# Deprecated Edge/KV Backend

This folder contains legacy Supabase Edge Function + KV implementation files that are no longer used by the frontend runtime after the relational migration.

Deprecated files:
- server/index.tsx
- server/kv_store.tsx
- server/seed-data.tsx

Do not wire new frontend code to these files.
All active data flows now use Supabase Postgres tables, RLS policies, and SQL RPC helpers.
