# Contesto del progetto

Riassunto per le sessioni di lavoro (anche `/ecc:dev-team`). Dettagli in
`STATO_REPO.md` e `TODO.md`.

- **Progetto**: gestionale soci e pagamenti dello Sci Club Don Bosco (soci,
  pagamenti per nucleo, riepilogo, bilancio, gite, assicurazione, post social).
  Lo usano volontari, spesso anziani e con vista debole: la leggibilità viene
  prima di tutto.
- **Stack**: HTML statico + Bulma 0.9.4 + supabase-js 2.45.4 da CDN, niente
  build; Supabase Postgres con RLS e ruoli per permessi (`supabase/schema.sql`,
  unico e idempotente); pagine pubblicate con GitHub Pages dal branch di lavoro.
  Test leggeri in node (`web/test-*.js`, `ricerca/test-ricerca.js`) e
  `supabase/test_ruoli.sh` in docker.
- **Fase**: branch `2.5-SNAPSHOT`, in produzione. Appena fatti la Social
  riordinata e i ritocchi del giro dell'app (Soci con controllo doppioni).
- **Vincoli**: interfaccia, commenti e variabili JS in italiano, database in
  inglese; misure in rem (pulsante A+ 17/19/21px); contrasti documentati in
  `docs/brand-guidelines.md`; nessuna dipendenza nuova; conferme scritte nella
  pagina (`chiedi()`), mai `confirm()`; commit solo dopo conferma dell'utente.
- **Fatto vuol dire**: pagine provate nel browser con un client Supabase finto
  (anche con A+ al massimo), test verdi, schema riapplicabile, commit e deploy
  delle Pages dal branch.
