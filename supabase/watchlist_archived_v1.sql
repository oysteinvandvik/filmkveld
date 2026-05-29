-- Legg til 'archived' som gyldig status på watchlist

-- 1. Finn og fjern eksisterende check-constraint på status
alter table public.watchlist
  drop constraint if exists watchlist_status_check;

-- 2. Legg til ny constraint som inkluderer archived
alter table public.watchlist
  add constraint watchlist_status_check
  check (status in ('watching', 'paused', 'completed', 'archived'));
