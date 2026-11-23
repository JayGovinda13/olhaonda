-- O link individual vale para 10 pessoas; depois é preciso gerar outro.
update public.invites set max_uses = 10 where personal and max_uses is null;

create or replace function public.my_invite() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare inv public.invites;
begin
  if not public.is_member() then raise exception 'Seu acesso ainda não foi liberado.' using errcode = '42501'; end if;
  select * into inv from public.invites where created_by = auth.uid() and personal and revoked_at is null;
  if not found then
    insert into public.invites (created_by, personal, label, max_uses) values (auth.uid(), true, null, 10) returning * into inv;
  end if;
  return jsonb_build_object('code', inv.code, 'uses', inv.uses, 'maxUses', inv.max_uses);
end $$;
