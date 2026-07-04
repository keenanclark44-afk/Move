-- Move app schema (Supabase / Postgres)
-- Mirrors the local IndexedDB entry shape (src/db.js) so the client
-- can push unsynced entries here as a durable backup / multi-device store.

create table if not exists entries (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  source text not null check (source in ('garmin', 'screenshot', 'manual')),
  duration_min integer not null default 0,
  distance_km numeric(6,2) not null default 0,
  avg_hr integer not null default 0,
  hr_zones jsonb not null default '{"z1":0,"z2":0,"z3":0,"z4":0,"z5":0}',
  pain_flags jsonb not null default '{"ankle":false,"calf":false,"shin":false}',
  notes text default '',
  raw jsonb,
  created_at timestamptz not null default now()
);

create index if not exists entries_date_idx on entries (date desc);
