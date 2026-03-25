-- Phase 3.1: Event flow support columns + public-safe RSVP count RPC

begin;

-- Extend events to support draft/publish workflows and current UI metadata.
alter table public.events add column if not exists category text;
alter table public.events add column if not exists start_date date;
alter table public.events add column if not exists end_date date;
alter table public.events add column if not exists start_time text;
alter table public.events add column if not exists end_time text;
alter table public.events add column if not exists venue_name text;
alter table public.events add column if not exists address text;
alter table public.events add column if not exists city text;
alter table public.events add column if not exists pricing_type text;
alter table public.events add column if not exists price numeric;
alter table public.events add column if not exists capacity integer;
alter table public.events add column if not exists tags text[];
alter table public.events add column if not exists highlights text[];
alter table public.events add column if not exists organizer_name text;
alter table public.events add column if not exists organizer_email text;
alter table public.events add column if not exists organizer_phone text;
alter table public.events add column if not exists website text;
alter table public.events add column if not exists is_draft boolean not null default false;
alter table public.events add column if not exists created_at timestamptz not null default now();
alter table public.events add column if not exists updated_at timestamptz not null default now();

create index if not exists events_author_draft_idx on public.events(author_id, is_draft);
create index if not exists events_author_status_idx on public.events(author_id, status);
create index if not exists events_status_draft_idx on public.events(status, is_draft);

-- Keep updated_at fresh for edits.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists events_set_updated_at on public.events;
create trigger events_set_updated_at
before update on public.events
for each row execute function public.set_updated_at();

-- Public-safe RSVP aggregate helper for home/browse counters.
create or replace function public.rsvp_counts_by_event_ids(event_ids uuid[])
returns table (event_id uuid, rsvp_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select r.event_id, count(*)::bigint as rsvp_count
  from public.rsvps r
  where r.event_id = any(event_ids)
  group by r.event_id;
$$;

revoke all on function public.rsvp_counts_by_event_ids(uuid[]) from public;
grant execute on function public.rsvp_counts_by_event_ids(uuid[]) to anon, authenticated;

commit;
