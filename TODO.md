# Ripresa lavori — aggiornato il 2026-10-08 (2.6-SNAPSHOT)

> Le richieste nuove si scrivono qui in cima, sotto la versione aperta (la più recente prima),
> non in fondo ai blocchi delle versioni vecchie.

## 2.6-SNAPSHOT (aperta il 01/10/2026 dalla 2.5)

1. [x] feat(ruoli) 1b87030: matrice dei permessi in Gestione > Ruoli (tabella `role_grants`,
       registro `role_grant_changes`), superadmin sempre tutto, Gestione non assegnabile.
       Schema in produzione il 01/10 (backup `supabase/migration/backup-2026-10-01/`).
       Deciso: niente separazione fra "elenco" e "dati personali" per ora.
2. [x] feat(iscrizioni) 09993da: controlli `supabase/scripts/controlli.sh`, utente `monitor`
       di sola lettura (creato in produzione, `supabase/.monitor_connect`), `docs/ISCRIZIONI.md`
       e `docs/GUIDA_VOLONTARI.md`. Iscrizioni di massa da metà novembre.
3. [x] Soci (richieste del 07/10, fatte l'08/10):
       - pulsante Salva e fascia con il nome scritto nei campi ("(era …)" se cambiato); prima di
         scrivere la domanda "Salvare ROSSI MARIO? Codice fiscale …, nascita …" (mancanti per esteso)
       - **Elimina socio** nella fascia del socio aperto: anche i doppioni vecchi. La pagina dice
         subito perché no (pagato, familiari a carico, gite, assicurazione), poi due finestre ("chi è",
         poi "sei sicuro?"); `delete_member()` rifà i controlli e copia socio, abbonamenti e storico in
         `member_deletions`. Si rimette solo dall'SQL Editor: `select public.restore_member(id) from
         public.member_deletions where last_name = '…' order by deleted_at desc limit 1;`
       - **Stampa scheda** nella fascia: A4 dalla stampa del browser (anche PDF), quello che c'è nel
         modulo anche non salvato, logo vettoriale `web/logo_sciclubdonbosco.svg`
4. [x] Doppioni: colonna generata `members.name_key` (`norm_name()`: solo lettere, senza accenti e
       apostrofi), usata dalla ricerca di Soci e del telefono e dal controllo dei doppioni:
       "D'ANGELO" trova "DANGELO". Trigger `members_no_double_insert`: due inserimenti della stessa
       persona (stesso nome e data o codice fiscale) a meno di 10 minuti, il secondo si ferma.
       In produzione 27 coppie di doppioni d'archivio, tutte vuote: si tolgono con Elimina socio.
5. [x] Conferme in una finestra sopra tutta la pagina (`chiedi()` in `shared.js`, sfondo scuro,
       Annulla già scelto, Esc = Annulla): Soci, Pagamenti ("Hai riscosso … da …?"), Assicurazione,
       Ruoli, Social. Le finestre già esistenti (chiusura stagione, utenti) con lo stesso stile.
6. [x] Impostazioni > Listino: colonna Assicurazione delle tessere (`prices.insurance`).
       Sito `ricerca/`: presciistica nella scheda del socio (l'A+ c'era già).
7. [x] Versione del sito in Gestione > Amministrazione: `web/versione.json`, riscritto dal workflow
       a ogni deploy (branch, commit, data del commit).
8. [x] Prova in produzione (08/10) dentro una transazione annullata: schema, doppio inserimento,
       nuovo abbonamento, gita, modifica importi e storico, totale a mano, eliminazione rifiutata e
       riuscita, ripristino SQL, direttivo invariato. Script in scratchpad, non nel repository.

### Ancora aperto
- [ ] Social: riprogettare le grafiche (sotto), proposta in `social/proposta-grafiche/`
- [ ] leggere `supabase/migration/cf-2026-09-30/warning-cf.md` (13 non trovati, 9 date diverse,
      73 codici fiscali che non passano il controllo)
- [ ] tag locale `2.1` diverso da quello su GitHub: capire quale è giusto prima di toccarlo
- [ ] facoltativo: ripubblicare la Edge Function `crea-utente`


## Social: riprogettare le grafiche per farle leggere meglio (richiesto il 2026-10-07)

Esempio: il post "Corso presciistica" (servizi, senza prezzo né foto). Nel biglietto bianco il testo
occupa una fascia al centro e sotto restano ~250 px vuoti; titolo 88 px, sottotitolo 34 px grigio in
maiuscolo, data 36 px: su un telefono, nel feed, si legge poco. Il riquadro "Servizi" in alto a
destra prende tanto spazio per dire solo la categoria; telefoni a 32 px in fondo, piccoli.

- **Perché succede**: `content()` in `web/social-templates.js` mette tutto attorno alla riga dei
  prezzi, fissa a `o.py` (450 nel post, 920 nella story), così il prezzo resta sempre nello stesso
  punto. Senza prezzo i dettagli salgono sotto il titolo e il resto del biglietto resta vuoto; con
  pochi dati (titolo + data) il vuoto è più grande. Vale per eventi, corsi, servizi, e per le gite
  senza quota o con poche partenze
- **Obiettivo**: il testo riempie il biglietto in base a quanto ce n'è. Titolo più grande quando è
  corto (fino a ~140 px, `data-fit` lo riduce se serve), data in evidenza (grande, nel colore della
  categoria, o nel bollo come le gite: oggi i servizi con data mostrano l'etichetta "Servizi" e la
  data in piccolo nel testo), informazioni a corpo leggibile (≥ 44 px nel post), contenuto
  distribuito in verticale (centrato o con spaziatura che cresce) invece che appeso al prezzo
- **Da provare**: foto/paesaggio più alto quando il testo è poco; bollo data uguale per tutti i
  tipi con data; telefoni più grandi (40-44 px) o su due righe quando sono due; sottotitolo non in
  maiuscolo grigio ma frase normale scura
- **Come**: fare prima 3-4 casi di prova (servizio con solo titolo e data, corso con 4 informazioni,
  gita con 3 partenze e quota, evento con prezzi adulti/ragazzi), metterli a confronto prima/dopo
  (come `social/confronto.html` nella storia di git) e scegliere; poi aggiornare `content()` /
  `disegnaPost()` per post e story. Tenere le regole che ci sono: fasce sicure di Instagram
  (`SAFE`) nella story, avviso "troppo lungo" di `fit()`, colori dai giorni di gita, contrasto
- **Test**: `node web/test-social.js` per le funzioni pure; per il disegno, screenshot dei casi di
  prova a 1080 px (playwright) da guardare prima di pubblicare


## Richieste del 2026-09-30 (testo originale)

> da stampare : per ordine alfabetico / per numero di tessera 
> per abbonamento sabato
> per abbonamento domenica
> per abbonamento martedì 
> per abbonametno jolly
> l'ordinamento deve essere raggriuppato per partenza ( asti / felizzano) e poi per ogni partenza ordnati alfabeticamente
>
> i campi da vedere in ordine sono : NUM TESSRA / COGNOME /NOME / LUOOGO NASCITA / TELEFONO 
>
> I fogli che l'assicuratore deve inviare sono quello in dati 26. Devono esserci tre liste separate per tipo di assicurazione
> la tessera nati prima del 47 hanno la stessa assicurazione di quelli base quinid sono da stampare
>
> nella pagina assicuratore non non sere il campo polizza e nemmeno nel database.
>
>
> nella pagina assicuratore l'excel dovrà poter scaricare tre fogli excel per i tipi di asscurazione ( sono 3 base / plus / sport).
> la struttura deve essere quella nei fogli delle liste, quando viene scaricato il foglio excel le persone che sono state scaricate devono risultare come asssicurate, in maniera da progredire settimanalmente
> la struttura del file ha la data decorrere da, deve essere inserito il campo data quando viene scaricato il file con la data odierna ( metti una label che ti dirà da quando partirà)
>
> nei fogli dei dati c'è una lista di persone / codice fiscale. questi sono corretti e devi controllare su supabase l'atttuale db e corregere i codici fiscali
>
> ultima richiesta : un socio si registra, paga il corso, fa solo due volte il corso decide di non fare più il corso, si può predisporre di segnare il rimborso di quanto ha pagato mettendo i lcampo da qualche parte? es pagamenti predisporre la possibilità di cambiare il totale dovuto e il totale pagato  e la lista di quando è stato modificato
>
> si può anche 
> sul salvataggio del socio il totale può essere editato quando vengono fatti gli sconti, segnalo da qualche parte che il conto è stato fatto a mano la modifica del totale

## Decisioni (30/09/2026, giro con il dev-team)

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
- Lavoro in autonomia (30/09 sera): un commit per funzione, schema in produzione con backup, push.


## Stato del lavoro (30/09/2026, sera)

### Fatto
- [x] Soci non direttivo iscritti oggi (COSSETTA Francesca, COSSETTA Gabriele, BALLATORE Mauro)
      rimessi in archivio come fa la chiusura stagione: anagrafica e CF restano, via tessera,
      abbonamenti, totale e pagato. Backup CSV in `supabase/migration/backup-2026-09-30/`
      (gitignored). Iscritti ora: 10, tutti direttivo.
      Attenzione: le righe migrate hanno created_at = 2000-01-01, "aggiunto oggi" si legge da
      enrolled_at / updated_at.

### Da controllare al ritorno
- [ ] leggere `supabase/migration/cf-2026-09-30/warning-cf.md`: 13 persone dei fogli non trovate,
      9 con data di nascita diversa, 73 codici dei fogli che non passano il controllo.
- [ ] provare sul sito vero: Stampe (sabato e domenica, martedì), Assicurazione con un account
      `assicurazione` (scarica, segna come inviata, annulla), Pagamenti (Modifica importi, Storico),
      totale a mano nel form Soci, "Nuovo abbonamento" dal telefono.
- [ ] tessere nuove nel listino: il tipo di assicurazione (`prices.insurance`) per ora si scrive
      solo dal database; se servono spesso, aggiungerlo al pannello Impostazioni.
- [ ] docker: resta un container di prova che non si riesce a fermare (`sudo systemctl restart docker`).

### Fatto, un commit per punto (schema in produzione e push già fatti)
1. [x] chore: `todo.md` unito qui e tolto (su Windows/Mac i due nomi erano lo stesso file).
2. [x] feat(corsi): giorno del corso sul socio. `members.course_day` (SABATO/DOMENICA, check),
       scelta "Corso sabato / Corso domenica" nel form Soci accanto al corso (obbligatoria se c'è un
       corso), azzerato da close_season. Un corso può essere di sabato o di domenica, a scelta del socio.
3. [x] feat(stampe): pagina `web/stampe.html` "Fogli dei soci" (permesso `gite`), voce "Stampe" nella
       barra e nelle pagine di ricerca. Tre pulsanti (Sabato, Domenica, Martedì) che SCARICANO fino a
       tre file Excel: Corsisti (sab/dom), Abbonamenti 5 gite di quel giorno e Jolly, solo quelli con
       qualcuno (il martedì niente corsi). In ogni file un foglio per partenza, in ordine alfabetico.
       Colonne: N. tessera / Cognome / Nome / Luogo di nascita / Telefono. `fogliDelGiorno()` e
       `nomeFoglioExcel()` in `web/stampe.js`, test `node web/test-stampe.js`.
4. [x] feat(gite): nel pannello gite del telefono "Nuovo abbonamento · pagato / da pagare" su
       tutte le schede (non solo chi non ha abbonamento), stesso giro di "Assegna": add_pass,
       coda offline, client_id.
5. [x] feat(soci): nel form Soci casella "già pagato" sulla riga dell'abbonamento aggiunto: somma
       il prezzo all'acconto sotto gli occhi dell'operatore (togliendo la spunta lo toglie);
       salvataggio invariato.
6. [x] feat(cf): `supabase/scripts/cf_dati26.py` (sola lettura) + correzione in produzione il 30/09:
       555 righe nei fogli, 540 codici; 70 righe del database aggiornate (7 riempite, 63 cambiate),
       447 già giuste. Backup e rapporto in `supabase/migration/cf-2026-09-30/` (fuori da git):
       **da leggere `warning-cf.md`**: 73 codici dei fogli che non passano il controllo (22 lasciati
       come nel database perché lì erano giusti: errori di battitura nei fogli), 13 persone non
       trovate, 9 con data di nascita diversa (non toccate).
7. [x] feat(assicurazione): schema + pagina (schema in produzione il 30/09). `prices.insurance` sulle
       tessere (riempito dal nome: direttivo e Global Sport → SPORT, Neve Plus → PLUS, Neve Base e
       scontata → BASE, NO ASSICURAZIONE → nessuna); tabella `insurance_lists` (numero unico per
       tipo e stagione) e `members.insurance_list_id`; funzioni `insurance_members`, `insurance_send`,
       `insurance_undo` (solo l'ultima del tipo), `insurance_sent_lists`, `insurance_list_members`,
       `set_tax_code` (al posto di `set_insurance`). Pagina: in alto "Liste da mandare" con i tre numeri progressivi (proposti, modificabili), una
       decorrenza per tutte, "Scarica gli Excel" (tutte le liste con qualcuno) e "Segna come assicurati"
       (tutte insieme, `insurance_send_all`, tutto o niente); lista unica dei da assicurare per tipo e
       in ordine alfabetico con la colonna Assicurazione,
       Excel come dati26 ("8 Lista Neve Base.xlsx"), "Segna come inviata" solo dopo lo scarico e solo
       per i soci del file, senza codice fiscale in rosso e fuori dalla lista, liste mandate con
       Riscarica e Annulla invio. Nuove tessere: il tipo si scrive a mano in `prices.insurance`
       (il pannello Impostazioni non lo mostra ancora).
8. [x] refactor(assicurazione): via il numero di polizza (produzione 30/09, backup in
       `supabase/migration/backup-2026-09-30/`: nessuna polizza era scritta). Tolti colonna
       `members.policy_number`, trigger `check_policy_number`, campo nel form Soci, colonna
       nell'Excel del Riepilogo; households non usa più `select *` (bloccava la rimozione).
9. [x] feat(pagamenti): totale a mano, rimborsi e storico (schema in produzione il 30/09).
       `members.total_manual` + casella "Totale scritto a mano" nel form Soci (non si ricalcola dal
       listino; un abbonamento aggiunto o tolto lo sposta del suo prezzo). `set_amounts()` per
       tesoriere e admin (permesso pagamenti) con motivo obbligatorio, dalla pagina Pagamenti
       ("Modifica importi"; rimborso = pagato più basso; un totale cambiato diventa "a mano").
       Storico `member_amount_changes` scritto dal trigger `log_amount_change` per ogni cambio di
       totale o pagato, con il motivo (incasso e abbonamenti dal telefono lo scrivono da soli);
       "Storico" in Pagamenti via `amount_history()`.
10. [x] feat(stile) dd56508: pulsanti ed etichette dei giorni uguali ovunque (`data-giorno`).
11. [x] feat(stile) e3a3b8a (01/10): filtri dei giorni in Gite pieni come i pulsanti di Stampe,
       quello scelto con anello e spunta.
12. [x] feat(stile) c5fcce8 (01/10): impianto unico delle pagine (linee guida sez. 6, mockup
       «Impianto delle pagine»): larghezza della barra (1180, 1280 superadmin), titolo + frase,
       `.cifre` e `.riquadro` in brand.css. Soci a riquadri, Pagamenti con Cerca e filtra,
       Riepilogo con riquadro Excel/stagioni chiuse, Social con anteprima a 320px accanto ai campi.
       Deploy verificato. Da guardare dal vivo: Social con un post vero a 1180px.
13. [x] feat(backup) d725867 (01/10): `.github/workflows/backup-db.yml`, mar/gio/sab 3:00 UTC,
       dump cifrato (gpg, frase in `supabase/.backup_passphrase`) tenuto 90 giorni. Ripristino
       provato in docker: conteggi uguali alla produzione.
       Secret impostati, frase copiata fuori dal PC, workflow anche su `dev` (22b1392: gli orari
       partono solo dal branch predefinito). Prima run a mano 01/10 riuscita, artifact decifrato.
       D'estate controllare che GitHub non sospenda l'orario (60 giorni senza commit).

Per ogni punto: test node, schema applicato due volte in docker (nomi container unici),
pagina provata nel browser con client finto (anche con A+ al massimo), poi commit.
Alla fine: chiedere l'ok per schema in produzione + push.

# Ripresa lavori — aggiornato il 2026-09-28 (2.5-SNAPSHOT)

## Fatto nella 2.5-SNAPSHOT (schema applicato in produzione il 2026-09-24)

- release **2.4** chiusa: branch e tag `2.4` su `f35797e`, workflow Pages su `["2.4", "2.5-SNAPSHOT"]`
- **ruoli per funzione** al posto della scala: `superadmin`, `admin`, `tesoriere`, `assicurazione`,
  `gite` (a schermo "Utente"), `social`. Permessi in `role_permissions()`, controllo `can()` in tutte
  le policy, `my_access()` per le pagine; niente più `ospite` e `kiosk` (account nuovo = senza riga
  profiles = senza accesso; `kiosk_search()` e la ricerca a parole intere tolte)
- tesoriere incassa senza modificare i soci (`settle_household` security definer); polizza scritta
  solo con il permesso polizze (trigger `check_policy_number`); pannello gite con `use_trip`,
  `cancel_trip`, `add_pass` security definer (il ruolo gite legge i soci ma non li modifica)
- **Vedi come** per il superadmin (`profiles.view_as`, `set_view_as()`), fascia gialla su ogni pagina
- **un solo ingresso**: la radice → login → pagina del ruolo (`PAGINE_DI_ARRIVO` in `web/shared.js`);
  `ricerca/` passa dallo stesso login; `next` accettato solo se è una pagina del sito
- pagina **Gestione** (Amministrazione, Utenti, Impostazioni, Vedi come) al posto delle tre voci rosse
- Riepilogo: entrate/uscite solo con il bilancio, link alle stagioni chiuse per chi ha lo storico
- **Social** (`web/social.html`, grafica C): post e story, calendario del mese, copertina FB, prezzo
  facoltativo, testo copiabile, pubblicato; **campagne sponsor** (tabella `sponsors`, formati collab,
  story con sticker link, grazie, copertina; UTM; avvertenza alcolici). Test `node web/test-social.js`
- `test_ruoli.sh` con la matrice ruoli × permessi (7 ruoli × 32 azioni), vedi come, passaggio 2.4→2.5
- Social, **giorni e colori delle gite** (tabella `trip_days`, una riga per giorno, colore vuoto = non è
  giorno di gita): riquadro in fondo alla pagina Social; il form della gita ha un calendario del mese al
  posto del campo data, con i giorni di gita colorati (gli altri si scelgono lo stesso, con avviso in
  rosso) e un pallino sui giorni che hanno già una gita. I colori valgono per post, story e calendario
  del mese; scritta bianca o blu scuro scelta dal contrasto
- Social, **contatti per post**: rubrica nella scheda Social > Contatti (`web/social-contatti.html`,
  tabella `social_contacts`: nome, telefono, orari facoltativi, ordine, "proposto" nei post nuovi); ogni
  post sceglie i suoi con una spunta (`social_events.contacts`, id in ordine). Stanno in fondo a post e
  story e nel testo da incollare; senza contatti la riga non c'è; troppo lunga si rimpicciolisce e poi
  l'anteprima avvisa. Un contatto tolto dalla rubrica esce dai post (trigger)
- Social a **schede colorate**: Post, Calendario del mese, Copertina Facebook, Sponsor, Giorni e colori
  delle gite (sezioni di `social.html`, scelte dall'indirizzo: `social.html#calendario`) e Contatti
  (`social-contatti.html`); ognuna col suo colore, piena quella aperta
- Social **riordinata** (2026-09-25, `77fd995`, proposta A dei mockup): tre schede Post, Grafiche,
  Impostazioni; elenco con un solo "+ Nuovo post", Da fare / Pubblicati, divisione per mese e stato
  Pronto / Da completare (`mancanti()` in `social-templates.js`); post con testata fissa (Salva) e
  anteprima fissa di lato con Post/Story, download, testo e Pubblicato; con A+ l'anteprima va sotto.
  `fit()` avvisa anche se partenze e scadenza finiscono sopra i telefoni della story. Vecchi indirizzi
  (`#calendario`, `#sponsor`, ...) portano alla scheda nuova. Solo pagine, schema invariato
- **Ritocchi del giro dell'app** (2026-09-28, solo pagine, schema invariato; provati nel browser con un
  client finto, mockup di Soci saltato su richiesta):
  - Soci: ricerca sempre in cima; fascia fissa sotto la barra "Nuovo socio" (gialla) / "Stai
    modificando: Cognome Nome · tessera N" (blu) con l'indice delle sezioni e "Nuovo socio"; nome sul
    pulsante Salva. Fotografia del modulo (`firma()`): "Nuovo socio", aprire un altro socio e uscire
    dalla pagina chiedono se ci sono modifiche. **Doppioni**: lasciando cognome, nome, data o codice
    fiscale di un socio nuovo, e di nuovo al salvataggio, si cerca in tutto l'archivio lo stesso codice
    fiscale o lo stesso cognome e nome (con la stessa data, o senza data in archivio): "Apri questa
    scheda" o "No, è un'altra persona", senza risposta non si salva. "Chi paga: da sé / un familiare"
    al posto del campo spento; "un familiare" senza nome scelto non si salva più come "da sé"
  - Pagamenti: "Cerca una famiglia" (per il nome di chiunque del nucleo), "1 nucleo", "1 familiare"
  - Bilancio: Entrata / Uscita due pulsanti grandi verde e rosso, nessuno scelto all'inizio
  - Social: rubrica Contatti dentro Impostazioni (`social.html#contatti`), `social-contatti.html` è un
    rimando; i riquadri di Impostazioni non restano più sopra il modulo aperto
  - Tutte: `chiedi()` in `shared.js`; link e pulsanti `is-link is-outlined` nel blu del club; pulsanti
    `is-small` a pillola

## Produzione (2026-09-24)

- backup CSV delle tabelle preso prima nella scratchpad della sessione; `schema.sql` applicato in una
  transazione, dopo una prova con rollback sui dati veri. Account: un superadmin e un admin (resta
  admin, senza Bilancio: deciso così); nessun utente/ospite/kiosk da spostare
- pagine della 2.5 pubblicate lo stesso giorno (deploy da `2.5-SNAPSHOT`, `d95fca7`)
- 2026-09-25: tabella `social_contacts` applicata dall'SQL Editor
- 2026-09-25: contatti per post (`supabase/applica_contatti_per_post.sql`) applicati dall'SQL Editor

## Da fare
- inserire i contatti veri in Social > Contatti e spuntarli nei post
- caricare lo sponsor 958 Santero dalla pagina Social (loghi in `social/santero/`) e la sua campagna
- facoltativo: ripubblicare la Edge Function `crea-utente` (la versione nel repository non assegna
  più ruoli); quella pubblicata funziona lo stesso

## Dopo il giro dell'app: cosa resta

- Social: confermare con chi pubblica la regola di "Da completare" (gita: meta, giorno, partenze,
  quota se mostrata, scadenza; cena e gara: data; campagna: sponsor; corso e servizi: solo il titolo).
  Story troppo lunga: c'è solo l'avviso, il testo non si rimpicciolisce
- Doppioni in Soci, limiti noti: due operatori che salvano la stessa persona nello stesso momento
  passano entrambi; "D'ANGELO" non trova "DANGELO". I doppioni già in archivio (5.778 schede) restano:
  manca uno strumento per unire due schede della stessa persona (chi lo fa, con quali regole)
- Provare sul sito vero Soci con i dati reali (ricerca doppioni su tutto l'archivio, A+ al massimo)

## Proposte Social (da decidere)

- **Pubblicare su Facebook e Instagram dal sito** (piano del 2026-09-28, complessità medio-alta,
  ~12-18 ore più i tempi di Meta). Prima di tutto chiedersi se serve: con 2-4 post a settimana il giro
  "scarica, copia, pubblica" costa 1-2 minuti, e Meta Business Suite pubblica già su tutti e due in un
  colpo (basterebbe un pulsante "Apri Business Suite", zero codice). Se si fa:
  - **Fase 0, senza codice, qui si ferma se si ferma**: account Instagram professionale (Business o
    Creator) collegato alla Pagina Facebook del club; app su developers.facebook.com (tipo Business)
    con chi pubblica come admin/tester, così bastano i permessi "Standard Access" senza App Review
    (verificare sulle regole Meta di oggi: può chiedere la verifica dell'attività); permessi
    `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`, `instagram_basic`,
    `instagram_content_publish`; una pagina con l'informativa privacy; prova a mano con Graph API
    Explorer su una Pagina e un account di prova
  - **Schema**: tabella `social_accounts` (id Pagina, token della Pagina che non scade, id Instagram)
    con RLS e nessuna regola per il browser, stato letto da una funzione che mostra solo nomi e data;
    `social_events` + `fb_post_id`, `ig_media_id`, `ig_permalink`; bucket Storage pubblico per le
    immagini (Instagram le scarica da un indirizzo pubblico, solo JPEG)
  - **Edge Function `collega-meta`**: login OAuth con redirect (niente SDK Facebook nella pagina),
    `state` legato all'utente, scambio dei token con l'app secret (secret di Supabase, mai nel
    browser), scelta Pagina e Instagram, ritorno a `social.html#impostazioni`
  - **Edge Function `pubblica-social`** (come `crea-utente`: CORS, controllo del chiamante e del
    permesso `social`): Facebook `POST /{page}/photos`; Instagram `POST /{ig}/media` → attesa →
    `media_publish`; story facoltativa; esito per piattaforma, poi `published_at` e i link
  - **Pagina**: riquadro "Account social" in Impostazioni (collegato / da ricollegare); nel post
    spunte Instagram, Facebook, Story e "Pubblica ora" con conferma (`chiedi()`): è pubblico e non si
    annulla. Il giro a mano resta
  - **Limiti**: lo sticker link della story non si mette da API (quella story resta a mano); il token
    cade se si cambia password o si revoca l'accesso ("ricollega"); Meta chiude le versioni vecchie
    delle API ogni ~2 anni (versione in una costante); campagne sponsor a mano nella prima versione
  - **Da decidere**: Business Suite o API; story da API senza link; chi collega l'account

---

# Ripresa lavori — aggiornato il 2026-09-24

## Fatto nella 2.4-SNAPSHOT (schema applicato in produzione il 2026-09-24)

- validatore del codice fiscale (`web/codicefiscale.js`, test `node web/test-codicefiscale.js`):
  avviso sotto il campo con il codice proposto, non blocca il salvataggio; il comune di nascita
  non si verifica (solo la forma)
- numero tessera proposto nel form Soci = il più alto numerico + 1 (`next_card_number()`), vincolo
  `members_card_number_key` (unico nella stagione, la chiusura lo azzera); se il proposto è stato
  preso da un altro operatore la pagina ne propone un altro
- più abbonamenti gite per socio, anche di giorni diversi: tabella `member_passes`,
  `trip_uses.pass_id`, viste `pass_status` (per abbonamento) e `trip_passes` (per socio, con
  `days`); `members.pass_type` è un riassunto scritto dal trigger `sync_pass_type`;
  `use_trip(member_id, client_id, day)` scala dal giorno scelto, poi JOLLY, poi il più vecchio;
  `add_pass()` per il pannello gite; Riepilogo e chiusura contano gli abbonamenti venduti
- ruolo `assicurazione` (vede solo `web/assicurazione.html`): tesserati senza polizza, CF e
  polizza modificabili, ricerca per correggere anche i già assicurati (`insurance_search()`, al
  massimo 20 risultati), Excel "da assicurare". L'Excel di **tutti** i soci della stagione sta nel
  Riepilogo e l'assicurazione non può scaricarlo (il database non glielo dà). Voce Assicurazione
  nella barra da assicurazione in su: per starci, la barra del superadmin usa tutta la larghezza
  e il testo a 17px
- creazione account: la pagina Utenti crea sempre come `ospite` e poi assegna il ruolo scelto, così
  un ruolo nuovo non richiede di ripubblicare la Edge Function
- pannello Utenti: gli account rimossi restano in fondo "senza accesso" (`accounts_without_role()`),
  con **Riattiva** (`restore_account()`) ed **Elimina per sempre** (`delete_account()`, cancella
  da auth.users); ricreare un'email rimossa la riattiva invece di dare "esiste già"
- Impostazioni: la riga del listino o delle partenze modificata e non salvata diventa gialla con
  "Salva modifiche"; lasciando la pagina con modifiche non salvate il browser chiede conferma
- superadmin: "Togli dalla stagione" nella pagina Soci (`remove_from_season()`), si ferma se il
  socio paga per dei familiari o ha gite segnate
- backup CSV di produzione preso prima dello schema nella scratchpad della sessione

## Da fare subito

- **TODO(assicurazione): tracciato dell'Excel** da definire con le specifiche dell'assicurazione:
  `COLONNE_ASSICURAZIONE` in `web/shared.js` (ora colonne provvisorie), usate sia dalla pagina
  Assicurazione sia dal Riepilogo. Se servono campi nuovi, aggiungerli a `insurance_members()` in
  `supabase/schema.sql` e alla select di `scaricaSoci()` in `web/riepilogo.html`
- facoltativo: ripubblicare la Edge Function `crea-utente` (`supabase login` e `supabase functions
  deploy crea-utente`) perché la sua lista di ruoli nel repository conosce `assicurazione`. Non
  serve più per creare gli account (vedi sopra)
- provare sul sito con i dati reali: numero tessera proposto, secondo abbonamento, pannello gite
  sul telefono con due abbonamenti, pagina Assicurazione con un account `assicurazione`
- dopo un eventuale caricamento da Excel (`generate_migration.py`) rilanciare `schema.sql`: crea
  le righe di `member_passes` dagli abbonamenti scritti nella colonna del socio

---

# Ripresa lavori — 2026-09-23

## Fatto nella 2.3 (committato, pushato, online)

- leggibilità (5b00869), fix barra Totale/Residuo (a4674d3), listino a
  righe grandi e barra in maiuscolo (8ed7e3b), Riepilogo più grande con
  somma di sezione in evidenza (d4638ad), pulsante A+ e listino dal prezzo
  più basso (0d77244)
- presciistica aggiuntiva: categoria PRESCIISTICA nel listino e colonna
  members.preski_type, scelta propria nella pagina Soci, sezione propria
  nel Riepilogo (anche per le stagioni chiuse, categoria PRESKI dello
  storico), fuori dall'incasso corsi; close_season la archivia e la azzera.
  Schema applicato in produzione il 2026-09-23: nessun socio da spostare,
  spostata la sola voce di listino (id 18). Backup CSV di prices e members
  preso prima nella scratchpad della sessione.

## Da fare

- 2.4-SNAPSHOT: funzioni social e campagne Santero. Piano già presente in
  `docs/PIANO_2.3_SOCIAL.md` (da rinominare o aggiornare per la 2.4?).
  Loghi Santero in `social/santero/`; il prototipo `campagna.html` e `export/`
  cancellati l'08/10 (non servivano).
- provare sul sito con i dati reali: righe del listino e ordine per prezzo,
  presciistica insieme a un abbonamento, totali della pagina Soci,
  Riepilogo, pulsante A+
- il tag locale `2.1` è diverso da quello su GitHub (`git fetch --tags` lo
  rifiuta): capire quale dei due è giusto
- docker su questa macchina non riesce a fermare i container ("could not
  kill container: permission denied", probabile AppArmor): restano accesi
  `scdb-test-presci`, `scdb-test-presci-<pid>`, `scdb-test-ruoli`. Si
  tolgono dopo `sudo systemctl restart docker` (o un riavvio) con
  `docker rm -f`
- il pulsante A+ c'è solo nel gestionale (`web/`), non nel sito di
  ricerca (`ricerca/`): aggiungerlo se serve
- il sito di ricerca non mostra la presciistica nella scheda del socio
  (mostra solo l'abbonamento): aggiungerla se serve

---

  Storico aggregato + schema tutto in inglese                                                                                                                                                                           
                                                                                                                                                                                                                           
     Contesto                                                                                                                                                                                                              
                                                                                                                                                                                                                           
     Due problemi emersi dopo la chiusura della prima stagione.                                                                                                                                                            
                                                                                                                                                                                                                           
     Lo storico duplica l'anagrafica. soci_storico conserva una riga per ogni                                                                                                                                              
     socio di ogni stagione chiusa: 17 colonne ricopiate da soci, cioè migliaia di                                                                                                                                         
     righe che crescono di un blocco intero a ogni chiusura. Della stagione passata                                                                                                                                        
     al direttivo servono cinque numeri (stagione, soci, quote, incassato, da                                                                                                                                              
     incassare) più i conteggi per tipologia che oggi si vedono nel Riepilogo. Il                                                                                                                                          
     resto è l'anagrafica, che non se ne va da nessuna parte perché i soci restano                                                                                                                                         
     in tabella.                                                                                                                                                                                                           
                                                                                                                                                                                                                           
     I nomi nel database sono metà in italiano e metà in inglese: soci ha                                                                                                                                                  
     created_at accanto a cognome, payer_id accanto a numero_polizza. Va                                                                                                                                                   
     uniformato all'inglese.                                                                                                                                                                                               
                                                                                                                                                                                                                           
     Decisioni prese con l'utente:                                                                                                                                                                                         
                                                                                                                                                                                                                           
     - si ricrea il database da zero e si reimportano i dati dall'Excel, invece di                                                                                                                                         
       rinominare in place;                                                                                                                                                                                                
     - l'inglese si ferma al database: variabili JS, nomi di funzione delle pagine e                                                                                                                                       
       testi a schermo restano in italiano;                                                                                                                                                                                
     - lo storico conserva i cinque totali più i conteggi per tipologia, così il                                                                                                                                           
       Riepilogo di un anno passato resta consultabile.                                                                                                                                                                    
                                                                                                                                                                                                                           
     ▎ Da sapere prima di partire. Ricreare il database cancella tutto quello che                                                                                                                                          
     ▎ è stato inserito dopo la migrazione: soci aggiunti dalle pagine, acconti                                                                                                                                            
     ▎ registrati, gite segnate, la stagione già archiviata. Torna solo ciò che sta                                                                                                                                        
     ▎ nel foglio new_structure/SOCI 2026.xlsx. Va verificato che non ci sia                                                                                                                                               
     ▎ lavoro recente da perdere.    
                                                                                                                                                                                                                              
     Cosa cambia nel database                                                                                                                                                                                              
                                                                                                                                                                                                                           
     Storico: due tabelle leggere al posto della copia dell'anagrafica                                                                                                                                                     
                                                                                                                                                                                                                           
     soci_storico sparisce. Al suo posto:                                                                                                                                                                                  
                                                                                                                                                                                                                           
     - season_history — una riga per stagione chiusa: season (chiave, il 1°                                                                                                                                                
       settembre), members, total, collected, outstanding, closed_at.                                                                                                                                                      
       Chiudere due volte la stessa stagione somma sui valori esistenti (on conflict do update), così resta una riga per anno.                                                                                             
     - season_breakdown — i conteggi per tipologia, poche decine di righe per                                                                                                                                              
       stagione: season, category (CARD / PASS / COURSE / DEPARTURE),                                                                                                                                                      
       label, day (valorizzato solo per le partenze, altrove stringa vuota),                                                                                                                                               
       count, total (solo per le tessere). Unica per (season, category, label, day).                                                                                                                                       
                                                                                                                                                                                                                           
     close_season() legge le viste di riepilogo — che filtrano già sulle righe che                                                                                                                                         
     sta per azzerare — scrive le due tabelle e poi svuota, tutto nella stessa                                                                                                                                             
     transazione. La tabella temporanea da_chiudere resta: garantisce che                                                                                                                                                  
     aggregato e azzeramento coprano le stesse righe, e dà all'UPDATE il WHERE che                                                                                                                                         
     Supabase pretende (estensione safeupdate).                                                                                                                                                                            
                                                                                                                                                                                                                           
     La vista stagioni_chiuse non serve più: la tabella è il record.                                                                                                                                                       
                                                                                                                                                                                                                           
     Nomi: mappa completa                                                                                                                                                                                                  
                                                                                                                                                                                                                           
     I valori restano italiani (TESSERA, SABATO, Abbonamento 5 viaggi JOLLY…): arrivano dal foglio Excel e il front-end ci fa già il codice colore.                                                                        
     Cambiano solo gli identificatori.                                                                                                                                                                                     
                                                                                                                                                                                                                           
     Tabelle                                                                                                                                                                                                               
                                                                                                                                                                                                                           
     ┌──────────────┬────────────────────────────────────────────┐                                                                                                                                                         
     │     oggi     │                   domani                   │                                                                                                                                                         
     ├──────────────┼────────────────────────────────────────────┤                                                                                                                                                         
     │ soci         │ members                                    │                                                                                                                                                         
     ├──────────────┼────────────────────────────────────────────┤                                                                                                                                                         
     │ prezzi       │ prices                                     │                                                                                                                                                         
     ├──────────────┼────────────────────────────────────────────┤                                                                                                                                                         
     │ partenze     │ departures                                 │   
       ├──────────────┼────────────────────────────────────────────┤                                                                                                                                                         
     │ gite_usate   │ trip_uses                                  │                                                                                                                                                         
     ├──────────────┼────────────────────────────────────────────┤                                                                                                                                                         
     │ soci_storico │ rimossa → season_history, season_breakdown │                                                                                                                                                         
     └──────────────┴────────────────────────────────────────────┘                                                                                                                                                         
                                                                                                                                                                                                                           
     Colonne di members                                                                                                                                                                                                    
                                                                                                                                                                                                                           
     data_iscrizione→enrolled_at, numero_polizza→policy_number,                                                                                                                                                            
     cognome→last_name, nome→first_name, luogo_nascita→birth_place,                                                                                                                                                        
     provincia_nascita→birth_province, codice_fiscale→tax_code,                                                                                                                                                            
     data_nascita→birth_date, indirizzo→address, citta→city,                                                                                                                                                               
     provincia→province, cap→postal_code, telefono→phone,                                                                                                                                                                  
     tipologia_tessera→card_type, agevolazioni_famiglia→family_discount,                                                                                                                                                   
     tipo_abbonamento→pass_type, partenze_sabato→saturday_departure,                                                                                                                                                       
     partenza_domenica→sunday_departure, tipologia_corso→course_type,                                                                                                                                                      
     totale→total, acconto→paid, saldo→balance,                                                                                                                                                                            
     numero_tessera→card_number, note→notes.                                                                                                                                                                               
     Restano: id, created_at, updated_at, legacy_id, legacy_payer_id,                                                                                                                                                      
     email, payer_id.                                                                                                                                                                                                      
                                                                                                                                                                                                                           
     Altre colonne                                                                                                                                                                                                         
                                                                                                                                                                                                                           
     prices: categoria→category, nome→name, prezzo→price,                                                                                                                                                                  
     attivo→active, viaggi→trips, giorno→day.                                                                                                                                                                              
     departures: giorno→day, luogo→place, attivo→active.                                                                                                                                                                   
     trip_uses: socio_id→member_id, stagione→season,                                                                                                                                                                       
     data_gita→trip_date, registrato_il→logged_at.                                                                                                                                                                         
                                                                                                                                                                                                                           
     Viste                                                                                                                                                                                                                 
                                                                                                                                                                                                                           
     nuclei_familiari→households, riepilogo_stagione→season_totals,                                                                                                                                                        
     riepilogo_tessere→card_counts, riepilogo_abbonamenti→pass_counts,                                                                                                                                                     
     riepilogo_corsi→course_counts, riepilogo_partenze→departure_counts,                                                                                                                                                   
     stagioni_aperte→open_season, abbonamenti_gite→trip_passes.                                                                                                                                                            
                                                                                                                                                                                                                           
     Funzioni (con i parametri, che fanno parte dell'API RPC)                                                                                                                                                              
                                                                                                                                                                                                                           
     stagione_di(quando)→season_of(moment),                                                                                                                                                                                
     stagione_corrente()→current_season(),                                                                                                                                                                                 
     chiudi_stagione(conferma)→close_season(confirmation),                                                                                                                                                                 
     salda_nucleo(capofamiglia)→settle_household(head_id),       
      usa_gite(socio)→use_trip(member_id),                                                                                                                                                                                  
     annulla_gita(gita)→cancel_trip(trip_id),                                                                                                                                                                              
     prezzi_deduci_abbonamento()→fill_pass_details().                                                                                                                                                                      
     Indici, vincoli e policy seguono i nomi delle rispettive tabelle.                                                                                                                                                     
                                                                                                                                                                                                                           
     La frase di conferma della chiusura resta CHIUDI STAGIONE: la scrive a                                                                                                                                                
     mano un volontario italiano, non è un identificatore.                                                                                                                                                                 
                                                                                                                                                                                                                           
     File                                                                                                                                                                                                                  
                                                                                                                                                                                                                           
     supabase/reset_legacy.sql (nuovo, da lanciare una volta sola) — elimina                                                                                                                                               
     gli oggetti con i nomi italiani (drop table … cascade, drop function,                                                                                                                                                 
     drop view), tutto con if exists così è innocuo su un database già pulito.                                                                                                                                             
     Sta in un file separato e non dentro schema.sql: una drop table members in                                                                                                                                            
     uno script che si rilancia ogni volta è una mina.                                                                                                                                                                     
                                                                                                                                                                                                                           
     supabase/schema.sql — riscritto con i nomi nuovi. Resta rieseguibile                                                                                                                                                  
     (create table if not exists, create or replace, alter … if exists) e                                                                                                                                                  
     mantiene la struttura attuale: tabelle di configurazione, members, sezione di                                                                                                                                         
     aggiornamento per database esistenti, stagione, viste, chiusura, incassi,                                                                                                                                             
     abbonamenti, RLS. Sparisce il blocco soci_storico, entrano season_history e                                                                                                                                           
     season_breakdown. Il trigger fill_pass_details sul listino resta com'è: si                                                                                                                                            
     lancia prima del caricamento dati e deve continuare a riempire trips/day                                                                                                                                              
     riga per riga.                       
      supabase/scripts/generate_migration.py — genera le INSERT con i nomi                                                                                                                                                  
     nuovi: ~198 riferimenti, sostituzione meccanica sulla mappa qui sopra. È da qui                                                                                                                                       
     che escono i file di supabase/migration/, che vanno rigenerati.                                                                                                                                                       
                                                                                                                                                                                                                           
     supabase/verifica.sql — stessi nomi nuovi nelle query di controllo (33                                                                                                                                                
     riferimenti). Il nome del file resta italiano: non è un identificatore di                                                                                                                                             
     database.                                                                                                                                                                                                             
                                                                                                                                                                                                                           
     Front-end — solo i riferimenti a tabelle, colonne, viste e RPC:                                                                                                                                                       
                                                                                                                                                                                                                           
     - web/index.html — il form: select, insert, update su members, più                                                                                                                                                    
       gli id dei campi che oggi rispecchiano le colonne;                                                                                                                                                                  
     - web/admin.html — households, members, settle_household;                                                                                                                                                             
     - web/riepilogo.html — le cinque viste di riepilogo;                                                                                                                                                                  
     - web/stagione.html — open_season, season_history, close_season, più il                                                                                                                                               
       dettaglio per tipologia (sotto);                                                                                                                                                                                    
     - web/shared.js — caricaPrezzi(), caricaPartenze(), ascoltaSoci(),                                                                                                                                                    
       saldoDi(), totaliNucleo();                                                                                                                                                                                          
     - ricerca/index.html — la costante CAMPI e la scheda del socio;                                                                                                                                                       
     - ricerca/gite.html — trip_passes, trip_uses, use_trip, cancel_trip.                                                                                                                                                  
                                                                                                                                                                                                                           
     Non si toccano: ricerca/comune.js e ricerca/test-ricerca.js (lavorano su                                                                                                                                              
     testo, non su colonne), ricerca/stile.css, web/brand.css, i testi a schermo.                                                                                                                                          
                                                                                                                                                                                                                           
     Documentazione — README.md (struttura e sezione «Chiudere la stagione»),                                                                                                                                              
     docs/MIGRAZIONE_2.0.md (ordine dei passi, con reset_legacy.sql prima di                                                                                                                                               
     schema.sql), docs/DOCUMENTAZIONE.md (la tabella colonna-foglio → colonna-DB).  
                                                                                                                                                                                                                            
     Dettaglio per tipologia nella pagina Amministrazione                                                                                                                                                                  
                                                                                                                                                                                                                           
     La tabella «Stagioni chiuse» resta com'è. Ogni riga guadagna un pulsante                                                                                                                                              
     Dettaglio che carica season_breakdown per quella stagione e la mostra                                                                                                                                                 
     sotto, raggruppata in Tessere / Abbonamenti / Corsi / Partenze — la stessa                                                                                                                                            
     lettura del Riepilogo, ma di un anno archiviato. Si riusa il meccanismo già                                                                                                                                           
     presente in ricerca/gite.html (apriRegistro): una zona vuota sotto la riga                                                                                                                                            
     che viene riempita al primo clic e svuotata alla chiusura.                                                                                                                                                            
                                                                                                                                                                                                                           
     Verifica                                                                                                                                                                                                              
                                                                                                                                                                                                                           
     1. Database, su Postgres in Docker (come per le modifiche precedenti):                                                                                                                                                
        applicare reset_legacy.sql e schema.sql su un database che contiene già                                                                                                                                            
        gli oggetti italiani, verificare che non resti nulla del vecchio schema;                                                                                                                                           
        quindi caricare qualche riga di prova e controllare che                                                                                                                                                            
        - close_season('CHIUDI STAGIONE') scriva una riga in season_history e                                                                                                                                              
          le righe attese in season_breakdown, e azzeri le colonne di stagione                                                                                                                                             
          lasciando intatta l'anagrafica;                                                                                                                                                                                  
        - una seconda chiusura nella stessa stagione sommi invece di duplicare;                                                                                                                                            
        - settle_household, use_trip e cancel_trip continuino a funzionare, con                                                                                                                                            
          il rifiuto su abbonamento esaurito;                                                                                                                                                                              
        - una chiusura a vuoto non scriva niente.                                                                                                                                                                          
     2. node ricerca/test-ricerca.js — deve restare verde (non tocca il DB, ma                                                                                                                                             
        gira in CI e va confermato).                                                                                                                                                                                       
     3. Pagine, in locale con i soliti stub: web/stagione.html (storico +                                                                                                                                                  
        dettaglio per tipologia), web/admin.html, web/index.html,                                                                                                                                                          
        ricerca/index.html, ricerca/gite.html.                                                                                                                                                                             
     4. Su Supabase, nell'ordine: reset_legacy.sql → schema.sql →                                                                                                                                                          
        python3 supabase/scripts/generate_migration.py "new_structure/SOCI 2026.xlsx"                                                                                                                                      
        → i file di supabase/migration/ in ordine → verifica.sql.                                                                                                                                                          
     5. Commit e push su 2.0 dopo conferma, poi controllo del workflow Pages e                                                                                                                                             
        delle pagine pubblicate.                                                                                                                                                                                           
                                                                              