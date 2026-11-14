-- Teste fechado: só quem o administrador liberar usa o fórum, os favoritos e os avisos.
-- Administração (liberar/bloquear pessoas) e itens da LGPD: consentimento registrado,
-- exportar os próprios dados e excluir a conta.

---------------------------------------------------------------------------
-- Perfil: liberação e consentimento
---------------------------------------------------------------------------
alter table public.profiles
  add column approved_at timestamptz,
  add column approved_by uuid references public.profiles on delete set null,
  -- registro do aceite da política de privacidade e das regras (LGPD, art. 8º)
  add column terms_accepted_at timestamptz,
  add column terms_version text check (terms_version is null or char_length(terms_version) <= 20);
-- (approved_at, approved_by, terms_*: ninguém altera pelo app; o `grant update` do perfil não os inclui)

-- quem já existe (ex.: testadores do staging) continua com acesso
update public.profiles set approved_at = now() where approved_at is null;

-- configuração única do app
create table public.app_settings (
  id boolean primary key default true check (id),
  -- true = só entra quem foi liberado; false = qualquer conta confirmada entra
  invite_only boolean not null default true,
  -- máximo de pessoas liberadas (administradores não contam); nulo = sem limite
  max_members int check (max_members is null or max_members >= 0) default 10
);
insert into public.app_settings default values;
alter table public.app_settings enable row level security; -- sem política: só as funções abaixo leem

-- registro de quem liberou/bloqueou quem (prestação de contas)
create table public.admin_audit (
  id bigint generated always as identity primary key,
  admin_id uuid references public.profiles on delete set null,
  target_id uuid references public.profiles on delete set null,
  action text not null check (action in ('liberou', 'bloqueou')),
  created_at timestamptz not null default now()
);
alter table public.admin_audit enable row level security; -- sem política

---------------------------------------------------------------------------
-- Funções de permissão
---------------------------------------------------------------------------
create function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
$$;

-- pode usar o fórum e os avisos? liberado, moderador/administrador, ou app aberto a todos
create function public.is_member() returns boolean
language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and (
    exists (select 1 from public.profiles where id = auth.uid() and (approved_at is not null or role in ('moderator', 'admin')))
    or not (select invite_only from public.app_settings)
  )
$$;
revoke execute on function public.is_admin(), public.is_member() from public;
grant execute on function public.is_admin(), public.is_member() to anon, authenticated;

---------------------------------------------------------------------------
-- Quem vê e escreve o quê: só membros
---------------------------------------------------------------------------
drop policy "perfis são públicos" on public.profiles;
create policy "perfil: o próprio ou de membro" on public.profiles for select using (id = auth.uid() or public.is_member());

drop policy "leitura pública" on public.forum_threads;
create policy "fórum: leitura de membro" on public.forum_threads for select using (public.is_member());
drop policy "cria tópico" on public.forum_threads;
create policy "cria tópico" on public.forum_threads for insert to authenticated
  with check (author_id = auth.uid() and kind = 'user' and public.is_member());

drop policy "leitura pública" on public.forum_posts;
create policy "fórum: leitura de membro" on public.forum_posts for select using (public.is_member());
drop policy "responde" on public.forum_posts;
create policy "responde" on public.forum_posts for insert to authenticated
  with check (author_id = auth.uid() and public.is_member());

drop policy "favorita" on public.favorite_spots;
create policy "favorita" on public.favorite_spots for insert to authenticated
  with check (user_id = auth.uid() and public.is_member());

drop policy "inscreve" on public.push_subscriptions;
create policy "inscreve" on public.push_subscriptions for insert to authenticated
  with check (user_id = auth.uid() and public.is_member());

---------------------------------------------------------------------------
-- Cadastro: grava o aceite (versão dos termos e data)
---------------------------------------------------------------------------
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  wanted text := lower(nullif(meta ->> 'username', ''));
  terms text := nullif(left(meta ->> 'terms_version', 20), '');
begin
  if wanted is not null and (wanted !~ '^[a-z0-9_.]{3,24}$' or exists (select 1 from public.profiles where username = wanted)) then
    wanted := null; -- apelido inválido ou já usado: a pessoa escolhe outro no perfil
  end if;
  insert into public.profiles (id, display_name, avatar_url, username, city, modality, level, terms_version, terms_accepted_at)
  values (
    new.id,
    left(coalesce(meta ->> 'display_name', meta ->> 'full_name', meta ->> 'name', split_part(new.email, '@', 1), 'Surfista'), 60),
    meta ->> 'avatar_url',
    wanted,
    left(nullif(meta ->> 'city', ''), 60),
    case when meta ->> 'modality' in ('surf', 'bodyboard', 'ambos') then meta ->> 'modality' end,
    case when meta ->> 'level' in ('iniciante', 'intermediario', 'avancado') then meta ->> 'level' end,
    terms,
    case when terms is not null then now() end
  );
  return new;
end $$;

---------------------------------------------------------------------------
-- Administração
---------------------------------------------------------------------------
-- tudo o que a tela de admin precisa, numa chamada. Mostra só o necessário para decidir a liberação.
create function public.admin_overview() returns jsonb
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
    'audit', coalesce((
      select jsonb_agg(jsonb_build_object('at', a.created_at, 'action', a.action, 'admin', ap.display_name, 'target', tp.display_name) order by a.created_at desc)
      from (select * from public.admin_audit order by created_at desc limit 20) a
      left join public.profiles ap on ap.id = a.admin_id
      left join public.profiles tp on tp.id = a.target_id
    ), '[]'::jsonb)
  );
end $$;

create function public.admin_set_access(target uuid, allow boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare s public.app_settings; p public.profiles;
begin
  if not public.is_admin() then raise exception 'Acesso negado.' using errcode = '42501'; end if;
  select * into p from public.profiles where id = target;
  if not found then raise exception 'Pessoa não encontrada.'; end if;
  if p.role <> 'user' then raise exception 'Administradores e moderadores já têm acesso.'; end if;
  if allow then
    if p.approved_at is not null then return; end if;
    select * into s from public.app_settings;
    if s.max_members is not null and (select count(*) from public.profiles where approved_at is not null and role = 'user') >= s.max_members then
      raise exception 'Limite de % pessoas liberadas atingido.', s.max_members;
    end if;
    update public.profiles set approved_at = now(), approved_by = auth.uid() where id = target;
  else
    if p.approved_at is null then return; end if;
    update public.profiles set approved_at = null, approved_by = null where id = target;
  end if;
  insert into public.admin_audit (admin_id, target_id, action) values (auth.uid(), target, case when allow then 'liberou' else 'bloqueou' end);
end $$;
revoke execute on function public.admin_overview(), public.admin_set_access(uuid, boolean) from public, anon;
grant execute on function public.admin_overview(), public.admin_set_access(uuid, boolean) to authenticated;

---------------------------------------------------------------------------
-- LGPD: a pessoa baixa tudo o que guardamos sobre ela
---------------------------------------------------------------------------
create function public.export_my_data() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'Entre na sua conta para continuar.' using errcode = '42501'; end if;
  return jsonb_build_object(
    'geradoEm', now(),
    'conta', (select jsonb_build_object('email', u.email, 'criadaEm', u.created_at) from auth.users u where u.id = me),
    'perfil', (select to_jsonb(p) - 'approved_by' from public.profiles p where p.id = me),
    'picosFavoritos', coalesce((select jsonb_agg(to_jsonb(f)) from public.favorite_spots f where f.user_id = me), '[]'::jsonb),
    'avisosRecebidos', coalesce((select jsonb_agg(to_jsonb(n) - 'user_id') from public.notifications n where n.user_id = me), '[]'::jsonb),
    'topicosNoForum', coalesce((select jsonb_agg(to_jsonb(t)) from public.forum_threads t where t.author_id = me), '[]'::jsonb),
    'respostasNoForum', coalesce((select jsonb_agg(to_jsonb(r)) from public.forum_posts r where r.author_id = me), '[]'::jsonb),
    'avisosNoNavegador', (select count(*) from public.push_subscriptions where user_id = me),
    'whatsapp', (select jsonb_build_object('numero', w.phone, 'aceiteEm', w.consented_at, 'ativo', w.enabled) from public.whatsapp_contacts w where w.user_id = me)
  );
end $$;
revoke execute on function public.export_my_data() from public, anon;
grant execute on function public.export_my_data() to authenticated;
