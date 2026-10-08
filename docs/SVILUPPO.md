# Sviluppo — come si lavora su questo repository

Per chi mette le mani al codice (persone o assistenti). Cosa fa il sito: `README.md`;
in breve per una sessione nuova: `PROJECT-CONTEXT.md`; cosa c'è da fare: `TODO.md`.

## Regole di lavoro

- **Niente commit senza un sì esplicito** di chi segue il progetto. Commit limitati ai
  percorsi toccati (`git commit -- file...`), così non finisce in stage altro.
- Messaggi di commit: Conventional Commits in italiano, con un corpo che spiega il perché
  (vedi `git log`).
- Interfaccia, commenti e variabili JS in **italiano**; nomi del database in **inglese**. I
  commenti spiegano il perché, in prosa: mantenere lo stesso stile.
- Le richieste nuove si scrivono **in cima** a `TODO.md`. Quando una cosa è fatta si toglie
  dal TODO: la storia resta nei commit.
- Il branch predefinito è `dev` (non esiste `main`); si lavora su `X.Y-SNAPSHOT`. Ogni branch
  nuovo va aggiunto ai trigger di `.github/workflows/deploy-pages.yml`.
- `gh` serve per seguire i deploy: `gh run list --workflow deploy-pages.yml --limit 3`.

## Rilasciare una versione (fatto così dalla 2.2 alla 2.6)

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

La versione online si vede in Gestione > Amministrazione (`web/versione.json`).

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
- Backup automatico: `.github/workflows/backup-db.yml` su `dev`, martedì, giovedì e sabato
  (frase in `supabase/.backup_passphrase`).
- Test: `./supabase/test_ruoli.sh` (ruoli, RLS e trigger in Postgres su docker).

## Modello dati da ricordare

- Listino `prices`: categorie `TESSERA`, `FAMIGLIA`, `ABBONAMENTO`, `CORSO`, `PRESCIISTICA`.
  `min_role` solo sulle tessere (es. TESSERA DIRETTIVO = admin); `insurance` dice in che lista
  dell'assicurazione va la tessera. Gli abbonamenti ricavano `trips`/`day` dal nome (trigger
  `fill_pass_details`).
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
  pagine li controllano con `requirePermesso()`. Dettagli in `docs/ACCOUNT.md`.

## Interfaccia: scelte da non disfare

- Token in `web/brand.css` (ricopiati in `ricerca/stile.css`, i due siti non condividono
  file); contrasti in `docs/brand-guidelines.md`. Focus = anello blu scuro 3px + alone giallo.
- Corpo 17px e **pulsante A+** nella barra di ogni pagina `web/` (17/19/21px su
  `html[data-testo]`): le misure delle pagine vanno in **rem**; la barra resta in px e non deve
  andare a capo.
- Conferme sempre in una finestra sopra la pagina (`chiedi()` in `shared.js` o `<dialog
  class="finestra">`), mai `confirm()`: un browser che blocca le finestre risponde "no" da solo.
- Errori (`showToast(..., "is-danger")`) restano finché non si preme Chiudi; le conferme
  spariscono dopo 8 secondi.
- Sezioni colorate (`.sezione`, `.striscia`, `.corpo` in `brand.css`): il nome in una striscia
  piena in alto, il colore dice di cosa si parla ed è lo stesso in tutto il sito (blu persone,
  verde tessera e assicurazione, viola gite e corsi, arancio soldi). Le usano Soci, Riepilogo e
  Assicurazione; non servono dove la pagina ha una sola parte o ha già i suoi colori.
- Pagina Soci: testata con il nome e i pulsanti Stampa (scarica il PDF) ed Elimina; quattro
  sezioni (Anagrafica, Tessera, Gite e corsi, Pagamento). Le voci del listino sono righe radio
  grandi, ordinate per prezzo.
- Barre fisse (navigazione, totali della pagina Soci, strisce delle sezioni) si sganciano sotto
  560px di altezza (zoom alto).
- Logo: `web/logo_sciclubdonbosco.svg` (copia in `ricerca/`), vedi `grafica/logo/README.md`.

## Provare le pagine senza login

Le pagine chiedono il login Supabase. Si prova una copia della cartella `web/` (fuori dal
repository) in cui lo script di supabase-js è sostituito da un client finto: `from()`
concatenabile con tabelle in memoria, `rpc("my_access")` che restituisce ruolo e permessi,
`auth.getSession()` con una sessione finta. `shared.js` resta quello vero. Si serve con
`python3 -m http.server` e si guarda nel browser, anche a 400px e con A+ al massimo.

Test senza browser: `node web/test-social.js`, `node web/test-stampe.js`,
`node web/test-codicefiscale.js`, `node ricerca/test-ricerca.js`.

## Regole decise con il direttivo (30/09/2026)

- Assicurazioni, in ordine di copertura: Base 35 €, Neve Plus 50 €, Global Sport 65 €.
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
- Codici fiscali dai fogli di dati26: si correggono su tutte le righe della persona, anche quelle
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
