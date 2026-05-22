-- Nye kolonner for movies (TMDB-data)
alter table public.movies
  add column if not exists genre text,
  add column if not exists runtime integer,
  add column if not exists tmdb_rating numeric(3,1),
  add column if not exists seasons integer,
  add column if not exists original_language text;

-- Nye kolonner for watchlist
alter table public.watchlist
  add column if not exists platform text,
  add column if not exists started_at timestamptz,
  add column if not exists completed_at timestamptz,
  add column if not exists family_rating integer check (family_rating between 1 and 5),
  add column if not exists episode_progress text;

-- Seanselogg
create table if not exists public.watch_log (
  id uuid primary key default gen_random_uuid(),
  watchlist_id uuid references public.watchlist on delete cascade not null,
  watched_at date not null default current_date,
  notes text,
  created_at timestamptz default now()
);

-- Hvem var til stede på en seanse
create table if not exists public.watch_log_viewers (
  watch_log_id uuid references public.watch_log on delete cascade not null,
  person_id uuid references public.people on delete cascade not null,
  primary key (watch_log_id, person_id)
);

-- RLS
alter table public.watch_log enable row level security;
alter table public.watch_log_viewers enable row level security;

create policy "authenticated users full access" on public.watch_log
  for all using (auth.role() = 'authenticated');
create policy "authenticated users full access" on public.watch_log_viewers
  for all using (auth.role() = 'authenticated');
