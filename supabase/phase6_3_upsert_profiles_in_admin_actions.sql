-- Phase 6.3: Upsert missing profiles during admin actions

begin;

-- Fix for making users admin even if their profile record is missing
create or replace function public.admin_set_user_admin(target_user_id uuid, make_admin boolean)
returns table (success boolean, message text)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  caller_id uuid := auth.uid();
  admin_count integer;
  target_email text;
begin
  if caller_id is null then
    return query select false, 'Authentication required';
    return;
  end if;

  if not public.is_admin(caller_id) then
    return query select false, 'Admin access required';
    return;
  end if;

  -- Check auth.users as the source of truth, not just public.profiles
  if not exists(select 1 from auth.users where id = target_user_id) then
    return query select false, 'Target user not found in auth system';
    return;
  end if;

  select email into target_email from auth.users where id = target_user_id;

  if make_admin = false then
    select count(*)::int into admin_count from public.profiles p where p.is_admin = true;
    if admin_count <= 1 and exists (select 1 from public.profiles p where p.id = target_user_id and p.is_admin = true) then
      return query select false, 'Cannot remove the last admin';
      return;
    end if;
  end if;

  -- Upsert profile so it works even if it was previously missing
  insert into public.profiles (id, email, is_admin, is_disabled)
  values (target_user_id, coalesce(target_email, ''), make_admin, false)
  on conflict (id) do update
  set is_admin = make_admin,
      is_disabled = false;

  if make_admin then
    return query select true, 'User promoted to admin';
  else
    return query select true, 'Admin privileges removed';
  end if;
end;
$$;

-- Fix for deactivating users even if their profile record is missing
create or replace function public.admin_deactivate_user(target_user_id uuid)
returns table (success boolean, message text)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  caller_id uuid := auth.uid();
  admin_count integer;
  target_is_admin boolean;
  target_email text;
begin
  if caller_id is null then
    return query select false, 'Authentication required';
    return;
  end if;

  if not public.is_admin(caller_id) then
    return query select false, 'Admin access required';
    return;
  end if;

  if target_user_id = caller_id then
    return query select false, 'You cannot remove your own account from the admin panel';
    return;
  end if;

  -- Check auth.users as the source of truth
  if not exists(select 1 from auth.users where id = target_user_id) then
    return query select false, 'Target user not found in auth system';
    return;
  end if;

  select email into target_email from auth.users where id = target_user_id;
  select coalesce(p.is_admin, false) into target_is_admin from public.profiles p where p.id = target_user_id;

  if target_is_admin then
    select count(*)::int into admin_count from public.profiles p where p.is_admin = true;
    if admin_count <= 1 then
      return query select false, 'Cannot remove the last admin';
      return;
    end if;
  end if;

  -- Upsert profile and mark as disabled
  insert into public.profiles (id, email, is_admin, is_disabled)
  values (target_user_id, coalesce(target_email, ''), false, true)
  on conflict (id) do update
  set is_admin = false,
      is_disabled = true;

  return query select true, 'User deactivated successfully';
end;
$$;

commit;
