-- Cadastro completo, fórum por pico com resumo diário do OlhaOnda, picos favoritos com
-- condições preferidas e notificações (no site e push no navegador).

---------------------------------------------------------------------------
-- Cadastro: dados do perfil
---------------------------------------------------------------------------
alter table public.profiles
  add column username text unique check (username is null or username ~ '^[a-z0-9_.]{3,24}$'),
  add column city text check (city is null or char_length(city) <= 60),
  add column modality text check (modality is null or modality in ('surf', 'bodyboard', 'ambos')),
  add column level text check (level is null or level in ('iniciante', 'intermediario', 'avancado')),
  add column bio text check (bio is null or char_length(bio) <= 280);

grant update (username, city, modality, level, bio) on public.profiles to authenticated;

-- dados do formulário de cadastro chegam em raw_user_meta_data (supabase.auth.signUp options.data)
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  wanted text := lower(nullif(meta ->> 'username', ''));
begin
  if wanted is not null and (wanted !~ '^[a-z0-9_.]{3,24}$' or exists (select 1 from public.profiles where username = wanted)) then
    wanted := null; -- apelido inválido ou já usado: a pessoa escolhe outro no perfil
  end if;
  insert into public.profiles (id, display_name, avatar_url, username, city, modality, level)
  values (
    new.id,
    left(coalesce(meta ->> 'display_name', meta ->> 'full_name', meta ->> 'name', split_part(new.email, '@', 1), 'Surfista'), 60),
    meta ->> 'avatar_url',
    wanted,
    left(nullif(meta ->> 'city', ''), 60),
    case when meta ->> 'modality' in ('surf', 'bodyboard', 'ambos') then meta ->> 'modality' end,
    case when meta ->> 'level' in ('iniciante', 'intermediario', 'avancado') then meta ->> 'level' end
  );
  return new;
end $$;

-- apelido livre? (usado no formulário de cadastro, sem expor e-mails)
create function public.username_available(name text) returns boolean
language sql stable security definer set search_path = '' as $$
  select lower(name) ~ '^[a-z0-9_.]{3,24}$' and not exists (select 1 from public.profiles where username = lower(name))
$$;
grant execute on function public.username_available(text) to anon, authenticated;

---------------------------------------------------------------------------
-- Fórum por pico + resumo diário do OlhaOnda
---------------------------------------------------------------------------
-- tópicos do OlhaOnda não têm autor humano (author_id nulo, publicados pela service role)
alter table public.forum_threads alter column author_id drop not null;
alter table public.forum_threads
  add column kind text not null default 'user' check (kind in ('user', 'daily')),
  add column forecast_date date,
  add constraint daily_has_spot check (kind = 'user' or (spot_id is not null and forecast_date is not null)),
  add constraint user_has_author check (kind = 'daily' or author_id is not null);

alter table public.forum_threads drop constraint forum_threads_category_check;
alter table public.forum_threads add constraint forum_threads_category_check
  check (category in ('previsao', 'condicoes', 'picos', 'equipamento', 'viagens', 'classificados', 'geral'));

-- um resumo por pico por dia
create unique index forum_daily_unique on public.forum_threads (spot_id, forecast_date) where kind = 'daily';

-- usuário não cria tópico do tipo "daily" (a policy de insert já exige author_id = auth.uid())
drop policy "cria tópico" on public.forum_threads;
create policy "cria tópico" on public.forum_threads for insert to authenticated
  with check (author_id = auth.uid() and kind = 'user');

drop view public.forum_threads_v;
create view public.forum_threads_v with (security_invoker = true) as
  select t.*, coalesce(p.display_name, 'OlhaOnda') as author_name
  from public.forum_threads t left join public.profiles p on p.id = t.author_id;

---------------------------------------------------------------------------
-- Picos favoritos e condições preferidas
---------------------------------------------------------------------------
create table public.favorite_spots (
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  spot_id text not null check (char_length(spot_id) <= 60),
  prefs jsonb not null default '{}'::jsonb,
  notify boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (user_id, spot_id)
);
alter table public.favorite_spots enable row level security;
create policy "vê os próprios favoritos" on public.favorite_spots for select to authenticated using (user_id = auth.uid());
create policy "favorita" on public.favorite_spots for insert to authenticated with check (user_id = auth.uid());
create policy "edita favorito" on public.favorite_spots for update to authenticated using (user_id = auth.uid());
create policy "remove favorito" on public.favorite_spots for delete to authenticated using (user_id = auth.uid());

---------------------------------------------------------------------------
-- Notificações (no site) e inscrições de push (navegador)
---------------------------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles on delete cascade,
  spot_id text not null,
  kind text not null default 'match' check (kind in ('match')),
  -- dia da sessão prevista: um aviso por pico por dia
  session_date date not null,
  title text not null,
  body text not null,
  url text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  unique (user_id, spot_id, session_date, kind)
);
create index on public.notifications (user_id, created_at desc);
alter table public.notifications enable row level security;
create policy "vê as próprias notificações" on public.notifications for select to authenticated using (user_id = auth.uid());
create policy "marca como lida" on public.notifications for update to authenticated using (user_id = auth.uid());
create policy "apaga notificação" on public.notifications for delete to authenticated using (user_id = auth.uid());
revoke update on public.notifications from anon, authenticated;
grant update (read_at) on public.notifications to authenticated;

create table public.push_subscriptions (
  endpoint text primary key,
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);
alter table public.push_subscriptions enable row level security;
create policy "vê as próprias inscrições" on public.push_subscriptions for select to authenticated using (user_id = auth.uid());
create policy "inscreve" on public.push_subscriptions for insert to authenticated with check (user_id = auth.uid());
create policy "atualiza inscrição" on public.push_subscriptions for update to authenticated using (user_id = auth.uid());
create policy "cancela inscrição" on public.push_subscriptions for delete to authenticated using (user_id = auth.uid());

-- o site aberto recebe as notificações novas na hora (Realtime respeita o RLS acima)
alter publication supabase_realtime add table public.notifications;
