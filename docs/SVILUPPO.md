# Sviluppo — come si lavora su questo repository

Per chi mette le mani al codice (persone o assistenti). Cosa fa il sito: `README.md`;
in breve per una sessione nuova: `PROJECT-CONTEXT.md`; cosa c'è da fare: `TODO.md`.

## Regole di lavoro

- I commit locali si fanno senza chiedere, limitati ai percorsi toccati
  (`git commit -- file...`), così non finisce in stage altro: un commit non pubblica niente.
  **Niente push senza un sì esplicito** di chi segue il progetto: il push su un branch nei
  trigger di `deploy-pages.yml` (oggi `2.7` e `2.8-SNAPSHOT`) ricostruisce il sito.
- Messaggi di commit: Conventional Commits in italiano, con un corpo che spiega il perché
  (vedi `git log`).
- Interfaccia, commenti e variabili JS in **italiano**; nomi del database in **inglese**. I
  commenti spiegano il perché, in prosa: mantenere lo stesso stile.
- Le richieste nuove si scrivono **in cima** a `TODO.md`. Quando una cosa è fatta si toglie
  dal TODO: la storia resta nei commit.
- Il branch predefinito è `dev` (non esiste `main`); si lavora su `X.Y-SNAPSHOT`. Ogni branch
  nuovo va aggiunto ai trigger di `.github/workflows/deploy-pages.yml`.
- `gh` serve per seguire i deploy: `gh run list --workflow deploy-pages.yml --limit 3`.

## Rilasciare una versione (fatto così dalla 2.2 alla 2.7)

1. Sullo SNAPSHOT: trigger del workflow → `["X.Y"]`; commit
   `chore: il workflow delle pagine pubblica dal branch X.Y`.
2. `git branch X.Y <commit>` e `git tag -a X.Y refs/heads/X.Y -m "riassunto"`; push con i
   riferimenti completi (branch e tag hanno lo stesso nome):
   `git push origin refs/heads/X.Y refs/tags/X.Y`.
3. `git switch -c X.(Y+1)-SNAPSHOT refs/heads/X.Y`; trigger → `["X.Y", "X.(Y+1)-SNAPSHOT"]`;
   commit `ci: deploy anche dal branch ... [skip ci]` (senza `[skip ci]` parte un deploy dallo
   SNAPSHOT e online la versione appena rilasciata diventa "X.(Y+1)-SNAPSHOT");
   `git push -u origin refs/heads/X.(Y+1)-SNAPSHOT`. Così al rilascio parte un solo deploy,
   dal branch X.Y: lo SNAPSHOT pushato al passo 2 ha già il trigger `["X.Y"]` e i tag non fanno
   partire il workflow.
4. Allineare `dev` (dove gira il backup del database): in una worktree, `git merge
   refs/tags/X.Y` su `origin/dev`, controllare che l'albero sia uguale al tag, push su `dev`
   (niente force push).
5. Quando le pagine pubblicano dal nuovo SNAPSHOT, il branch `X.Y` e il vecchio
   `X.Y-SNAPSHOT` non servono più: la versione resta nel tag `X.Y`. Si tolgono con
   `git push origin --delete refs/heads/X.Y refs/heads/X.Y-SNAPSHOT` (dopo aver controllato con
   `git tag --contains` che il tag li contenga). Su GitHub restano solo `dev` e lo SNAPSHOT aperto.

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
  (frase in `supabase/.backup_passphrase`).
- Test: `./supabase/test_ruoli.sh` (ruoli, RLS e trigger in Postgres su docker).

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
  pagine li controllano con `requirePermesso()`. Dettagli in `docs/ACCOUNT.md`. Dalla 2.8 una
  voce della barra = un permesso: `cerca` (Cerca socio), `gite` (pannello gite: solo lui segna le
  gite e vende abbonamenti dal telefono), `stampe`; prima `gite` le apriva tutte e tre. I nomi
  delle voci si cambiano in Gestione > Ruoli (`nav_labels`, `nomiBarra()` in `shared.js` e
  `ricerca/comune.js`); senza nome vale quello scritto nelle pagine.
- Password iniziale da cambiare: riga in `pending_password_changes` (la mettono i trigger su
  `auth.users` e `reset_password()`, la toglie il cambio vero della password); `my_access()` la
  restituisce come `change_password` e le guardie delle pagine mandano a `password.html`.

## Interfaccia: scelte da non disfare

- Token in `web/brand.css` (ricopiati in `ricerca/stile.css`, i due siti non condividono
  file); contrasti in `docs/brand-guidelines.md`. Focus = anello blu scuro 3px + alone giallo.
- Corpo 17px e **pulsante A+** nella barra di ogni pagina `web/` (17/19/21px su
  `html[data-testo]`): le misure delle pagine vanno in **rem**; la barra resta in px e non deve
  andare a capo.
- Conferme sempre in una finestra sopra la pagina (`chiedi()` in `shared.js` o `<dialog
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
- Logo: `web/logo-ufficiale-trasparente-lettere-blu.svg` (copia in `ricerca/`), vedi `grafica/logo/README.md`.
- Post social: una sola grafica, **K · Piani** (`postK`, `meseK` in `web/social-templates.js`; il
  disegno d'origine in `grafica/proposte-post-social/`), post 4:5 (`misurePost()`) e story. Le altre
  (Ritocco, Montagna, Biglietto, Calendario, Divano) e la scelta in Impostazioni sono state tolte il
  15/10/2026: la riga `style` di `social_settings` resta nel database ma non si legge più. Il testo
  resta grande: post almeno 34 px su 1080, story 44 (misurato). Il titolo è sempre alto due righe e il
  testo parte dallo stesso punto; se non ci sta, `fit()` lo abbassa fino al 92% senza spostare niente,
  poi prende lo spazio vuoto (`data-cede`: la seconda riga del titolo se non serve) e solo dopo
  abbassa tutto insieme (`--s`, `data-adatta`) fino ai corpi minimi. Il gancio ("Alzati dal divano!")
  è `social_events.hook`, scritto post per post. Gli eventi hanno Ora, Dove e Iscrizioni entro
  (`event_time`, `place`, `deadline`: `fattiEvento()`); nel sottotesto il pulsante Evidenzia mette le
  parole fra asterischi (`evidenzia()` le disegna, `senzaSegni()` le toglie nel testo del post). Il
  form segue l'ordine del post (`ORDINE_CAMPI` in `social.html`). Logo in alto a sinistra e coccarda
  del corso (`stellaCorso()`) all'angolo basso della tessera della data, uguali in post e story.
  La foto si sposta col pulsante «Sposta la foto» (frecce, + e −: `collegaSpostaFoto()` in
  `social.html`) in `social_events.photo_x`, `photo_y` (0–100, vuoti = 50% 45%: `posFoto()`) e
  `photo_zoom` (100–300, vuoto = 100: `zoomFoto()`), uguali per post e story, nelle variabili
  `--pos` e `--zoom` di foto, finestra e grigi. Senza ingrandire, una foto orizzontale nel post si
  sposta solo ai lati (object-fit: cover). La partenza sotto la data è `card_stop` (per luogo;
  vuota = la prima). «Duplica questo post» apre una copia non salvata senza giorno, scadenza, foto,
  stato «pubblicato» e testo scritto a mano. La gita può avere una nota in giallo sotto la meta
  (`subtitle`, es. «Prova gratuita con i maestri»); quota e scadenza della gita sono facoltative
  (`mancanti()` non le chiede). `photo` accetta solo data URL d'immagine (check nel database) e
  nell'`url()` del CSS si codifica tutto tranne i caratteri di un data URL. La meta della gita va su
  due righe (a capo scritti o da sola, `righeMeta()`; `data-due` in `fit()`): su una riga 150 (168
  nella story), su due 104 (124); fuori dal post l'a capo diventa uno spazio (`unaRiga()`).
- Dopo ogni modifica ai post, controllare post, story e calendario contro la
  versione online: nessuna informazione saliente (corso, scadenza, prezzi, partenze, telefoni) deve
  sparire o rimpicciolirsi.
- Conferme con dati di una persona: `tabellaDati()` in `shared.js` (anche come `dettagli` di
  `chiedi()`), una riga per dato, i mancanti scritti "non scritto" in rosso.

## Provare le pagine senza login

Le pagine chiedono il login Supabase. Si prova una copia della cartella `web/` (fuori dal
repository) in cui lo script di supabase-js è sostituito da un client finto: `from()`
concatenabile con tabelle in memoria, `rpc("my_access")` che restituisce ruolo e permessi,
`auth.getSession()` con una sessione finta. `shared.js` resta quello vero. Si serve con
`python3 -m http.server` e si guarda nel browser, anche a 400px e con A+ al massimo.

Test senza browser: `node web/test-social.js`, `node web/test-stampe.js`,
`node web/test-codicefiscale.js`, `node ricerca/test-ricerca.js`. Il deploy li lancia tutti
prima di pubblicare (`web/test-*.js` e quello della ricerca): se uno fallisce il sito resta com'era.
Nel sito pubblicato i file dei test non ci sono.

## Regole decise con il direttivo (30/09/2026)

- Assicurazioni, in ordine di copertura: Base 35 €, Neve Plus 50 €, Global Sport 65 €. Dal 14/10/2026:
  Global Neve Base 20 € e Global Neve Sport 45 €, a parte dalla quota della tessera; la Neve Plus
  non c'è più; il direttivo ha la Sport pagata dal club.
- Tessera → assicurazione: ORDINARIA NEVE BASE e SCONTATA NEVE BASE (nati prima del 1947) → Base;
  ORDINARIA NEVE PLUS → Plus; ORDINARIA GLOBAL SPORT e DIRETTIVO → Sport;
  SOLO TESSERA / SCONTATA NO ASSICURAZIONE → in nessuna lista.
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
- Totale scritto a mano: segnato come manuale, il form non lo ricalcola più.
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
  storico scritto dal database. Nel form Soci casella "Totale scritto a mano".
