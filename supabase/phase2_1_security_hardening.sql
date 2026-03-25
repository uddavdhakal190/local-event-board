-- Phase 2.1: Security hardening for profiles admin escalation and safe admin bootstrap RPC

begin;

-- ------------------------------
-- Restrict profile write surface
-- ------------------------------

revoke update on table public.profiles from authenticated;
revoke insert on table public.profiles from authenticated;

grant insert (id, email) on table public.profiles to authenticated;
grant update (email) on table public.profiles to authenticated;

-- Non-admin users may only keep their own safe profile fields updated.
drop policy if exists profiles_insert_own_or_admin on public.profiles;
create policy profiles_insert_own_or_admin
on public.profiles
for insert
to authenticated
with check (
  (id = auth.uid() and coalesce(is_admin, false) = false)
  or public.is_admin(auth.uid())
);

drop policy if exists profiles_update_own_or_admin on public.profiles;
create policy profiles_update_own_or_admin
on public.profiles
for update
to authenticated
using (
  id = auth.uid() or public.is_admin(auth.uid())
)
with check (
  (
    id = auth.uid()
    and is_admin = coalesce((select p.is_admin from public.profiles p where p.id = auth.uid()), false)
  )
  or public.is_admin(auth.uid())
);

-- ------------------------------
-- Safe helper RPCs
-- ------------------------------

create or replace function public.admin_exists()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.is_admin = true
  );
$$;

create or replace function public.claim_first_admin()
returns table (success boolean, message text)
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_id uuid := auth.uid();
  caller_email text := coalesce(auth.jwt() ->> 'email', '');
begin
  if caller_id is null then
    return query select false, 'Authentication required';
    return;
  end if;

  -- Serialize first-admin claiming to avoid race conditions.
  perform pg_advisory_xact_lock(hashtext('public.claim_first_admin'));

  if exists (select 1 from public.profiles where is_admin = true) then
    if exists (select 1 from public.profiles where id = caller_id and is_admin = true) then
      return query select true, 'You are already an admin';
    else
      return query select false, 'Admin already exists';
    end if;
    return;
  end if;

  insert into public.profiles (id, email)
  values (caller_id, caller_email)
  on conflict (id) do update
    set email = excluded.email;

  update public.profiles
  set is_admin = true
  where id = caller_id;

  return query select true, 'Admin claim successful';
end;
$$;

revoke all on function public.admin_exists() from public;
grant execute on function public.admin_exists() to authenticated;

revoke all on function public.claim_first_admin() from public;
grant execute on function public.claim_first_admin() to authenticated;

commit;
