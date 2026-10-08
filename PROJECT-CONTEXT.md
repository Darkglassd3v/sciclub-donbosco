# Contesto del progetto

Riassunto per le sessioni di lavoro (anche `/ecc:dev-team`). Cosa c'è da fare: `TODO.md`;
come si lavora (rilascio, database, scelte dell'interfaccia): `docs/SVILUPPO.md`.

- **Progetto**: gestionale soci e pagamenti dello Sci Club Don Bosco (soci,
  pagamenti per nucleo, riepilogo, bilancio, gite, assicurazione, post social).
  Lo usano volontari, spesso anziani e con vista debole: la leggibilità viene
  prima di tutto.
- **Stack**: HTML statico + Bulma 0.9.4 + supabase-js 2.45.4 da CDN, niente
  build; Supabase Postgres con RLS e ruoli per permessi (`supabase/schema.sql`,
  unico e idempotente); pagine pubblicate con GitHub Pages dal branch di lavoro.
  Test leggeri in node (`web/test-*.js`, `ricerca/test-ricerca.js`) e
  `supabase/test_ruoli.sh` in docker.
- **Fase**: online la `2.7-SNAPSHOT` (aperta l'08/10/2026 dalla 2.6, non ancora rilasciata):
  due grafiche social (Ritocco e Montagna) scelte in Impostazioni, scheda Soci a sezioni colorate
  con Stampa che scarica il PDF e conferme a tabellina, sezioni colorate in Riepilogo, Assicurazione
  e Bilancio, logo vettoriale. Iscrizioni di massa da metà novembre: prima la prova generale.
- **Vincoli**: interfaccia, commenti e variabili JS in italiano, database in
  inglese; misure in rem (pulsante A+ 17/19/21px); contrasti documentati in
  `docs/brand-guidelines.md`; nessuna dipendenza nuova; conferme in una finestra
  sopra la pagina (`chiedi()` o `<dialog class="finestra">`), mai `confirm()`; commit solo dopo conferma dell'utente.
- **Fatto vuol dire**: pagine provate nel browser con un client Supabase finto
  (anche con A+ al massimo), test verdi, schema riapplicabile, commit e deploy
  delle Pages dal branch.
