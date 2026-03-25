-- Phase 3.2: Hardening for public RSVP aggregate RPC visibility

begin;

create or replace function public.rsvp_counts_by_event_ids(event_ids uuid[])
returns table (event_id uuid, rsvp_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select r.event_id, count(*)::bigint as rsvp_count
  from public.rsvps r
  inner join public.events e
    on e.id = r.event_id
  where r.event_id = any(event_ids)
    and e.status = 'approved'
    and coalesce(e.is_draft, false) = false
  group by r.event_id;
$$;

revoke all on function public.rsvp_counts_by_event_ids(uuid[]) from public;
grant execute on function public.rsvp_counts_by_event_ids(uuid[]) to anon, authenticated;

commit;
