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

- [ ] 22/10: **2.8 rilasciata, si lavora su 2.9-SNAPSHOT.** Tag e branch `2.8` (le pagine pubblicano da
      lì finché non parte un deploy da `2.9-SNAPSHOT`). Da fare al primo deploy da `2.9-SNAPSHOT`
      (docs/SVILUPPO.md, passo 5): controllare con `git tag --contains` e togliere i branch
      `2.8` e `2.8-SNAPSHOT` da GitHub, e `2.8` dai trigger di deploy-pages.yml.

- [ ] 22/10: **Errori sui campi, codice fiscale da calcolare, euro interi o coi 50 centesimi.** Fatto
      (TDD: 0626e00, b4f61e4, 7766a47 e il RED del database; GREEN bbc3b10, 9c96499, 1f68d0a; vincolo
      dei prezzi in produzione; online). (1) In tutto il sito un campo che il browser non accetta al
      salvataggio o che la pagina segnala (segnaErrore() in shared.js) ha il bordo rosso finché non lo
      si cambia, la pagina scorre al primo e un messaggio dice quali sono. (2) Soci: «Calcola» accanto al
      codice fiscale (codice proposto da cliccare, o i dati che mancano bordati); il sesso non scelto si
      prende dai soci con lo stesso nome; un codice sbagliato dice solo «Codice fiscale errato, codice
      proposto: …» (anche in Assicurazione). (3) Importi a passi di 0,50 € ovunque, anche nel database per
      listino e assicurazioni; Social controlla i centesimi nei prezzi dei post. Da provare sul sito vero.
      Non fatto: il saldo della banca in Bilancio resta coi centesimi (lo dice l'estratto conto: dirlo
      all'utente); i totali e i versati dei soci nel database non hanno un vincolo sui centesimi (solo
      i campi delle pagine). Poi: tag 2.8 e branch 2.9-SNAPSHOT.

- [ ] 22/10: **Numeri tessera liberi in rosso sotto il numero tessera.** Fatto (TDD: c9bd5d1 e 92b52fe RED,
      ffe38d5 e 35f9094 GREEN; in produzione e online): in Soci, sotto «Numero tessera», i numeri che
      nessuno ha dal numero delle Impostazioni (`settings.card_gaps_from`, 21: sotto, direttivo e
      famiglia tenuti vuoti apposta) al più alto dato o scritto («36, 38–44»); il numero vecchio del
      socio aperto torna libero se cambiato. Si cambia in Impostazioni, riquadro Listino. Al 22/10 in
      produzione dal 21 al 33 nessun buco. Da provare sul sito vero. Non fatto (da chiedere):
      `next_card_number` propone ancora «il più alto + 1», quindi a inizio stagione senza numeri dati
      propone 1 e non il 21.

- [ ] 21/10: **Agevolazioni famiglia con l'assicurazione, al posto della tessera.** Fatto (TDD: 3a729e2 e
      a8c3f47 RED, 5b8ac3c, 607cb2a, 974c42b, 35fc63d GREEN; in produzione e online): o la tessera o
      l'agevolazione, che la sceglie il capofamiglia e copre lui e i familiari a carico fino alle sue
      persone (dal nome); prezzo quota + persone × assicurazione (3 persone Base 110, invariato);
      con la presciistica con l'assicurazione la tessera non è obbligatoria; chi è coperto
      dall'agevolazione ha la «CORSO PRESCIISTICA - FAMIGLIA» (50 €); liste dell'assicurazione,
      tesserati (Riepilogo, Gite) e conteggi contano chi è coperto; la tessera compresa nella
      presciistica non si conta più (6 soci al 21/10). Backup in
      `supabase/migration/backup-2026-10-21-agevolazioni/`. Da provare sul sito vero: capofamiglia
      con l'agevolazione e due familiari, un familiare in più col nucleo pieno, socio con la sola
      presciistica. Da controllare: LACHELLI ha la presciistica Total Sport (120) e il totale 115.
      Non fatto: nelle pagine Cerca socio ed Excel dei soci la colonna «Tessera» resta vuota per chi
      è coperto senza tessera; Riepilogo e Gite usano il filtro `card_holder` (PostgREST), provato
      solo nel database.

- [ ] 21/10: **Impostazioni leggibili e nello stile del sito.** Fatto (TDD: ef07e87 RED, poi GREEN; online):
      nome della voce, dell'assicurazione e luogo della partenza in un campo che va a capo e cresce col
      testo (Invio non va a capo, spazi e a capo diventano uno spazio al salvataggio); nomi con «&amp;»
      non più cambiati in «&» (esc()); riquadri a striscia (Listino arancio, Assicurazioni verde,
      Partenze viola), campi `.input`/`.textarea`/`.select` come in Bilancio; sotto i 900 px ogni voce
      è una scheda con le etichette. Prova `test-browser/impostazioni.js` a 1280 e 500 px. Da provare
      sul sito vero (anche col testo grande, A+). Resta: sul computer i menu «Chi la assegna» e
      «Assicurazione» sono stretti e tagliano il testo («admin e…», «REALE TOTAL SPORT (€…»);
      allargarli fa scorrere la tabella di lato a 1280 px (la prova lo blocca): serve stringere altro.

- [ ] 21/10: **Campi che fanno sparire il valore del record (PIANO, fase 2, da fare con TDD).**
      L'utente: «controlla che in giro per il sito non ci siano field che inserendo campi troppo
      lunghi o non previsti facciano sparire il valore del record»; rimandato il 21/10.
      1. Censimento in sola lettura, pagina per pagina (index, admin, assicurazione, bilancio,
         social, utenti, stagione, gestione, ricerca/): campo, colonna, come si carica, come si
         salva. Casi da cercare:
         - scelta non più nel listino: `selezionaPerNome` (index.html, ~riga 1200) non spunta niente
           se card_type / family_discount / preski_type / course_type sono di una voce disattivata o
           rinominata (caricaPrezzi legge solo `active`), e Salva scrive vuoto; lo stesso per
           `spuntaPartenze` con una partenza disattivata; in Impostazioni un'assicurazione che non c'è
           più nel menu;
         - campi numerici: «12,5» in `type=number` dà "" e diventa 0 (acconto, totale a mano, importi
           in Pagamenti e Bilancio);
         - date scritte a metà (data di nascita) che diventano null;
         - pulizie del testo che danno vuoto (telefono, codice fiscale, email);
         - `maxlength` più corti di quello che c'è nel database; trigger che azzerano un campo.
      2. Per ogni caso vero: prova nel browser che fallisce (test-browser/), correzione nel codice
         condiviso se il difetto è in più pagine (per la scelta fuori listino: mostrarla spuntata come
         «(non più nel listino)», così salvando resta), commit.
      3. Docs (SVILUPPO, GUIDA_VOLONTARI se cambia l'uso), review OCR in delega, push e dev col sì.

- [ ] 21/10: **Assicurazione: «Da assicurare» a pagine.** Fatto (TDD: b156014 RED, 3ec5114 GREEN, poi il
      fuoco all'ultima pagina; online): 25 per pagina, una per tipo, «‹ Indietro · 26–50 di 60 ·
      Avanti ›» sotto il gruppo; il titolo dice quanti senza codice fiscale; dopo Salva si resta sulla
      pagina; lista accorciata = ultima pagina; codice fiscale scritto e non salvato: `chiedi()` prima
      di cambiare pagina. Excel e «Segna come assicurati» prendono tutti. Salva su una riga non perde
      più i codici scritti e non salvati nelle altre (d4dd02c RED, poi GREEN).
      Da provare sul sito vero con un account `assicurazione`.

- [ ] 21/10: **Presciistica in due voci del listino.** Fatto (TDD, commit 442df28 RED, 42203e0 GREEN;
      online e in produzione): la presciistica comprende tessera, quota CONI e assicurazione, come
      sulla scheda di carta. «CORSO PRESCIISTICA» 70 + Base 20 = 90 €, «CORSO PRESCIISTICA - REALE
      TOTAL SPORT» 75 + Sport 45 = 120 € (`prices.insurance` anche per la presciistica). Tolta la
      scelta a parte (`members.insurance`, +25). In Soci, con la presciistica la tessera non si somma
      al totale (nota sotto la tessera). L'assicurazione della voce vale nelle liste; `close_season`
      conta la presciistica a `card_price`; Impostazioni mette l'assicurazione anche sulle voci della
      presciistica; Riepilogo prezzi a `card_price`. Produzione: backup in
      `supabase/migration/backup-2026-10-21-presciistica-2/`; COLOMBA Base (90, pagato 105, 15 a
      credito), MARENGO Total Sport (120). Resta (Basso, c'era già): `card_counts` e la chiusura
      contano anche la tessera di chi ha la presciistica, che la comprende. Da provare sul sito vero
      (voce sotto).

- [ ] 16/10: **Tessera col colore del giorno, calendari che non sbordano, story del calendario.** Fatto:
      nelle gite la tessera della data ha il colore del giorno (domenica gialla con le scritte blu,
      sabato blu con le scritte bianche e la fascia dell'ora gialla, martedì rossa con le scritte
      bianche e la fascia blu). Calendario del mese: senza «Le gite del mese» (la tessera dice mese e
      numero), tessera e angolo più bassi, una gita per riga con la meta su una riga sola; con 13 gite
      il testo scende al 76-78% invece di sbordare al 60%. Nuova story del calendario (1080×1920) nella
      pagina Grafiche. Banco: post e story identici a prima nei testi e nelle misure. Da provare sul
      sito vero.

- [ ] 16/10: **Post della locandina nel database.** Fatto: 49 post da fare (45 gite di domenica,
      martedì e sabato dal 01/12/2026 al 06/04/2027, Presentazione del 25/11, Pranzo sociale del
      14/03, Settimana bianca in Val di Fassa e Traversata Courmayeur/Chamonix senza data, da
      completare). Gite con i contatti di default, «Iscrizioni entro» e quota vuote; corsi e gare
      nella nota gialla (e coccarda Corso); eventi senza telefoni. Backup in
      `supabase/migration/backup-2026-10-16-post-locandina/`. Foto da Wikimedia Commons, una per
      località (Sestriere e Val Thorens quelle che c'erano), da sistemare a mano dove serve. Tutte
      tranne La Thuile (CC0) chiedono di citare l'autore, per esempio nel testo del post:
      - Cervinia: «Cime Bianche.JPG», SteGrifo27, CC BY-SA 3.0, https://commons.wikimedia.org/wiki/File:Cime_Bianche.JPG
      - Pila: «Panorama piste pila.JPG», Gnappo1989, CC BY 3.0, https://commons.wikimedia.org/wiki/File:Panorama_piste_pila.JPG
      - Serre Chevalier: «Prorel-Serre-Che.JPG», Benj05, CC BY-SA 3.0, https://commons.wikimedia.org/wiki/File:Prorel-Serre-Che.JPG
      - Monginevro: «Montgenèvre Hiver.jpg», Station de Montgenèvre, CC BY-SA 4.0, https://commons.wikimedia.org/wiki/File:Montgen%C3%A8vre_Hiver.jpg
      - Monterosa Ski: «Alagna Valsesia, Funifor Salati.jpg», Massimo Beltrame, CC BY-SA 4.0, https://commons.wikimedia.org/wiki/File:Alagna_Valsesia,_Funifor_Salati.jpg
      - La Thuile: «Descending the San Bernardo slope towards the Fourclaz Express, La Thuile, 2024.jpg», DimiTalen, CC0, https://commons.wikimedia.org/wiki/File:Descending_the_San_Bernardo_slope_towards_the_Fourclaz_Express,_La_Thuile,_2024.jpg
      - Val Cenis: «Télésiège Ramasse de Val-Cenis à l'arrivée en hiver (mars 2025).JPG», Florian Pépellin, CC BY-SA 4.0, https://commons.wikimedia.org/wiki/File:T%C3%A9l%C3%A9si%C3%A8ge_Ramasse_de_Val-Cenis_%C3%A0_l%27arriv%C3%A9e_en_hiver_(mars_2025).JPG
      - Limone: «Snowy landscape.jpg», Matteo tavee, CC BY-SA 4.0, https://commons.wikimedia.org/wiki/File:Snowy_landscape.jpg
      - Courmayeur: «Amazing Mont Blanc from Val Ferret, winter, Italy.jpg», Davide Tomatis, CC BY-SA 4.0, https://commons.wikimedia.org/wiki/File:Amazing_Mont_Blanc_from_Val_Ferret,_winter,_Italy.jpg
      - Valtournenche: «Valtournenche-Salette - panoramio.jpg», Pier B., CC BY-SA 3.0, https://commons.wikimedia.org/wiki/File:Valtournenche-Salette_-_panoramio.jpg
      - Val di Fassa: «Marmolada-Arabba-Val di Fassa 1.jpg», kallerna, CC BY-SA 4.0, https://commons.wikimedia.org/wiki/File:Marmolada-Arabba-Val_di_Fassa_1.jpg

- [ ] 16/10: **Logo blu ufficiale e angolo sempre giallo in post e story.** Fatto: il logo dei post è
      `logo-ufficiale-blu-tondo.svg` (l'ufficiale blu nel cerchio, nuovo, anche in `grafica/logo/`),
      sull'angolo in alto a sinistra sempre giallo (foto in grigi col giallo sopra; le zone buie
      schiarite, perché con la foto della cena il giallo diventava nero); velo sotto il testo blu notte
      (`--velo: 4,32,62`, .78/.88), così i riquadri blu delle partenze si staccano. Anche la story del
      canale WhatsApp. Cartello e volantino restano col logo bianco ad anello giallo, senza il filo blu.
      Banco di 9 grafiche (gite sabato/domenica, post e story, meta su due righe, corso, cena, gara,
      servizi, calendario): testi e misure identici a prima. Da provare sul sito vero.

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
- [ ] Provare sul sito vero la presciistica in due voci (dal 21/10, online e in produzione):
      COLOMBA con «CORSO PRESCIISTICA» (90), MARENGO con «… - REALE TOTAL SPORT» (120); in
      Assicurazione COLOMBA fra i Base e MARENGO fra gli Sport. Un socio nuovo: tessera ordinaria
      40, con la presciistica 90 (la tessera non si somma, nota sotto), con la Total Sport 120.
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
