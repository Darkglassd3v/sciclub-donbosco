# TODO — aggiornato il 2026-10-11

> Le richieste nuove si scrivono qui in cima, in "Richieste nuove". Quando una cosa è fatta si
> toglie: la storia resta nei commit (`git log`). Come si lavora: `docs/SVILUPPO.md`.

## Stato del repository (11/10/2026)

- Rilasciata la **2.7** (tag `2.7`). Branch di lavoro `2.8-SNAPSHOT`: le pagine online sono le
  sue (trigger del workflow `["2.7", "2.8-SNAPSHOT"]`) e `dev` è allineato a lui. L'11/10 tolti i
  branch vecchi (versioni 1.x-2.7, i loro SNAPSHOT, `claude/*`), tutti già contenuti nei tag e in
  `2.8-SNAPSHOT`: restano solo `dev` e `2.8-SNAPSHOT`. Gli SHA per ricrearli sono in
  `.git/branch-cancellati-2026-10-11.txt` (solo su questo PC).
- Database di produzione: schema di `supabase/schema.sql` applicato l'11/10 (grafiche nuove dei
  post: colonne `social_events.hook`, `event_time` e `place`, check di `social_settings.style`).
  Backup in `supabase/migration/backup-2026-10-11-ora-luogo/` (fuori da git).
- Documenti puliti l'08/10: tolti `docs/DOCUMENTAZIONE.md` (la 1.x) e i piani 2.1, 2.3 e social
  già realizzati (restano nella storia di git). Le pagine di prova su claude.ai sono cancellate.
- Da dove ripartire: `PROJECT-CONTEXT.md`, poi questo file, poi `docs/SVILUPPO.md`.

## Richieste nuove

- [ ] 11/10: grafiche dei post nello stile dei marchi dello sci, coi colori del club. Fatte
      come tavole le proposte **D · Pista** (alla Head) ed **E · Fascia** (alla Rossignol) in
      `grafica/proposte-post-social/` (titoli in Barlow Condensed, `grafica/font/barlow-condensed/`).
      Da scegliere con chi pubblica; quella scelta va poi nel generatore (`web/social-templates.js`).

## Versione aperta: 2.8-SNAPSHOT

Aperta il 09/10/2026 dalla 2.7 (branch e tag `2.7`, cosa contiene: `git show 2.7` e il TODO del
tag). Le pagine si pubblicano dal branch `2.8-SNAPSHOT`. Fatto finora (10/10, review del codice
prima delle iscrizioni): salvataggio Soci che non cancella pagamenti e abbonamenti scritti
intanto da altri; nomi e dati dal database passati da `esc()` in Soci e Pagamenti; conferma
dell'incasso col saldo del momento; gite in coda tenute se la sessione scade; Elimina movimento
del Bilancio in finestra; rinomina delle voci di listino estesa ai soci; `set_amounts()` che
segnala il socio non trovato; saldo di chiusura non più leggibile senza login. L'11/10: le
grafiche Biglietto, Calendario e Divano nel generatore dei post (Social > Impostazioni).

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

- [ ] Scegliere la grafica dei post in Social > Impostazioni: oltre a Ritocco e Montagna ci sono
      Biglietto, Calendario e Divano (le proposte di `grafica/proposte-post-social/`). Con il
      Divano scrivere il gancio di ogni post. Da decidere con chi pubblica: nelle tre nuove le
      gite del martedì restano rosse (colore del giorno in Impostazioni > Giorni) e le cene,
      gare e servizi sono blu.
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
