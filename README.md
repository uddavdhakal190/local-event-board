
# EventGO UI

EventGO is a React + Supabase event platform running on a relational Postgres model with RLS and SQL RPCs.

## Current Architecture

- Frontend: React + Vite + Tailwind.
- Auth: Supabase Auth (email/password and OAuth if configured).
- Data model: Postgres tables in `public` schema.
- Security: Row Level Security policies + narrowly scoped `SECURITY DEFINER` RPCs.
- Admin operations: SQL-enforced via RPC (`admin_*` functions), not UI-only checks.
- Messaging: Per-user read/archive/delete state in `message_user_state`.

## Core Relational Tables

- `public.profiles`
- `public.events`
- `public.rsvps`
- `public.favorites`
- `public.messages`
- `public.message_user_state`

## Legacy Backend Status

Legacy Edge/KV server code has been decommissioned from active runtime paths and quarantined under:

- `supabase/functions/deprecated/server/`

Do not wire new frontend features to deprecated Edge endpoints.

## Setup

1. Install dependencies:

```bash
npm i
```

2. Start development server:

```bash
npm run dev
```

## Required SQL Migration Order

Run these files in Supabase SQL Editor in this exact order:

1. `supabase/phase1_relational_schema.sql`
2. `supabase/phase2_1_security_hardening.sql`
3. `supabase/phase3_1_event_flow_and_rsvp_counts.sql`
4. `supabase/phase3_2_rsvp_rpc_hardening.sql`
5. `supabase/phase4_messaging_contact_admin_helpers.sql`
6. `supabase/phase5_relational_seed_events.sql`
7. `supabase/phase6_1_rpc_grant_lockdown.sql`

## Migration Run Guide

1. Open Supabase Dashboard -> SQL Editor.
2. Execute files in the order above, one file at a time.
3. Verify each execution succeeds before running the next file.
4. After all files are applied, reload the app.

## Troubleshooting

### No events visible on Home or Browse

Check these in order:

1. Confirm all SQL files above were executed successfully.
2. Ensure at least one authenticated user exists and has a `profiles` row.
3. Re-run `supabase/phase5_relational_seed_events.sql` after user/profile exists.
4. Confirm seeded events are `status='approved'` and `is_draft=false`.
5. Confirm your Supabase project URL/key env values are correct for this app.

### Contact organizer submission fails

- Contact creation is authenticated-only by policy.
- Sign in first, then submit from the contact page.

### Admin actions fail

- Ensure your account has admin status via `claim_first_admin` (first admin) or `admin_set_user_admin`.
  