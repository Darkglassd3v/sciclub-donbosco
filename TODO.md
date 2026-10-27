# TODO — aggiornato il 2026-10-23

> Le richieste nuove si scrivono qui in cima, in "Richieste nuove". Quando una cosa è fatta si
> toglie subito: la storia resta nei commit (`git log`). Come si lavora: `docs/SVILUPPO.md`.

## Stato del repository (27/10/2026)

- La 2.9 è rilasciata (tag `2.9`, online dal branch `2.9`), `dev` allineato al tag. Si lavora su
  `3.0-SNAPSHOT`, dedicata al telefono. Al primo deploy da `3.0-SNAPSHOT` (passo 5 del rilascio in
  `docs/SVILUPPO.md`): togliere `"2.9"` dai trigger di `deploy-pages.yml` e cancellare su GitHub i
  branch `2.9` e `2.9-SNAPSHOT`.
- Produzione: lo schema intero ci mette qualche minuto e tiene fermo il sito; di giorno solo le
  istruzioni nuove con `lock_timeout` (`docs/SVILUPPO.md`).
- Backup: dump cifrato e `dati-AAAA-MM-GG.7z` per Excel, su GitHub, sul PC del club (timer
  `sciclub-backup`, cartella `~/Backup/sciclub-donbosco`) e, quando attivato, su Google Drive:
  `docs/BACKUP.md`.
- Da dove ripartire: `PROJECT-CONTEXT.md`, poi questo file, poi `docs/SVILUPPO.md`.

## Richieste nuove

- [ ] **3.0: il sito sul telefono** (27/10, l'utente: «fai un bel controllo completo sulle feature
      mobile, un bel /ecc:plan puntando sull'ottimizzazione della grafica mobile»). Da pianificare
      e far approvare prima di scrivere codice. Segnalati con le foto: la barra in alto sul
      telefono (menu a hamburger?); in Soci la fascia Totale / Residuo / «Salva il nuovo socio»
      enorme, che copre mezzo schermo; in Riepilogo le tabelle illeggibili (nomi delle voci a una
      parola per riga, numeri sopra il testo); in Social la testa del post (tipo, data, titolo,
      «Pronto», Salva) che si accavalla e l'anteprima che esce dallo schermo. Poi tutte le altre
      pagine.

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
- Barra da admin e da superadmin sul PC del club: tutte le voci, «Cerca socio» compresa, ed
  «Esci» in vista. Cerca socio: il prossimo numero tessera in cima e la ricerca per numero
  («33», «rossi 33»). Soci: il numero tessera proposto è il primo campo del modulo.

## Da fare prima delle iscrizioni di massa (da metà novembre)

- [ ] Prova generale delle iscrizioni (`docs/ISCRIZIONI.md`).
- [ ] Togliere le 27 coppie di doppioni d'archivio con Elimina socio (tutte vuote): decide l'utente,
      che ha l'elenco.
- [ ] Leggere `supabase/migration/cf-2026-09-30/warning-cf.md`: 13 persone dei fogli non
      trovate, 9 con data di nascita diversa, 73 codici dei fogli che non passano il controllo.
- [ ] Controllare LACHELLI: presciistica Total Sport (120) e totale 115.
- [ ] Assicurazione: tracciato dell'Excel da definire con le specifiche dell'assicurazione.
      `COLONNE_ASSICURAZIONE` in `web/shared.js` (colonne provvisorie), usate dalla pagina
      Assicurazione e dal Riepilogo; campi nuovi anche in `insurance_members()`
      (`supabase/schema.sql`) e in `scaricaSoci()` (`web/riepilogo.html`).

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
