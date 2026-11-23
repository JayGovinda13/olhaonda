-- Quem escreveu pode editar o próprio tópico (título e texto) e as próprias respostas (texto).
-- Só isso muda: autor, categoria, pico, datas e contadores ficam travados. A mensagem passa a mostrar "editado".

alter table public.forum_threads add column edited_at timestamptz;
alter table public.forum_posts add column edited_at timestamptz;

create function public.guard_forum_edit() returns trigger
language plpgsql security definer set search_path = '' as $$
declare t text; b text;
begin
  -- contadores e rotinas do servidor (gatilhos internos, service role) mexem livremente
  if pg_trigger_depth() > 1 or auth.uid() is null then return new; end if;
  b := new.body;
  if tg_table_name = 'forum_threads' then
    t := new.title;
    new := old;
    new.title := t;
    new.body := b;
    if new.title is distinct from old.title or new.body is distinct from old.body then new.edited_at := now(); end if;
  else
    new := old;
    new.body := b;
    if new.body is distinct from old.body then new.edited_at := now(); end if;
  end if;
  return new;
end $$;
create trigger forum_threads_guard_edit before update on public.forum_threads
  for each row execute function public.guard_forum_edit();
create trigger forum_posts_guard_edit before update on public.forum_posts
  for each row execute function public.guard_forum_edit();

drop policy "edita tópico" on public.forum_threads;
create policy "edita tópico" on public.forum_threads for update to authenticated
  using (author_id = auth.uid() and kind = 'user' and public.is_member())
  with check (author_id = auth.uid() and kind = 'user' and public.is_member());
drop policy "edita resposta" on public.forum_posts;
create policy "edita resposta" on public.forum_posts for update to authenticated
  using (author_id = auth.uid() and public.is_member())
  with check (author_id = auth.uid() and public.is_member());

-- as visões passam a trazer edited_at
drop view if exists public.forum_threads_v;
create view public.forum_threads_v with (security_invoker = true) as
  select t.*, coalesce(p.display_name, 'OlhaOnda') as author_name, p.username as author_username
  from public.forum_threads t left join public.profiles p on p.id = t.author_id;
drop view if exists public.forum_posts_v;
create view public.forum_posts_v with (security_invoker = true) as
  select f.*, p.display_name as author_name, p.username as author_username
  from public.forum_posts f join public.profiles p on p.id = f.author_id;
grant select on public.forum_threads_v, public.forum_posts_v to anon, authenticated;
