-- Sci Club Don Bosco 2.0 — rimozione dello schema con i nomi italiani
--
-- DA LANCIARE UNA VOLTA SOLA, prima del nuovo schema.sql.
--
-- Il database era nato con i nomi delle tabelle e delle colonne in italiano,
-- mescolati a qualche nome inglese (`soci` con dentro `created_at`, accanto a
-- `cognome`). Il nuovo schema.sql usa nomi inglesi ovunque: questo file toglie
-- di mezzo il vecchio, poi i dati si ricaricano dal foglio Excel.
--
--   ATTENZIONE: cancella i dati. Tutto quello che è stato inserito dopo la
--   migrazione — soci aggiunti dalle pagine, acconti registrati, gite segnate,
--   stagioni archiviate — non si recupera. Torna solo ciò che sta nel foglio.
--
-- Ordine completo, dalla dashboard Supabase > SQL Editor:
--   1. questo file
--   2. supabase/schema.sql
--   3. i file di supabase/migration/ in ordine (rigenerati dal foglio)
--   4. supabase/verifica.sql
--
-- Tutto è `if exists`: rilanciarlo su un database già ripulito non dà errore.

-- Le viste per prime: dipendono dalle tabelle.
drop view if exists public.stagioni_chiuse    cascade;
drop view if exists public.stagioni_aperte    cascade;
drop view if exists public.abbonamenti_gite   cascade;
drop view if exists public.riepilogo_partenze cascade;
drop view if exists public.riepilogo_corsi    cascade;
drop view if exists public.riepilogo_abbonamenti cascade;
drop view if exists public.riepilogo_tessere  cascade;
drop view if exists public.riepilogo_stagione cascade;
drop view if exists public.nuclei_familiari   cascade;

-- Poi le funzioni, con la firma esplicita: `drop function` senza argomenti non
-- basta quando esistono più versioni della stessa funzione.
drop function if exists public.chiudi_stagione(text)               cascade;
drop function if exists public.salda_nucleo(uuid)                  cascade;
drop function if exists public.usa_gite(uuid)                      cascade;
drop function if exists public.usa_gite(uuid, int, date)           cascade;
drop function if exists public.usa_gite(uuid, int, date, text, text) cascade;
drop function if exists public.annulla_gita(uuid)                  cascade;
drop function if exists public.prezzi_deduci_abbonamento()         cascade;
drop function if exists public.stagione_corrente()                 cascade;
drop function if exists public.stagione_di(timestamptz)            cascade;

-- Infine le tabelle. `cascade` porta via indici, vincoli, policy e le viste
-- eventualmente sfuggite sopra.
drop table if exists public.gite_usate   cascade;
drop table if exists public.soci_storico cascade;
drop table if exists public.soci         cascade;
drop table if exists public.prezzi       cascade;
drop table if exists public.partenze     cascade;

-- set_updated_at() resta: il nuovo schema la ricrea identica e il nome era già
-- inglese. La si toglie solo se non la usa più nessuno.
