-- Cadastro só por convite (link) e sem limite de pessoas.
-- O administrador cria links na tela /admin; quem se cadastra por um link válido já entra liberado.
-- A regra é do banco: sem convite válido a conta nem é criada, mesmo que alguém chame a API direto.

-- sem limite de 10 pessoas
alter table public.app_settings alter column max_members set default null;
update public.app_settings set max_members = null;

create table public.invites (
  code text primary key default substr(replace(gen_random_uuid()::text, '-', ''), 1, 20),
  label text check (label is null or char_length(label) <= 60),
  created_by uuid references public.profiles on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  max_uses int check (max_uses is null or max_uses >= 1),
  uses int not null default 0,
  revoked_at timestamptz
);
alter table public.invites enable row level security; -- sem política: só as funções abaixo

-- o link ainda vale? (o formulário de cadastro usa antes de pedir os dados)
create function public.invite_valid(invite_code text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.invites i
    where i.code = lower(trim(invite_code)) and i.revoked_at is null
      and (i.expires_at is null or i.expires_at > now())
      and (i.max_uses is null or i.uses < i.max_uses)
  )
$$;
grant execute on function public.invite_valid(text) to anon, authenticated;

-- barra o cadastro sem convite válido e gasta um uso do link (na mesma transação da criação da conta)
create function public.require_invite() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  c text := lower(nullif(trim(meta ->> 'invite'), ''));
  inv public.invites;
begin
  meta := meta - 'invite_ok' - 'invite'; -- nada que venha do cliente vale como aprovação
  if c is not null then
    select * into inv from public.invites where code = c for update;
    if found and inv.revoked_at is null and (inv.expires_at is null or inv.expires_at > now())
       and (inv.max_uses is null or inv.uses < inv.max_uses) then
      update public.invites set uses = uses + 1 where code = c;
      meta := meta || '{"invite_ok": true}'::jsonb;
    end if;
  end if;
  if (select invite_only from public.app_settings) and not (meta ? 'invite_ok') then
    raise exception 'O cadastro é só por convite. Peça um link a quem te convidou.' using errcode = 'P0001';
  end if;
  new.raw_user_meta_data := meta;
  return new;
end $$;
create trigger a_require_invite before insert on auth.users
  for each row execute function public.require_invite();

-- quem entra por convite já nasce liberado
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  wanted text := lower(nullif(meta ->> 'username', ''));
  terms text := nullif(left(meta ->> 'terms_version', 20), '');
begin
  if wanted is not null and (wanted !~ '^[a-z0-9_.]{3,24}$' or public.username_reserved(wanted) or exists (select 1 from public.profiles where username = wanted)) then
    wanted := null;
  end if;
  insert into public.profiles (id, display_name, avatar_url, username, city, modality, level, terms_version, terms_accepted_at, approved_at)
  values (
    new.id,
    left(coalesce(meta ->> 'display_name', meta ->> 'full_name', meta ->> 'name', split_part(new.email, '@', 1), 'Surfista'), 60),
    meta ->> 'avatar_url',
    wanted,
    left(nullif(meta ->> 'city', ''), 60),
    case when meta ->> 'modality' in ('surf', 'bodyboard', 'ambos') then meta ->> 'modality' end,
    case when meta ->> 'level' in ('iniciante', 'intermediario', 'avancado') then meta ->> 'level' end,
    terms,
    case when terms is not null then now() end,
    case when meta ->> 'invite_ok' = 'true' then now() end
  );
  return new;
end $$;

create function public.admin_create_invite(invite_label text default null, uses_limit int default null, valid_days int default null)
returns text language plpgsql security definer set search_path = '' as $$
declare c text;
begin
  if not public.is_admin() then raise exception 'Acesso negado.' using errcode = '42501'; end if;
  insert into public.invites (label, created_by, max_uses, expires_at)
  values (left(nullif(trim(invite_label), ''), 60), auth.uid(), uses_limit,
          case when valid_days is not null then now() + make_interval(days => valid_days) end)
  returning code into c;
  return c;
end $$;

create function public.admin_revoke_invite(invite_code text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Acesso negado.' using errcode = '42501'; end if;
  update public.invites set revoked_at = coalesce(revoked_at, now()) where code = invite_code;
end $$;
revoke execute on function public.admin_create_invite(text, int, int), public.admin_revoke_invite(text) from public, anon;
grant execute on function public.admin_create_invite(text, int, int), public.admin_revoke_invite(text) to authenticated;

-- a visão do admin ganha os convites
create or replace function public.admin_overview() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare s public.app_settings;
begin
  if not public.is_admin() then raise exception 'Acesso negado.' using errcode = '42501'; end if;
  select * into s from public.app_settings;
  return jsonb_build_object(
    'inviteOnly', s.invite_only,
    'limit', s.max_members,
    'members', (select count(*) from public.profiles where approved_at is not null and role = 'user'),
    'users', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id, 'name', p.display_name, 'username', p.username, 'email', u.email, 'city', p.city,
        'createdAt', p.created_at, 'emailConfirmed', u.email_confirmed_at is not null,
        'approvedAt', p.approved_at, 'role', p.role
      ) order by (p.approved_at is null) desc, p.created_at desc)
      from public.profiles p join auth.users u on u.id = p.id
    ), '[]'::jsonb),
    'invites', coalesce((
      select jsonb_agg(jsonb_build_object(
        'code', i.code, 'label', i.label, 'createdAt', i.created_at, 'expiresAt', i.expires_at,
        'maxUses', i.max_uses, 'uses', i.uses, 'revoked', i.revoked_at is not null
      ) order by i.created_at desc)
      from (select * from public.invites order by created_at desc limit 50) i
    ), '[]'::jsonb),
    'topSpots', coalesce((
      select jsonb_agg(jsonb_build_object('spotId', t.spot_id, 'count', t.n) order by t.n desc, t.spot_id)
      from (select spot_id, count(*) n from public.favorite_spots group by spot_id order by count(*) desc, spot_id limit 20) t
    ), '[]'::jsonb),
    'audit', coalesce((
      select jsonb_agg(jsonb_build_object('at', a.created_at, 'action', a.action, 'admin', ap.display_name, 'target', tp.display_name) order by a.created_at desc)
      from (select * from public.admin_audit order by created_at desc limit 20) a
      left join public.profiles ap on ap.id = a.admin_id
      left join public.profiles tp on tp.id = a.target_id
    ), '[]'::jsonb)
  );
end $$;
