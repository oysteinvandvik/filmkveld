-- Filmkveld database schema
-- Run this in the Supabase SQL Editor

-- Family members (not tied to auth users)
create table public.people (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  avatar_url text,
  created_at timestamptz default now()
);

-- Local cache of TMDB data (TMDB ID is the primary key)
create table public.movies (
  id integer primary key,  -- TMDB ID
  title text not null,
  type text not null check (type in ('movie', 'tv')),
  year text,
  poster_url text,
  overview text,
  created_at timestamptz default now()
);

-- A voting event ("filmkveld")
create table public.voting_sessions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  date date,
  status text not null default 'open' check (status in ('open', 'closed')),
  votes_per_person integer not null default 5,
  created_at timestamptz default now(),
  closed_at timestamptz
);

-- Movies nominated for a session
create table public.session_candidates (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.voting_sessions on delete cascade not null,
  movie_id integer references public.movies not null,
  created_at timestamptz default now(),
  unique (session_id, movie_id)
);

-- Who will vote in a session
create table public.session_participants (
  session_id uuid references public.voting_sessions on delete cascade not null,
  person_id uuid references public.people on delete cascade not null,
  primary key (session_id, person_id)
);

-- Votes: each person can distribute their votes_per_person points freely
create table public.votes (
  session_id uuid references public.voting_sessions on delete cascade not null,
  candidate_id uuid references public.session_candidates on delete cascade not null,
  person_id uuid references public.people on delete cascade not null,
  points integer not null check (points > 0),
  updated_at timestamptz default now(),
  primary key (session_id, candidate_id, person_id)
);

-- Enable realtime for live vote updates
alter publication supabase_realtime add table public.votes;
alter publication supabase_realtime add table public.session_candidates;

-- RLS: authenticated users can do everything (single-family app)
alter table public.people enable row level security;
alter table public.movies enable row level security;
alter table public.voting_sessions enable row level security;
alter table public.session_candidates enable row level security;
alter table public.session_participants enable row level security;
alter table public.votes enable row level security;

create policy "authenticated users full access" on public.people
  for all using (auth.role() = 'authenticated');
create policy "authenticated users full access" on public.movies
  for all using (auth.role() = 'authenticated');
create policy "authenticated users full access" on public.voting_sessions
  for all using (auth.role() = 'authenticated');
create policy "authenticated users full access" on public.session_candidates
  for all using (auth.role() = 'authenticated');
create policy "authenticated users full access" on public.session_participants
  for all using (auth.role() = 'authenticated');
create policy "authenticated users full access" on public.votes
  for all using (auth.role() = 'authenticated');
