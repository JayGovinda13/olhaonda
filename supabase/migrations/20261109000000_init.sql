-- OlhaOnda: perfis, fórum, marketplace de fotos e pagamentos.
-- Aplicar com: supabase db push   (ou colar no SQL Editor do Supabase)

create extension if not exists pgcrypto;

---------------------------------------------------------------------------
-- Perfis
---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text not null default 'Surfista' check (char_length(display_name) between 1 and 60),
  avatar_url text,
  instagram text check (instagram is null or char_length(instagram) <= 40),
  is_photographer boolean not null default false,
  payments_connected boolean not null default false, -- só as Edge Functions alteram
  role text not null default 'user' check (role in ('user', 'moderator', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
create policy "perfis são públicos" on public.profiles for select using (true);
create policy "edita o próprio perfil" on public.profiles for update using (id = auth.uid());

-- O usuário só pode mudar estas colunas (role e payments_connected ficam protegidas).
revoke update on public.profiles from anon, authenticated;
grant update (display_name, avatar_url, instagram, is_photographer) on public.profiles to authenticated;

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1), 'Surfista'), 60),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.is_moderator() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role in ('moderator', 'admin'))
$$;

---------------------------------------------------------------------------
-- Fórum
---------------------------------------------------------------------------
create table public.forum_threads (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null default auth.uid() references public.profiles on delete cascade,
  title text not null check (char_length(title) between 3 and 140),
  body text not null check (char_length(body) between 1 and 10000),
  category text not null check (category in ('condicoes', 'picos', 'equipamento', 'viagens', 'classificados', 'geral')),
  spot_id text,
  reply_count int not null default 0,
  created_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now()
);
create index on public.forum_threads (last_activity_at desc);
create index on public.forum_threads (spot_id);

create table public.forum_posts (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.forum_threads on delete cascade,
  author_id uuid not null default auth.uid() references public.profiles on delete cascade,
  body text not null check (char_length(body) between 1 and 10000),
  created_at timestamptz not null default now()
);
create index on public.forum_posts (thread_id, created_at);

alter table public.forum_threads enable row level security;
alter table public.forum_posts enable row level security;

create policy "leitura pública" on public.forum_threads for select using (true);
create policy "cria tópico" on public.forum_threads for insert to authenticated with check (author_id = auth.uid());
create policy "edita tópico" on public.forum_threads for update to authenticated using (author_id = auth.uid());
create policy "apaga tópico" on public.forum_threads for delete to authenticated using (author_id = auth.uid() or public.is_moderator());

create policy "leitura pública" on public.forum_posts for select using (true);
create policy "responde" on public.forum_posts for insert to authenticated with check (author_id = auth.uid());
create policy "edita resposta" on public.forum_posts for update to authenticated using (author_id = auth.uid());
create policy "apaga resposta" on public.forum_posts for delete to authenticated using (author_id = auth.uid() or public.is_moderator());

revoke update on public.forum_threads, public.forum_posts from anon, authenticated;
grant update (title, body) on public.forum_threads to authenticated;
grant update (body) on public.forum_posts to authenticated;

create function public.forum_post_counter() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    update public.forum_threads set reply_count = reply_count + 1, last_activity_at = new.created_at where id = new.thread_id;
  else
    update public.forum_threads set reply_count = greatest(reply_count - 1, 0) where id = old.thread_id;
  end if;
  return null;
end $$;

create trigger forum_post_counter after insert or delete on public.forum_posts
  for each row execute function public.forum_post_counter();

create view public.forum_threads_v with (security_invoker = true) as
  select t.*, p.display_name as author_name
  from public.forum_threads t join public.profiles p on p.id = t.author_id;

create view public.forum_posts_v with (security_invoker = true) as
  select f.*, p.display_name as author_name
  from public.forum_posts f join public.profiles p on p.id = f.author_id;

---------------------------------------------------------------------------
-- Marketplace de fotos
---------------------------------------------------------------------------
create table public.photo_sessions (
  id uuid primary key default gen_random_uuid(),
  photographer_id uuid not null default auth.uid() references public.profiles on delete cascade,
  spot_id text not null,
  date date not null,
  period text not null check (period in ('manha', 'tarde')),
  title text check (title is null or char_length(title) <= 120),
  price_cents int not null check (price_cents between 300 and 100000),
  created_at timestamptz not null default now()
);
create index on public.photo_sessions (spot_id, date desc);

create table public.photos (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.photo_sessions on delete cascade,
  photographer_id uuid not null default auth.uid() references public.profiles on delete cascade,
  preview_path text not null,
  original_path text not null,
  width int not null,
  height int not null,
  created_at timestamptz not null default now()
);
create index on public.photos (session_id);

alter table public.photo_sessions enable row level security;
alter table public.photos enable row level security;

create policy "vitrine pública" on public.photo_sessions for select using (true);
create policy "fotógrafo cria sessão" on public.photo_sessions for insert to authenticated
  with check (
    photographer_id = auth.uid()
    and exists (select 1 from public.profiles where id = auth.uid() and is_photographer)
  );
create policy "fotógrafo edita sessão" on public.photo_sessions for update to authenticated using (photographer_id = auth.uid());
create policy "fotógrafo apaga sessão" on public.photo_sessions for delete to authenticated using (photographer_id = auth.uid());

create policy "vitrine pública" on public.photos for select using (true);
create policy "fotógrafo envia foto" on public.photos for insert to authenticated
  with check (
    photographer_id = auth.uid()
    and exists (select 1 from public.photo_sessions s where s.id = session_id and s.photographer_id = auth.uid())
  );
create policy "fotógrafo apaga foto" on public.photos for delete to authenticated using (photographer_id = auth.uid());

create view public.photo_sessions_v with (security_invoker = true) as
  select
    s.*,
    coalesce(p.instagram, p.display_name) as photographer_name,
    (select count(*) from public.photos ph where ph.session_id = s.id)::int as photo_count,
    (select ph.preview_path from public.photos ph where ph.session_id = s.id order by ph.created_at limit 1) as cover_path
  from public.photo_sessions s join public.profiles p on p.id = s.photographer_id;

---------------------------------------------------------------------------
-- Pedidos (escritos só pelas Edge Functions, com a service role)
---------------------------------------------------------------------------
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles on delete restrict,
  photographer_id uuid not null references public.profiles on delete restrict,
  session_id uuid not null references public.photo_sessions on delete restrict,
  total_cents int not null,
  fee_cents int not null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'cancelled', 'refunded')),
  mp_preference_id text,
  mp_payment_id text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
create index on public.orders (buyer_id, created_at desc);

create table public.order_items (
  order_id uuid not null references public.orders on delete cascade,
  photo_id uuid not null references public.photos on delete restrict,
  price_cents int not null,
  primary key (order_id, photo_id)
);

alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create policy "comprador e fotógrafo veem o pedido" on public.orders for select to authenticated
  using (buyer_id = auth.uid() or photographer_id = auth.uid());
create policy "itens do pedido visível" on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and (o.buyer_id = auth.uid() or o.photographer_id = auth.uid())));

---------------------------------------------------------------------------
-- Segredos de pagamento: sem nenhuma policy => só a service role acessa.
---------------------------------------------------------------------------
create table public.mp_accounts (
  photographer_id uuid primary key references public.profiles on delete cascade,
  mp_user_id text not null unique,
  access_token text not null,
  refresh_token text,
  expires_at timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.mp_accounts enable row level security;
revoke all on public.mp_accounts from anon, authenticated;

create table public.oauth_states (
  state text primary key,
  user_id uuid not null references public.profiles on delete cascade,
  return_url text not null,
  created_at timestamptz not null default now()
);
alter table public.oauth_states enable row level security;
revoke all on public.oauth_states from anon, authenticated;

---------------------------------------------------------------------------
-- Storage: prévias públicas (com marca d'água) e originais privados.
-- Caminho dos arquivos: {uid do fotógrafo}/{id da sessão}/{id da foto}.ext
---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('previews', 'previews', true, 5242880, array['image/jpeg']),
  ('originals', 'originals', false, 52428800, array['image/jpeg', 'image/png', 'image/heic', 'image/webp'])
on conflict (id) do nothing;

create policy "fotógrafo envia prévias" on storage.objects for insert to authenticated
  with check (bucket_id = 'previews' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "fotógrafo envia originais" on storage.objects for insert to authenticated
  with check (bucket_id = 'originals' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "fotógrafo apaga os próprios arquivos" on storage.objects for delete to authenticated
  using (bucket_id in ('previews', 'originals') and (storage.foldername(name))[1] = auth.uid()::text);

-- Original: só o próprio fotógrafo ou quem tem um pedido PAGO contendo a foto.
create policy "original para quem comprou" on storage.objects for select to authenticated
  using (
    bucket_id = 'originals'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (
        select 1
        from public.order_items oi
        join public.orders o on o.id = oi.order_id
        join public.photos ph on ph.id = oi.photo_id
        where o.buyer_id = auth.uid() and o.status = 'paid' and ph.original_path = storage.objects.name
      )
    )
  );
