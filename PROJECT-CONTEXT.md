# Contesto del progetto

Riepilogo sessioni lavoro (anche `/ecc:dev-team`). Task: `TODO.md`; workflow (rilascio, database, UI): `docs/SVILUPPO.md`.

- **Progetto**: gestionale soci+pagamenti Sci Club Don Bosco (soci, nucleo, riepilogo, bilancio, gite, assicurazione, social). Usato da volontari, spesso anziani con vista debole: leggibilità prima di tutto.
- **Stack**: HTML statico + Bulma 0.9.4 + supabase-js 2.45.4 CDN, no build; Supabase Postgres con RLS e ruoli (`supabase/schema.sql`, idempotente); deploy GitHub Pages dal branch. Test node (`web/test-*.js`, `ricerca/test-ricerca.js`), prove in Chrome (`test-browser/esegui.sh`) e `supabase/test_ruoli.sh` docker.
- **Fase**: 2.9 rilasciata il 27/10/2026 (tag `2.9`); si lavora su `3.0-SNAPSHOT`, dedicata al telefono (grafica di tutte le pagine sullo schermo piccolo). Nella 2.9: barra larga quanto lo schermo con pulsanti Material e voci su due righe se serve, Cerca socio anche per numero tessera col prossimo numero in cima, numero tessera in cima al modulo Soci, admin con tutte le funzioni tranne Gestione, testi professionali, backup leggibili senza il sito con una seconda copia sul PC, accessibilità e integrity sulle librerie, le correzioni dell'audit del 22/10. Iscrizioni massa metà novembre: prima prova generale.
- **Vincoli**: UI, commenti, variabili JS in italiano; database inglese; misure rem (A+ 17/19/21px); contrasti in `docs/brand-guidelines.md`; no nuove dipendenze; conferme in finestra sopra pagina (`chiedi()` o `<dialog class="finestra">`), mai `confirm()`; commit solo su conferma utente.
- **Fatto vuol dire**: pagine testate nel browser con client Supabase finto (A+ al massimo), test verdi, schema riapplicabile, commit e deploy Pages dal branch.
