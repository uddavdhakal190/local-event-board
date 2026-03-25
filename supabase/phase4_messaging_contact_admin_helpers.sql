-- Phase 4: Messaging/contact/admin migration helpers (SDK + secure RPC)

begin;

-- ------------------------------
-- Message model expansion
-- ------------------------------

alter table public.messages alter column user_id drop not null;

alter table public.messages add column if not exists event_id uuid references public.events(id) on delete set null;
alter table public.messages add column if not exists event_title text;
alter table public.messages add column if not exists organizer_user_id uuid references public.profiles(id) on delete set null;
alter table public.messages add column if not exists organizer_email text;
alter table public.messages add column if not exists sender_user_id uuid references public.profiles(id) on delete set null;
alter table public.messages add column if not exists sender_name text;
alter table public.messages add column if not exists sender_email text;
alter table public.messages add column if not exists sender_phone text;
alter table public.messages add column if not exists subject text;
alter table public.messages add column if not exists message text;
alter table public.messages add column if not exists status text not null default 'unread' check (status in ('unread', 'read', 'replied'));
alter table public.messages add column if not exists replies jsonb not null default '[]'::jsonb;
alter table public.messages add column if not exists last_reply_at timestamptz;
alter table public.messages add column if not exists last_reply_by uuid references public.profiles(id) on delete set null;
alter table public.messages add column if not exists read_by uuid references public.profiles(id) on delete set null;
alter table public.messages add column if not exists read_at timestamptz;
alter table public.messages add column if not exists created_at timestamptz not null default now();

create index if not exists messages_type_created_idx on public.messages(type, created_at desc);
create index if not exists messages_sender_idx on public.messages(sender_user_id);
create index if not exists messages_organizer_idx on public.messages(organizer_user_id);
create index if not exists messages_last_reply_at_idx on public.messages(last_reply_at desc);

-- Per-user message state for archive/delete/read tracking.
create table if not exists public.message_user_state (
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  archived boolean not null default false,
  deleted boolean not null default false,
  last_read_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (message_id, user_id)
);

create index if not exists message_user_state_user_flags_idx
  on public.message_user_state(user_id, archived, deleted, updated_at desc);

-- Keep state row timestamps fresh.
drop trigger if exists message_user_state_set_updated_at on public.message_user_state;
create trigger message_user_state_set_updated_at
before update on public.message_user_state
for each row execute function public.set_updated_at();

-- ------------------------------
-- Grants + RLS
-- ------------------------------

revoke all on table public.messages from anon;
revoke insert, update, delete on table public.messages from authenticated;
grant select on table public.messages to authenticated;

grant select, insert, update, delete on table public.message_user_state to authenticated;

alter table public.message_user_state enable row level security;

drop policy if exists message_user_state_select_own_or_admin on public.message_user_state;
create policy message_user_state_select_own_or_admin
on public.message_user_state
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_admin(auth.uid())
);

drop policy if exists message_user_state_insert_own_or_admin on public.message_user_state;
create policy message_user_state_insert_own_or_admin
on public.message_user_state
for insert
to authenticated
with check (
  user_id = auth.uid()
  or public.is_admin(auth.uid())
);

drop policy if exists message_user_state_update_own_or_admin on public.message_user_state;
create policy message_user_state_update_own_or_admin
on public.message_user_state
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

drop policy if exists message_user_state_delete_own_or_admin on public.message_user_state;
create policy message_user_state_delete_own_or_admin
on public.message_user_state
for delete
to authenticated
using (
  user_id = auth.uid()
  or public.is_admin(auth.uid())
);

-- Replace broad message policies with participant/admin reads only.
drop policy if exists messages_select_own_or_admin on public.messages;
drop policy if exists messages_insert_own_or_admin on public.messages;
drop policy if exists messages_update_own_or_admin on public.messages;
drop policy if exists messages_delete_own_or_admin on public.messages;

create policy messages_select_participant_or_admin
on public.messages
for select
to authenticated
using (
  public.is_admin(auth.uid())
  or sender_user_id = auth.uid()
  or organizer_user_id = auth.uid()
  or user_id = auth.uid()
);

create policy messages_insert_admin_only
on public.messages
for insert
to authenticated
with check (public.is_admin(auth.uid()));

create policy messages_update_admin_only
on public.messages
for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy messages_delete_admin_only
on public.messages
for delete
to authenticated
using (public.is_admin(auth.uid()));

-- ------------------------------
-- Profile admin operations
-- ------------------------------

alter table public.profiles add column if not exists is_disabled boolean not null default false;

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
    u.id,
    coalesce(u.email, p.email, ''),
    coalesce(
      u.raw_user_meta_data ->> 'name',
      u.raw_user_meta_data ->> 'full_name',
      split_part(coalesce(u.email, p.email, 'User'), '@', 1),
      'User'
    ) as name,
    u.raw_user_meta_data ->> 'avatar_url' as avatar,
    coalesce(p.is_admin, false) as is_admin,
    u.created_at,
    u.last_sign_in_at,
    coalesce(p.is_disabled, false) as is_disabled
  from auth.users u
  left join public.profiles p on p.id = u.id
  where coalesce(p.is_disabled, false) = false
  order by coalesce(p.is_admin, false) desc, u.created_at desc;
end;
$$;

create or replace function public.admin_set_user_admin(target_user_id uuid, make_admin boolean)
returns table (success boolean, message text)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  caller_id uuid := auth.uid();
  admin_count integer;
  target_exists boolean;
begin
  if caller_id is null then
    return query select false, 'Authentication required';
    return;
  end if;

  if not public.is_admin(caller_id) then
    return query select false, 'Admin access required';
    return;
  end if;

  select exists(select 1 from public.profiles p where p.id = target_user_id) into target_exists;
  if not target_exists then
    return query select false, 'Target user not found';
    return;
  end if;

  if make_admin = false then
    select count(*)::int into admin_count from public.profiles p where p.is_admin = true;
    if admin_count <= 1 and exists (select 1 from public.profiles p where p.id = target_user_id and p.is_admin = true) then
      return query select false, 'Cannot remove the last admin';
      return;
    end if;
  end if;

  update public.profiles
  set is_admin = make_admin,
      is_disabled = false
  where id = target_user_id;

  if make_admin then
    return query select true, 'User promoted to admin';
  else
    return query select true, 'Admin privileges removed';
  end if;
end;
$$;

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

  if not exists(select 1 from public.profiles p where p.id = target_user_id) then
    return query select false, 'Target user not found';
    return;
  end if;

  select coalesce(p.is_admin, false) into target_is_admin
  from public.profiles p
  where p.id = target_user_id;

  if target_is_admin then
    select count(*)::int into admin_count from public.profiles p where p.is_admin = true;
    if admin_count <= 1 then
      return query select false, 'Cannot remove the last admin';
      return;
    end if;
  end if;

  update public.profiles
  set is_admin = false,
      is_disabled = true
  where id = target_user_id;

  return query select true, 'User deactivated successfully';
end;
$$;

-- ------------------------------
-- Event moderation RPCs
-- ------------------------------

create or replace function public.admin_update_event_status(target_event_id uuid, next_status text)
returns table (success boolean, message text, reviewed_at timestamptz)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  caller_id uuid := auth.uid();
  normalized text;
  updated_ts timestamptz := now();
begin
  if caller_id is null then
    return query select false, 'Authentication required', null::timestamptz;
    return;
  end if;

  if not public.is_admin(caller_id) then
    return query select false, 'Admin access required', null::timestamptz;
    return;
  end if;

  normalized := case when next_status = 'pending_review' then 'pending' else next_status end;

  if normalized not in ('pending', 'approved', 'rejected') then
    return query select false, 'Invalid status', null::timestamptz;
    return;
  end if;

  update public.events
  set status = normalized,
      updated_at = updated_ts
  where id = target_event_id;

  if not found then
    return query select false, 'Event not found', null::timestamptz;
    return;
  end if;

  return query select true, 'Event status updated', updated_ts;
end;
$$;

create or replace function public.admin_delete_event(target_event_id uuid)
returns table (success boolean, message text)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null then
    return query select false, 'Authentication required';
    return;
  end if;

  if not public.is_admin(auth.uid()) then
    return query select false, 'Admin access required';
    return;
  end if;

  delete from public.events where id = target_event_id;

  if not found then
    return query select false, 'Event not found';
    return;
  end if;

  return query select true, 'Event deleted';
end;
$$;

-- ------------------------------
-- Messaging/contact RPCs
-- ------------------------------

create or replace function public.create_contact_message(
  event_id_param uuid,
  event_title_param text,
  sender_name_param text,
  sender_email_param text,
  sender_phone_param text,
  subject_param text,
  message_param text
)
returns table (success boolean, message_id uuid, error text)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  caller_id uuid := auth.uid();
  target_event record;
  new_id uuid;
  initial_reply jsonb;
  clean_name text := btrim(coalesce(sender_name_param, ''));
  clean_email text := btrim(coalesce(sender_email_param, ''));
  clean_message text := btrim(coalesce(message_param, ''));
begin
  if caller_id is null then
    return query select false, null::uuid, 'Authentication required to contact organizers';
    return;
  end if;

  if clean_name = '' or clean_email = '' or clean_message = '' then
    return query select false, null::uuid, 'Name, email, and message are required';
    return;
  end if;

  if position('@' in clean_email) = 0 then
    return query select false, null::uuid, 'Invalid email address';
    return;
  end if;

  if event_id_param is not null then
    select e.id, e.title, e.author_id, e.organizer_email
    into target_event
    from public.events e
    where e.id = event_id_param;
  end if;

  initial_reply := jsonb_build_object(
    'id', gen_random_uuid()::text,
    'senderId', caller_id,
    'senderName', clean_name,
    'senderEmail', clean_email,
    'message', clean_message,
    'createdAt', now(),
    'isInitialMessage', true
  );

  insert into public.messages (
    user_id,
    type,
    content,
    event_id,
    event_title,
    organizer_user_id,
    organizer_email,
    sender_user_id,
    sender_name,
    sender_email,
    sender_phone,
    subject,
    message,
    status,
    replies,
    last_reply_at,
    last_reply_by,
    created_at
  )
  values (
    caller_id,
    'contact',
    clean_message,
    target_event.id,
    coalesce(nullif(event_title_param, ''), target_event.title),
    target_event.author_id,
    target_event.organizer_email,
    caller_id,
    clean_name,
    clean_email,
    nullif(sender_phone_param, ''),
    coalesce(subject_param, ''),
    clean_message,
    'unread',
    jsonb_build_array(initial_reply),
    now(),
    caller_id,
    now()
  )
  returning id into new_id;

  if caller_id is not null then
    insert into public.message_user_state(message_id, user_id, archived, deleted, last_read_at)
    values (new_id, caller_id, false, false, now())
    on conflict (message_id, user_id)
    do update set deleted = false;
  end if;

  if target_event.author_id is not null then
    insert into public.message_user_state(message_id, user_id, archived, deleted)
    values (new_id, target_event.author_id, false, false)
    on conflict (message_id, user_id)
    do update set deleted = false;
  end if;

  return query select true, new_id, null::text;
end;
$$;

create or replace function public.send_contact_reply(target_message_id uuid, reply_text text)
returns table (success boolean, reply jsonb, error text)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  caller_id uuid := auth.uid();
  msg record;
  reply_obj jsonb;
  clean_reply text := btrim(coalesce(reply_text, ''));
  caller_email text := coalesce(auth.jwt() ->> 'email', '');
  caller_name text := split_part(coalesce(auth.jwt() ->> 'email', 'User'), '@', 1);
begin
  if caller_id is null then
    return query select false, null::jsonb, 'Authentication required';
    return;
  end if;

  if clean_reply = '' then
    return query select false, null::jsonb, 'Message is required';
    return;
  end if;

  select *
  into msg
  from public.messages m
  where m.id = target_message_id
    and m.type = 'contact'
  for update;

  if not found then
    return query select false, null::jsonb, 'Conversation not found';
    return;
  end if;

  if not public.is_admin(caller_id)
     and caller_id <> msg.sender_user_id
     and caller_id <> msg.organizer_user_id then
    return query select false, null::jsonb, 'You do not have access to this conversation';
    return;
  end if;

  reply_obj := jsonb_build_object(
    'id', gen_random_uuid()::text,
    'senderId', caller_id,
    'senderName', caller_name,
    'senderEmail', caller_email,
    'message', clean_reply,
    'createdAt', now()
  );

  update public.messages
  set replies = coalesce(replies, '[]'::jsonb) || jsonb_build_array(reply_obj),
      last_reply_at = now(),
      last_reply_by = caller_id,
      status = case
        when caller_id = organizer_user_id or public.is_admin(caller_id) then 'replied'
        else 'unread'
      end
  where id = target_message_id;

  insert into public.message_user_state(message_id, user_id, archived, deleted, last_read_at)
  values (target_message_id, caller_id, false, false, now())
  on conflict (message_id, user_id)
  do update set deleted = false, last_read_at = now();

  return query select true, reply_obj, null::text;
end;
$$;

create or replace function public.mark_contact_message_read(target_message_id uuid)
returns table (success boolean, error text)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  caller_id uuid := auth.uid();
  msg record;
begin
  if caller_id is null then
    return query select false, 'Authentication required';
    return;
  end if;

  select * into msg
  from public.messages m
  where m.id = target_message_id
    and m.type = 'contact';

  if not found then
    return query select false, 'Conversation not found';
    return;
  end if;

  if not public.is_admin(caller_id)
     and caller_id <> msg.sender_user_id
     and caller_id <> msg.organizer_user_id then
    return query select false, 'You do not have access to this conversation';
    return;
  end if;

  insert into public.message_user_state(message_id, user_id, archived, deleted, last_read_at)
  values (target_message_id, caller_id, false, false, now())
  on conflict (message_id, user_id)
  do update set last_read_at = now(), deleted = false;

  return query select true, null::text;
end;
$$;

create or replace function public.set_contact_message_archived(target_message_id uuid, archive_value boolean)
returns table (success boolean, error text)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  caller_id uuid := auth.uid();
  msg record;
begin
  if caller_id is null then
    return query select false, 'Authentication required';
    return;
  end if;

  select * into msg
  from public.messages m
  where m.id = target_message_id
    and m.type = 'contact';

  if not found then
    return query select false, 'Conversation not found';
    return;
  end if;

  if not public.is_admin(caller_id)
     and caller_id <> msg.sender_user_id
     and caller_id <> msg.organizer_user_id then
    return query select false, 'You do not have access to this conversation';
    return;
  end if;

  insert into public.message_user_state(message_id, user_id, archived, deleted)
  values (target_message_id, caller_id, archive_value, false)
  on conflict (message_id, user_id)
  do update set archived = archive_value, deleted = false;

  return query select true, null::text;
end;
$$;

create or replace function public.soft_delete_contact_message(target_message_id uuid)
returns table (success boolean, error text)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  caller_id uuid := auth.uid();
  msg record;
begin
  if caller_id is null then
    return query select false, 'Authentication required';
    return;
  end if;

  select * into msg
  from public.messages m
  where m.id = target_message_id
    and m.type = 'contact';

  if not found then
    return query select false, 'Conversation not found';
    return;
  end if;

  if not public.is_admin(caller_id)
     and caller_id <> msg.sender_user_id
     and caller_id <> msg.organizer_user_id then
    return query select false, 'You do not have access to this conversation';
    return;
  end if;

  insert into public.message_user_state(message_id, user_id, archived, deleted)
  values (target_message_id, caller_id, false, true)
  on conflict (message_id, user_id)
  do update set deleted = true;

  return query select true, null::text;
end;
$$;

create or replace function public.my_unread_conversation_count()
returns integer
language sql
stable
security definer
set search_path = public, auth
as $$
  select coalesce(count(*)::int, 0)
  from public.messages m
  left join public.message_user_state mus
    on mus.message_id = m.id
   and mus.user_id = auth.uid()
  where auth.uid() is not null
    and m.type = 'contact'
    and (m.sender_user_id = auth.uid() or m.organizer_user_id = auth.uid())
    and coalesce(mus.deleted, false) = false
    and coalesce(mus.archived, false) = false
    and coalesce(m.last_reply_at, m.created_at) > coalesce(mus.last_read_at, 'epoch'::timestamptz)
    and coalesce(m.last_reply_by, m.sender_user_id) <> auth.uid();
$$;

-- ------------------------------
-- RPC grants
-- ------------------------------

revoke all on function public.admin_list_users() from public;
revoke all on function public.admin_set_user_admin(uuid, boolean) from public;
revoke all on function public.admin_deactivate_user(uuid) from public;
revoke all on function public.admin_update_event_status(uuid, text) from public;
revoke all on function public.admin_delete_event(uuid) from public;
revoke all on function public.create_contact_message(uuid, text, text, text, text, text, text) from public;
revoke all on function public.send_contact_reply(uuid, text) from public;
revoke all on function public.mark_contact_message_read(uuid) from public;
revoke all on function public.set_contact_message_archived(uuid, boolean) from public;
revoke all on function public.soft_delete_contact_message(uuid) from public;
revoke all on function public.my_unread_conversation_count() from public;

grant execute on function public.admin_list_users() to authenticated;
grant execute on function public.admin_set_user_admin(uuid, boolean) to authenticated;
grant execute on function public.admin_deactivate_user(uuid) to authenticated;
grant execute on function public.admin_update_event_status(uuid, text) to authenticated;
grant execute on function public.admin_delete_event(uuid) to authenticated;
grant execute on function public.create_contact_message(uuid, text, text, text, text, text, text) to authenticated;
grant execute on function public.send_contact_reply(uuid, text) to authenticated;
grant execute on function public.mark_contact_message_read(uuid) to authenticated;
grant execute on function public.set_contact_message_archived(uuid, boolean) to authenticated;
grant execute on function public.soft_delete_contact_message(uuid) to authenticated;
grant execute on function public.my_unread_conversation_count() to authenticated;

commit;
