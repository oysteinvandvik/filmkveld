-- Oppdater tilstandsmaskin: suggestion → voting → decided → archived
-- Erstatter gammel open/closed-modell

-- 1. Fjern gammel check-constraint
alter table public.voting_sessions
  drop constraint if exists voting_sessions_status_check;

-- 2. Legg til ny constraint med alle fire tilstander
alter table public.voting_sessions
  add constraint voting_sessions_status_check
  check (status in ('suggestion', 'voting', 'decided', 'archived'));

-- 3. Migrer eksisterende data
update public.voting_sessions set status = 'voting'  where status = 'open';
update public.voting_sessions set status = 'decided' where status = 'closed';

-- 4. Nye sesjoner starter i forslagsfase
alter table public.voting_sessions
  alter column status set default 'suggestion';
