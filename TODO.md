# TODO — aggiornato il 2026-11-12

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

- [ ] **Lancio della stagione 2026/27 (12/11): file pronti, da pubblicare.** In `grafica/lancio-stagione/`
      (calendario, file e sponsorizzazione nel README, testi in `didascalie.md`) e Reel veloce per
      Instagram in `grafica/video-serata-veloce/renders/invito-serata-veloce-16s.mp4` (quello da 19 s resta
      in `grafica/video-presentazione/renders/`). L'evento del 25/11 in produzione ha già testi e foto.
      Restano:
      1. L'utente pubblica il post 1 (invito alla serata) entro il 15/11, su Facebook con l'immagine e su
         Instagram con il Reel veloce e una musica libera da diritti.
      2. Poi Claude prepara in Gestione inserzioni le due bozze con «Usa post esistente», con il pubblico
         allargato proposto il 12/11 (Facebook 35–65 a 2 € al giorno, Instagram 18–55 a 3 € al giorno, fino al
         24/11; dettagli nel README del lancio e regole in `docs/META-ADS.md`); «Pubblica» e il pagamento li fa
         l'utente.
      3. Storie di promemoria il 22/11 (con il conto alla rovescia) e il 25/11.
      4. Il 26/11 il carosello «Si parte!» e il Reel della stagione, collegato alla campagna già in bozza
         (riaccendere la campagna prima di pubblicare), sponsorizzazione fino al 6/12.
      5. Controllo nel Chrome dell'utente della pagina Social con l'evento aggiornato (estensione
         scollegata il 12/11).

- [ ] **Campagne Target BMW e Gimax Rent (29/10): sul sito, da controllare.** Sponsor e campagna
      creati in Social > Campagne con logo e colori dai loro siti (livello «Sponsor», titolo,
      testo, pulsante e inserzione Meta proposti). Mancano i profili Instagram (sui siti non ci
      sono) e il livello vero; i testi sono una proposta. SQL e loghi in
      `supabase/migration/campagne-sponsor-2026-10-29/` (fuori da git), `annulla.sql` li toglie.

- [ ] **Sito WordPress del club: sistemare i problemi e rifare la grafica** (29/10; analisi del
      12/11/2026 in sola lettura, prime correzioni fatte lo stesso giorno dal Chrome dell'utente).
      `https://www.sciclubdonboscoasti.it/`: WordPress 7.1.4, tema Enfold 8.3 (a pagamento, già
      comprato) con tema figlio, hosting Host.it (server LiteSpeed, PHP 7.4.33). Le password non le
      scrive Claude: l'utente entra in `/wp-admin` nel suo Chrome.
      Fatto il 12/11/2026: backup completo con UpdraftPlus (installato; 4,1 GB in 15 archivi del
      12/11 alle 17:43, sul server con eliminazione solo manuale e scaricati nella cartella Download
      del PC dell'utente), fuso orario «Roma» con data «12 novembre 2026» e ora «17:43», link
      Instagram nuovo nella barra in alto (menu «icon menu», voce 551), nelle icone social di Enfold
      e nei profili di Yoast SEO, aggiornamenti automatici accesi per i 5 plugin, Twenty Twenty-Five
      installato come tema di riserva (non attivo), firewall di Wordfence ottimizzato («Extended
      Protection», configurazione LiteSpeed/lsapi; copia del `.htaccess` di prima nella cartella
      Download), logo dello sponsor Servello nella pagina Sponsor collegato al sito nuovo
      `https://servellogroup.it/` al posto di `servellosnc.it`, che non esiste più. Il titolo
      dell'articolo «STA' PER INIZIARE» resta com'è (scelta dell'utente).
      Decisioni dell'utente del 12/11/2026, da non riproporre: la pagina «Gara Sociale 2025 Memorial
      Gioele Torchio» resta pubblicata, il banner dei cookie resta com'è, niente verifica in due
      passaggi.
      Restano, in ordine di urgenza:
      1. PHP 7.4.33, fuori supporto (WordPress chiede almeno la 8.3). Prova del 12/11/2026 su due
         copie locali fatte dal backup (Docker, PHP 7.4.33 e 8.3.36, rete esterna bloccata): 97 pagine
         pubbliche, 32 pagine di amministrazione, salvataggio della pagina Sponsor col costruttore di
         Enfold e 32 eventi programmati danno lo stesso risultato sulle due versioni, senza errori né
         deprecazioni da Enfold 8.3 (con LayerSlider 8.4.1), tema figlio (senza codice proprio) e
         plugin; con 8.3 la memoria usata scende da 44 a 35 MB. L'analisi statica PHPCompatibility non
         trova niente di bloccante. Resta il controllo dell'hosting (Host.it, CloudLinux, PHP Selector):
         per la 8.3 attivare le stesse estensioni della 7.4 (mysqli/nd_mysqli e pdo_mysql, mysqlnd, gd,
         imagick, intl, mbstring, zip, exif, curl, openssl, sodium, opcache, ionCube) e le stesse
         opzioni (memory_limit 2G, max_execution_time 300, max_input_vars 10000, post_max_size 512M,
         upload_max_filesize 1G); senza mysqli il sito si ferma con «missing the MySQL extension».
         Bloccato dal 12/11/2026: l'utente non ha le credenziali dell'area clienti di Host.it
         (`https://my.host.it/pannello/login.jsp`, poi pannello DirectAdmin del servizio, utente di
         sistema `umnwnjze`); servono a chi ha comprato o rinnova l'hosting (mail di attivazione o
         fatture di Host.it), oppure «password dimenticata» con l'email dell'account.
         Il cambio lo fa l'utente dal pannello; subito dopo si controllano home, un articolo, Sponsor,
         amministrazione, opzioni di Enfold e firewall di Wordfence, e in caso di problemi si torna a
         7.4 dal pannello. Le copie locali restano utili per provare il nuovo tema e le immagini.
      2. Nessuna cache delle pagine (risposta del server in circa 1,2 s): plugin LiteSpeed Cache,
         adatto al server, oppure la cache di WP-Optimize, oggi spenta.
      3. Home di circa 8 MB: foto dello slider da circa 1 MB l'una (slide_1.jpg 1.095 KB, slide_3.jpg
         974 KB), 768 KB di CSS e 490 KB di JavaScript di Enfold. Comprimere le immagini e convertirle
         in WebP (WP-Optimize). Nel PHP dell'hosting `post_max_size` (512 MB) è minore di
         `upload_max_filesize` (1 GB).
      4. Spazio: la cartella di WordPress senza temi, plugin e caricamenti pesa 3,48 GB (i file di
         WordPress sono circa 70 MB) e i caricamenti 4,12 GB: capire cosa c'è nella cartella principale
         (copie vecchie, backup, archivi) prima di toglierlo.
      5. Ci sono 2 bozze ferme; il calendario delle gite non indica l'anno e non porta all'iscrizione.
      6. La home non ha un titolo H1, 16 immagini su 18 non hanno il testo alternativo e la
         configurazione iniziale di Yoast SEO non è stata fatta (manca anche la pagina Facebook fra
         i profili).
      Grafica nuova: i 76 articoli sono testo semplice e passano a qualsiasi tema; 8 pagine su 9 sono
      fatte con il costruttore di Enfold e vanno rifatte se si cambia tema. Opzioni valutate:
      A. Enfold con una delle 43 demo incluse (Travel, GYM, Academy, Modern): nessuna pagina da
         rifare, ma resta pesante e l'import della demo azzera le opzioni del tema.
      B. Astra con i modelli gratuiti «Outdoor Adventure» o «Travel & Tourism» (quelli sport sono a
         pagamento).
      C. Ollie o Twenty Twenty-Five (temi a blocchi, oltre 50 sezioni pronte): i più leggeri e
         semplici da mantenere, da vestire nello stile dei post social (blu e giallo, logo tondo).
      D. Kadence: buon tema, ma i modelli gratuiti sono generici.
      Proposta: prima i punti 1-4, poi la grafica con C (o B partendo da un modello), lavorando su
      una copia di prova. Da decidere con l'utente: chi gestisce l'hosting e quale opzione; poi un
      abbozzo piccolo della home in due varianti da scegliere.

- [ ] **Normalizzazione dei soci (29/10): fatta, restano 14 schede da sistemare a mano.**
      Email in minuscolo, anagrafica e indirizzi in maiuscolo, città e luoghi di nascita col nome
      ufficiale ISTAT, apostrofi dritti, spazi singoli, telefoni con le sole cifre: in produzione
      e nella regola del database (`normalize_member_text`). Restano 9 codici fiscali non di 16
      caratteri e 5 telefoni strani, nel foglio «Da controllare a mano» di
      `supabase/migration/normalizza-2026-10-29/anteprima-normalizzazione.xlsx` (fuori da git).

- [ ] **Instagram del club: seguire i soci iscritti** (29/10). Cercati i 28 iscritti della
      stagione: 6 già seguiti, gli altri con i profili probabili mostrati in chat; aspetta
      dall'utente quali seguire (si seguono solo quelli confermati, uno alla volta). Nessun
      nome qui: l'elenco si rifà dalla ricerca.

- [ ] **Doppioni dei soci (28/10): fatto il grosso, restano controlli dell'utente.** 30 doppioni
      eliminati o uniti in produzione, archiviati in `member_deletions`. Cosa controllare (una
      scheda eliminata forse di un'altra persona, 7 codici fiscali da correggere con la tessera)
      in `supabase/migration/doppioni-2026-10-28/DA-CONTROLLARE.md`, fuori da git perché ha nomi
      di soci: qui niente dati personali, il repository è pubblico.

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
