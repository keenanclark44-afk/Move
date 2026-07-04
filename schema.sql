-- Move app schema (Supabase / Postgres)
-- Mirrors the local IndexedDB entry shape (src/db.js) so the client
-- can push unsynced entries here as a durable backup / multi-device store.

create table if not exists plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in ('match', 'gym', 'training', 'padel', 'general')),
  description text default '',
  created_at timestamptz not null default now()
);

create table if not exists entries (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  source text not null check (source in ('garmin', 'screenshot', 'manual', 'import')),
  category text not null default 'general' check (category in ('match', 'gym', 'training', 'padel', 'general')),
  plan_id uuid references plans(id) on delete set null,
  duration_min integer not null default 0,
  distance_km numeric(6,2) not null default 0,
  avg_hr integer not null default 0,
  max_hr integer not null default 0,
  max_speed_kmh numeric(5,2),
  calories integer not null default 0,
  hr_zones jsonb not null default '{"z1":0,"z2":0,"z3":0,"z4":0,"z5":0}',
  pain_flags jsonb not null default '{"ankle":false,"calf":false,"shin":false}',
  score text,
  feeling text,
  venue text,
  result text check (result in ('win', 'loss', 'draw', 'unknown')),
  goals_scored integer,
  assists integer,
  stamina integer,
  confidence integer,
  touch integer,
  dry_mouth text,
  went_in_goal text,
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

create table if not exists injuries (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  body_part text not null,
  injury_type text,
  grade text,
  pain_level integer,
  swelling text,
  treatment text,
  saw_gp_physio text,
  days_out text,
  status text,
  notes text default '',
  created_at timestamptz not null default now()
);

create index if not exists injuries_date_idx on injuries (date desc);

create table if not exists supplements (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'supplement' check (kind in ('supplement', 'tool')),
  name text not null,
  brand text,
  dosage text,
  timing text,
  status text,
  notes text default '',
  created_at timestamptz not null default now()
);

create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  term text not null check (term in ('short', 'medium', 'long')),
  text text not null,
  baseline text,
  current text,
  target text,
  status text,
  notes text default '',
  created_at timestamptz not null default now()
);
