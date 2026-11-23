-- Todo membro tem o seu link de convite individual. Quem entra por ele fica registrado como convidado dele.
-- Se o dono do link for bloqueado, o link deixa de valer.

alter table public.invites add column personal boolean not null default false;
create unique index invites_one_personal_active on public.invites (created_by) where personal and revoked_at is null;

-- quem convidou quem (só o administrador vê, pela visão geral)
create table public.invite_uses (
  user_id uuid primary key references public.profiles on delete cascade,
  code text not null
);
alter table public.invite_uses enable row level security; -- sem política

-- o convite vale? (não revogado, no prazo, com vaga e com o dono ainda liberado)
create function public.invite_ok(i public.invites) returns boolean
language sql stable security definer set search_path = '' as $$
  select i.revoked_at is null
    and (i.expires_at is null or i.expires_at > now())
    and (i.max_uses is null or i.uses < i.max_uses)
    and (i.created_by is null or not i.personal or exists (
      select 1 from public.profiles p where p.id = i.created_by and (p.approved_at is not null or p.role in ('moderator', 'admin'))))
$$;
revoke execute on function public.invite_ok(public.invites) from public, anon, authenticated;

create or replace function public.invite_valid(invite_code text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.invites i where i.code = lower(trim(invite_code)) and public.invite_ok(i))
$$;

create or replace function public.require_invite() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  c text := lower(nullif(trim(meta ->> 'invite'), ''));
  inv public.invites;
begin
  meta := meta - 'invite_ok' - 'invite' - 'invite_used'; -- nada que venha do cliente vale como aprovação
  if c is not null then
    select * into inv from public.invites where code = c for update;
    if found and public.invite_ok(inv) then
      update public.invites set uses = uses + 1 where code = c;
      meta := meta || jsonb_build_object('invite_ok', true, 'invite_used', c);
    end if;
  end if;
  if (select invite_only from public.app_settings) and not (meta ? 'invite_ok') then
    raise exception 'O cadastro é só por convite. Peça um link a quem te convidou.' using errcode = 'P0001';
  end if;
  new.raw_user_meta_data := meta;
  return new;
end $$;

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
  if meta ->> 'invite_ok' = 'true' and meta ->> 'invite_used' is not null then
    insert into public.invite_uses (user_id, code) values (new.id, meta ->> 'invite_used');
  end if;
  return new;
end $$;

-- o meu link individual (cria na primeira vez). Só membros.
create function public.my_invite() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare inv public.invites;
begin
  if not public.is_member() then raise exception 'Seu acesso ainda não foi liberado.' using errcode = '42501'; end if;
  select * into inv from public.invites where created_by = auth.uid() and personal and revoked_at is null;
  if not found then
    insert into public.invites (created_by, personal, label) values (auth.uid(), true, null) returning * into inv;
  end if;
  return jsonb_build_object('code', inv.code, 'uses', inv.uses);
end $$;

-- gera outro link e cancela o anterior (quem já entrou continua)
create function public.my_invite_renew() returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_member() then raise exception 'Seu acesso ainda não foi liberado.' using errcode = '42501'; end if;
  update public.invites set revoked_at = now() where created_by = auth.uid() and personal and revoked_at is null;
  return public.my_invite();
end $$;
revoke execute on function public.my_invite(), public.my_invite_renew() from public, anon;
grant execute on function public.my_invite(), public.my_invite_renew() to authenticated;

-- visão do admin: convites criados por ele (sem os individuais) e "convidado por" em cada pessoa
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
        'approvedAt', p.approved_at, 'role', p.role,
        'invitedBy', (select coalesce(op.display_name, 'convite do administrador')
                      from public.invite_uses iu join public.invites iv on iv.code = iu.code
                      left join public.profiles op on op.id = iv.created_by and iv.personal
                      where iu.user_id = p.id)
      ) order by (p.approved_at is null) desc, p.created_at desc)
      from public.profiles p join auth.users u on u.id = p.id
    ), '[]'::jsonb),
    'invites', coalesce((
      select jsonb_agg(jsonb_build_object(
        'code', i.code, 'label', i.label, 'createdAt', i.created_at, 'expiresAt', i.expires_at,
        'maxUses', i.max_uses, 'uses', i.uses, 'revoked', i.revoked_at is not null
      ) order by i.created_at desc)
      from (select * from public.invites where not personal order by created_at desc limit 50) i
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
