-- Phase 6.1: Enforce RPC grant lockdown for admin bootstrap helpers

begin;

-- Prevent anonymous/public execution exposure for admin metadata helper.
revoke all on function public.admin_exists() from public;
revoke all on function public.admin_exists() from anon;
revoke all on function public.admin_exists() from authenticated;
grant execute on function public.admin_exists() to authenticated;

-- Keep first-admin claim restricted to authenticated sessions only.
revoke all on function public.claim_first_admin() from public;
revoke all on function public.claim_first_admin() from anon;
revoke all on function public.claim_first_admin() from authenticated;
grant execute on function public.claim_first_admin() to authenticated;

commit;
