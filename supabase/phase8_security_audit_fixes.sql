-- phase8_security_audit_fixes.sql
-- F-01: Block non-admins from updating event status
REVOKE UPDATE(status) ON public.events FROM authenticated;

-- F-02: Drop claim_first_admin
drop function if exists public.claim_first_admin();

-- F-15: NULL check in is_admin
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where "uid" is not null and p.id = uid and p.is_admin = true
  );
$$;

-- F-09: Add CHECK constraints
alter table public.events drop constraint if exists events_title_len, drop constraint if exists events_desc_len;
alter table public.events add constraint events_title_len check (length(title) <= 200), add constraint events_desc_len check (length(description) <= 10000);

alter table public.messages drop constraint if exists messages_subject_len, drop constraint if exists messages_msg_len;
alter table public.messages add constraint messages_subject_len check (length(subject) <= 200), add constraint messages_msg_len check (length(message) <= 10000);

-- F-10 & N-02: Audit Log
create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  performed_by uuid not null references auth.users(id),
  target_id text,
  old_value text,
  new_value text,
  created_at timestamptz default now()
);
alter table public.admin_audit_log enable row level security;
drop policy if exists audit_log_admins_only on public.admin_audit_log;
create policy audit_log_admins_only on public.admin_audit_log for select to authenticated using (public.is_admin(auth.uid()));

-- F-03, F-04, F-06, F-16: fix create_contact_message
drop function if exists public.create_contact_message(uuid, text, text, text, text, text);
drop function if exists public.create_contact_message(uuid, text, text, text, text, text, text);
create or replace function public.create_contact_message(event_id_param uuid, event_title_param text, sender_name_param text, sender_email_param text, sender_phone_param text, subject_param text, message_param text)
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
  clean_email text := trim(lower(coalesce(sender_email_param, '')));
  clean_message text := btrim(coalesce(message_param, ''));
begin
  if caller_id is null then return query select false, null::uuid, 'Authentication required'; return; end if;
  if clean_name = '' or clean_email = '' or clean_message = '' then return query select false, null::uuid, 'Missing required fields'; return; end if;
  if not clean_email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then return query select false, null::uuid, 'Invalid email'; return; end if;
  if sender_phone_param is not null and trim(sender_phone_param) != '' and not sender_phone_param ~ '^[+\d\s\-()]{7,20}$' then return query select false, null::uuid, 'Invalid phone'; return; end if;
  if event_id_param is not null then
    select e.id, e.title, e.author_id, e.organizer_email, e.status, e.is_draft into target_event from public.events e where e.id = event_id_param;
    if not found or target_event.status != 'approved' or coalesce(target_event.is_draft, false) = true then return query select false, null::uuid, 'Event not found or not approved'; return; end if;
  end if;
  initial_reply := jsonb_build_object('id', gen_random_uuid()::text, 'senderId', caller_id, 'senderName', clean_name, 'senderEmail', clean_email, 'message', clean_message, 'createdAt', now(), 'isInitialMessage', true);
  insert into public.messages (user_id, type, content, event_id, event_title, organizer_user_id, organizer_email, sender_user_id, sender_name, sender_email, sender_phone, subject, message, status, replies, last_reply_at, last_reply_by, created_at)
  values (caller_id, 'contact', clean_message, target_event.id, coalesce(nullif(event_title_param, ''), target_event.title), target_event.author_id, null, caller_id, clean_name, clean_email, nullif(sender_phone_param, ''), coalesce(subject_param, ''), clean_message, 'unread', jsonb_build_array(initial_reply), now(), caller_id, now()) returning id into new_id;
  if caller_id is not null then insert into public.message_user_state(message_id, user_id, archived, deleted, last_read_at) values (new_id, caller_id, false, false, now()) on conflict on constraint message_user_state_pkey do update set deleted = false; end if;
  if target_event.author_id is not null then insert into public.message_user_state(message_id, user_id, archived, deleted) values (new_id, target_event.author_id, false, false) on conflict on constraint message_user_state_pkey do update set deleted = false; end if;
  return query select true, new_id, null::text;
end;
$$;

-- F-07: limit replies
drop function if exists public.send_contact_reply(uuid, text);
create or replace function public.send_contact_reply(target_message_id uuid, reply_text text)
returns table (success boolean, reply jsonb, error text)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  caller_id uuid := auth.uid(); msg record; reply_obj jsonb; clean_reply text := btrim(coalesce(reply_text, '')); caller_email text := coalesce(auth.jwt() ->> 'email', ''); caller_name text := split_part(coalesce(auth.jwt() ->> 'email', 'User'), '@', 1);
begin
  if caller_id is null then return query select false, null::jsonb, 'Authentication required'; return; end if;
  if clean_reply = '' then return query select false, null::jsonb, 'Message is required'; return; end if;
  if (select jsonb_array_length(replies) from public.messages where id = target_message_id) >= 500 then return query select false, null::jsonb, 'Reply limit reached'; return; end if;
  select * into msg from public.messages m where m.id = target_message_id and m.type = 'contact' for update;
  if not found then return query select false, null::jsonb, 'Conversation not found'; return; end if;
  if not public.is_admin(caller_id) and caller_id <> msg.sender_user_id and caller_id <> msg.organizer_user_id then return query select false, null::jsonb, 'Not authorized'; return; end if;
  reply_obj := jsonb_build_object('id', gen_random_uuid()::text, 'senderId', caller_id, 'senderName', caller_name, 'senderEmail', caller_email, 'message', clean_reply, 'createdAt', now());
  update public.messages set replies = coalesce(replies, '[]'::jsonb) || jsonb_build_array(reply_obj), last_reply_at = now(), last_reply_by = caller_id, status = case when caller_id = organizer_user_id or public.is_admin(caller_id) then 'replied' else 'unread' end where id = target_message_id;
  insert into public.message_user_state(message_id, user_id, archived, deleted, last_read_at) values (target_message_id, caller_id, false, false, now()) on conflict (message_id, user_id) do update set deleted = false, last_read_at = now();
  return query select true, reply_obj, null::text;
end;
$$;

drop function if exists public.rsvp_counts_by_event_ids(uuid[]);
create or replace function public.rsvp_counts_by_event_ids(event_ids uuid[]) returns table (event_id uuid, count bigint) as $$ select r.event_id, count(r.user_id) from public.rsvps r join public.events e on r.event_id = e.id where r.event_id = any(event_ids) and e.status = 'approved' group by r.event_id; $$ language sql stable security definer set search_path = public;

-- N-01 & N-03: Reverting to phase7 signatures with audit logs added
drop function if exists public.admin_set_user_admin(uuid, boolean);
create or replace function public.admin_set_user_admin(target_user_id uuid, make_admin boolean) returns table (success boolean, message text) language plpgsql security definer set search_path = public, auth as $$
declare caller_id uuid := auth.uid(); admin_count integer; target_email text;
begin
  if caller_id is null then return query select false, 'Auth required'; return; end if;
  if not public.is_grand_admin(caller_id) then return query select false, 'Grand Admin access required to change admin privileges'; return; end if;
  if not exists(select 1 from auth.users where id = target_user_id) then return query select false, 'Target user not found'; return; end if;
  select email into target_email from auth.users where id = target_user_id;
  if make_admin = false then
    select count(*)::int into admin_count from public.profiles p where p.is_admin = true;
    if admin_count <= 1 and exists (select 1 from public.profiles p where p.id = target_user_id and p.is_admin = true) then return query select false, 'Cannot remove last admin'; return; end if;
    if exists (select 1 from public.profiles p where p.id = target_user_id and p.is_grand_admin = true) then return query select false, 'Cannot demote a Grand Admin directly'; return; end if;
  end if;
  insert into public.profiles (id, email, is_admin, is_disabled) values (target_user_id, coalesce(target_email, ''), make_admin, false) on conflict (id) do update set is_admin = make_admin, is_disabled = false;
  insert into public.admin_audit_log (action, performed_by, target_id, new_value) values ('admin_set_user_admin', caller_id, target_user_id::text, make_admin::text);
  if make_admin then return query select true, 'User promoted to admin'; else return query select true, 'Admin privileges removed'; end if;
end; $$;

drop function if exists public.admin_update_event_status(uuid, text);
create or replace function public.admin_update_event_status(target_event_id uuid, next_status text) returns table (success boolean, message text, reviewed_at timestamptz) language plpgsql security definer set search_path = public, auth as $$
declare caller_id uuid := auth.uid(); normalized text; updated_ts timestamptz := now(); old_status text;
begin
  if caller_id is null then return query select false, 'Auth required', null::timestamptz; return; end if;
  if not public.is_admin(caller_id) then return query select false, 'Admin access required', null::timestamptz; return; end if;
  normalized := case when next_status = 'pending_review' then 'pending' else next_status end;
  if normalized not in ('pending', 'approved', 'rejected') then return query select false, 'Invalid status', null::timestamptz; return; end if;
  select status into old_status from public.events where id = target_event_id;
  update public.events set status = normalized, updated_at = updated_ts where id = target_event_id;
  if not found then return query select false, 'Event not found', null::timestamptz; return; end if;
  insert into public.admin_audit_log (action, performed_by, target_id, old_value, new_value) values ('admin_update_event_status', caller_id, target_event_id::text, old_status, normalized);
  return query select true, 'Event status updated', updated_ts;
end; $$;

drop function if exists public.admin_deactivate_user(uuid);
create or replace function public.admin_deactivate_user(target_user_id uuid) returns table (success boolean, message text) language plpgsql security definer set search_path = public, auth as $$
declare caller_id uuid := auth.uid(); admin_count integer; target_is_admin boolean; target_email text;
begin
  if caller_id is null then return query select false, 'Auth required'; return; end if;
  if not public.is_admin(caller_id) then return query select false, 'Admin access required'; return; end if;
  if target_user_id = caller_id then return query select false, 'Cannot deactivate self'; return; end if;
  if not exists(select 1 from auth.users where id = target_user_id) then return query select false, 'Not found'; return; end if;
  select email into target_email from auth.users where id = target_user_id;
  select coalesce(p.is_admin, false) into target_is_admin from public.profiles p where p.id = target_user_id;
  if target_is_admin then
     if not public.is_grand_admin(caller_id) then return query select false, 'Only Grand Admin can deactivate admin'; return; end if;
     if exists (select 1 from public.profiles p where p.id = target_user_id and p.is_grand_admin = true) then return query select false, 'Cannot deactivate Grand Admin directly'; return; end if;
     select count(*)::int into admin_count from public.profiles p where p.is_admin = true;
     if admin_count <= 1 then return query select false, 'Cannot remove last admin'; return; end if;
  end if;
  insert into public.profiles (id, email, is_admin, is_disabled) values (target_user_id, coalesce(target_email, ''), false, true) on conflict (id) do update set is_admin = false, is_disabled = true;
  insert into public.admin_audit_log (action, performed_by, target_id, new_value) values ('admin_deactivate_user', caller_id, target_user_id::text, 'true');
  return query select true, 'User deactivated';
end; $$;

-- N-04: Secure transfer RPC
revoke all on function public.admin_transfer_grand_admin(uuid) from public;
grant execute on function public.admin_transfer_grand_admin(uuid) to authenticated;

