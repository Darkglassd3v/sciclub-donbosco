# Sci Club Don Bosco — Documentazione sistema gestionale

_Generato da analisi del codice sorgente (`.gs`/`.html`), del file Excel originale `original_data/soci 26_originale.xlsx` (vecchio sistema manuale) e del file `new_structure/SOCI 2026.xlsx` (struttura attuale su cui si appoggiano i 3 script — export/copia del Google Sheet realmente usato in produzione). Data: 2026-09-10._

## 1. Storia e idea di partenza

Il sistema nasce come digitalizzazione di un vecchio foglio Excel di appoggio (`soci 26_originale.xlsx`) usato per gestire le iscrizioni allo sci club. Quel foglio conteneva:

- un elenco soci molto granulare (`TESSERATI 26`, ~5800 righe fisiche/835 soci reali, 55 colonne) con una colonna di costo dedicata per **ogni combinazione** di tessera/assicurazione/gita (es. "Costo tessera 3 senza assic", "Costo tessera 4 con ass", "5 Gite sabato Nizza", ecc.);
- un foglio `DA PAGARE` con la stessa struttura, usato come tracciamento manuale di acconto/saldo;
- fogli dedicati per corsi e trasporti (`CORSI SABATO`, `CORSO DOMENICA`, `PULMAN DOMENICA`, `PULMAN SABATO`, `GITA CAUSALE MARTEDI`, `GINNASTICA`);
- un foglio `riepilogo` con un vero e proprio **bilancio del club** (entrate/uscite), inclusi elementi **non presenti nel nuovo sistema** (vedi §5).

Nel foglio originale **non esisteva alcun meccanismo di "capofamiglia"**: ogni socio aveva la propria riga con proprio acconto/saldo, senza collegamento tra pagamenti di persone diverse. La logica di "un socio che paga per altri membri della propria famiglia" è stata introdotta ex-novo nella riscrittura su Google Apps Script.

## 2. Architettura attuale

Sistema riscritto come **3 web app separate su Google Apps Script (GAS)**, tutte collegate allo stesso Google Sheet condiviso (ID `1z41N7ofw3bJK9n8f9w2DJgIgMoXW0WLfY8Xs10MnbzQ`), usato come unico database:

| App | Cartella | File server | File client | Scopo |
|---|---|---|---|---|
| Gestione Soci | `gestione-soci/` | `codice.gs` | `Index.html` | Form iscrizione/anagrafica, creazione/modifica socio, invio email riepilogo |
| Pannello Pagamenti | `pannello-pagamenti/` | `Admin.gs` | `AdminIndex.html` | Vista amministrativa: nuclei familiari, saldi da incassare, aggiornamento acconto |
| Riepilogo 2026 | `riepilogo-2026/` | `Riepilogo.gs` | `RiepilogoIndex.html` | Dashboard statistiche stagione corrente (KPI, conteggi tessere/corsi/gite) |

Ogni app è deployata **separatamente** come web app GAS (3 URL `/exec` o `/dev` distinti — vedi §6), ma legge/scrive tutte sullo stesso foglio Google Sheets, sui fogli `SOCI`, `PREZZI`, `PARTENZE`.

### Foglio `SOCI` — mappa colonne (usata da tutti e 3 i moduli)

Verificata sia sui riferimenti nel codice (`codice.gs`, `Admin.gs`) sia sull'intestazione reale del foglio in `new_structure/SOCI 2026.xlsx`:

| Col | Intestazione reale nel foglio | Nome nel codice | Note |
|---|---|---|---|
| 1 | Informazioni cronologiche | timestamp | usato per il filtro "stagione corrente" (≥ 1 settembre) |
| 2 | NUMERO POLIZZA | policy | |
| 3-4 | COGNOME, NOME | lastName, firstName | |
| 5-6 | LUOGO/PROVINCIA DI NASCITA | birthPlace, birthProv | |
| 7 | CODICE FISCALE | taxCode | |
| 8 | DATA NASCITA | birthDate | normalizzata in `getMembers()` con parsing robusto (gestisce Date e stringhe `gg/mm/aa`) |
| 9-12 | INDIRIZZO/CITTÀ/PROVINCIA/CAP RESIDENZA | address, city, prov, cap | |
| 13-14 | TELEFONO, EMAIL | phone, email | |
| 15 | TIPOLOGIA TESSERA | membership | |
| 16 | AGEVOLAZIONI FAMIGLIA | `family` in `codice.gs`, `facilitation` in `Admin.gs` | stesso campo, nome variabile diverso nei due moduli — non è un problema di dati, solo incoerenza di naming nel codice, da uniformare |
| 17 | TIPO DI ABBONAMENTO | subscription | |
| 18-19 | PARTENZA DOMENICA, PARTENZE SABATO | sunday, saturday | |
| 20 | TIPOLOGIA CORSO | course | |
| 21 | **SALDO PERSONALE** (etichetta foglio) | `total` (codice) | ⚠️ **vedi nota sotto — etichetta del foglio non corrisponde al dato realmente scritto** |
| 22 | ACCONTO | deposit | coerente tra etichetta e codice |
| 23 | **TOTALE DOVUTO** (etichetta foglio) | `balance`/saldo (codice) | ⚠️ **vedi nota sotto** — non più fonte di verità comunque: `Admin.gs` ricalcola sempre `totale - acconto` in tempo reale (commit `edcd8d0`/`7fd9a20`) invece di fidarsi del valore salvato qui |
| 24 | ID | id | UUID interno generato da `saveMember()`, identifica univocamente il socio |
| 25 | NUMERO TESSERA | cardNumber | numero tessera fisica |
| 26 | ID PAGANTE | `payerCode` | il nome variabile nel codice (`payerCode`, commentato come "codice fiscale del pagante") è fuorviante: contiene in realtà l'**UUID** (colonna 24) del capofamiglia, non un codice fiscale — l'intestazione reale del foglio ("ID PAGANTE") è corretta, il nome nel codice no |
| 27 | TOTALE FAMILIARI A CARICO | familyTotal | calcolato/scritto automaticamente da `updateFamilyTotal()`, sola lettura |

> ⚠️ **Attenzione — colonne 21 e 23 invertite tra etichetta e contenuto reale.** Il foglio etichetta la colonna 21 come "SALDO PERSONALE" e la 23 come "TOTALE DOVUTO", ma sia `codice.gs` (`saveMember`, `getMembers`) sia `Admin.gs` (`updateAdminMember`, che commenta esplicitamente "Legge il totale personale... col 21") scrivono/leggono **il totale dovuto in colonna 21 e il saldo in colonna 23** — l'esatto opposto delle etichette. Il codice è internamente coerente (nessun bug funzionale nell'app), ma **chi apre il Google Sheet a mano e legge le intestazioni vede i valori scambiati**: la colonna che dice "saldo" contiene in realtà il totale dovuto, e viceversa. Da correggere aggiornando le etichette del foglio (intervento a costo zero, nessun rischio) per evitare errori di lettura manuale da parte del direttivo.

Il foglio contiene anche `RICERCA SOCIO` (ricerca socio per nome/cognome, uso manuale diretto sul foglio, non tocca le 3 web app), `PREZZI` (categorie TESSERA/FAMIGLIA/ABBONAMENTO/CORSO — verificato: corrisponde esattamente a quanto legge `getPrices()`) e `PARTENZE` (SABATO/DOMENICA + località — corrisponde a `getDepartures()`).

### Logica "capofamiglia" (nucleo familiare)

1. Ogni socio ha un `id` (UUID) univoco.
2. Se un socio è pagato da un altro (es. figlio pagato dal genitore), il campo `payerCode` (col. 26) del dipendente viene impostato all'`id` del pagante.
3. `saveMember()` in `codice.gs`, ad ogni salvataggio, ricalcola il totale del nucleo (`updateFamilyTotal`) sia per il nuovo pagante sia per l'eventuale vecchio pagante (se il collegamento è cambiato), sommando `total` di tutti i dipendenti + il pagante stesso.
4. `Admin.gs` (`getAdminData`) raggruppa i soci in **unità di pagamento**: filtra i soci senza `paymentId` (cioè i "capofamiglia" o soci indipendenti), trova i loro dipendenti (`paymentId === id del pagante`), e calcola saldo/totale/acconto aggregati per l'intero nucleo. I soci con saldo ≤ 0 e polizza già presente vengono nascosti dalla vista "da incassare".
5. Tutti i calcoli di saldo usano sempre `total - deposit` in tempo reale, mai la colonna 23 salvata (fix esplicito in git log per evitare saldi disallineati).

### Filtro stagione

`Admin.gs` e `Riepilogo.gs` filtrano entrambi i soci per **stagione corrente**: se il mese corrente è ≥ settembre (indice 8), la stagione parte dal 1° settembre dell'anno corrente, altrimenti dal 1° settembre dell'anno precedente. Solo i soci con `timestamp` ≥ questa data vengono conteggiati.

### Riepilogo 2026 — statistiche calcolate

`getRiepilogo()` calcola, sulla stagione corrente: numero soci totali, totale teorico dovuto, totale incassato, da incassare, conteggio per tipo tessera (arricchito con prezzo dal foglio `PREZZI`), abbonamenti, corsi, gite sabato/domenica per località.

## 3. Frontend (client HTML)

I tre file `Index.html`, `AdminIndex.html`, `RiepilogoIndex.html` sono pagine GAS `HtmlService` standalone (nessun framework), con JS inline che chiama le funzioni server via `google.script.run`. Punti in comune rilevati (vedi anche knowledge graph generato con `/graphify`):

- **`showToast()` duplicata 3 volte**, una implementazione indipendente per app (introdotta di recente al posto di `alert()`, commit `f85f9ff`) — nessun file JS condiviso tra i moduli.
- Pattern comune "load-then-render" all'avvio pagina in tutti e 3 i moduli.
- `calc()` (gestione-soci) e `renderRow()` (pannello-pagamenti) implementano entrambi la stessa logica di calcolo saldo, in modo indipendente.

Non esiste alcun file JS/CSS condiviso tra i tre moduli: ogni app è completamente autonoma e duplica utility comuni.

## 4. Cosa manca rispetto al foglio Excel originale

Analizzando `soci 26_originale.xlsx` (foglio `riepilogo`), il vecchio sistema teneva traccia di dati **non presenti in nessuno dei 3 moduli attuali**:

- **Uscite/spese del club**: costo maestri (sabato, domenica, Sestriere), calcolato separatamente da entrate — il sistema attuale non ha alcun concetto di spesa, solo di incasso. Non esiste quindi un vero bilancio (entrate − uscite), solo il lato incassi.
- **Saldo anno precedente** (riporto di cassa) — non presente nel nuovo sistema.
- **Assicurazioni** tracciate come voce a parte (conteggio + incasso dedicato) — nel nuovo sistema l'assicurazione è implicita nel prezzo tessera, non tracciata singolarmente.
- **Pass giornalieri / gite singole** (Sestriere, Giornalieri, Invito, Baby, Tapis, Gite Singole) — categorie di ingresso occasionale non stagionale, assenti dal nuovo `SOCI`/`PREZZI`.
- 9 grafici/drawing embedded nel foglio Excel (andamento iscrizioni ecc.) — nessun equivalente grafico nel nuovo Riepilogo (solo numeri/KPI testuali).

Se queste informazioni servono ancora al direttivo, andrebbero reintrodotte (probabilmente prima nel modulo Riepilogo, che è il punto giusto per un vero cruscotto).

## 5. Deployment attuale

Le 3 web app sono pubblicate come deployment GAS separati:

- `https://script.google.com/macros/s/AKfycbwxQskL5KDsmuCOzrhBZzDFH_VjC-B88fyDQdys-2Gv95ea4lvH0_EMHI5UIIBeKUCHgg/exec` — deployment di produzione (`/exec`)
- `https://script.google.com/macros/s/AKfycbx5NYrFDOHC6s0V4uf8lesYPpDopVSwDPPclNOSS2A/dev` — deployment di **test** (`/dev`, richiede accesso come editor dello script, non va condiviso con utenti finali)
- `https://script.google.com/macros/s/AKfycbw0-3QJcniMrtQpxFCxwNCz0YLyTln0MGXXhr2p6jSBMe8U3OPzCdpxLWZPUJLlkkuC/exec` — deployment di produzione (`/exec`)

Non è stato possibile verificare via fetch automatico quale URL corrisponda a quale modulo (le pagine GAS richiedono login Google). Segnalo comunque due criticità strutturali del deployment attuale, indipendenti da quale URL sia quale:

- Un link `/dev` esposto/condiviso è un rischio: espone la versione di sviluppo, non stabile, e richiede permessi da editor.
- Gli URL `/exec` di Apps Script sono lunghi, non memorizzabili, senza dominio custom, e mostrano schermate di redirect login Google non sempre fluide su mobile.

## 6. Alternative gratuite/più fruibili (proposta)

### Sul database (oggi: Google Sheet come DB)

Limiti noti dell'approccio attuale: ogni chiamata (`getMembers`, `getAdminData`, `getRiepilogo`) fa una `getDataRange().getValues()` cioè **legge l'intero foglio ad ogni richiesta** — con 800+ soci è già lento, cresce linearmente, e Sheets non ha vere transazioni (rischio race condition se due admin salvano contemporaneamente, mitigato solo in parte).

| Opzione | Costo | Pro | Contro |
|---|---|---|---|
| **A. Restare su Google Sheets, ma ottimizzare** | gratis | zero migrazione, il direttivo continua a editare a mano se serve | non risolve la scalabilità/concorrenza, solo la rimanda |
| **B. Google Apps Script + Firestore** | gratis (tier generoso) | resta nell'ecosistema Google, molto più veloce di Sheets API, query indicizzate | serve riscrivere il livello dati, Firestore non è "apribile" a mano dal direttivo |
| **C. Supabase (Postgres)** | gratis fino a 500MB | DB relazionale vero, REST/API pronte, **export CSV/Excel nativo dalla dashboard o via API**, auth inclusa se serve login admin | richiede uscire da Apps Script come backend, curva di apprendimento maggiore |
| **D. Airtable** | gratis fino a ~1200 record/base | interfaccia a griglia familiare per chi già usa Excel, API pronta, export CSV/Excel semplice | 1200 record è limite stretto con 800+ soci/stagione + storico, si esaurisce in 1-2 stagioni |

**Suggerimento pratico**: se l'obiettivo è "gratis, restare esportabile in Excel, ma più solido", **Supabase (opzione C)** è il miglior compromesso — Postgres vero, tier gratuito ampio, esportazione CSV/Excel a un click o via script, e permette comunque di tenere un frontend semplicissimo. Il rischio è tempo di migrazione: bisogna riscrivere le 3 web app per chiamare Supabase invece di `SpreadsheetApp`.

Percorso incrementale a basso rischio, se non si vuole migrare subito: mantenere Google Sheets ma **aggiungere una cache** (es. `CacheService` di Apps Script, TTL 1-5 minuti) davanti a `getMembers`/`getAdminData`/`getRiepilogo`, così le letture ripetute non ri-scansionano tutto il foglio ad ogni refresh pagina. Zero costo, zero migrazione, riduce subito la lentezza percepita.

### Sul deployment del frontend (oggi: 3 web app Apps Script separate)

| Opzione | Costo | Pro | Contro |
|---|---|---|---|
| **Restare su Apps Script** | gratis | zero cambiamento | URL brutti, redirect login Google, UI limitata, JS duplicato tra le 3 app |
| **GitHub Pages / Cloudflare Pages per il frontend + Supabase/Firestore come backend** | gratis | dominio custom possibile, caricamento più veloce, un solo frontend condiviso (niente più 3 `showToast()` duplicate), niente redirect login per gli utenti finali | serve login/autenticazione da gestire diversamente (oggi implicito nel login Google) |

**Suggerimento pratico**: se si migra il DB a Supabase (opzione C sopra), ha senso migrare anche il frontend a una singola pagina statica (o 3 pagine di uno stesso sito) su **Cloudflare Pages o GitHub Pages** (entrambi gratis, dominio custom gratuito con Cloudflare), consolidando le utility duplicate (`showToast`, calcolo saldo) in un unico file JS condiviso. Se invece si vuole intervenire subito senza aspettare la migrazione DB, consolidare almeno gli JS duplicati tra i 3 moduli GAS attuali è un miglioramento a costo zero.

### Priorità consigliata (dal più economico/rischio-basso al più impegnativo)

1. Consolidare `showToast()` e logica saldo duplicate in un unico file HTML incluso nei 3 progetti GAS (`<?!= include('shared') ?>`) — zero rischio, riduce bug futuri.
2. Aggiungere `CacheService` davanti alle letture pesanti (`getDataRange`) — zero rischio, migliora subito le performance percepite.
3. Se serve un vero bilancio (entrate/uscite, non solo incassi), reintrodurre nel Riepilogo le voci mancanti trovate in `soci 26_originale.xlsx` (§4) — puro lavoro di funzionalità, non tocca l'architettura.
4. Solo se la lentezza o la concorrenza diventano un problema reale: migrazione a Supabase + frontend statico, con export Excel mantenuto per il direttivo.
