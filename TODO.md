# TODO — aggiornato il 2026-10-16

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

- [ ] 16/10: **Review completa del codice del 15-16/10: fatta e corretta.** Commit del 16/10 in
      `534ac00`. Commit del 15/10 (`bf605e4~1..a22a5a3~1`): «Sposta la foto» ha le frecce da cliccare
      (mouse e tablet) e non si spegne cliccando + e −; `settle_household` blocca le righe del nucleo
      prima di sommare (in produzione il 16/10); `social_settings.style` ammette solo `k`; avviso in
      testa a `schema.sql` per un database nuovo. Controllato in produzione, nessun problema: nessun
      socio con tessera PLUS, nessuna lista PLUS, l'unica tessera a 0 è il direttivo. Resta una scelta
      dell'utente: i fogli del pullman stampati non dicono la partenza (solo il nome del foglio di
      lavoro). In sospeso fuori dal codice: `web/etichetta…pdf` (dati personali, non in git) da
      spostare; la bozza `volantino-k` e la «c» in più nel README del canale non in commit.
- [ ] 16/10: **Nota gialla nella gita, quota e scadenza facoltative, foto blindata.** Fatto: nella
      gita il campo Sottotesto diventa «Nota in giallo sotto la meta» (riga gialla nel post e nel
      testo); quota e scadenza non fanno più segnare la gita «Da completare»; dalla security review,
      `photo` accetta solo `data:image/(jpeg|png|webp);base64,…` (check in produzione) e la foto
      nell'`url()` del CSS è codificata. Con la nota il testo della gita si stringe un po' (una riga
      in più). Da provare sul sito vero. Ancora da decidere: `web/etichetta…pdf` (dati personali,
      non in git) da spostare fuori dal repository.
- [ ] 16/10: **Foto spostabile con le frecce, Duplica, partenza sotto la data** (l'utente: «muoverla
      liberamente», «pulsante sposta con le freccette», «duplica», «scegliere quale partenza è sotto la
      data»). Fatto: pulsante «Sposta la foto» (frecce, Maiuscole, + e −, Invio), colonna `photo_zoom`;
      «Duplica questo post»; radio «sotto la data» nelle partenze, colonna `card_stop`. Colonne già in
      produzione (backup `supabase/migration/backup-2026-10-15-foto/`). Da provare sul sito vero.
- [ ] 15/10: **Volantino con le geometrie della K**, bozza in prova (copia: definitivo e variante QR
      non toccati): `sorgenti/volantino-k.html` → `volantino-2026-2027-k*.pdf/.jpg` (`rendi.sh` fa le tre).
      Angoli tagliati a 45°, cunei blu scuro sulle testate delle gite e degli eventi, cuneo sulla fascia
      di Piazza d'Armi, angolo blu sulla copertina; solo colori pieni (nessuna trasparenza). Da scegliere.
- [ ] 15/10: **K: logo e coccarda, meta su due righe, foto spostabile** (dev-team fatto). Tutti e tre **fatti**: (1) e (3) il 15/10 (colonne in produzione, backup in
      `supabase/migration/backup-2026-10-15-foto/`), (2) il 16/10: meta su due righe a 104 (124 nella story). Scelte
      dell'utente: (1) logo e coccarda **come nel post**
      anche nella story: logo in alto a sinistra (`top: su + 40px`), coccarda all'angolo basso della
      tessera della data; una regola sola relativa alla tessera, non numeri doppi post/story
      (`.cv.sk .stella`, `.cv.sk.story .stella`, `.cv.sk.story .logo-box` in `web/social-templates.js`).
      Mai la coccarda vicino al logo (due tondi si confondono). (2) **Meta della gita**: oggi `meta()`
      in `postK` è `data-fit` su una riga e scende fino a 40 px («Cervinia valtournenche» piccola):
      passare a `data-righe="2"` (una riga a 150/168 px se ci sta, se no due), rispettare gli a capo
      scritti (`white-space: pre-line`, max 2 righe, `\r\n` e righe vuote ripulite), campo della meta
      in `social.html` da input a textarea; nel calendario del mese (`righeMese`) e nella didascalia
      l'a capo diventa uno spazio. Rivedere `.tit min-height` e controllare che partenze, quota,
      scadenza, telefoni non si rimpiccioliscano (story: 1920 − 250 − 300 utili). (3) **Foto
      spostabile**, una posizione sola per post e story: due colonne nuove in `social_events`,
      `photo_x` e `photo_y` `smallint` 0–100, nulle = come oggi (`50% 45%`), con check
      0–100; in `schema.sql` con `add column if not exists`; in produzione **solo quelle istruzioni**
      con `set lock_timeout` (schema intero = sito fermo), backup e review **prima del push** (senza
      colonna il salvataggio fallisce). Nel CSS una variabile `--pos` per `.foto` (object-position),
      `.finestra` e `.grigi` (oggi `center 45%` in tre punti), valori numerici con clamp in JS, mai
      testo libero nello style. Nel form due cursori (sinistra-destra, alto-basso) con anteprima viva,
      niente trascinamento. Prove: banco con meta corta/lunga/con a capo/parola lunga, foto a 0/50/100,
      post e story con le fasce di Instagram, test node per a capo e clamp.
- [ ] 15/10: **Pulizia** (l'utente: «c'è troppa roba»). Tolti: `bozze/` (tutte già fatte; salvata
      solo la pagina dei PNG del logo), `docs/MIGRAZIONE_2.0.md` (il sito parte da zero),
      `inspiration/`, `grafica/proposte-presciistica-2026/`, `grafica/scheda-tesseramento/`, le
      proposte di grafica diverse dalla K in `grafica/proposte-post-social/`. Nel sito la **K è
      l'unica grafica** dei post: tolti Ritocco, Montagna, Biglietto, Calendario, Divano e la scelta
      della grafica. Tutto nella storia di git tranne `bozze/`. 
      Fatto e provato (banco K identico al pixel, test node verdi, `social.html` senza errori JS),
      online dal 15/10; `docs/SVILUPPO.md` e `PROJECT-CONTEXT.md` aggiornati.
- [ ] 15/10: **Volantino col QR del canale WhatsApp**, variante in prova (copia, il definitivo non è
      toccato): `sorgenti/volantino-qr.html` → `volantino-2026-2027-qr*.pdf/.jpg` (`rendi.sh` fa entrambe).
      QR piccolo da 20 mm in cornice verde WhatsApp `#25D366` con «Seguici su WhatsApp», sopra
      «Informazioni e prenotazioni» a sinistra (copre la rete rossa e le gambe del primo a sinistra).
      Letto dall'anteprima a 150 dpi. Se l'utente la sceglie: diventa il volantino, si toglie l'altra.
- [ ] 15/10: **Volantino 2026/2027 rifatto**, versione definitiva scelta dall'utente (la C; A e B
      cancellate). `grafica/volantino/volantino-2026-2027.pdf` (A5 fronte-retro), `-tipografia.pdf`
      (3 mm di abbondanza), anteprime; sorgente `sorgenti/volantino.html`, `rendi.sh` (lancia `sfuma.py`):
      vedi il README della cartella. Nessuna trasparenza nel PDF (il lettore dell'utente le disegnava
      male). Da far controllare: partenze del sabato uguali alla domenica, «Zermat». Da stampare una prova
      fronte-retro. Nella cartella restano il PDF vecchio dell'IA e `FOTO COPERTINA_mod.JPG`.
- [x] 15/10: **Logo ufficiale ovunque** (commit `1fc4ec5`, deploy fatto): logo del sito
      `logo-ufficiale-trasparente-lettere-blu.svg`, tondo nei post nuovi (`logo-ufficiale-tondo.svg`,
      `SOCIAL.logoTondo`), coccarda del K all'angolo della tessera, `fermata` al posto di `box`
      (Bulma). La barra del sito ha ancora il logo rettangolare: da decidere.
- [x] 15/10: **K, gita con titolo solo la meta** (commit `1823f8a`, deploy fatto): «Gita a» nel gancio.

- [ ] 16/10: **Logo ufficiale ovunque** (l'utente, 15/10: «solo i loghi ufficiali ovunque: post, sito,
      generatore»). Fatto: il logo è `grafica/logo/logo-ufficiale.JPG` (728×468, col cielo, con «Sci Club»
      e «ASTI»), ricalcato in vettoriale senza cielo, per fondo chiaro, da
      `grafica/logo/strumenti/ricalca_ufficiale.py` in `logo-ufficiale-trasparente-lettere-blu.svg`, copiato in `web/` e
      `ricerca/` (stesso nome: le 14 pagine e `SOCIAL.logo` non cambiano). Tolti: la ricostruzione del
      07/10 (PNG, JPG, quadrato, `originale_228x170.png`, i loro script); `bozze/` cancellata il 15/10
      (la pagina dei PNG del logo è ora `grafica/logo/strumenti/profilo.html`). Provato: test node, i sei stili del generatore
      in post e story, barra, login e canvas del PDF. Da guardare sul sito vero. Ancora col logo
      vecchio dentro, perché sono JPG già fatti: `grafica/proposte-post-social/`, da rifare solo se
      servono. Cartelli chiaro e scuro e story di `grafica/canale-whatsapp/` rifatti col logo tondo il
      15/10 (QR riletto da entrambi i cartelli, commit `930919b`).
      **Immagine del profilo Instagram e Facebook**: da rifare con il logo ufficiale (bianco e blu a
      fondo unito, tondo e quadrato; «Sci Club» in alto a sinistra e «ASTI» grande sotto, idea
      dell'utente). Gli abbozzi e le prove sono stati cancellati: si riparte dall'SVG nuovo. A 40 px
      (feed, anello delle storie) «Sci Club» e «ASTI» non si leggono.
      Dopo la scelta: il JPG in `grafica/logo/` e il README.
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
