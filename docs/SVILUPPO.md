# Sviluppo — come si lavora su questo repository

Per chi mette le mani al codice (persone o assistenti). Cosa fa il sito: `README.md`;
in breve per una sessione nuova: `PROJECT-CONTEXT.md`; cosa c'è da fare: `TODO.md`.

## Regole di lavoro

- I commit locali si fanno senza chiedere, limitati ai percorsi toccati
  (`git commit -- file...`), così non finisce in stage altro: un commit non pubblica niente.
  Il push è autorizzato a lavoro finito, con le prove verdi e la code review fatta; prima si
  controlla `git status`. Il sito si pubblica solo dai tag `v<versione>` (vedi sotto).
- Messaggi di commit: Conventional Commits in italiano, con un corpo che spiega il perché
  (vedi `git log`).
- Interfaccia, commenti e variabili JS in **italiano**; nomi del database in **inglese**. I
  commenti spiegano il perché, in prosa: mantenere lo stesso stile.
- Le richieste nuove si scrivono **in cima** a `TODO.md`. Quando una cosa è fatta si toglie
  dal TODO: la storia resta nei commit.
- Rami (dal 12/11/2026, regola valida per tutti i progetti): il ramo predefinito è `main`,
  uguale all'ultimo rilascio; ogni versione si sviluppa su `release/v<versione>` creato da
  `main`. `dev` e `3.0-SNAPSHOT` sono rami vecchi, fermi alla 3.0.0.
- `gh` serve per seguire i deploy: `gh run list --workflow deploy-pages.yml --limit 3`.

## Rilasciare una versione (dalla 3.0.1)

1. `git switch -c release/v<versione> main` e push del ramo; si lavora e si committa lì.
2. PR verso `main` (`gh pr create --base main`): sulla PR il workflow `deploy-pages.yml`
   costruisce il sito e fa girare le prove, senza pubblicare.
3. Con la CI verde, merge con un commit di merge, mai squash (resta la storia RED/GREEN):
   `gh pr merge --merge`.
4. Tag su `main`: `git tag -a v<versione> origin/main -m "riassunto"` e
   `git push origin refs/tags/v<versione>`. Il tag avvia il rilascio: il workflow pubblica il
   sito e `web/versione.json` dice `v<versione>`.
5. Correzioni urgenti a una versione pubblicata: `hotfix/v<x.y.z>` dal tag, stessa PR.

Fino alla 3.0.0 si pubblicava da un ramo `X.Y-SNAPSHOT` con il merge in `dev`: la storia resta
nei tag `2.5` … `2.9` e `v3.0.0`.

La versione online si vede in Gestione > Amministrazione (`web/versione.json`).

GitHub Pages fa tenere i file nella cache del browser per 10 minuti: una pagina nuova con un
`shared.js` vecchio si rompe ("nomiBarra is not defined", 15/10/2026). Per questo le pagine chiedono
script e fogli di stile con `?v=AAAAMMGGx`: **cambiato un `.js` o un `.css`, cambiare il numero in
tutte le pagine** (`sed -i 's/?v=VECCHIO/?v=NUOVO/g' web/*.html ricerca/*.html`).

## Database

- La connessione di produzione sta in `supabase/.postgre_connect` (fuori da git, **non
  stamparla**): `DB="$(cat supabase/.postgre_connect)"`. Utente di sola lettura per i
  controlli: `supabase/.monitor_connect` (`supabase/scripts/controlli.sh`).
- Applicare lo schema, in una transazione:
  `psql "$DB" -X -1 -v ON_ERROR_STOP=1 -q -f supabase/schema.sql`, poi
  `psql "$DB" -X -q -c "notify pgrst, 'reload schema';"`.
- Prima di cambiare dati: backup con `\copy public.<tabella> to 'file.csv' csv header` in
  `supabase/migration/backup-AAAA-MM-GG/` (fuori da git), e conteggi prima e dopo.
- `schema.sql` si riapplica per intero: le colonne nuove vanno anche in `alter table ... add
  column if not exists`, i check scritti nel `create table` si rimpiazzano con `drop constraint
  if exists` + `add constraint`, gli spostamenti di dati sono UPDATE rieseguibili.
- Dopo un caricamento da Excel (`supabase/scripts/generate_migration.py`) rilanciare
  `schema.sql`: crea le righe di `member_passes` dagli abbonamenti scritti nella colonna del socio.
  Le tessere già nel listino restano come sono; una tessera nuova del foglio entra col prezzo
  pieno (assicurazione dentro) e senza assicurazione: in Impostazioni sceglierla e abbassare la
  quota. I prezzi sono in euro interi (il database rifiuta i centesimi).
- Backup automatico: `.github/workflows/backup-db.yml` su `dev`, martedì, giovedì e sabato
  (frase in `supabase/.backup_passphrase`): il dump cifrato e `dati-AAAA-MM-GG.7z` con ogni
  tabella per Excel (`supabase/scripts/esporta-tutto.sh`). Seconda copia sul PC del club
  (`supabase/scripts/scarica-backup.sh`, timer di systemd) e, col secret `RCLONE_CONFIG`, su
  Google Drive. Come leggerli e rimetterli: `docs/BACKUP.md`.
- Test: `./supabase/test_ruoli.sh` (ruoli, RLS e trigger in Postgres su docker),
  `./supabase/test_backup.sh` (backup leggibili e copia sul PC).

## Modello dati da ricordare

- Listino `prices`: categorie `TESSERA`, `FAMIGLIA`, `ABBONAMENTO`, `CORSO`, `PRESCIISTICA`.
  `min_role` solo sulle tessere (es. TESSERA DIRETTIVO = admin); `insurance` dice in che lista
  dell'assicurazione va la tessera (`insurances.code`). Dalla 2.8 il prezzo di una tessera è la sola
  quota: il socio paga quota + assicurazione (`card_price()`, letto dalle pagine come
  `price:card_price`), tranne con `insurance_paid = false` (il direttivo, la paga il club). Le
  assicurazioni (`insurances`: nome, prezzo) si aggiungono e si tolgono da Impostazioni. `position`
  è l'ordine della voce come sul modulo di carta (vuoto = in fondo, per prezzo). Gli abbonamenti ricavano `trips`/`day` dal nome (trigger
  `fill_pass_details`). I soci tengono le voci per nome: rinominare una voce rinomina anche le
  scelte dei soci e gli abbonamenti della stagione aperta (trigger `rename_price_choices`).
- `members`: una colonna per categoria (`card_type`, `family_discount`, `pass_type`,
  `preski_type`, `course_type`, `course_day`); partenze `saturday_departure` /
  `sunday_departure` (testo separato da virgole); `total` salvato dalla pagina (o scritto a
  mano, `total_manual`), `paid`, `balance` generata; `payer_id` = capofamiglia; `enrolled_at`
  decide la stagione; `name_key` per trovare i doppioni.
- Viste: `households`, `season_totals`, `card_counts`, `pass_counts`, `course_counts`,
  `preski_counts`, `departure_counts`, `admin_summary` (incasso corsi = solo categoria CORSO),
  `open_season`, `trip_passes`.
- Chiusura stagione `close_season('CHIUDI STAGIONE')`: archivia in `season_history` e
  `season_breakdown` e azzera i dati di stagione dei soci.
- Ruoli: `superadmin`, `admin`, `tesoriere`, `assicurazione`, `gite` ("Utente"), `social`;
  permessi in `role_permissions()` e nella matrice di Gestione > Ruoli (`role_grants`); le
  pagine li controllano con `requirePermission()`. Dettagli in `docs/ACCOUNT.md`. Dalla 2.8 una
  voce della barra = un permesso: `cerca` (Cerca socio), `gite` (pannello gite: solo lui segna le
  gite e vende abbonamenti dal telefono), `stampe`; prima `gite` le apriva tutte e tre. I nomi
  delle voci si cambiano in Gestione > Ruoli (`nav_labels`, `menuLabels()` in `shared.js` e
  `ricerca/comune.js`); senza nome vale quello scritto nelle pagine.
- Password iniziale da cambiare: riga in `pending_password_changes` (la mettono i trigger su
  `auth.users` e `reset_password()`, la toglie il cambio vero della password); `my_access()` la
  restituisce come `change_password` e le guardie delle pagine mandano a `password.html`.

## Bilancio: post collegati, spese anticipate, fatture (dal 12/11/2026)

- Un movimento si collega a un post qualsiasi di Social (`ledger_entries.social_event_id`): in
  Bilancio con la tendina, che legge `ledger_social_events()` perché il tesoriere non vede
  `social_events`; in Social col riquadro «Spese» di ogni post salvato. Il rimborso dallo
  sponsor esiste solo sulle campagne.
- Spesa anticipata da un socio: `advanced_by` (chi ha pagato) e `refunded_on` (quando il club
  gliel'ha restituita), solo per le uscite. In alto il totale ancora da rimborsare.
- Fatture in PDF nel database (`ledger_receipts`, al massimo 2 MB, iniziano con `%PDF`), così
  stanno nel backup cifrato senza altre chiavi; si scrivono con `set_ledger_receipt()` e si
  leggono con `ledger_receipt()`, in base64, col permesso bilancio. Il piano gratuito ha 500 MB
  di database: tenerlo d'occhio. Nel backup Excel i PDF vanno nella cartella `fatture/`.

## Interfaccia: scelte da non disfare

- Token in `web/brand.css` (ricopiati in `ricerca/stile.css`, i due siti non condividono
  file); contrasti in `docs/brand-guidelines.md`. Focus = anello blu scuro 3px + alone giallo.
- Corpo 17px e **pulsante A+** nella barra di ogni pagina `web/` (17/19/21px su
  `html[data-testo]`): le misure delle pagine vanno in **rem**; barra e menu restano in px.
- Dalla 3.0: barra in alto e menu a colonna a sinistra (blu, `--barra-h` e `--menu-l` in
  `brand.css`); sul telefono il menu è un pannello («Menu», `openMenu()`). L'HTML della barra e
  del menu è uguale in tutte le 13 pagine, con la voce aperta già segnata: si cambia in tutte
  insieme. Stile Material (4px pulsanti e campi, 8px schede, pulsanti in maiuscolo) e tema
  scuro (`html[data-tema="scuro"]`, `toggleTheme()`, `--blu-pieno`/`--ok-pieno`/`--errore-pieno`
  per i fondi sotto le scritte bianche). Prove: `test-browser/menu.js`,
  `test-reale/stile-tutte.js`, `telefono-tutte.js` (390 px), `scuro-tutte.js`.
- Conferme sempre in una finestra sopra la pagina (`ask()` in `shared.js` o `<dialog
  class="finestra">`), mai `confirm()`: un browser che blocca le finestre risponde "no" da solo.
- Pagina Soci: si salva solo se la scheda non è cambiata da quando è aperta (`updated_at`
  letto all'apertura); se Pagamenti, il pannello gite o l'Assicurazione l'hanno toccata, avviso
  e niente scritto.
- Errori (`showToast(..., "is-danger")`) restano finché non si preme Chiudi; le conferme
  spariscono dopo 8 secondi.
- Sezioni colorate (`.sezione`, `.striscia`, `.corpo` in `brand.css`): il nome in una striscia
  piena in alto, il colore dice di cosa si parla ed è lo stesso in tutto il sito (blu persone,
  verde tessera e assicurazione, viola gite e corsi, arancio soldi). Le usano Soci, Riepilogo,
  Assicurazione e Bilancio; non servono dove la pagina ha una sola parte o ha già i suoi colori.
- Pagina Soci: testata con il nome e i pulsanti Stampa (scarica il PDF) ed Elimina; quattro
  sezioni (Anagrafica, Tessera, Gite e corsi, Pagamento). Le voci del listino sono righe radio
  grandi, nell'ordine del modulo di carta del tesseramento (`prices.position`), e così i campi:
  anagrafica come le righe del modulo, numero tessera in cima alla Tessera, partenze (domenica,
  sabato) prima del corso; la Stampa nello stesso ordine.
- Barre fisse (navigazione, totali della pagina Soci, strisce delle sezioni) si sganciano sotto
  560px di altezza (zoom alto).
- Logo: ovunque solo quello tondo, `web/logo-ufficiale-blu-tondo.svg` e `web/logo-ufficiale-tondo.svg`, vedi `grafica/logo/README.md`; ogni grafica lo ha sempre.
- Post social: una sola grafica, **K · Piani** (`postK`, `monthK` in `web/social-templates.js`; il
  disegno d'origine in `grafica/proposte-post-social/`), post 4:5 (`postSizes()`) e story. Le altre
  (Ritocco, Montagna, Biglietto, Calendario, Divano) e la scelta in Impostazioni sono state tolte il
  15/10/2026: la riga `style` di `social_settings` resta nel database ma non si legge più. Il testo
  resta grande: post almeno 34 px su 1080, story 44 (misurato). Il titolo è sempre alto due righe e il
  testo parte dallo stesso punto; se non ci sta, `fit()` lo abbassa fino al 92% senza spostare niente,
  poi prende lo spazio vuoto (`data-cede`: la seconda riga del titolo se non serve) e solo dopo
  abbassa tutto insieme (`--s`, `data-adatta`) fino ai corpi minimi. Il gancio ("Alzati dal divano!")
  è `social_events.hook`, scritto post per post. Gli eventi hanno Ora, Dove e Iscrizioni entro
  (`event_time`, `place`, `deadline`: `eventFacts()`); nel sottotesto il pulsante Evidenzia mette le
  parole fra asterischi (`highlight()` le disegna, `withoutSigns()` le toglie nel testo del post). Il
  form segue l'ordine del post (`FIELD_ORDER` in `social.html`). Logo in alto a sinistra e coccarda
  del corso (`courseStar()`) all'angolo basso della tessera della data, uguali in post e story.
  La foto si sposta col pulsante «Sposta la foto» (frecce, + e −: `bindMovePhoto()` in
  `social.html`) in `social_events.photo_x`, `photo_y` (0–100, vuoti = 50% 45%: `photoPos()`) e
  `photo_zoom` (100–300, vuoto = 100: `zoomPhoto()`), uguali per post e story, nelle variabili
  `--pos` e `--zoom` di foto, finestra e grigi. Senza ingrandire, una foto orizzontale nel post si
  sposta solo ai lati (object-fit: cover). La partenza sotto la data è `card_stop` (per luogo;
  vuota = la prima). «Duplica questo post» apre una copia non salvata senza giorno, scadenza, foto,
  stato «pubblicato» e testo scritto a mano. La gita può avere una nota in giallo sotto la meta
  (`subtitle`, es. «Prova gratuita con i maestri»); quota e scadenza della gita sono facoltative
  (`missingItems()` non le chiede). `photo` accetta solo data URL d'immagine (check nel database) e
  nell'`url()` del CSS si codifica tutto tranne i caratteri di un data URL. La meta della gita va su
  due righe (a capo scritti o da sola, `metaLines()`; `data-due` in `fit()`): su una riga 150 (168
  nella story), su due 104 (124); fuori dal post l'a capo diventa uno spazio (`oneRow()`).
- Dopo ogni modifica ai post, controllare post, story e calendario contro la
  versione online: nessuna informazione saliente (corso, scadenza, prezzi, partenze, telefoni) deve
  sparire o rimpicciolirsi.
- Conferme con dati di una persona: `dataTable()` in `shared.js` (anche come `dettagli` di
  `ask()`), una riga per dato, i mancanti scritti "non scritto" in rosso.

- «Caricamento…», regola di tutto il sito (3/11/2026): ogni elenco che si riempie all'apertura parte da quella
  scritta nell'HTML, mai vuoto o con «Nessun…» prima che i dati arrivino; un avviso d'errore rosso (`showToast`) cambia
  quelle ancora in attesa in «Elenco non disponibile». In più ogni richiesta al database che dura oltre 400 ms mostra l'etichetta `#caricamento`
  (`fetchWithWaiting()` in `shared.js` e `ricerca/comune.js`). `web/test-pagine.js` controlla gli elenchi: una pagina
  nuova va aggiunta lì.
- Social, tipi di post (2/11/2026): Gita, Evento (i corsi, le cene, le gare e i servizi di prima: la
  stessa grafica, un tipo solo) e Weekend e settimane bianche (`kind = 'weekend'`, dal giorno `event_date`
  all'ultimo `end_date`, senza prezzi: solo luogo, dettagli essenziali e scadenza). Eventi e weekend hanno
  un colore loro, scelto in Impostazioni > Giorni e colori (`social_settings`, chiave `event_color`), e
  scelgono il giorno nello stesso calendario delle gite; il tipo non si cambia più nel form. Il rinvio è
  fatto di due spunte, «Rimandato» e «Rimandato per maltempo». L'anteprima c'è sempre, con la tessera vuota
  finché manca la data; i pulsanti per scaricare restano spenti e dicono cosa manca.
- Social, carosello (2/11/2026): accanto a Post e Story ogni gita o evento ha tre pagine 1080×1350
  (`drawCarousel()` in `social-templates.js`): la copertina col logo, il bollino nel colore del post
  (`social_events.carousel_badge`, vuoto = «Novità»; giallo se il post è blu o giallo) e la linguetta rossa «Scorri»; il post con la
  stessa linguetta; il finale fisso «Seguici», come l'outro del video della stagione, con «link in bio»
  sotto il canale WhatsApp. Il testo del post invita a seguire il canale (bio su Instagram, link breve
  su Facebook). Le campagne sponsor non hanno il carosello.

### Testi

Registro professionale in tutto il sito (`web/` e `ricerca/`), deciso il 22/10/2026 («etichette
professionali e non che sembrano del parlato comune»). Lo controlla `node web/test-testi.js`.

- Istruzioni e avvisi impersonali o all'infinito: «Inserire la data di decorrenza», «Selezionare
  il ruolo», «Ricaricare la pagina». Niente seconda persona («premi», «scrivi», «hai», «tuo») né
  prima persona del sito («non riesco», «ho messo»): «Impossibile scaricare il modulo».
- Pulsanti: verbi brevi all'imperativo, come nei programmi («Salva», «Scarica i file Excel»,
  «Rimuovi»). Nelle conferme il pulsante dice l'azione («Conferma incasso», «Elimina
  definitivamente»), non «Sì, …».
- Titoli fatti di nomi: «Liste inviate nella stagione in corso», «Correzione del codice fiscale».
- Lessico: «inviare» e non «mandare», «rimuovere» e non «togliere», «registrare una gita» e non
  «segnare», «definitivamente» e non «per sempre», «L'operazione non è reversibile».
- I post dei social (`social-templates.js`) parlano al pubblico e restano fuori da queste regole.

### Accessibilità

WCAG 2.2, controllata il 23/10/2026 con Lighthouse (100 in tutte le pagine, sul computer e sul
telefono) e da `test-reale/accessibilita.js` (ogni pagina coi dati veri) e
`test-browser/accesso-accessibile.js` (la pagina di accesso).

- Una sola zona principale per pagina (`role="main"` sul contenitore del contenuto).
- Ogni campo e ogni tendina ha un nome: `<label for>`, o `aria-label` se non c'è un'etichetta che
  si vede (anche nelle righe scritte dal JS, es. «Ruolo di <email>»).
- Le colonne dei pulsanti hanno l'intestazione `<th><span class="is-sr-only">Azioni</span></th>`,
  mai `<th></th>`.
- I link dentro una frase sono sottolineati (brand.css): il blu sul testo scuro non basta.
- Testo con contrasto almeno 4,5:1 (3:1 se grande): niente `has-text-grey` di Bulma sul bianco.
- Le conferme sono `<dialog>` con `showModal()` (`ask()` in shared.js): il fuoco resta dentro,
  Esc vale come Annulla, il fuoco torna dove era.

## Provare le pagine senza login

Le pagine chiedono il login Supabase. Si prova una copia della cartella `web/` (fuori dal
repository) in cui lo script di supabase-js è sostituito da un client finto: `from()`
concatenabile con tabelle in memoria, `rpc("my_access")` che restituisce ruolo e permessi,
`auth.getSession()` con una sessione finta. `shared.js` resta quello vero. Si serve con
`python3 -m http.server` e si guarda nel browser, anche a 400px e con A+ al massimo.

Test senza browser: `node web/test-social.js`, `node web/test-stampe.js`,
`node ricerca/test-ricerca.js`. Il deploy li lancia tutti
prima di pubblicare (`web/test-*.js` e quello della ricerca): se uno fallisce il sito resta com'era.
Nel sito pubblicato i file dei test non ci sono.

Prove nel browser: `bash test-browser/esegui.sh` apre le pagine vere in Chrome headless con un
client Supabase finto (`test-browser/fake-supabase.js`) che risponde quando e come dice la prova:
servono per quello che i test node non vedono, come le risposte che arrivano in ordine sparso.
Una prova è un file `.js` che imposta `FINTO.risposta` e `FINTO.ritardo` (le funzioni del database,
`sb.rpc`, rispondono con `FINTO.rpc[nome]` e hanno `.range()`), usa la pagina e scrive
l'esito nel titolo (`RISULTATO nome=ok nome=NO(perché)`); si aggiunge all'elenco in `esegui.sh`,
con la larghezza della finestra se conta (Impostazioni gira a 1280 e a 500 px, il minimo di Chrome
headless: tabella sul computer, schede sul telefono).
Le lancia anche il deploy. Per un bug: prima la prova che fallisce, poi la correzione.
Il client finto sa anche rispondere con un errore (`FINTO.errore`), fare l'accesso
(`FINTO.email`, `FINTO.auth`) e mandare eventi del realtime (`FINTO.realtime`).

Prove sulla copia del database vero (dal 23/10/2026): `bash test-reale/avvia.sh [prova.js]`.
Servono docker e una copia della produzione in `supabase/migration/copia-test/` (dati personali:
fuori da git; i due comandi per farla sono in cima a `avvia.sh`). Postgres 17 con la copia,
PostgREST vero davanti e `servi.py` che fa da Supabase sullo stesso indirizzo: la pagina usa
supabase-js vero, con filtri, rpc e RLS veri, e un account per ruolo. Una prova dice in testa
`// PAGINA:`, `// RUOLO:` e se serve `// LARGHEZZA:`; un `.sql` accanto (stesso nome) prepara i
dati sulla copia e dà `window.ATTESO`, quello che la pagina deve mostrare calcolato dal database.
Chrome va a tempo reale (`chrome.js`). `TIENI=1` lascia tutto acceso per guardare a mano;
`FOTO=cartella` fotografa ogni pagina a 1280 e 500 px e segnala errori JavaScript e tabelle che
escono dallo schermo (le foto hanno dati veri: tenerle fuori da git). Con `TIENI=1` ogni pagina
ha anche la copia `entra-<pagina>.html` col superadmin già entrato: si apre in Chrome o la si passa
a Lighthouse. Una prova con più pagine in `// PAGINA:` (es. `accessibilita.js`) gira su ognuna. Non
le lancia il deploy.

## Regole decise con il direttivo (30/09/2026)

- Assicurazioni, in ordine di copertura: Base 35 €, Neve Plus 50 €, Global Sport 65 €. Dal 14/10/2026:
  Global Neve Base 20 € e Global Neve Sport 45 €, a parte dalla quota della tessera; la Neve Plus
  non c'è più; il direttivo ha la Sport pagata dal club.
- Tessera → assicurazione: ORDINARIA NEVE BASE e SCONTATA NEVE BASE (nati prima del 1947) → Base;
  ORDINARIA NEVE PLUS → Plus; ORDINARIA GLOBAL SPORT e DIRETTIVO → Sport;
  SOLO TESSERA / SCONTATA NO ASSICURAZIONE → in nessuna lista.
- Presciistica (dal 5/11/2026): la voce «CORSO PRESCIISTICA» da 70 € comprende tessera e quota CONI
  (scheda di carta, `legacy/dati26/1TESSERAMENTO Scheda e Ricevuta.pdf`); l'assicurazione è un campo
  del socio, `members.preski_insurance`: nessuna (70 €), Base (90 €) o Sport (115 €). Nella pagina
  Soci la Base è proposta e si può togliere o cambiare. Il campo è esclusivo con tessera e
  agevolazione (vincolo `members_preski_insurance_alone`): sarebbero doppioni. Con questa voce
  `member_insurance()` dà solo quel campo, quindi chi l'ha tolta non entra nelle liste.
  `preski_price()` e `preski_label()` danno prezzo e nome con l'assicurazione per `preski_counts`,
  `close_season()`, Riepilogo e ricerca. I totali già fatti pagare non sono stati toccati: chi ha
  pagato 120 € con la vecchia voce Total Sport (75 + 45, ora spenta) li tiene.
- Agevolazioni famiglia (dal 21/10/2026): al posto della tessera (vincolo
  `members_card_or_family`), le sceglie il capofamiglia e coprono lui e i familiari a carico.
  `prices.people` dal nome («3 PERSONE», trigger `fill_family_people`), `prices.insurance` anche
  per FAMIGLIA, `card_price()` = quota + persone × assicurazione (3 persone Base 50 + 3×20 = 110).
  `member_insurance(m)` dà l'assicurazione di un socio (presciistica, tessera, agevolazione sua o
  del capofamiglia) per le liste; `card_holder(m)` dice chi è tesserato (Riepilogo, Gite,
  `admin_summary`). `card_counts` e `close_season()` contano le agevolazioni e, dall'11/11/2026,
  anche la tessera compresa nella presciistica col suo tipo (`preski_card()`: l'ordinaria della
  sua assicurazione, o la solo tessera); `preski_counts` ha una riga per voce col solo prezzo della
  presciistica (`preski_course_price()`: voce meno la quota della tessera). Il totale non cambia. In Soci (`cover()`) la tessera è
  obbligatoria solo per chi non è coperto; il nucleo si conta e un familiare oltre le persone
  dell'agevolazione deve avere la tessera; chi è coperto dall'agevolazione ha la presciistica
  «solo corso» (CORSO PRESCIISTICA - FAMIGLIA, 50 €, `prices.course_only`).
- «Da assicurare» (dal 21/10/2026) è a pagine di 25, una per tipo; il titolo del gruppo dice
  quanti sono senza codice fiscale. Dopo Salva si resta sulla pagina; un codice fiscale scritto e
  non salvato si chiede prima di cambiare pagina. Excel e «Segna come assicurati» prendono tutti i
  selezionati, anche quelli delle altre pagine.
- «Da assicurare» (dall'11/11/2026): ogni socio con il codice fiscale ha la casella «Assicura»,
  accesa di default; spenta, il socio resta fuori da Excel e invio e rimane da assicurare. «Tutti»
  nel titolo del gruppo vale per l'intero tipo. La scelta non si salva (dopo un invio o ricaricando
  si riparte da tutti) e, cambiata dopo lo scarico, annulla lo scarico. Chi ha un importo da
  saldare resta selezionato ma la riga è rossa, con l'importo: è il debito del nucleo, come in
  Pagamenti (`insurance_members().debt`, da `member_debt()` sulla vista `households`; il familiare
  a carico segue il capofamiglia). L'esclusione fino al saldo del 7/11 (`members.insurance_hold`,
  `set_insurance_hold()`) è stata tolta.
- Fogli Excel per l'assicurazione (tracciato del 12/11/2026, uguale per ogni tipo): Nr. (numero
  progressivo della riga), Decorrenza, Polizza, Cognome, Nome, Luogo di nascita (solo il comune), Data di nascita, Codice fiscale,
  Sci club, Numero lista; tutte le celle centrate, carattere 14. Nella colonna Polizza «Reale
  neve» per BASE e «Reale sport» per SPORT (`POLICY_NAMES`). Si scrivono in `excelList()`
  di `assicurazione.html`; le liste già inviate si riscaricano con `insurance_list_members()`.
- Lo scarico dell'Excel è un'anteprima. Il socio diventa assicurato solo con "Segna come inviata":
  lì si assegnano decorrenza (data del giorno) e numero di lista, progressivo per tipo e per stagione.
  L'invio si può annullare e una lista inviata si può riscaricare uguale.
- Stampe: fogli corsisti, abbonamenti 5 gite e SEMPRE jolly, divisi per partenza, in ordine
  alfabetico: un pulsante per sabato, domenica e martedì, ognuno con fino a tre file Excel.
- Corsi: ogni socio sceglie se fare il corso di sabato o di domenica (voce nuova nel database e nel
  form Soci), indipendentemente dal tipo di corso.
- Secondo abbonamento: dal telefono "Nuovo abbonamento · pagato / da pagare" per tutti; nel form
  Soci la casella "già pagato" sulla riga aggiunta somma il prezzo all'acconto.
- Rimborso: riduce il pagato del socio. Lo possono fare tesoriere e admin, con lo storico delle modifiche.
- Totale manuale: segnato come manuale, il form non lo ricalcola più.
- Totale di un socio già salvato (22/10): non segue i prezzi nuovi del listino, quello fatto pagare
  vale. Cambiando una voce cambia solo la differenza, coi prezzi di oggi (`computedTotal()` in Soci).
- Codici fiscali dai fogli di dati26 (`legacy/dati26/`): si correggono su tutte le righe della persona, anche quelle
  vecchie. Prima un controllo che non scrive niente, poi il backup, poi la correzione.
  Se il CF dei fogli è diverso da quello del database vince quello dei fogli; i CF dei fogli si
  scrivono tutti anche se il controllo segnala qualcosa, e i dubbi vanno in un file di warning.
  Abbinamento: cognome + nome + data di nascita; senza data valida, cognome + nome solo se nel
  database c'è una sola persona con quel nome. Omonimi e non trovati: solo nel file di warning,
  nessun socio nuovo.
- Stampe: un pulsante "sabato e domenica" (partenze non distinte per giorno: chi ha due partenze
  diverse compare in tutti e due i gruppi) più il martedì; jolly sempre.
- Assicurazione: senza codice fiscale non si assicura: il socio non entra nel foglio e non risulta
  assicurato; la pagina lo elenca a parte in rosso. "Segna come inviata" con il permesso polizze;
  si annulla solo l'ultima lista di ogni tipo. La colonna policy_number si toglie (backup prima).
- Modifica di totale e pagato (rimborsi) da Pagamenti, tesoriere e admin, con il motivo obbligatorio;
  storico scritto dal database. Nel form Soci casella "Totale manuale".
