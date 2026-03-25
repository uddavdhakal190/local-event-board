-- Phase 1: Relational schema + RLS for EventGO
-- Run this in Supabase SQL Editor.

begin;

-- Required for gen_random_uuid()
create extension if not exists pgcrypto;

-- ------------------------------
-- Tables
-- ------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  is_admin boolean not null default false
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  author_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  cover_image text
);

create table if not exists public.rsvps (
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  primary key (user_id, event_id)
);

create table if not exists public.favorites (
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  primary key (user_id, event_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('contact', 'system')),
  content text not null
);

-- ------------------------------
-- Helpful indexes
-- ------------------------------

create index if not exists events_author_id_idx on public.events(author_id);
create index if not exists events_status_idx on public.events(status);

create index if not exists rsvps_event_id_idx on public.rsvps(event_id);
create index if not exists favorites_event_id_idx on public.favorites(event_id);

create index if not exists messages_user_id_idx on public.messages(user_id);
create index if not exists messages_type_idx on public.messages(type);

-- ------------------------------
-- Profile bootstrap on sign-up
-- ------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, coalesce(new.email, ''))
  on conflict (id) do update
    set email = excluded.email;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ------------------------------
-- Grants
-- ------------------------------

grant usage on schema public to anon, authenticated;

grant select on public.events to anon;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.events to authenticated;
grant select, insert, update, delete on public.rsvps to authenticated;
grant select, insert, update, delete on public.favorites to authenticated;
grant select, insert, update, delete on public.messages to authenticated;

-- ------------------------------
-- RLS helper
-- ------------------------------

create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = uid
      and p.is_admin = true
  );
$$;

-- ------------------------------
-- Enable RLS
-- ------------------------------

alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.rsvps enable row level security;
alter table public.favorites enable row level security;
alter table public.messages enable row level security;

-- ------------------------------
-- Profiles policies
-- ------------------------------

drop policy if exists profiles_select_own_or_admin on public.profiles;
create policy profiles_select_own_or_admin
on public.profiles
for select
to authenticated
using (id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists profiles_insert_own_or_admin on public.profiles;
create policy profiles_insert_own_or_admin
on public.profiles
for insert
to authenticated
with check (id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists profiles_update_own_or_admin on public.profiles;
create policy profiles_update_own_or_admin
on public.profiles
for update
to authenticated
using (id = auth.uid() or public.is_admin(auth.uid()))
with check (id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists profiles_delete_own_or_admin on public.profiles;
create policy profiles_delete_own_or_admin
on public.profiles
for delete
to authenticated
using (id = auth.uid() or public.is_admin(auth.uid()));

-- ------------------------------
-- Events policies
-- Read: approved for everyone, plus own/admin access
-- ------------------------------

drop policy if exists events_select_approved_public on public.events;
create policy events_select_approved_public
on public.events
for select
to anon, authenticated
using (
  status = 'approved'
  or author_id = auth.uid()
  or public.is_admin(auth.uid())
);

drop policy if exists events_insert_own_or_admin on public.events;
create policy events_insert_own_or_admin
on public.events
for insert
to authenticated
with check (
  author_id = auth.uid()
  or public.is_admin(auth.uid())
);

drop policy if exists events_update_own_or_admin on public.events;
create policy events_update_own_or_admin
on public.events
for update
to authenticated
using (
  author_id = auth.uid()
  or public.is_admin(auth.uid())
)
with check (
  author_id = auth.uid()
  or public.is_admin(auth.uid())
);

drop policy if exists events_delete_own_or_admin on public.events;
create policy events_delete_own_or_admin
on public.events
for delete
to authenticated
using (
  author_id = auth.uid()
  or public.is_admin(auth.uid())
);

-- ------------------------------
-- RSVPs policies
-- ------------------------------

drop policy if exists rsvps_select_own_or_admin on public.rsvps;
create policy rsvps_select_own_or_admin
on public.rsvps
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_admin(auth.uid())
);

drop policy if exists rsvps_insert_own_or_admin on public.rsvps;
create policy rsvps_insert_own_or_admin
on public.rsvps
for insert
to authenticated
with check (
  user_id = auth.uid()
  or public.is_admin(auth.uid())
);

drop policy if exists rsvps_update_own_or_admin on public.rsvps;
create policy rsvps_update_own_or_admin
on public.rsvps
for update
to authenticated
using (
  user_id = auth.uid()
  or public.is_admin(auth.uid())
)
with check (
  user_id = auth.uid()
  or public.is_admin(auth.uid())
);

drop policy if exists rsvps_delete_own_or_admin on public.rsvps;
create policy rsvps_delete_own_or_admin
on public.rsvps
for delete
to authenticated
using (
  user_id = auth.uid()
  or public.is_admin(auth.uid())
);

-- ------------------------------
-- Favorites policies
-- ------------------------------

drop policy if exists favorites_select_own_or_admin on public.favorites;
create policy favorites_select_own_or_admin
on public.favorites
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_admin(auth.uid())
);

drop policy if exists favorites_insert_own_or_admin on public.favorites;
create policy favorites_insert_own_or_admin
on public.favorites
for insert
to authenticated
with check (
  user_id = auth.uid()
  or public.is_admin(auth.uid())
);

drop policy if exists favorites_update_own_or_admin on public.favorites;
create policy favorites_update_own_or_admin
on public.favorites
for update
to authenticated
using (
  user_id = auth.uid()
  or public.is_admin(auth.uid())
)
with check (
  user_id = auth.uid()
  or public.is_admin(auth.uid())
);

drop policy if exists favorites_delete_own_or_admin on public.favorites;
create policy favorites_delete_own_or_admin
on public.favorites
for delete
to authenticated
using (
  user_id = auth.uid()
  or public.is_admin(auth.uid())
);

-- ------------------------------
-- Messages policies
-- ------------------------------

drop policy if exists messages_select_own_or_admin on public.messages;
create policy messages_select_own_or_admin
on public.messages
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_admin(auth.uid())
);

drop policy if exists messages_insert_own_or_admin on public.messages;
create policy messages_insert_own_or_admin
on public.messages
for insert
to authenticated
with check (
  user_id = auth.uid()
  or public.is_admin(auth.uid())
);

drop policy if exists messages_update_own_or_admin on public.messages;
create policy messages_update_own_or_admin
on public.messages
for update
to authenticated
using (
  user_id = auth.uid()
  or public.is_admin(auth.uid())
)
with check (
  user_id = auth.uid()
  or public.is_admin(auth.uid())
);

drop policy if exists messages_delete_own_or_admin on public.messages;
create policy messages_delete_own_or_admin
on public.messages
for delete
to authenticated
using (
  user_id = auth.uid()
  or public.is_admin(auth.uid())
);

commit;
