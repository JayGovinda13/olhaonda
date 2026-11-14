-- Fórum: @apelido aparece ao lado do nome, dá para marcar alguém (@apelido) e a pessoa marcada recebe um aviso no sino.

---------------------------------------------------------------------------
-- Os tópicos e as respostas passam a trazer também o apelido de quem escreveu
---------------------------------------------------------------------------
drop view if exists public.forum_threads_v;
create view public.forum_threads_v with (security_invoker = true) as
  select t.*, coalesce(p.display_name, 'OlhaOnda') as author_name, p.username as author_username
  from public.forum_threads t left join public.profiles p on p.id = t.author_id;

drop view if exists public.forum_posts_v;
create view public.forum_posts_v with (security_invoker = true) as
  select f.*, p.display_name as author_name, p.username as author_username
  from public.forum_posts f join public.profiles p on p.id = f.author_id;

---------------------------------------------------------------------------
-- Busca de pessoas para marcar (só quem tem acesso ao fórum, só pessoas liberadas)
---------------------------------------------------------------------------
create function public.forum_member_search(q text) returns table (username text, name text)
language plpgsql stable security definer set search_path = '' as $$
declare t text := lower(regexp_replace(coalesce(q, ''), '[^A-Za-z0-9_.]', '', 'g'));
begin
  if not public.is_member() then raise exception 'Acesso negado.' using errcode = '42501'; end if;
  return query
    select p.username, p.display_name
    from public.profiles p
    where p.username is not null
      and (p.approved_at is not null or p.role in ('moderator', 'admin') or not (select invite_only from public.app_settings))
      and (t = '' or starts_with(p.username, t) or strpos(lower(p.display_name), t) > 0)
    order by starts_with(p.username, t) desc, p.username
    limit 6;
end $$;
revoke execute on function public.forum_member_search(text) from public, anon;
grant execute on function public.forum_member_search(text) to authenticated;

---------------------------------------------------------------------------
-- Aviso para quem foi marcado
---------------------------------------------------------------------------
alter table public.notifications drop constraint if exists notifications_kind_check;
alter table public.notifications add constraint notifications_kind_check
  check (kind in ('match', 'enter', 'back', 'change', 'lost', 'mention'));

create function public.notify_mentions() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  author uuid;
  author_name text;
  thread uuid;
  thread_title text;
  spot text;
  txt text;
  uname text;
  target uuid;
begin
  if tg_table_name = 'forum_threads' then
    if new.author_id is null or new.kind <> 'user' then return new; end if; -- resumo do OlhaOnda não marca ninguém
    author := new.author_id; thread := new.id; thread_title := new.title; spot := new.spot_id; txt := new.body;
  else
    author := new.author_id; thread := new.thread_id; txt := new.body;
    select t.title, t.spot_id into thread_title, spot from public.forum_threads t where t.id = new.thread_id;
  end if;
  select display_name into author_name from public.profiles where id = author;

  -- até 5 pessoas por mensagem; "@ana." no fim da frase vale "ana"
  for uname in
    select distinct rtrim(m[1], '.') from regexp_matches(lower(txt), '(?:^|[^a-z0-9_.])@([a-z0-9_.]{3,24})', 'g') as m limit 5
  loop
    continue when char_length(uname) < 3;
    target := null;
    select p.id into target from public.profiles p
    where p.username = uname and p.id <> author
      and (p.approved_at is not null or p.role in ('moderator', 'admin') or not (select invite_only from public.app_settings));
    if target is not null then
      insert into public.notifications (user_id, spot_id, kind, session_date, title, body, url)
      values (
        target, coalesce(spot, 'forum'), 'mention', current_date,
        coalesce(author_name, 'Alguém') || ' te marcou no fórum',
        left(coalesce(thread_title, ''), 80) || ': ' || left(txt, 140),
        '/forum/' || thread
      );
    end if;
  end loop;
  return new;
end $$;

create trigger forum_post_mentions after insert on public.forum_posts for each row execute function public.notify_mentions();
create trigger forum_thread_mentions after insert on public.forum_threads for each row execute function public.notify_mentions();
