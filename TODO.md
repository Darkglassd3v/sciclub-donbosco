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

## Richieste nuove

- [ ] 15/10: **Story della K da sistemare** (foto dell'utente: Corso presciistica). Il logo sta a metà
      schermo; la tessera della data è lunga ma il testo dentro non la riempie; nella story il
      testo può essere più grande e dire di più; il luogo degli eventi (non delle gite) è troppo
      piccolo. Le dimensioni regolabili campo per campo: **scartate** (l'utente: i testi devono
      restare coerenti fra i post); si correggono le misure della grafica. Nelle gite **partenze e
      orari sono confusi**: metterli in riquadri. Prima un abbozzo prima/dopo da approvare.
- [ ] 15/10, dalla review: **Incasso di un nucleo con un credito dentro** (Alta). Pagamenti mostra il
      saldo netto (es. 100 da pagare − 30 a credito = 70) ma `settle_household` incassava solo i
      saldi positivi (100) e lasciava il credito: il cassiere poi lo "restituiva". Da fare: la
      funzione incassa il netto e azzera anche il credito, con la cifra confermata (`expected`).
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

- Pubblicare su Facebook e Instagram dal sito invece che a mano: piano in
  `docs/PIANO_PUBBLICAZIONE_META.md`. Prima domanda: serve, o basta Meta Business Suite?
