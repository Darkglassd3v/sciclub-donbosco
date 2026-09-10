# Sci Club Don Bosco 2.0 — guida alla migrazione

Passaggio da Google Apps Script + Google Sheet a **Supabase (Postgres) + pagine statiche su GitHub Pages**.

La 1.x (cartelle `gestione-soci/`, `pannello-pagamenti/`, `riepilogo-2026/`) resta intatta sul branch `main`: finché la 2.0 non è collaudata si può continuare a usarla.

---

## Cosa c'è in questo branch

> ⚠️ **Il repository è pubblico.** I fogli Excel e i file in `supabase/migration/` contengono
> anagrafiche reali (nome, indirizzo, telefono, codice fiscale, anche di minori) e sono
> esclusi da git tramite `.gitignore`. Vanno tenuti solo in locale o su Drive: non
> committarli mai, nemmeno temporaneamente, perché resterebbero nella cronologia git.

```
supabase/
  schema.sql                  tabelle, viste, policy di sicurezza (RLS)
  scripts/generate_migration.py   genera i file di migrazione dal foglio esportato
  migration/                  NON versionato: 14 file generati in locale (vedi Passo 2)

web/
  config.js                   URL e chiave anon di Supabase (da compilare)
  shared.js                   client Supabase, login, toast, calcoli importi
  login.html                  accesso del direttivo
  index.html                  gestione soci        (era gestione-soci/Index.html)
  admin.html                  pannello pagamenti   (era pannello-pagamenti/AdminIndex.html)
  riepilogo.html              riepilogo stagione   (era riepilogo-2026/RiepilogoIndex.html)

.github/workflows/deploy-pages.yml   pubblicazione automatica di web/ su GitHub Pages
```

---

## Passo 1 — Creare il progetto Supabase

1. Registrarsi su [supabase.com](https://supabase.com) (piano gratuito) e creare un progetto.
2. Scegliere una regione europea (es. Frankfurt) e **conservare la password del database**.
3. Aprire **SQL Editor**, incollare il contenuto di `supabase/schema.sql`, premere **Run**.

Lo script è rieseguibile: lanciarlo due volte non crea duplicati né errori.

## Passo 2 — Caricare i dati

Prima si generano i file SQL dal foglio esportato (non sono nel repository perché contengono dati personali):

```bash
pip install openpyxl
python3 supabase/scripts/generate_migration.py "new_structure/SOCI 2026.xlsx"
```

Vengono creati **14 file numerati** in `supabase/migration/`, da circa 140 KB l'uno:

```
01_listino_e_partenze.sql       listino prezzi e luoghi di partenza
02_soci_00001_00500.sql   ...   le 5.778 anagrafiche, 500 per file
13_soci_05501_05778.sql
14_collegamenti_familiari.sql   collega ogni socio al capofamiglia
```

Un unico file da 1,2 MB veniva rifiutato dall'editor SQL con *"Query is too large"*: da qui la divisione.

**Dall'editor SQL** (Supabase Dashboard > SQL Editor): aprire i file **in ordine di numero**, incollare il contenuto di uno alla volta e premere **Run**. Sono 14 operazioni, ognuna di pochi secondi.

Se anche 140 KB risultassero troppi, si rigenerano più piccoli indicando quante righe per file:
```bash
python3 supabase/scripts/generate_migration.py "new_structure/SOCI 2026.xlsx" supabase/migration 250
```

**Da riga di comando**, se si ha `psql` (più veloce, un colpo solo):
```bash
# stringa di connessione: Project Settings > Database > Connection string > URI
for f in supabase/migration/*.sql; do
  psql "postgresql://postgres:[PASSWORD]@db.[PROGETTO].supabase.co:5432/postgres" \
       -v ON_ERROR_STOP=1 -f "$f"
done
```

Ogni file apre e chiude la propria transazione ed è **rieseguibile**: se ci si perde il conto, si può rilanciare un file già eseguito senza creare duplicati né errori. L'unico vincolo è che `14_collegamenti_familiari.sql` vada eseguito dopo i file dei soci (e comunque lo si può rilanciare in seguito).

### Cosa viene migrato

| Dato | Quantità | Note |
|---|---|---|
| Anagrafiche soci | 5.778 | tutte le righe del foglio `SOCI` |
| Listino prezzi | 22 voci | foglio `PREZZI` |
| Luoghi di partenza | 5 | foglio `PARTENZE` |

Le anagrafiche importate sono un **archivio storico**: nel foglio la colonna delle date di iscrizione è vuota al 100% e i campi di tessera/pagamento non sono compilati. Vengono quindi caricate con `data_iscrizione = 2000-01-01`, così restano **cercabili** ma non vengono conteggiate nella stagione corrente. Quando una di queste persone si iscrive davvero, si apre la sua scheda, si compilano tessera e importi e si salva: il salvataggio aggiorna `data_iscrizione` a oggi e la persona entra nella stagione. È lo stesso comportamento della 1.x, che riscriveva la colonna "Informazioni cronologiche" ad ogni salvataggio.

56 date di nascita non erano interpretabili e sono state lasciate vuote (nessuna riga è stata scartata).

## Passo 3 — Creare gli utenti del direttivo

**Authentication > Users > Add user**: creare un account (email + password) per ogni persona che deve accedere.

Non esiste registrazione libera: le policy RLS non permettono di leggere né scrivere nulla senza un utente autenticato. La chiave `anon` presente in `web/config.js` **è pubblica per definizione** e da sola non dà accesso ad alcun dato.

> Non inserire mai la chiave `service_role` nelle pagine web: quella scavalca ogni policy.

## Passo 4 — Configurare le pagine

In **Project Settings > API** copiare *Project URL* e *anon public key*, poi compilare `web/config.js`:

```js
window.SUPABASE_CONFIG = {
  url: "https://xxxxxxxx.supabase.co",
  anonKey: "eyJhbGciOi...",
};
```

In alternativa, per non versionare i valori: **Settings > Secrets and variables > Actions > Variables** e creare `SUPABASE_URL` e `SUPABASE_ANON_KEY`. Il workflow genera `config.js` al momento del deploy e fallisce se trova ancora i segnaposto.

## Passo 5 — Pubblicare le pagine

1. **Settings > Pages > Build and deployment > Source: GitHub Actions** (una volta sola).
2. Push del branch `2.0`: il workflow parte da solo e pubblica `web/`.

L'indirizzo sarà `https://<utente>.github.io/<repository>/`. Si può collegare un dominio personalizzato gratuitamente da Settings > Pages.

Per provare in locale senza pubblicare:
```bash
cd web && python3 -m http.server 8000   # poi apri http://localhost:8000/login.html
```

---

## Cosa cambia rispetto alla 1.x

### Problemi risolti

| Problema (vedi `DOCUMENTAZIONE.md`) | Come è risolto |
|---|---|
| Colonne 21 e 23 del foglio con etichette invertite rispetto al contenuto | Colonne con nome esplicito: `totale`, `acconto`, `saldo` |
| Colonna `saldo` disallineata, ricalcolata a mano da `Admin.gs` ad ogni lettura | `saldo` è una **colonna generata** (`totale - acconto`): non può andare fuori sincrono |
| `payerCode` documentato come "codice fiscale" ma contenente un UUID | `payer_id`, chiave esterna vera verso `soci(id)`, con vincolo di integrità |
| `TOTALE FAMILIARI A CARICO` copiato e mantenuto a mano da `updateFamilyTotal()` | Vista `nuclei_familiari`, sempre coerente perché calcolata |
| `showToast()` duplicata in 3 file | Una sola implementazione in `web/shared.js` |
| Calcolo del saldo scritto due volte (`calc()` e `renderRow()`) | Una sola funzione condivisa (`saldoDi`, `totaliNucleo`) |
| Ogni lettura rileggeva l'intero foglio (`getDataRange()`) | Query indicizzate; la ricerca soci interroga il database invece di scaricare 5.778 righe |
| Acconto di un familiare non modificabile dal pannello pagamenti | Ogni riga del nucleo è modificabile direttamente |
| Nessun aggiornamento senza ricaricare la pagina | Realtime: pannello e riepilogo si aggiornano da soli quando un altro operatore salva |

### Cosa resta uguale di proposito

- La tabella `soci` è cumulativa (una riga per iscrizione stagionale), come il foglio.
- La stagione parte il **1° settembre**, con la stessa regola della 1.x (funzione `stagione_corrente()`).
- Le partenze restano liste separate da virgola nello stesso campo.

### Cosa non è ancora stato portato

Non erano presenti nemmeno nella 1.x — sono le voci del vecchio Excel `soci 26_originale.xlsx` elencate in `DOCUMENTAZIONE.md`: uscite e compensi maestri, saldo dell'anno precedente, assicurazioni come voce separata, pass giornalieri, grafici. Vanno decise a parte: il posto naturale è il riepilogo.

Non è stata portata la **email di riepilogo iscrizione** che la 1.x inviava con `MailApp` (funzione `sendSummaryEmail`). Su Supabase serve un servizio esterno (es. Resend, piano gratuito) chiamato da una Edge Function. Da valutare se serve davvero: oggi l'email arrivava a un solo indirizzo fisso.

---

## Verifiche fatte

Schema e migrazione sono stati eseguiti su un PostgreSQL 16 reale prima di essere consegnati:

- `schema.sql` e i 14 file di migrazione eseguiti in ordine su un database vuoto, poi rieseguiti singolarmente e fuori ordine: nessun errore, nessun duplicato (5.778 righe stabili);
- colonna generata `saldo` verificata: modificando l'acconto il saldo si aggiorna da solo, e con esso il totale del nucleo;
- vista `nuclei_familiari` verificata su un nucleo con capofamiglia e due familiari;
- viste del riepilogo verificate (KPI, tessere con prezzo di listino, corsi, abbonamenti, partenze con esplosione delle liste separate da virgola);
- verificato che l'archivio importato **non** inquina le statistiche di stagione e che una re-iscrizione lo fa rientrare correttamente.

Non è stato possibile provare le pagine web contro un vero progetto Supabase (serve un progetto reale con le sue chiavi): il JavaScript è stato controllato sintatticamente e le query sono state verificate contro i nomi di colonna reali dello schema, ma **il collaudo dell'interfaccia va fatto dopo il Passo 4**.

## Come tornare indietro

Il branch `main` con la versione Apps Script resta invariato e le web app Google continuano a funzionare finché non vengono disattivate a mano. Il Google Sheet non viene modificato in alcun modo da questa migrazione: viene solo letto.
