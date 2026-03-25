-- Phase 6.2: Make admin user counters reflect all real accounts (active + disabled)

begin;

drop function if exists public.admin_list_users();

create or replace function public.admin_list_users()
returns table (
  id uuid,
  email text,
  name text,
  avatar text,
  is_admin boolean,
  created_at timestamptz,
  last_sign_in timestamptz,
  is_disabled boolean
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null or not public.is_admin(auth.uid()) then
    raise exception 'Admin access required';
  end if;

  return query
  select
    u.id::uuid,
    coalesce(u.email, p.email, '')::text,
    coalesce(
      u.raw_user_meta_data ->> 'name',
      u.raw_user_meta_data ->> 'full_name',
      split_part(coalesce(u.email, p.email, 'User'), '@', 1),
      'User'
    )::text as name,
    (u.raw_user_meta_data ->> 'avatar_url')::text as avatar,
    coalesce(p.is_admin, false)::boolean as is_admin,
    u.created_at::timestamptz,
    u.last_sign_in_at::timestamptz,
    coalesce(p.is_disabled, false)::boolean as is_disabled
  from auth.users u
  left join public.profiles p on p.id = u.id
  order by coalesce(p.is_admin, false) desc, coalesce(p.is_disabled, false) asc, u.created_at desc;
end;
$$;

revoke all on function public.admin_list_users() from public;
revoke all on function public.admin_list_users() from anon;
revoke all on function public.admin_list_users() from authenticated;
grant execute on function public.admin_list_users() to authenticated;

commit;
