# TODO — aggiornato il 2026-10-23

> Le richieste nuove si scrivono qui in cima, in "Richieste nuove". Quando una cosa è fatta si
> toglie subito: la storia resta nei commit (`git log`). Come si lavora: `docs/SVILUPPO.md`.

## Stato del repository (27/10/2026)

- Online `3.0-SNAPSHOT` (stile Material, menu a colonna, tema scuro, telefono), `dev` allineato a
  lui; niente tag 3.0 (tolto: si resta su `3.0-SNAPSHOT`). La 2.9 è nel tag `2.9`. Su GitHub
  restano i branch `2.9` e `2.9-SNAPSHOT`, già dentro il tag: cancellarli lo fa l'utente
  (`git push origin --delete refs/heads/2.9 refs/heads/2.9-SNAPSHOT`, a Claude il comando è
  bloccato dai permessi).
- Produzione: lo schema intero ci mette qualche minuto e tiene fermo il sito; di giorno solo le
  istruzioni nuove con `lock_timeout` (`docs/SVILUPPO.md`).
- Backup: dump cifrato e `dati-AAAA-MM-GG.7z` per Excel, su GitHub, sul PC del club (timer
  `sciclub-backup`, cartella `~/Backup/sciclub-donbosco`) e, quando attivato, su Google Drive:
  `docs/BACKUP.md`.
- Da dove ripartire: `PROJECT-CONTEXT.md`, poi questo file, poi `docs/SVILUPPO.md`.

## Richieste nuove

- [ ] **Doppioni dei soci (28/10): fatto il grosso, restano controlli dell'utente.** 30 doppioni
      eliminati o uniti in produzione, archiviati in `member_deletions`. Cosa controllare (una
      scheda eliminata forse di un'altra persona, 7 codici fiscali da correggere con la tessera)
      in `supabase/migration/doppioni-2026-10-28/DA-CONTROLLARE.md`, fuori da git perché ha nomi
      di soci: qui niente dati personali, il repository è pubblico.

- [ ] **Social: menu «Campagne» per gli sponsor, immagini degli sponsor, inserzioni Meta** (28/10,
      da pianificare: il piano qui sotto è una bozza, aspetta il sì dell'utente).
      Richiesta: le campagne sponsor crescono. Oltre alle storie col logo, servono post con
      immagini fornite dallo sponsor (es. BMW lancia un'auto nuova e manda la foto da condividere).
      Separarle dai post Instagram di gite ed eventi con una voce sua in Social. Poi pubblicità
      mirate con Facebook/Meta Ads: tenere traccia delle spese e preparare i contenuti da caricare
      nell'app Inserzioni di Meta. Per la grafica dei post con immagini di terzi brandizzate usare
      `/ui-ux-pro-max:design` (prima abbozzo piccolo, vedi memorie sulle grafiche).
      Oggi: le campagne sono `social_events.kind = 'sponsor'` (`supabase/schema.sql:3379`), dentro
      la scheda Post insieme a gite/corsi/cene (`web/social.html:257`, «Campagna sponsor»); gli
      sponsor (nome, livello, url, handle, loghi, colori) sono nella tabella `sponsors`, gestiti in
      Social > Impostazioni (`web/social.html:500`); link con UTM già pronti (`social.html:1367`).
      Bozza di piano:
      1. Voce «Campagne» nel gruppo Social del menu (`social.html#campagne`): elenco dei soli post
         `sponsor`, filtrabile per sponsor; la scheda Post resta per gite ed eventi. Stessa tabella,
         nessun dato da spostare.
      2. Immagine dello sponsor nel post: campo per caricarla (come la foto dei post) e modelli
         nuovi (feed 1080×1350, storia 1080×1920) con l'immagine intera e una cornice/fascia del
         club e del logo sponsor, senza coprire o ritoccare l'immagine (le regole del marchio di
         molti sponsor lo vietano: da chiedere allo sponsor). Disegno con `/ui-ux-pro-max:design`.
      3. Inserzioni Meta, per campagna: testi entro i limiti di Meta (testo principale ~125
         caratteri visibili, titolo ~40, descrizione ~30), invito all'azione, link UTM, immagini
         esportate nei formati delle inserzioni (1080×1080, 1080×1350, 1080×1920): una scheda
         «da copiare in Gestione inserzioni».
      4. Spese: budget, date, speso e risultati (copertura, clic) per campagna; la spesa anche in
         Bilancio come voce di uscita («Pubblicità Meta»), così entra nei conti della stagione.
      Da decidere con l'utente: chi carica le immagini (social o anche admin), se la spesa va
      solo in Bilancio o anche nella campagna, se lo sponsor rimborsa le inserzioni (entrata).
      Rischi: diritti delle immagini di terzi (usarle solo come lo sponsor permette); peso delle
      foto nel database (oggi la foto dei post sta in `social_events`, nessun bucket storage).

- [ ] **Menu che lampeggia: provare sul sito** (27/10, online `2a27fc6`). Corretto: una graffa
      in più in `brand.css` scartava la regola che mostra subito le voci; il menu ora ha la sua
      transizione fra pagine e resta fermo; email, ruolo, nomi scelti in Gestione > Ruoli
      («Fogli pullman») e nome della pagina ci sono prima del primo disegno; logo della barra con
      larghezza fissa (in Firefox saltava). Prova: Ctrl+Shift+R, poi cambiare voce più volte.
      Chrome/Edge/Safari: menu fermo, sfuma solo il contenuto. Firefox 158 la transizione non ce
      l'ha: la pagina cambia come prima, ma barra e menu restano uguali. Se lampeggia ancora si
      passa al piano B: `app.html` con barra e menu disegnati una volta e le pagine dentro un
      iframe (da gestire: indirizzo e tasto Indietro, link fra pagine, login/uscita fuori dal
      riquadro, tema e A+, fasce fisse, menu del telefono).
- [ ] **Pubblicare la funzione Edge `crea-utente`** (tocca all'utente: su questo PC non c'è la CLI
      `supabase`): `supabase functions deploy crea-utente`, oppure dalla dashboard (Edge
      Functions > crea-utente, incollare `supabase/functions/crea-utente/index.ts`). Novità: il
      permesso si legge con `my_access()` e il token di chi chiama, quindi un superadmin con la
      password iniziale ancora da cambiare o in «vedi come» non crea account. Finché non è
      pubblicata, online gira la vecchia: funziona come prima.
- [ ] **Da decidere: «soci» senza «pagamenti»**. Oggi chi ha il permesso soci scrive anche il
      versato (campo Acconto del form Soci, colonna `paid`); lo storico lo registra, senza motivo.
      Con i ruoli di partenza non cambia niente (admin li ha tutti e due). Un ruolo con soci ma
      senza pagamenti deve poter scrivere il versato? Se no: trigger che rifiuta il cambio di
      `paid` senza `pagamenti` e campo Acconto spento nel form.
- [ ] **Da decidere: utente `monitor`** (audit 27/10). In produzione c'è ancora, con `bypassrls`
      e `pg_read_all_data`: legge tutto, anche `auth.users` con gli hash delle password. Lo usa
      `supabase/scripts/controlli.sh`; il suo script (`crea_monitor.sql`) dice «togliere a fine
      campagna». Toglierlo, o limitarlo alla lettura delle tabelle di `public`.
- [ ] **Da controllare nella dashboard Supabase**: registrazione libera spenta (Authentication >
      «Allow new users to sign up», vedi `docs/ACCOUNT.md`). Dal repository non si vede. Se fosse
      accesa, chi si registra non vede niente (nessun ruolo), ma l'account resta.

- [ ] **Codice in inglese** (27/10, l'utente: «voglio tutto in inglese, dove non causa problemi
      con il db»; scelto: nomi e commenti; avviato su `3.0-SNAPSHOT`). Circa 24.500 righe: 410
      funzioni, 780 variabili, 300 classi CSS, 320 id. Restano in italiano: le scritte per gli
      utenti; i valori del database (permessi `soci`/`pagamenti`/…, ruoli, giorni `SABATO`…,
      categorie `TESSERA`…, chiavi di `nav_labels`); le chiavi di localStorage (`sciclub-*`: le
      preferenze di chi usa il sito); i nomi delle pagine e la cartella `ricerca/` (indirizzi nei
      segnalibri). Passi, ognuno con tutte le prove verdi e un commit:
      1-2. FATTO il 27/10 (commit `7ac20ce`): 9.128 nomi di variabili e funzioni tradotti in tutti
         i file JS/HTML/prove con lo strumento nello scratchpad della sessione (`traduci/`:
         `tok.py`, `rinomina.py`, `glossario.json` 1.096 nomi). Proprietà (`x.nome`) e chiavi
         (`{ nome: … }`) restano: così restano uguali database, funzione Edge (`ruolo`) e coda di
         Gite. Dopo la review: corretti i nomi tradotti col senso sbagliato (`caption`, `real`,
         `done`, `exit`…) e i commenti e i documenti che citavano le funzioni coi nomi vecchi.
         Restano italiane le proprietà interne degli oggetti e alcuni nomi fuori glossario
         (`coda`, `nome`, `ora`, `dove`…): da fare col passo 5;
      3. classi CSS, id, attributi data-* (non i valori), variabili CSS (`--barra-h`…);
      4. prove: nomi dei file, `FINTO`, il protocollo «RISULTATO … =NO(…)», `esegui.sh`,
         `avvia.sh`; script (`esporta-tutto.sh` → anche `backup-db.yml`; `scarica-backup.sh` →
         reinstallare il timer con `--installa`);
      5. commenti in inglese in tutti i file (anche `schema.sql`: solo il file, la produzione
         non si tocca);
      6. regola in `CLAUDE.md`, `docs/SVILUPPO.md`, `PROJECT-CONTEXT.md`; review; push e deploy.

- [ ] **Attivare la copia dei backup su Google Drive** (la fa chi ha l'account Google del club):
      `docs/BACKUP.md`, «Attivare la copia su Google Drive». Fino ad allora le copie sono su GitHub
      e sul PC del club.
- [ ] **Campi che fanno sparire il valore del record** (21/10, l'utente: «controlla che in giro per
      il sito non ci siano field che inserendo campi troppo lunghi o non previsti facciano sparire
      il valore del record»). Già fatto con l'audit del 22/10: voci e partenze spente che il Salva
      toglieva (S1/S10). Restano da censire, pagina per pagina, con TDD: numeri scritti male
      (`type=number` che dà "" e diventa 0), date scritte a metà che diventano null, pulizie del
      testo che danno vuoto (telefono, codice fiscale, email), `maxlength` più corti del database,
      trigger che azzerano un campo.

## Da provare sul sito vero

- Pagamenti: numero tessera sotto il nome di ogni socio («Tessera n° …», o «Senza numero
  tessera»), anche sul telefono, per la ricevuta di chi torna a pagare dopo l'acconto.
- Soci: totale fisso coi prezzi nuovi (cambiando una voce cambia solo la differenza), «Calcola»
  del codice fiscale, numeri tessera liberi e prima tessera dal 21, presciistica con e senza
  assicurazione, agevolazione famiglia (capofamiglia con due familiari, un familiare col nucleo
  pieno), voci e partenze spente, totale a mano, A+ al massimo, Stampa, un socio nato a Torino.
- Due operatori sullo stesso socio: scheda aperta in Soci, acconto da Pagamenti, poi Salva in Soci:
  deve dire «Socio NON salvato» e non toccare niente.
- Pagamenti (Modifica importi, Storico, schede sul telefono), Riepilogo e Bilancio sul telefono,
  Stampe (sabato, domenica, martedì; un foglio del pullman stampato), Gite (coda, stagione, due
  abbonamenti, «Nuovo abbonamento»), Assicurazione con un account `assicurazione` (a pagine,
  scarica, riscarica, segna come inviata, annulla).
- Impostazioni: colonna «In Soci», un prezzo cambiato e il totale in Soci, una assicurazione
  aggiunta e tolta, l'ordine del listino, una partenza rinominata (i soci la seguono).
- Primo accesso: account di prova da Utenti, entrare, cambiare la password, poi Reimposta password
  e rientrare con `donbosco26!`. Un nome cambiato in Ruoli e permessi; un account del ruolo gite
  con una voce sola.
- I tre Excel (Riepilogo, Stampe, Assicurazione) in Excel e sul telefono.
- Social: la K con una foto vera caricata; la story del canale WhatsApp pubblicata con lo sticker
  link (Instagram, e Facebook se la pagina ha lo sticker).
- Testi nuovi in tutte le pagine e accessibilità (link sottolineati, lettore di schermo).
- Il primo backup col file per Excel: aprire `dati-AAAA-MM-GG.7z` con 7-Zip e `soci.csv` in Excel.
- Cerca socio: il prossimo numero tessera in cima e la ricerca per numero («33», «rossi 33»).
  Soci: il numero tessera proposto è il primo campo del modulo.
- 3.0 sul PC del club e su un telefono vero: il menu a colonna e i gruppi Gestione e Social, il
  pannello «Menu» sul telefono, il tema scuro (luna in alto a destra) su ogni pagina, la fascia
  di Soci su una riga, Riepilogo e Utenti a schede, la scheda del post in Social.

## Da fare prima delle iscrizioni di massa (da metà novembre)

- [ ] Prova generale delle iscrizioni (`docs/ISCRIZIONI.md`).
- [ ] Togliere le 27 coppie di doppioni d'archivio con Elimina socio (tutte vuote): decide l'utente,
      che ha l'elenco.
- [ ] Leggere `supabase/migration/cf-2026-09-30/warning-cf.md`: 13 persone dei fogli non
      trovate, 9 con data di nascita diversa, 73 codici dei fogli che non passano il controllo.
- [ ] Controllare LACHELLI: presciistica Total Sport (120) e totale 115.
- [ ] Assicurazione: tracciato dell'Excel da definire con le specifiche dell'assicurazione.
      `INSURANCE_COLUMNS` in `web/shared.js` (colonne provvisorie), usate dalla pagina
      Assicurazione e dal Riepilogo; campi nuovi anche in `insurance_members()`
      (`supabase/schema.sql`) e in `downloadMembers()` (`web/riepilogo.html`).

## Grafica

- [ ] Volantino 2026/2027 (`grafica/volantino/`, README): far controllare le partenze del sabato
      uguali alla domenica e «Zermat», stampare una prova fronte-retro. Scegliere fra il
      definitivo e la variante col QR del canale WhatsApp (`volantino-2026-2027-qr*.pdf`): quella
      scelta resta, l'altra si toglie.
- [ ] Immagine del profilo Instagram e Facebook col logo ufficiale (bianco e blu a fondo unito,
      tondo e quadrato; «Sci Club» in alto a sinistra e «ASTI» grande sotto). A 40 px «Sci Club» e
      «ASTI» non si leggono: da tenerne conto. Poi il JPG in `grafica/logo/` e il README.
- [ ] Barra del sito: ha ancora il logo rettangolare, da decidere se passare al tondo.

## Social

- [ ] Inserire i contatti veri in Social > Impostazioni > Contatti e spuntarli nei post.
- [ ] Caricare lo sponsor 958 Santero e la sua campagna (loghi in `social/santero/`).
- [ ] Confermare con chi pubblica la regola di «Da completare» (gita: meta, giorno, partenze;
      cena e gara: data; campagna: sponsor; corso e servizi: il titolo o il sottotesto).
- [ ] Le foto dei post della locandina (Wikimedia Commons) chiedono di citare l'autore, tranne La
      Thuile (CC0), per esempio nel testo del post:
      - Cervinia: «Cime Bianche.JPG», SteGrifo27, CC BY-SA 3.0, https://commons.wikimedia.org/wiki/File:Cime_Bianche.JPG
      - Pila: «Panorama piste pila.JPG», Gnappo1989, CC BY 3.0, https://commons.wikimedia.org/wiki/File:Panorama_piste_pila.JPG
      - Serre Chevalier: «Prorel-Serre-Che.JPG», Benj05, CC BY-SA 3.0, https://commons.wikimedia.org/wiki/File:Prorel-Serre-Che.JPG
      - Monginevro: «Montgenèvre Hiver.jpg», Station de Montgenèvre, CC BY-SA 4.0, https://commons.wikimedia.org/wiki/File:Montgen%C3%A8vre_Hiver.jpg
      - Monterosa Ski: «Alagna Valsesia, Funifor Salati.jpg», Massimo Beltrame, CC BY-SA 4.0, https://commons.wikimedia.org/wiki/File:Alagna_Valsesia,_Funifor_Salati.jpg
      - Val Cenis: «Télésiège Ramasse de Val-Cenis à l'arrivée en hiver (mars 2025).JPG», Florian Pépellin, CC BY-SA 4.0, https://commons.wikimedia.org/wiki/File:T%C3%A9l%C3%A9si%C3%A8ge_Ramasse_de_Val-Cenis_%C3%A0_l%27arriv%C3%A9e_en_hiver_(mars_2025).JPG
      - Limone: «Snowy landscape.jpg», Matteo tavee, CC BY-SA 4.0, https://commons.wikimedia.org/wiki/File:Snowy_landscape.jpg
      - Courmayeur: «Amazing Mont Blanc from Val Ferret, winter, Italy.jpg», Davide Tomatis, CC BY-SA 4.0, https://commons.wikimedia.org/wiki/File:Amazing_Mont_Blanc_from_Val_Ferret,_winter,_Italy.jpg
      - Valtournenche: «Valtournenche-Salette - panoramio.jpg», Pier B., CC BY-SA 3.0, https://commons.wikimedia.org/wiki/File:Valtournenche-Salette_-_panoramio.jpg
      - Val di Fassa: «Marmolada-Arabba-Val di Fassa 1.jpg», kallerna, CC BY-SA 4.0, https://commons.wikimedia.org/wiki/File:Marmolada-Arabba-Val_di_Fassa_1.jpg
- [ ] Da valutare: un post senza titolo ma con delle informazioni ha il sottotesto a 46 px; la
      misura grande (72 px) c'è solo quando il sottotesto è da solo.

## Soci

- [ ] Unire due schede della stessa persona quando tutte e due hanno dati (pagamenti, gite):
      oggi si elimina solo una scheda vuota. Da decidere chi lo fa e con quali regole.
- [ ] Cerca socio ed Excel dei soci: la colonna «Tessera» resta vuota per chi è coperto
      dall'agevolazione famiglia senza tessera.

## Facoltativi

- [ ] Pulsante A+ anche nel sito `ricerca/`.
- [ ] Presciistica nella scheda del socio in `ricerca/` (oggi mostra solo l'abbonamento).
- [ ] Impostazioni sul computer: il menu «Assicurazione» è stretto e taglia il testo; allargarlo
      fa scorrere la tabella di lato a 1280 px (la prova lo blocca).
- [ ] Il tag locale `2.1` è diverso da quello su GitHub (`git fetch --tags` lo rifiuta): capire
      quale è giusto prima di toccarlo.

## Da decidere

- Bot Telegram per chiedere le informazioni di un socio (27/10, l'utente: «lo facciamo dopo»).

- Soci, «Leggi la scheda» (23/10, rimandato dall'utente): foto della scheda di carta con la
  fotocamera, letta da Claude in una Edge Function (come `supabase/functions/crea-utente`), modulo
  compilato senza salvare, totale ricontrollato col listino. Circa 3 centesimi a scheda, serve un
  account Anthropic e una riga nell'informativa privacy (le foto vanno ad Anthropic, negli USA).
  Prima una prova con 2-3 schede finte fotografate dal portatile.

- Bilancio, voce Sponsor: basta il nome scritto a mano, o serve il legame con l'elenco degli
  sponsor di Social (colonna nuova; oggi chi ha il bilancio non legge quell'elenco)?
- Codice fiscale: un elenco dei codici dei comuni (JSON statico nel repository, niente libreria)
  darebbe il comune atteso anche per chi è nato in un posto raro; oggi si ricava dai soci nati lì
  (almeno 3). Il nodo è la corrispondenza coi luoghi scritti a mano nell'archivio ("S. DAMIANO",
  "SAN DAMIANO D'ASTI"). Chiesto dall'utente il 15/10.
