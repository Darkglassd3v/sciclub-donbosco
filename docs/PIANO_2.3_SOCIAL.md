# Piano social: grafica, pagina "Genera post", campagne sponsor

Nato per la 2.3, fatto nella **2.5** (branch `2.5-SNAPSHOT`). Qui sotto lo stato.

Chi pubblica: una persona sola, da PC, a mano su Instagram e Facebook. La
pagina prepara immagini e testi; la pubblicazione resta manuale.

## Stato

### A. Grafica
- [x] Template in `social/templates.html` (direzioni A Linea, B Vetta, C Skipass), export PNG con `social/export.sh`
- [x] Tavola di confronto `social/confronto.html` per il direttivo
- [x] Data DD/MM sulla singola gita (per postare in anticipo e capire la data a colpo d'occhio): oggi solo in C
- [x] Direzione scelta: **C · Skipass**, data DD/MM nel bollo
- [x] Prototipi (`social/templates.html`, `confronto.html`, `export.sh`) tolti: restano nella storia di git fino alla 2.4

### B. Pagina "Genera post" (`web/social.html`)
- [x] Tabella `social_events` in `supabase/schema.sql` (più `show_price`, `photo`, `sponsor_id`, `story_title`, `cta`, `caption`), RLS `can('social')`
- [x] Disegni in `web/social-templates.js` (una copia sola), funzioni pure provate da `web/test-social.js`
- [x] Pagina: elenco post da fare ordinato per data, con data DD/MM ben visibile · form · anteprima live post e story
- [x] Form: tipo (gita/corso/cena/gara/servizi/campagna), data → giorno e colore calcolati, fermate con luoghi suggeriti da `departures`, scadenza, corso sì/no, foto facoltativa, **prezzo facoltativo** ("Mostra il prezzo nel post")
- [x] Calendario del mese generato dalle gite salvate, e copertina Facebook
- [x] Export PNG nel browser (`html-to-image` da cdn.jsdelivr, font Barlow incorporati); avviso se il testo sborda
- [x] Testo del post generato + pulsante "Copia"
- [x] Flag "pubblicato" con data (`published_at`)
- [x] Voce "Social" nella barra (`data-permesso="social"`), ruolo `social` che vede solo questa pagina
- [x] Verifica: domenica gialla, martedì rosso; PNG 1080×1080 e 1080×1920; la RLS nega agli altri ruoli (`test_ruoli.sh`)
- [ ] TODO(social): numeri di telefono veri su ogni post (`SOCIAL.telefoni` in `web/social-templates.js`)

### C. Campagne sponsor
Mockup e listino: canvas "Post sponsor Sci Club" (https://claude.ai/artifact/3VuhRgPXXVdUYSWVaWZ4MU).
Il volantino con gli spazi a pagamento è già deciso; i social sono un supplemento.

- [ ] Listino social approvato dal direttivo (bozza, da tarare sui follower reali):
  - A, sponsor del comune: Vetrina +50 €, Dedicato +120 €, Dedicato + spinta +200 € (Meta 60 € inclusi)
  - B, sponsor regione/Italia: Partner +450 €, Campagna +1.000 €, Stagione +2.200 € (Meta 150/400/1.000 € inclusi)
- [x] Template sponsor in `social-templates.js`, con i colori e i loghi dello sponsor: post collab 4:5, story con spazio per lo sticker link, pagina "Grazie a chi ci sostiene", copertina FB; avvertenza alcolici su ogni formato
- [ ] Carosello "Grazie a chi ci sostiene" con più sponsor insieme (griglia): quando gli sponsor saranno più d'uno
- [x] Tabella `sponsors` (nome, livello, sito, profilo, due loghi, tre colori, alcolici); i loghi stanno nel database come immagini, così l'export non si blocca e non serve lo Storage
- [x] Nella pagina: tipo post "Campagna sponsor" con lo sponsor; 958 Santero è la prima campagna (da caricare in produzione dalla pagina: sponsor con i loghi di `social/santero/`, poi la campagna)
- [x] URL con UTM generato e copiabile (`utm_source=instagram&utm_medium=story|post&utm_campaign=<sponsor>-<stagione>&utm_content=<titolo>`)
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
- [ ] Prova manuale: `docs/CHECKLIST_BILANCIO.md`, in particolare da admin e da utente
- [x] `supabase/test_ruoli.sh` eseguito (2026-09-22)
- [x] Stagione aperta = quella dopo l'ultima chiusa, non più il calendario: `current_season()` legge `season_history`, i filtri soci diventano `enrolled_at is not null`, `open_season` una riga sola (2026-09-22)
- [ ] Saldi banca 2025/26 da inserire quando disponibili (`season_history.bank_opening`/`bank_closing`)
- [ ] Provare `close_season()` nuova su una copia del database prima di una chiusura vera
