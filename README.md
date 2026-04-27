# EventGO

EventGO is a full-stack event discovery and event management platform built as a bachelor capstone project. The application allows users to explore public events, create accounts, save favorites, RSVP to events, submit new events for review, and communicate with organizers. It also includes an admin workflow for moderation, user management, and message handling.

The project combines a modern React frontend with a Supabase backend powered by PostgreSQL, authentication, Row Level Security, and SQL RPC functions. The goal of the project is to deliver a realistic event platform with both public user features and protected management features.

## Project Overview

EventGO was designed to simulate a real event ecosystem where multiple roles interact with the same platform:

- visitors can browse approved events without signing in
- registered users can manage favorites, RSVPs, messages, and their own submissions
- organizers can create and manage events
- administrators can review content, manage users, and handle platform-level actions

This repository contains the frontend application, the SQL migration files, smoke-test tooling, and supporting configuration needed to run the project.

## Main Features

### Public features

- landing page with featured and upcoming events
- browse page with search, category filtering, price filtering, sorting, and pagination
- event detail pages
- about page, help center, privacy policy, and terms pages
- responsive interface for desktop and mobile layouts

### Authentication and account features

- email and password sign up
- email and password login
- forgot password and password recovery flow
- Google OAuth login when configured in Supabase
- automatic profile creation for new users
- first-admin claim flow when no admin exists yet

### User features

- save and remove favorite events
- RSVP to events
- view personal RSVPs
- submit new events
- save and manage event drafts
- view submitted events
- contact event organizers
- read, reply to, archive, and delete personal messages depending on role and permissions

### Admin features

- review submitted events
- approve, reject, revert, or delete events
- list platform users
- grant or remove admin privileges
- deactivate users
- transfer grand admin responsibility
- view and manage organizer contact messages

### Backend and security features

- relational PostgreSQL schema
- Supabase Auth integration
- Row Level Security policies
- SQL helper functions and security-definer RPCs
- per-user message state tracking
- smoke test script for backend verification
- GitHub Actions CI workflow for build and smoke-test execution

## Technology Stack

### Frontend

- React
- Vite
- React Router
- Tailwind CSS
- Motion
- Radix UI components
- Lucide icons

### Backend

- Supabase
- PostgreSQL
- Supabase Auth
- SQL migrations
- Row Level Security
- RPC functions

### Tooling

- Node.js
- npm
- GitHub Actions

## Project Structure

```text
.
|-- .github/workflows/        # CI workflow
|-- scripts/                  # utility and smoke test scripts
|-- src/
|   |-- app/
|   |   |-- components/       # page and shared UI components
|   |   |-- App.tsx           # app providers and router mounting
|   |   `-- routes.ts         # route configuration
|   |-- styles/               # global styles and theme files
|   `-- utils/                # Supabase client utilities
|-- supabase/                 # SQL migrations and backend-related assets
|-- utils/supabase/info.tsx   # Supabase project config used by the app
|-- package.json
`-- README.md
```

## Application Pages and Modules

The application currently includes these main routes:

- `/` - home page
- `/browse` - browse all approved events
- `/event/:eventId` - individual event details
- `/login` - user login
- `/signup` - account registration
- `/forgot-password` - password reset flow
- `/submit` - submit a new event
- `/my-events` - view submitted events
- `/my-drafts` - manage saved event drafts
- `/favorites` - saved favorite events
- `/my-rsvps` - RSVP history
- `/my-messages` - user messaging area
- `/contact-organizer` - organizer contact flow
- `/admin` - administrator dashboard
- `/about`, `/help`, `/terms`, `/privacy` - informational pages

## Database Model

The core relational model includes:

- `public.profiles`
- `public.events`
- `public.rsvps`
- `public.favorites`
- `public.messages`
- `public.message_user_state`

The schema is extended through later migration phases to support:

- event moderation status
- RSVP counters
- favorites
- contact messaging
- per-user archive/delete state
- admin and grand-admin workflows
- security hardening and permissions lockdown

## Security Model

Security is one of the main technical goals of the project.

- authentication is handled through Supabase Auth
- authorization is enforced with Row Level Security
- admin actions are protected through database RPC functions
- message visibility is restricted to participants and admins
- platform logic is not based on frontend checks alone

This means important operations such as user administration, event moderation, and certain message actions are enforced in the database layer instead of trusting only the UI.

## Prerequisites

Before running the project, make sure you have:

- Node.js 18 or newer
- npm
- a Supabase project
- access to the Supabase SQL Editor

## How to Run the Project

### 1. Clone the repository

```bash
git clone https://github.com/NurAhammadNiloy/EventGo.git
cd EventGo
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure Supabase project values

This project currently reads the Supabase project configuration from:

- `utils/supabase/info.tsx`

Make sure this file contains the correct values for:

- `projectId`
- `publicAnonKey`

If you are using a different Supabase project, replace those values with your own project settings.

### 4. Run the database migrations

Open the Supabase dashboard and execute the SQL files in the exact order below.

## Required SQL Migration Order

1. `supabase/phase1_relational_schema.sql`
2. `supabase/phase2_1_security_hardening.sql`
3. `supabase/phase3_1_event_flow_and_rsvp_counts.sql`
4. `supabase/phase3_2_rsvp_rpc_hardening.sql`
5. `supabase/phase4_messaging_contact_admin_helpers.sql`
6. `supabase/phase5_relational_seed_events.sql`
7. `supabase/phase6_1_rpc_grant_lockdown.sql`
8. `supabase/phase6_2_admin_list_users_include_disabled.sql`
9. `supabase/phase6_3_upsert_profiles_in_admin_actions.sql`
10. `supabase/phase6_4_fix_create_contact_message.sql`
11. `supabase/phase7_1_grand_admin.sql`
12. `supabase/phase8_security_audit_fixes.sql`

### 5. Start the development server

```bash
npm run dev
```

Vite will print the local development URL in the terminal, usually:

```text
http://localhost:5173
```

### 6. Build for production

```bash
npm run build
```

### 7. Run the smoke test

```bash
npm run test:smoke:api
```

Note: the smoke test requires a reachable Supabase backend and will exercise live backend functionality.

## Recommended First-Time Setup Flow

If you are running the project for the first time, use this order:

1. create or select your Supabase project
2. update `utils/supabase/info.tsx`
3. run all SQL migration files in order
4. install npm dependencies
5. start the app with `npm run dev`
6. create a user account
7. claim the first admin account if the system shows that no admin exists
8. seed or submit events
9. test browsing, favorites, RSVPs, messaging, and admin actions

## Available Scripts

- `npm run dev` - starts the development server
- `npm run build` - creates a production build
- `npm run test:smoke:api` - runs the API smoke test script

## CI Workflow

The repository includes a GitHub Actions workflow in `.github/workflows/ci.yml`.

It currently performs:

- dependency installation
- dependency audit
- production build
- smoke test execution

If the smoke test is used in CI, make sure the target Supabase backend and required credentials are available in the execution environment.

## Troubleshooting

### No events appear on the home page or browse page

Check the following:

1. all SQL migration files have been executed successfully
2. the Supabase `projectId` and `publicAnonKey` are correct
3. your database contains approved events
4. seeded events are not marked as drafts
5. at least one profile exists if your seeding logic depends on authenticated users

### Login or signup does not work

Check the following:

1. Supabase Auth is enabled
2. the public anon key is correct
3. redirect URLs are configured correctly in Supabase for auth flows
4. Google OAuth is configured if you are testing Google login

### Contact organizer submission fails

- the user must be authenticated
- the messaging-related SQL migrations must be applied
- the event and organizer references must exist in the database

### Admin page actions fail

Check the following:

1. your user has admin privileges
2. the admin RPC migration files were applied
3. the database policies were updated correctly

### Smoke test fails

Check the following:

1. the Supabase project is online
2. all required migrations were applied
3. approved events exist for read and RSVP tests
4. auth flows are enabled in the Supabase project

## Notes About Legacy Backend Code

Legacy server code has been moved under:

- `supabase/functions/deprecated/`

This directory is preserved only as reference and should not be used for new development.

## Team and Academic Context

EventGO was developed as a bachelor capstone project by a four-member team with responsibilities spanning UI/UX design, quality assurance, backend development, and database engineering. The project reflects both technical implementation and academic work, including planning, research, testing, debugging, documentation, and presentation preparation.

### Team Members

| Member | Role |
| --- | --- |
| Nur Ahammad Niloy | UI/UX Designer |
| Tahbir Moon | Quality Assurance Tester |
| Md Rashedul Islam | Backend Developer |
| Uddhav Dhakal | Database Engineer |

Detailed contribution notes are available in `CONTRIBUTORS.md`.

## License and Attribution

Please review:

- `ATTRIBUTIONS.md`

for any related attribution notes used in the project.
