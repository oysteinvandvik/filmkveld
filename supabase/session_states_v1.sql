-- Oppdater tilstandsmaskin: suggestion → voting → decided → archived

-- 1. Fjern gammel check-constraint
alter table public.voting_sessions
  drop constraint if exists voting_sessions_status_check;

-- 2. Migrer eksisterende data (må skje FØR ny constraint legges til)
update public.voting_sessions set status = 'voting'  where status = 'open';
update public.voting_sessions set status = 'decided' where status = 'closed';

-- 3. Legg til ny constraint med alle fire tilstander
alter table public.voting_sessions
  add constraint voting_sessions_status_check
  check (status in ('suggestion', 'voting', 'decided', 'archived'));

-- 4. Nye sesjoner starter i forslagsfase
alter table public.voting_sessions
  alter column status set default 'suggestion';
