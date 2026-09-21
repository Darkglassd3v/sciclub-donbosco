# Piano 2.3 — Social: grafica, pagina "Genera post", campagne sponsor

Chi pubblica: una persona sola, da PC, a mano su Instagram e Facebook. La
pagina prepara immagini e testi; la pubblicazione resta manuale.

## Stato

### A. Grafica
- [x] Template in `social/templates.html` (direzioni A Linea, B Vetta, C Skipass), export PNG con `social/export.sh`
- [x] Tavola di confronto `social/confronto.html` per il direttivo
- [x] Data DD/MM sulla singola gita (per postare in anticipo e capire la data a colpo d'occhio): oggi solo in C
- [ ] Confermare la direzione scelta (A / B / C) e il formato data, da scrivere qui: **[DIREZIONE]**
- [ ] Togliere le direzioni scartate da `templates.html`

### B. Pagina "Genera post" (`web/social.html`)
- [ ] Tabella `social_events(id, kind, event_date date, title, subtitle, prices jsonb, stops jsonb, facts jsonb, deadline date, corso bool, published_at timestamptz, created_at, updated_at)` in `supabase/schema.sql`, RLS come `departures` (`has_role('admin')`)
- [ ] Funzioni di disegno spostate da `social/templates.html` a `web/social-templates.js` (una copia sola; `templates.html` e `export.sh` la includono)
- [ ] Pagina: elenco post da fare ordinato per data, con data DD/MM ben visibile · form · anteprima live post e story
- [ ] Form: tipo (gita/corso/cena/gara/servizi), `<input type="date">` → giorno e colore calcolati, fermate con luoghi suggeriti da `departures`, scadenza, corso sì/no
- [ ] Calendario del mese generato dalle gite salvate
- [ ] Export PNG nel browser (`html-to-image` da cdn.jsdelivr), font e logo same-origin; avviso se il testo sborda
- [ ] Testo del post generato + pulsante "Copia"
- [ ] Flag "pubblicato" con data (`published_at`)
- [ ] Voce "Social" nella barra (`data-ruolo="admin"`), `requireRole('admin')`
- [ ] Verifica: gita domenica 18/01 → anteprima gialla "Domenica"; PNG uguale a `export.sh`; ruolo `utente` non vede la voce e la RLS nega (`test_ruoli.sh`)

### C. Campagne sponsor
Mockup e listino: canvas "Post sponsor Sci Club" (https://claude.ai/artifact/3VuhRgPXXVdUYSWVaWZ4MU).
Il volantino con gli spazi a pagamento è già deciso; i social sono un supplemento.

- [ ] Listino social approvato dal direttivo (bozza, da tarare sui follower reali):
  - A, sponsor del comune: Vetrina +50 €, Dedicato +120 €, Dedicato + spinta +200 € (Meta 60 € inclusi)
  - B, sponsor regione/Italia: Partner +450 €, Campagna +1.000 €, Stagione +2.200 € (Meta 150/400/1.000 € inclusi)
- [ ] Template sponsor in `social-templates.js`: carosello "Grazie a chi ci sostiene" (copertina + griglia 4 sponsor), storia sponsor con spazio per lo sticker link, post collab 4:5, storia campagna, copertina FB con main sponsor
- [ ] Tabella `sponsors(id, name, logo_path, url, handle, package, offer)`; loghi su Supabase Storage (same-origin per l'export)
- [ ] Nella pagina: tipo post "sponsor" con scelta di uno o più sponsor
- [ ] URL con UTM generato e copiabile (`utm_source=instagram|facebook&utm_medium=story|post|paid&utm_campaign=sponsor2627&utm_content=…`)
- [ ] Resoconto per sponsor a fine stagione: post pubblicati (da `published_at`) + numeri Meta inseriti a mano
- [ ] Pagina "Sponsor" statica per il link in bio (un pulsante per brand, i pacchetti più alti in alto) + QR sul volantino
- [ ] Contratto e fattura per ogni sponsor; trattamento fiscale da verificare col commercialista

### D. Rilascio
- [ ] `.github/workflows/deploy-pages.yml`: il deploy parte dal branch `2.2`, da portare a `2.3` al rilascio
- [ ] `graphify update .`, README, tag `2.3`

### E. Bilancio stagione (fuori piano social, fatto il 2026-09-21)
- [x] DB: `ledger_entries` (movimenti extra), `season_accounts` (saldo banca iniziale), vista `season_balance`, colonne banca in `season_history`, `close_season()` le scrive; totali abbonamenti/corsi archiviati alla chiusura
- [x] Pagina `web/bilancio.html` (admin): saldo iniziale, incassato soci, entrate extra, uscite, saldo attuale, movimenti
- [x] Amministrazione: chiusura con finestra di conferma
- [x] Riepilogo: solo voci di bilancio (tessere, abbonamenti, corsi, entrate extra, uscite) con prezzo e totale; stagione chiusa con banca
- [ ] Prova manuale: checklist in scratchpad (`checklist_bilancio.md`), in particolare da admin e da utente
- [ ] `supabase/test_ruoli.sh` da eseguire (serve docker)
- [ ] Saldi banca 2025/26 da inserire quando disponibili (`season_history.bank_opening`/`bank_closing`)
- [ ] Provare `close_season()` nuova su una copia del database prima di una chiusura vera
