-- Tela de admin: ranking dos picos mais favoritados (só totais, sem dizer quem favoritou).
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
