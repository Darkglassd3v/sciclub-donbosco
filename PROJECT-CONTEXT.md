# Contesto del progetto

Riepilogo sessioni lavoro (anche `/ecc:dev-team`). Task: `TODO.md`; workflow (rilascio, database, UI): `docs/SVILUPPO.md`.

- **Progetto**: gestionale soci+pagamenti Sci Club Don Bosco (soci, nucleo, riepilogo, bilancio, gite, assicurazione, social). Usato da volontari, spesso anziani con vista debole: leggibilità prima di tutto.
- **Stack**: HTML statico + Bulma 0.9.4 + supabase-js 2.45.4 CDN, no build; Supabase Postgres con RLS e ruoli (`supabase/schema.sql`, idempotente); deploy GitHub Pages dal branch. Test node (`web/test-*.js`, `ricerca/test-ricerca.js`) e `supabase/test_ruoli.sh` docker.
- **Fase**: online `2.7-SNAPSHOT` (aperta 08/10/2026 dalla 2.6, non rilasciata): grafiche social (Ritocco/Montagna) in Impostazioni, Soci a sezioni colorate con PDF+tabellina conferme, sezioni colorate Riepilogo/Assicurazione/Bilancio, logo vettoriale. Iscrizioni massa metà novembre: prima prova generale.
- **Vincoli**: UI, commenti, variabili JS in italiano; database inglese; misure rem (A+ 17/19/21px); contrasti in `docs/brand-guidelines.md`; no nuove dipendenze; conferme in finestra sopra pagina (`chiedi()` o `<dialog class="finestra">`), mai `confirm()`; commit solo su conferma utente.
- **Fatto vuol dire**: pagine testate nel browser con client Supabase finto (A+ al massimo), test verdi, schema riapplicabile, commit e deploy Pages dal branch.
