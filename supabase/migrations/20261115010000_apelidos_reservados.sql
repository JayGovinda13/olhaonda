-- Apelidos: únicos (já eram, pela restrição profiles_username_key) e sem nomes que se passam pela equipe.
-- O apelido é sempre gravado em minúsculas (regex do cadastro), então "Ana" e "ana" são o mesmo apelido.

create function public.username_reserved(name text) returns boolean
language sql immutable set search_path = '' as $$
  select lower(name) = any (array[
    'admin', 'administrador', 'administracao', 'root', 'suporte', 'moderador', 'mod', 'olhaonda',
    'oficial', 'sistema', 'system', 'api', 'www', 'contato', 'equipe', 'staff', 'support', 'null', 'undefined'
  ])
$$;

-- not valid: contas que já existem não são recusadas; vale para novos apelidos e para trocas
alter table public.profiles
  add constraint profiles_username_not_reserved check (username is null or not public.username_reserved(username)) not valid;

create or replace function public.username_available(name text) returns boolean
language sql stable security definer set search_path = '' as $$
  select lower(name) ~ '^[a-z0-9_.]{3,24}$'
    and not public.username_reserved(name)
    and not exists (select 1 from public.profiles where username = lower(name))
$$;
grant execute on function public.username_available(text) to anon, authenticated;

-- o cadastro nunca falha por apelido: inválido, reservado ou já usado vira "sem apelido" e a pessoa escolhe outro no perfil
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
