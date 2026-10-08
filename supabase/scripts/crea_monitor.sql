-- Utente "monitor": legge tutto e non scrive niente. Lo usano i controlli
-- durante le iscrizioni (controlli.sh) e Claude quando aiuta a capire un
-- problema: così nessuno dei due può cambiare dati per sbaglio.
--
--   psql "$DB" -v password=... -f supabase/scripts/crea_monitor.sql
--
-- La password non sta nel repository: la stringa di connessione completa è
-- in supabase/.monitor_connect (ignorato da git). Rieseguibile.
-- pg_read_all_data dà la lettura di tutte le tabelle; bypassrls serve perché
-- le policy sono scritte per gli utenti del sito (authenticated), non per lui.
-- Togliere a fine campagna: drop role monitor;
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'monitor') then
    create role monitor login bypassrls;
  end if;
end $$;
alter role monitor with login bypassrls nocreatedb nocreaterole password :'password';
alter role monitor set default_transaction_read_only = on;
grant pg_read_all_data to monitor;
