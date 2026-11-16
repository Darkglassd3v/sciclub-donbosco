# Contesto del progetto

Riepilogo sessioni lavoro (anche `/ecc:dev-team`). Task: `TODO.md`; workflow (rilascio, database, UI): `docs/SVILUPPO.md`; fuga di dati personali: `docs/VIOLAZIONE-DATI.md`.

- **Progetto**: gestionale soci+pagamenti Sci Club Don Bosco (soci, nucleo, riepilogo, bilancio, gite, assicurazione, social). Usato da volontari, spesso anziani con vista debole: leggibilità prima di tutto.
- **Stack**: HTML statico + Bulma 0.9.4 + supabase-js 2.45.4 CDN, no build; Supabase Postgres con RLS e ruoli (`supabase/schema.sql`, idempotente); deploy GitHub Pages dal branch. Test node (`web/test-*.js`, `ricerca/test-ricerca.js`), prove in Chrome (`test-browser/esegui.sh`) e `supabase/test_ruoli.sh` docker.
- **Fase**: online la v3.3.0 (tag del 16/11/2026: il salvataggio dei soci regge la rete assente o caduta a metà, prove `test-browser/rete-assente.js`, `risposta-persa.js` e `test-reale/rete-caduta.js`); si rilascia dai tag `v<versione>` su `main`, l'unico ramo. Dalla 3.0: stile Material in tutto il sito, barra in alto blu con chi è entrato, menu a colonna a sinistra con i gruppi Gestione e Social e pannello «Menu» sul telefono, tema scuro, pagine ridisegnate per il telefono. Prossimo lavoro: codice in inglese (`TODO.md`). Iscrizioni massa metà novembre: prima prova generale.
- **Vincoli**: UI, commenti, variabili JS in italiano; database inglese; misure rem (A+ 17/19/21px); contrasti in `docs/brand-guidelines.md`; no nuove dipendenze; conferme in finestra sopra pagina (`ask()` o `<dialog class="finestra">`), mai `confirm()`; commit solo su conferma utente.
- **Fatto vuol dire**: pagine testate nel browser con client Supabase finto (A+ al massimo), test verdi, schema riapplicabile, commit e deploy Pages dal branch.
