-- Invitasjonsstøtte: e-post per person
alter table public.people
  add column if not exists email text unique;
