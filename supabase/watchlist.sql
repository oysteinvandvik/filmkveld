-- Watchlist: films/series the family is actively tracking
create table public.watchlist (
  id uuid primary key default gen_random_uuid(),
  movie_id integer references public.movies not null,
  status text not null default 'watching' check (status in ('watching', 'completed', 'paused')),
  notes text,
  created_at timestamptz default now()
);

-- Who is watching each entry
create table public.watchlist_viewers (
  watchlist_id uuid references public.watchlist on delete cascade not null,
  person_id uuid references public.people on delete cascade not null,
  primary key (watchlist_id, person_id)
);

-- RLS
alter table public.watchlist enable row level security;
alter table public.watchlist_viewers enable row level security;

create policy "authenticated users full access" on public.watchlist
  for all using (auth.role() = 'authenticated');
create policy "authenticated users full access" on public.watchlist_viewers
  for all using (auth.role() = 'authenticated');
