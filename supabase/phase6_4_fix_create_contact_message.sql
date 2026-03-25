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
    user_id, type, content, event_id, event_title, organizer_user_id, organizer_email,
    sender_user_id, sender_name, sender_email, sender_phone, subject, message, status,
    replies, last_reply_at, last_reply_by, created_at
  )
  values (
    caller_id, 'contact', clean_message, target_event.id,
    coalesce(nullif(event_title_param, ''), target_event.title),
    target_event.author_id, target_event.organizer_email,
    caller_id, clean_name, clean_email, nullif(sender_phone_param, ''),
    coalesce(subject_param, ''), clean_message, 'unread',
    jsonb_build_array(initial_reply), now(), caller_id, now()
  )
  returning id into new_id;

  if caller_id is not null then
    insert into public.message_user_state(message_id, user_id, archived, deleted, last_read_at)
    values (new_id, caller_id, false, false, now())
    on conflict on constraint message_user_state_pkey
    do update set deleted = false;
  end if;

  if target_event.author_id is not null then
    insert into public.message_user_state(message_id, user_id, archived, deleted)
    values (new_id, target_event.author_id, false, false)
    on conflict on constraint message_user_state_pkey
    do update set deleted = false;
  end if;

  -- Ensure we use new_id instead of message_id to avoid ambiguity
  return query select true, new_id, null::text;
end;
$$;
