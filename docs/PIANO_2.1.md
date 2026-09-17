# 2.1-SNAPSHOT: ruoli/permessi, pannello impostazioni costi, abbonamento da gite, tab colorati

## Stato di avanzamento

Aggiornato ad ogni commit di questo piano, così è ripartibile da qualunque macchina/sessione (anche mobile) leggendo solo questo file.

- [x] Task 0 — Tab colorati filtro giorno (`ricerca/stile.css`)
- [x] Task 1 — Fondazione ruoli (RLS + profiles) — blocca 2,3,4,5
- [ ] Task 2 — Pannello impostazioni costi (`web/impostazioni.html`)
- [ ] Task 3 — Gestione utenti/ruoli (`web/utenti.html`)
- [ ] Task 4 — Assegna abbonamento da `ricerca/gite.html`
- [ ] Task 5 — Irrigidimento kiosk (`ricerca/index.html`)

## Context

App attuale (branch `2.1-SNAPSHOT`, appena taggata da `2.0`) è due siti statici separati su Supabase, senza backend proprio:

- `web/` — gestionale direttivo (`index.html` iscrizione/modifica socio, `admin.html` incassi, `riepilogo.html` KPI stagione, `stagione.html` chiusura stagione).
- `ricerca/` — sito leggero mobile: `index.html` (ricerca socio, campi ridotti) e `gite.html` ("pannello delle gite": ricerca abbonamento gite, segna/annulla una gita).

Oggi l'autorizzazione è **piatta**: qualunque utente Supabase Auth loggato ha accesso completo a tutto (confermato in `docs/ACCOUNT.md:131-135` e in ogni RLS policy di `supabase/schema.sql`, tutte `to authenticated using (true)`). Non esiste tabella ruoli, non esiste UI per modificare il listino prezzi (`prices`, categorie TESSERA/FAMIGLIA/ABBONAMENTO/CORSO — solo modificabile da dashboard/SQL), e il pannello gite non permette di assegnare un abbonamento a un socio che non ne ha uno (si deve passare dal form soci completo in `web/index.html`).

Richiesta dell'utente: introdurre un sistema di ruoli a 4 livelli (kiosk in negozio, utente standard, admin, superadmin), un pannello impostazioni unico per i costi (gite/viaggi/abbonamento/presciistica = il listino `prices`), la possibilità di assegnare un abbonamento a un socio direttamente dal pannello gite, un controllo di visibilità per-tipologia sulle voci ABBONAMENTO (es. "ABBONAMENTO DIRETTIVO" visibile solo a superadmin), e un piccolo miglioramento UI indipendente sui filtri giorno del pannello gite.

Decisioni prese in fase di chiarimento con l'utente:
- Il kiosk in negozio userà un account Supabase dedicato con ruolo `kiosk` (non accesso anonimo).
- I ruoli sono gestiti con una tabella `public.profiles(user_id, role)` collegata a `auth.uid()` (non custom claims su `auth.users`).
- Gerarchia ruoli: `kiosk < utente < admin < superadmin`.
- Il livello di visibilità per-tipologia si applica solo alle voci categoria `ABBONAMENTO` (non tessera/famiglia/corso).

## Decisioni di design aggiuntive (motivate sotto, da confermare in review)

- **Bootstrap ruoli**: la migration crea `profiles` con un trigger `after insert on auth.users` che crea automaticamente una riga con `role='utente'` per ogni nuovo login futuro, e con uno script di backfill che assegna `role='admin'` a tutti gli utenti Supabase Auth **già esistenti** oggi (sono il direttivo, hanno già accesso pieno adesso — non li deve declassare). Nessuno è superadmin subito dopo la migration: va promosso a mano con un `UPDATE profiles SET role='superadmin' WHERE email = '...'` una tantum, documentato in `docs/ACCOUNT.md`. Stesso discorso per l'account kiosk: va creato in dashboard come oggi, poi promosso a `role='kiosk'` (a mano la prima volta, poi dal pannello utenti del punto 3).
- **Ricerca kiosk "solo il proprio nome"**: interpretata come "niente numero tessera / dati sensibili, e nessuna lista di più persone che matchano un prefisso" (privacy: non deve poter scorrere il resto del club). Il pannello kiosk userà una vista ristretta `members_kiosk_search` (no `card_number`, no `tax_code`, no importi, no indirizzo) e richiederà nome+cognome quasi esatti invece del prefisso libero usato oggi da utente/admin. Se questa non è l'interpretazione voluta, va corretta prima del task 5.

## Struttura del lavoro

Un solo pezzo è **fondativo e va fatto per primo** (task 1: schema ruoli + RLS). Tutto il resto dipende da quello ma è indipendente tra loro — file diversi, zero sovrapposizione — quindi va assegnato a 4 agent separati in parallelo dopo che il task 1 è merged. Il task 0 (tab colorati) non dipende da nulla e può partire subito, anche prima/insieme al task 1.

**Regola per tutti gli agent dei task 2-5**: non toccare `web/shared.js` o `ricerca/comune.js` (già estesi dal task 1 con gli helper di ruolo) — se serve un helper nuovo, va messo nel file della singola pagina, per evitare conflitti di merge tra agent paralleli.

Ogni task = un commit autoconsistente (branch parte da `2.1-SNAPSHOT`, app funzionante ad ogni commit, nessun task lascia lo schema o la UI a metà).

---

### Task 0 — Tab colorati nel filtro giorno di `ricerca/gite.html` (nessuna dipendenza)

Oggi il filtro giorno (`ricerca/gite.html:45-49`) è 5 bottoni con un pallino colorato (`::before`, `ricerca/stile.css:152-158`) davanti al testo; quando un bottone è attivo (`[aria-pressed="true"]`, `stile.css:161-163`) diventa scuro/bianco generico, perdendo il colore del giorno. Richiesta: da premuto, il tab deve prendere il colore pieno di quel giorno (stesso mapping già usato da `.giorno-sabato/domenica/martedi/jolly` in `stile.css:94-97` e dalla barra progresso `stile.css:178-181`), così è ovvio a colpo d'occhio per cosa si sta filtrando.

**File**: solo `ricerca/stile.css` (eventualmente `data-giorno` già presente in `gite.html`, nessuna modifica HTML necessaria). Aggiungere regole `[aria-pressed="true"][data-giorno="SABATO"]` ecc. che sovrascrivono lo sfondo/colore con le variabili blu/giallo/errore/ok già in uso, mantenendo contrasto testo leggibile (bianco o scuro a seconda del colore, come già gestito per `.giorno-*`).

**Verifica**: aprire `ricerca/gite.html` in locale (`python3 -m http.server` dalla root e navigare a `/ricerca/gite.html`), cliccare ciascun tab, controllare visivamente che il colore del tab attivo combaci con quello dell'etichetta/barra dello stesso giorno e che il testo resti leggibile.

---

### Task 1 — Fondazione ruoli (RLS + profiles) — FA DA SOLO, BLOCCA TUTTO IL RESTO

**File**: `supabase/schema.sql` (nuova sezione), `web/shared.js`, `ricerca/comune.js`, `docs/ACCOUNT.md`.

Schema:
- `public.profiles(user_id uuid primary key references auth.users(id) on delete cascade, email text not null, role text not null default 'utente' check (role in ('kiosk','utente','admin','superadmin')), created_at timestamptz not null default now())`.
- Trigger `after insert on auth.users` → crea la riga `profiles` con `role='utente'` ed `email = NEW.email` (pattern standard Supabase, `security definer`).
- Backfill one-off nella stessa migration: `insert into profiles (user_id, email, role) select id, email, 'admin' from auth.users on conflict do nothing` (fotografa il direttivo di oggi come admin).
- Funzione `public.current_role() returns text` (implementata `security invoker`, non `definer` come ipotizzato sopra: legge solo la riga `profiles` dell'utente stesso, sempre leggibile per la policy `profiles_select_own`, quindi niente bisogno di bypassare la RLS) e helper `public.has_role(min_role text) returns boolean` che confronta la gerarchia `kiosk < utente < admin < superadmin`. Verificato con un Postgres locale usable via docker (schema fittizio `auth.users`/`auth.uid()`): la matrice `has_role` è corretta su tutte le 20 combinazioni, `null` (nessun profilo) nega sempre.
- Colonna `public.prices.min_role text not null default 'utente' check (min_role in ('utente','admin','superadmin'))` — rilevante solo per `category='ABBONAMENTO'`, ma la colonna esiste su tutte le righe per semplicità (le altre categorie restano sempre a `'utente'`, cioè visibili a tutti).
- Nuova vista `public.members_kiosk_search` (`security_invoker`) che espone solo `id, last_name, first_name, phone, email, card_type, pass_type` da `members` — niente `card_number`, `tax_code`, importi, indirizzo (usata dal task 5).
- Riscrivere le RLS esistenti (tutte oggi `to authenticated using (true)`) per richiedere il ruolo minimo giusto per tabella/operazione, usando `has_role(...)`:
  - `members`: select/insert/update richiedono almeno `utente` (kiosk non tocca `members` direttamente, solo la vista dedicata).
  - `prices`, `departures`: select richiede almeno `utente`; insert/update/delete richiedono `superadmin`.
  - `trip_uses`: select/insert/delete richiedono almeno `utente` (chi segna una gita).
  - `season_history`, `season_breakdown`: richiedono almeno `admin`.
  - `members_kiosk_search`: select richiede almeno `kiosk` (quindi chiunque, dato che è il livello più basso).
  - `profiles`: select della propria riga per chiunque loggato (`user_id = auth.uid()`); select di tutte le righe e update del `role` altrui solo per `superadmin`.

Frontend (helper riusabili dai task 2-5, non pagine):
- `web/shared.js`: aggiungere `getProfile()` (fetch la riga `profiles` dell'utente corrente, cache in memoria) e `requireRole(minRuolo)` (come `requireAuth()` ma redirige/mostra errore se il ruolo è insufficiente).
- `ricerca/comune.js`: stesso pattern (`getProfilo()`/`richiediRuolo()`), coerente con `proteggiPagina()` esistente.

Documentazione: aggiornato `docs/ACCOUNT.md` §3 ("Chi vede cosa") con la nuova gerarchia di ruoli e il comando SQL una tantum per promuovere il primo superadmin e l'account kiosk.

**Aggiunta non prevista nella stesura originale, necessaria a chiudere un buco di sicurezza**: il form completo `web/index.html` (`riempiSelect()`) filtrava già tutte le voci ABBONAMENTO senza guardare `min_role` — un operatore `utente` avrebbe potuto scegliere "ABBONAMENTO DIRETTIVO" da lì anche dopo il Task 4, che tocca solo `ricerca/gite.html`. Aggiunto lo stesso filtro `min_role` anche in `web/index.html` (righe vicino a `riempiSelect`/`init()`), riusando `LIVELLO_RUOLO`/`getProfile()` di `web/shared.js`.

**Stato: FATTO** (committato). Verificato con Postgres locale via docker (schema fittizio `auth.users`/`auth.uid()`, non un vero progetto Supabase — quello resta da fare al primo deploy reale): schema.sql rieseguibile due volte senza errori, trigger `on_auth_user_created` crea la riga `profiles` al primo login con `role='utente'`, `prices.min_role` esiste con default `'utente'`, vista `members_kiosk_search` espone solo le 7 colonne previste, `test-ricerca.js` continua a passare. **Non ancora verificato su un vero progetto Supabase** (serve farlo al primo deploy: promuovere un utente a `superadmin` da SQL Editor e controllare che il pannello Utenti del Task 3 lo veda).

---

### Task 2 — Pannello impostazioni costi (dipende solo da Task 1)

**File nuovo**: `web/impostazioni.html` (+ eventuale link nel menu comune a `web/*.html`, verificare come sono collegate le pagine tra loro oggi, es. header/nav condiviso).

CRUD unico per `prices` (tutte le categorie: TESSERA, FAMIGLIA, ABBONAMENTO incluso `trips`/`day`, CORSO) e `departures`, riusando `caricaPrezzi()`/`caricaPartenze()` da `web/shared.js` per la lettura e aggiungendo insert/update/toggle-`active` (niente delete fisico, segue la stessa scelta già fatta su `members`: si disattiva con `active=false`, non si cancella). Per le righe `category='ABBONAMENTO'`, selettore aggiuntivo per `min_role` (utente/admin/superadmin) — esempio d'uso: creare/segnare "ABBONAMENTO DIRETTIVO" con `min_role='superadmin'`. Pagina protetta con `requireRole('superadmin')`.

**Verifica**: da superadmin, creare una nuova voce ABBONAMENTO con `min_role='superadmin'`, salvare, ricaricare e verificare che compaia; da account `admin` (non superadmin) verificare che la pagina sia bloccata da `requireRole`.

---

### Task 3 — Gestione utenti/ruoli (dipende solo da Task 1)

**File nuovo**: `web/utenti.html`.

Lista di `profiles` (email + ruolo attuale), select per cambiare ruolo di ciascun utente (via update RLS-protetto, solo superadmin può scrivere `profiles.role` altrui, vedi Task 1). Pagina protetta con `requireRole('superadmin')`. Nessuna creazione di nuovi account Supabase Auth da qui (resta manuale da dashboard, come oggi per tutti gli account) — questa pagina serve solo ad assegnare/cambiare il ruolo a chi ha già fatto almeno un login (quindi ha già una riga `profiles` grazie al trigger del Task 1).

**Verifica**: da superadmin, cambiare il ruolo di un utente di test da `utente` a `admin`, verificare che il cambiamento sia visibile rileggendo la tabella e che quell'utente ottenga i permessi `admin` al login successivo.

---

### Task 4 — Assegna abbonamento dal pannello gite (dipende solo da Task 1)

**File**: `ricerca/gite.html` (nuova azione), eventuale piccolo helper locale nel `<script>` della pagina (non in `comune.js`, vedi regola sopra).

Nella scheda di un socio senza `pass_type` impostato (oggi la vista `trip_passes` filtra solo chi ha già un abbonamento — verificare se la ricerca socio di `gite.html` mostra anche chi non ne ha uno, o se va aggiunta una query separata su `members` per i soci senza pass_type prima di poter offrire l'azione), aggiungere un'azione "Assegna abbonamento": select delle voci `prices` categoria ABBONAMENTO filtrate per `min_role <= ruolo dell'operatore corrente` (usa `getProfilo()`/`richiediRuolo()` del Task 1 — un operatore `utente` non deve vedere/poter scegliere una voce `min_role='superadmin'` come "ABBONAMENTO DIRETTIVO"), poi update di `members.pass_type` (e ricalcolo di `members.total` sommando il prezzo scelto, coerente con come già fa `web/index.html:492-547`).

**Verifica**: da operatore `utente`, cercare un socio senza abbonamento, verificare che il selettore NON mostri le voci `min_role='superadmin'`; assegnare un abbonamento normale e verificare che il socio compaia poi nella vista `trip_passes`/lista principale di `gite.html`. Da `superadmin`, verificare che le voci riservate siano invece selezionabili.

---

### Task 5 — Irrigidimento kiosk (dipende solo da Task 1)

**File**: `ricerca/index.html`.

- Sostituire la query diretta su `members` (oggi `CAMPI` a `ricerca/index.html:65`, include `card_number`) con lettura dalla vista `public.members_kiosk_search` (Task 1) quando l'operatore ha ruolo `kiosk` — niente più `card_number` visibile.
- Per il ruolo `kiosk`, restringere la ricerca a corrispondenza quasi-esatta di nome+cognome (non il prefisso libero usato oggi da `pezzi()`/`cerca()`, che con un ruolo pieno può restituire più persone) — evitare che un utente da tablet negozio veda un elenco di più soci.
- Nascondere/disabilitare qualunque azione di scelta tipologia abbonamento per il ruolo `kiosk` (oggi `index.html` è già sola-lettura, quindi verificare che resti così e non regredisca).
- Proteggere la pagina con `richiediRuolo('kiosk')` (livello minimo, quindi chiunque loggato la vede, ma con campi/ricerca ridotti solo per chi è effettivamente `kiosk`; `utente`/`admin`/`superadmin` continuano a vedere la ricerca attuale a prefisso libero con i campi già ridotti esistenti, MENO `card_number` che va tolto per tutti visto che l'utente ha detto esplicitamente che il kiosk non deve vederlo — decidere in review se toglierlo solo al kiosk o a tutti).

**Verifica**: da account kiosk, cercare un nome parziale e verificare che serva il nome+cognome quasi completo, che non compaia `card_number`, e che non ci sia alcun modo di impostare un tipo di abbonamento. Da `utente`/`admin`, verificare che la ricerca a prefisso continui a funzionare.

---

## Ordine di esecuzione consigliato per gli agent

1. Task 0 e Task 1 possono partire subito, in parallelo (non si toccano).
2. Appena Task 1 è mergiato in `2.1-SNAPSHOT`, lanciare Task 2, 3, 4, 5 in parallelo (4 agent, file disgiunti).
3. Nessun task successivo al 1 deve modificare `supabase/schema.sql`, `web/shared.js` o `ricerca/comune.js` — se durante l'implementazione emerge che serve, fermarsi e segnalarlo invece di modificare un file condiviso mentre altri agent lavorano in parallelo.
