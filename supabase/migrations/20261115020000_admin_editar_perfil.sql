-- O administrador edita o nome e o apelido de uma pessoa (tela /admin). Fica no histórico de ações.

alter table public.admin_audit drop constraint if exists admin_audit_action_check;
alter table public.admin_audit add constraint admin_audit_action_check check (action in ('liberou', 'bloqueou', 'editou'));

create function public.admin_update_profile(target uuid, new_name text, new_username text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  nm text := btrim(coalesce(new_name, ''));
  un text := nullif(lower(btrim(coalesce(new_username, ''))), '');
begin
  if not public.is_admin() then raise exception 'Acesso negado.' using errcode = '42501'; end if;
  if char_length(nm) not between 1 and 60 then raise exception 'O nome precisa ter de 1 a 60 caracteres.'; end if;
  if un is not null then
    if un !~ '^[a-z0-9_.]{3,24}$' then raise exception 'Apelido: de 3 a 24 letras minúsculas, números, ponto ou sublinhado.'; end if;
    if public.username_reserved(un) then raise exception 'Esse apelido é reservado.'; end if;
    if exists (select 1 from public.profiles where username = un and id <> target) then raise exception 'Esse apelido já está em uso.'; end if;
  end if;
  update public.profiles set display_name = nm, username = un where id = target;
  if not found then raise exception 'Pessoa não encontrada.'; end if;
  insert into public.admin_audit (admin_id, target_id, action) values (auth.uid(), target, 'editou');
end $$;
revoke execute on function public.admin_update_profile(uuid, text, text) from public, anon;
grant execute on function public.admin_update_profile(uuid, text, text) to authenticated;
