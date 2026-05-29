-- Oppdater tilstandsnavn til ny tilstandsmaskin
-- suggestion → voting → decided → archived

update public.voting_sessions set status = 'voting'  where status = 'open';
update public.voting_sessions set status = 'decided' where status = 'closed';

-- Nye sesjoner starter i forslagsfase
alter table public.voting_sessions
  alter column status set default 'suggestion';
