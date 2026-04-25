-- Phase 5: Relational seed data for public.events
-- Idempotent seed for local/dev so Home/Browse always have approved, non-draft events.

begin;

do $$
declare
  seed_author_id uuid;
begin
  select p.id
  into seed_author_id
  from public.profiles p
  where coalesce(p.is_disabled, false) = false
  order by p.is_admin desc, p.id
  limit 1;

  if seed_author_id is null then
    raise notice 'Phase 5 seed skipped: no profile rows found. Create/login a user first, then re-run this file.';
    return;
  end if;

  insert into public.events (
    id,
    title,
    description,
    author_id,
    status,
    cover_image,
    category,
    start_date,
    end_date,
    start_time,
    end_time,
    venue_name,
    address,
    city,
    pricing_type,
    price,
    capacity,
    tags,
    highlights,
    organizer_name,
    organizer_email,
    organizer_phone,
    website,
    is_draft,
    created_at,
    updated_at
  )
  values
    (
      gen_random_uuid(),
      'Kokkola Spring Street Food Fest',
      'A two-day outdoor food festival featuring Finnish street food, live acoustic sets, and family activities in the city center.',
      seed_author_id,
      'approved',
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1400&q=80&auto=format&fit=crop',
      'Food & Drink',
      date '2026-05-08',
      date '2026-05-09',
      '11:00',
      '20:00',
      'Market Square',
      'Kauppatori 1',
      'Kokkola',
      'paid',
      8,
      1200,
      array['street-food', 'family-friendly', 'live-music'],
      array['25 local food vendors', 'Live music at sunset', 'Kids activity zone'],
      'EventGO Local Team',
      'hello@eventgo.local',
      '+358 40 555 1201',
      'https://eventgo.local/events/street-food-fest',
      false,
      now() - interval '10 days',
      now() - interval '2 days'
    ),
    (
      gen_random_uuid(),
      'Nordic Design Workshop Night',
      'Hands-on workshop exploring Nordic poster design, typography, and digital branding systems for creators and students.',
      seed_author_id,
      'approved',
      'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=1400&q=80&auto=format&fit=crop',
      'Workshop',
      date '2026-05-15',
      null,
      '17:30',
      '21:00',
      'Cultural Lab Hall',
      'Rantakatu 12',
      'Kokkola',
      'paid',
      15,
      60,
      array['design', 'workshop', 'creative-tech'],
      array['Bring your own laptop', 'Template pack included', 'Mentor Q&A session'],
      'EventGO Creative Studio',
      'creative@eventgo.local',
      '+358 40 555 1202',
      'https://eventgo.local/events/nordic-design-night',
      false,
      now() - interval '9 days',
      now() - interval '1 day'
    ),
    (
      gen_random_uuid(),
      'Sunset Wellness Walk & Breathwork',
      'Guided coastal walk with light mobility practice and breathwork to unwind after work. Suitable for beginners.',
      seed_author_id,
      'approved',
      'https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=1400&q=80&auto=format&fit=crop',
      'Wellness',
      date '2026-05-11',
      null,
      '18:00',
      '19:30',
      'Seaside Park Gate',
      'Meripuisto 3',
      'Kokkola',
      'free',
      null,
      80,
      array['wellness', 'outdoor', 'mindfulness'],
      array['Beginner-friendly', 'Certified instructor', 'No equipment required'],
      'EventGO Wellness Collective',
      'wellness@eventgo.local',
      '+358 40 555 1203',
      'https://eventgo.local/events/sunset-wellness-walk',
      false,
      now() - interval '8 days',
      now() - interval '8 hours'
    ),
    (
      gen_random_uuid(),
      'Community Tech Meetup: Build and Ship',
      'An evening meetup for developers and builders sharing practical shipping lessons, demos, and networking.',
      seed_author_id,
      'approved',
      'https://images.unsplash.com/photo-1515169067868-5387ec356754?w=1400&q=80&auto=format&fit=crop',
      'Tech',
      date '2026-05-20',
      null,
      '18:30',
      '21:30',
      'Innovation Hub Auditorium',
      'Satamakatu 5',
      'Kokkola',
      'free',
      null,
      220,
      array['tech', 'networking', 'startup'],
      array['Lightning talks', 'Founder panel', 'Open demo corner'],
      'EventGO Tech Community',
      'tech@eventgo.local',
      '+358 40 555 1204',
      'https://eventgo.local/events/build-and-ship-meetup',
      false,
      now() - interval '7 days',
      now() - interval '6 hours'
    )
  on conflict (id)
  do update set
    title = excluded.title,
    description = excluded.description,
    author_id = excluded.author_id,
    status = excluded.status,
    cover_image = excluded.cover_image,
    category = excluded.category,
    start_date = excluded.start_date,
    end_date = excluded.end_date,
    start_time = excluded.start_time,
    end_time = excluded.end_time,
    venue_name = excluded.venue_name,
    address = excluded.address,
    city = excluded.city,
    pricing_type = excluded.pricing_type,
    price = excluded.price,
    capacity = excluded.capacity,
    tags = excluded.tags,
    highlights = excluded.highlights,
    organizer_name = excluded.organizer_name,
    organizer_email = excluded.organizer_email,
    organizer_phone = excluded.organizer_phone,
    website = excluded.website,
    is_draft = excluded.is_draft,
    updated_at = now();
end;
$$;

commit;
