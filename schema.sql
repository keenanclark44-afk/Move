-- Move app schema (Supabase / Postgres)
-- Mirrors the local IndexedDB entry shape (src/db.js) so the client
-- can push unsynced entries here as a durable backup / multi-device store.

create table if not exists plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in ('match', 'gym', 'training', 'general')),
  description text default '',
  created_at timestamptz not null default now()
);

create table if not exists entries (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  source text not null check (source in ('garmin', 'screenshot', 'manual')),
  category text not null default 'general' check (category in ('match', 'gym', 'training', 'general')),
  plan_id uuid references plans(id) on delete set null,
  duration_min integer not null default 0,
  distance_km numeric(6,2) not null default 0,
  avg_hr integer not null default 0,
  hr_zones jsonb not null default '{"z1":0,"z2":0,"z3":0,"z4":0,"z5":0}',
  pain_flags jsonb not null default '{"ankle":false,"calf":false,"shin":false}',
  score text,
  feeling text,
  notes text default '',
  raw jsonb,
  created_at timestamptz not null default now()
);

create index if not exists entries_date_idx on entries (date desc);
create index if not exists entries_category_idx on entries (category);

-- Manual health metrics for the General tab (VO2 max / sleep / weight).
-- Progress photos are intentionally device-only (IndexedDB), not synced here.
create table if not exists metrics (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  type text not null check (type in ('vo2max', 'sleep', 'weight')),
  value numeric not null,
  created_at timestamptz not null default now()
);

create index if not exists metrics_date_idx on metrics (date desc);
