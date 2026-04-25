-- Phase 7.1: Grand Admin Role and Hierarchy

begin;

-- 1. Add grand admin column
alter table public.profiles
add column if not exists is_grand_admin boolean not null default false;

-- 2. Helper function
create or replace function public.is_grand_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1 from public.profiles p
    where p.id = uid and coalesce(p.is_grand_admin, false) = true
  );
$$;

-- 3. Bootstrap first grand admin from existing first admin if none exists
do $$
declare any_grand boolean;
declare first_admin uuid;
begin
  select exists(select 1 from public.profiles where is_grand_admin = true) into any_grand;
  if not any_grand then
    select id into first_admin
    from public.profiles
    where is_admin = true
    order by id asc
    limit 1;

    if first_admin is not null then
      update public.profiles
      set is_grand_admin = true
      where id = first_admin;
    end if;
  end if;
end $$;

-- 4. Re-define admin_set_user_admin to require Grand Admin
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

  if not public.is_grand_admin(caller_id) then
    return query select false, 'Grand Admin access required to change admin privileges';
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

    -- Prevent demoting a Grand Admin
    if exists (select 1 from public.profiles p where p.id = target_user_id and p.is_grand_admin = true) then
      return query select false, 'Cannot demote a Grand Admin directly';
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

-- 5. Update admin_deactivate_user to prevent normal admins from deactivating other admins
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
     if not public.is_grand_admin(caller_id) then
       return query select false, 'Only Grand Admin can deactivate an admin';
       return;
     end if;

     -- Prevent deactivating grand admin directly
     if exists (select 1 from public.profiles p where p.id = target_user_id and p.is_grand_admin = true) then
       return query select false, 'Cannot deactivate a Grand Admin directly';
       return;
     end if;
     
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

-- 6. Add transfer RPC
create or replace function public.admin_transfer_grand_admin(target_user_id uuid)
returns table (success boolean, message text)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  caller_id uuid := auth.uid();
begin
  if caller_id is null then
    return query select false, 'Authentication required';
    return;
  end if;

  if not public.is_grand_admin(caller_id) then
    return query select false, 'Grand Admin access required to transfer this role';
    return;
  end if;

  if not exists(select 1 from auth.users where id = target_user_id) then
    return query select false, 'Target user not found';
    return;
  end if;

  -- Remove grand admin from everywhere
  update public.profiles set is_grand_admin = false where is_grand_admin = true;

  -- Grant it to the target
  insert into public.profiles (id, email, is_admin, is_grand_admin, is_disabled)
  values (
    target_user_id,
    coalesce((select email from auth.users where id = target_user_id), ''),
    true,
    true,
    false
  )
  on conflict (id) do update
  set is_admin = true,
      is_grand_admin = true,
      is_disabled = false;

  return query select true, 'Grand Admin transferred successfully';
end;
$$;

-- 7. Update admin list users function to return is_grand_admin 
drop function if exists public.admin_list_users();

create or replace function public.admin_list_users()
returns table (
  id uuid,
  email text,
  name text,
  avatar text,
  is_admin boolean,
  is_grand_admin boolean,
  created_at timestamptz,
  last_sign_in timestamptz,
  is_disabled boolean
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Admin access required';
  end if;

  return query
  select 
    u.id::uuid, 
    coalesce(u.email, p.email, '')::text as email, 
    coalesce(u.raw_user_meta_data ->> 'name', u.raw_user_meta_data ->> 'full_name', split_part(u.email, '@', 1))::text as name,
    coalesce(u.raw_user_meta_data ->> 'avatar_url', '')::text as avatar,
    coalesce(p.is_admin, false) as is_admin,
    coalesce(p.is_grand_admin, false) as is_grand_admin,
    u.created_at::timestamptz as created_at,
    u.last_sign_in_at::timestamptz as last_sign_in,
    coalesce(p.is_disabled, false) as is_disabled
  from auth.users u
  left join public.profiles p on u.id = p.id;
end;
$$;

commit;