# TODO — aggiornato il 2026-10-15

> Le richieste nuove si scrivono qui in cima, in "Richieste nuove". Quando una cosa è fatta si
> toglie: la storia resta nei commit (`git log`). Come si lavora: `docs/SVILUPPO.md`.

## Stato del repository (15/10/2026)

- Branch di lavoro `2.8-SNAPSHOT` (le pagine online sono le sue), `dev` allineato a lui il 15/10.
  Restano solo `dev` e `2.8-SNAPSHOT`; gli SHA dei branch tolti l'11/10 sono in
  `.git/branch-cancellati-2026-10-11.txt` (solo su questo PC).
- Produzione: `supabase/schema.sql` applicato il 15/10 (assicurazioni a parte, `prices.position`),
  backup in `supabase/migration/backup-2026-10-15-assicurazioni/` (fuori da git). Lo schema intero
  ci mette qualche minuto: applicarlo quando nessuno usa il sito.
- Da dove ripartire: `PROJECT-CONTEXT.md`, poi questo file, poi `docs/SVILUPPO.md`.
- **Ripresa (16/10, sera):** tutto fatto, pushato e online fino a `fc4012a` (gite fatte nei fogli
  del pullman), `dev` allineato. Aspettano l'utente: (1) **canale WhatsApp**: story come JPG da
  caricare (niente generatore), da provare pubblicandola con lo sticker link;
  (2) Sponsor nel Bilancio, nome a mano o legato all'elenco di Social; (3) la partenza nel titolo
  stampato dei fogli del pullman (tolta come chiesto, resta nel nome del foglio di lavoro); (4) le
  prove sul sito vero elencate sotto. Il client Supabase finto per le prove nel browser sta nello
  scratchpad, che un riavvio svuota: va riscritto.

## Richieste nuove

- [ ] 16/10: **Immagine del profilo Instagram e Facebook** dal logo vettoriale
      (`grafica/logo/logo_sciclubdonbosco.svg`), con le **scritte un po' più spesse**, in due
      proposte da confrontare: (1) sfondo bianco, logo più grande nel cerchio e filo blu e giallo
      intorno; (2) sfondo blu `#084C8D`, «DON» giallo e «BOSCO» bianco. Oggi a 40 px (feed, anello
      delle storie) il logo occupa metà del cerchio e il giallo sul bianco quasi sparisce.
      Abbozzo da scegliere: `bozze/abbozzo-logo-profilo.png` (oggi, 1 e 2 a 180, 110, 56 e 40 px,
      sui profili chiari e scuri; contorno di 26 unità del logo, solo sulle lettere, l'arco resta
      com'è). L'utente (16/10): su Facebook oggi c'è il logo sul blu con **«Sci Club»** in alto a
      sinistra e **«ASTI»** in basso a destra (`bozze/profilo-facebook-oggi.png`): aggiungerli a
      tutte e due le proposte, in Barlow Condensed, dentro il cerchio (Facebook ritaglia tondo).
      Fatto nell'abbozzo: «Sci Club» sopra «DON», «ASTI» sotto la «O» finale allineato al fondo
      della «B» (fuori dall'arco), logo al 78% del cerchio perché le scritte stiano dentro il filo;
      `abbozzo-logo-profilo.html#p1` e `#p2` danno già l'immagine 1080×1080 (anteprime
      `bozze/profilo-p1.png`, `bozze/profilo-p2.png`). Dopo la scelta: il JPG in `grafica/logo/`,
      la sorgente in `grafica/logo/strumenti/` e il README.
- [ ] 16/10: **Story del canale WhatsApp** fatta come JPG da caricare (l'utente: niente tipo nuovo
      nel generatore per una cosa sola): `grafica/canale-whatsapp/story-canale-whatsapp.jpg`
      1080×1920, dall'abbozzo approvato, con la foto CC0 della montagna, senza «Nessuno vede il tuo
      numero» (l'utente: solo le informazioni utili); sorgente
      `sorgenti/story.html`, rifatta da `rendi.sh`. Il riquadro col bordo giallo è vuoto: lì chi
      pubblica mette lo **sticker link** al canale, i passi sono nel README della cartella. Da provare
      pubblicandola: su Instagram, e su Facebook se la pagina del club ha lo sticker Link.
- [ ] 16/10: **Gite fatte nei fogli del pullman** fatto: colonna «Gite fatte» nei fogli ABBONAMENTI
      e ABBONAMENTI JOLLY («1/5», con due abbonamenti «5/5, 1/5»; contate quando si scarica), non nei
      CORSI. Da provare sul sito vero insieme agli altri Excel.
- [ ] 16/10: **Excel leggibili** fatto: colonne larghe quanto il testo (prima fisse), dati in corpo
      14, intestazione in grassetto 15 bianca sul blu, titolo delle Stampe in grassetto 18 su tutta
      la riga. Per gli stili SheetJS è passata a `xlsx-js-style@1.2.0` (la stessa 0.18.5 con gli
      stili; fissata con l'impronta SRI in `caricaXlsx()`). La lista per l'**assicurazione** ha solo
      le larghezze nuove: niente stili finché l'assicurazione non dà il tracciato (stessi valori,
      tipi e formato delle date: controllato). Nei fogli delle Stampe il titolo dice solo cosa sono
      (CORSI SABATO, ABBONAMENTI DOMENICA, ABBONAMENTI JOLLY; la partenza è nel nome del foglio di
      lavoro), c'è la data di nascita accanto al luogo, e si stampano in orizzontale larghi una
      pagina. Da provare sul sito vero: aprire i tre Excel (Riepilogo, Stampe, Assicurazione) in
      Excel e sul telefono, e stampare un foglio del pullman.
- [ ] 16/10: **K sistemata** (story: tessera più corta e piena, logo accanto, testo più su e più
      grande; luogo degli eventi su una riga sua col segnaposto; partenze in riquadri blu; telefoni
      con numero e icona in giallo; in fondo 300 px per Instagram invece di 340). Provata sul banco
      di tutte le grafiche (6 stili, post e story, evento e gita, 0 e 2 telefoni): le altre cinque
      uguali a prima; nella K ora ci sta tutto anche con due telefoni (prima la story perdeva la
      scadenza). Da vedere con chi pubblica, con una foto vera. Già da prima: il **Montagna** post di
      un evento con due telefoni sborda (non è la grafica scelta).
- [ ] 15/10, review del 15/10 (fatti: l'incasso dei nuclei con un credito, `c6a6936`; le
      assicurazioni, prezzi in euro interi anche nel database, applicati in produzione il 15/10 con
      le sole istruzioni nuove, backup in `supabase/migration/backup-2026-10-15-prezzi-interi/`).
      Il 15/10 anche il codice fiscale (sesso scelto, A-J nel comune, finale senza comune,
      richieste, maiuscole; in produzione corretti i nomi `tOMMASO` e `AòESSANDRA`, backup in
      `supabase/migration/backup-2026-10-15-nomi/`). La regola della review "comune rifatto se il
      nome non torna" **non** è stata messa: sull'archivio smentita da un nato in Cina (Z210)
      con la scheda che dice ASTI. Un codice coerente col suo finale ora ha solo l'avviso, senza
      proposta (81 delle 196 proposte sull'archivio erano così). Fatto anche il saldo "a credito"
      in Soci (barra, familiari, PDF) e il controllo di test-social sui nomi dei campi.
- [ ] 16/10: Bilancio fatto (data in colonne in rem, voci in una tendina, voce **Sponsor** col nome
      dello sponsor obbligatorio nella descrizione). Da decidere con l'utente: basta il nome scritto
      a mano, o serve il legame con l'elenco degli sponsor di Social (colonna nuova nel database;
      oggi chi ha il bilancio non legge quell'elenco)? Provato solo in Chrome, non in Firefox.
- [ ] 15/10: **Un permesso per ogni voce della barra** fatto: `cerca`, `gite`, `stampe` (chi aveva
      `gite` le ha tutte e tre), nomi della barra in Gestione > Ruoli (`nav_labels`). In produzione
      il 15/10 solo le istruzioni nuove (lo schema intero teneva fermo il sito), backup in
      `supabase/migration/backup-2026-10-15-permessi/`. Da provare sul sito vero: un nome cambiato
      in Gestione > Ruoli, e un account del ruolo gite con una voce sola.
- [ ] Da provare sul sito vero (dopo il 15/10): Impostazioni > Assicurazioni (cambiare un prezzo e
      vedere il totale in Soci, aggiungerne una e toglierla), colonna Ordine del listino, scheda
      Soci nell'ordine del modulo; il controllo del codice fiscale su un socio nato a Torino.
- [ ] **K nel generatore**: provare con una foto vera caricata (Supabase Storage; html-to-image deve
      poterla scaricare, CORS). Seconda immagine nella finestra: dopo novembre.

## Versione aperta: 2.8-SNAPSHOT

Aperta il 09/10/2026 dalla 2.7 (branch e tag `2.7`, cosa contiene: `git show 2.7` e il TODO del
tag). Le pagine si pubblicano dal branch `2.8-SNAPSHOT`. Fatto finora (10/10, review del codice
prima delle iscrizioni): salvataggio Soci che non cancella pagamenti e abbonamenti scritti
intanto da altri; nomi e dati dal database passati da `esc()` in Soci e Pagamenti; conferma
dell'incasso col saldo del momento; gite in coda tenute se la sessione scade; Elimina movimento
del Bilancio in finestra; rinomina delle voci di listino estesa ai soci; `set_amounts()` che
segnala il socio non trovato; saldo di chiusura non più leggibile senza login. L'11/10: le
grafiche Biglietto, Calendario e Divano nel generatore dei post (Social > Impostazioni). Il 14/10: la
grafica K «Piani» nel generatore e la proposta del codice fiscale nella scheda del socio nuovo. Il
14-15/10: codice fiscale controllato col comune dei soci nati lì (COLOMBA corretto in produzione);
assicurazioni con un menù loro in Impostazioni (Global Neve Base 20 €, Global Neve Sport 45 €, quota
della tessera a parte, direttivo pagato dal club); scheda Soci e Stampa nell'ordine del modulo di carta.

## Da fare prima delle iscrizioni di massa (da metà novembre)

- [ ] Prova generale delle iscrizioni (`docs/ISCRIZIONI.md`).
- [ ] Provare sul sito vero due operatori sullo stesso socio: aprire la scheda in Soci, segnare un
      acconto da Pagamenti, poi Salva in Soci: deve dire "Socio NON salvato" e non toccare niente.
- [ ] Provare sul sito vero il primo accesso: creare un account di prova da Utenti, entrare,
      cambiare la password, poi Reimposta password e rientrare con `donbosco26!`.
- [ ] Provare sul sito vero con i dati reali: Soci (doppioni su tutto l'archivio, A+ al
      massimo, numero tessera proposto, secondo abbonamento, presciistica insieme a un
      abbonamento, totale a mano, Stampa), Pagamenti (Modifica importi, Storico), Riepilogo,
      Stampe (sabato e domenica, martedì), Assicurazione con un account `assicurazione`
      (scarica, segna come inviata, annulla), pannello gite sul telefono con due abbonamenti
      e "Nuovo abbonamento".
- [ ] Togliere le 27 coppie di doppioni d'archivio con Elimina socio (tutte vuote).
- [ ] Leggere `supabase/migration/cf-2026-09-30/warning-cf.md`: 13 persone dei fogli non
      trovate, 9 con data di nascita diversa, 73 codici dei fogli che non passano il controllo.
- [ ] Assicurazione: tracciato dell'Excel da definire con le specifiche dell'assicurazione.
      `COLONNE_ASSICURAZIONE` in `web/shared.js` (colonne provvisorie), usate dalla pagina
      Assicurazione e dal Riepilogo; campi nuovi anche in `insurance_members()`
      (`supabase/schema.sql`) e in `scaricaSoci()` (`web/riepilogo.html`).

## Social

- [ ] In Social > Impostazioni scegliere «Piani» (la K, la grafica decisa il 14/10) e scrivere
      il gancio dei post.
- [ ] Provare le grafiche nuove con foto vere e con le campagne sponsor.
- [ ] Inserire i contatti veri in Social > Impostazioni > Contatti e spuntarli nei post.
- [ ] Caricare lo sponsor 958 Santero e la sua campagna (loghi in `social/santero/`).
- [ ] Confermare con chi pubblica la regola di "Da completare" (gita: meta, giorno, partenze,
      quota se mostrata, scadenza; cena e gara: data; campagna: sponsor; corso e servizi: il
      titolo o il sottotesto).
- [ ] Da valutare: un post senza titolo ma con delle informazioni ha il sottotesto a 46 px; la
      misura grande (72 px) c'è solo quando il sottotesto è da solo.

## Soci

- [ ] Unire due schede della stessa persona quando tutte e due hanno dati (pagamenti, gite):
      oggi si elimina solo una scheda vuota. Da decidere chi lo fa e con quali regole.

## Facoltativi

- [ ] Pulsante A+ anche nel sito `ricerca/`.
- [ ] Presciistica nella scheda del socio in `ricerca/` (oggi mostra solo l'abbonamento).
- [ ] Ripubblicare la Edge Function `crea-utente` (la versione nel repository non assegna più
      ruoli; quella pubblicata funziona lo stesso). Come: `docs/ACCOUNT.md`.
- [ ] Il tag locale `2.1` è diverso da quello su GitHub (`git fetch --tags` lo rifiuta): capire
      quale è giusto prima di toccarlo.

## Da decidere

- Codice fiscale: un elenco dei codici dei comuni (JSON statico nel repository, niente libreria:
  il progetto non ha dipendenze né build) darebbe il comune atteso anche per chi è nato in un
  posto raro; oggi si ricava dai soci nati lì (almeno 3). Il nodo è la corrispondenza coi luoghi
  scritti a mano nell'archivio ("S. DAMIANO", "SAN DAMIANO D'ASTI"). Chiesto dall'utente il 15/10.

- Pubblicare su Facebook e Instagram dal sito invece che a mano: piano in
  `docs/PIANO_PUBBLICAZIONE_META.md`. Prima domanda: serve, o basta Meta Business Suite?
