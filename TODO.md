# TODO — aggiornato il 2026-10-09

> Le richieste nuove si scrivono qui in cima, in "Richieste nuove". Quando una cosa è fatta si
> toglie: la storia resta nei commit (`git log`). Come si lavora: `docs/SVILUPPO.md`.

## Stato del repository (09/10/2026)

- Rilasciata la **2.7** (branch e tag `2.7`): le pagine online sono quelle del branch `2.7`.
  `dev` è allineato alla 2.7. Branch di lavoro `2.8-SNAPSHOT`: il suo primo push pubblica le
  pagine da lì (trigger del workflow `["2.7", "2.8-SNAPSHOT"]`).
- Database di produzione: schema di `supabase/schema.sql` applicato il 09/10 (cambio della
  password al primo accesso, tabella `pending_password_changes`). Backup in
  `supabase/migration/backup-2026-10-09-password/` (fuori da git).
- Documenti puliti l'08/10: tolti `docs/DOCUMENTAZIONE.md` (la 1.x) e i piani 2.1, 2.3 e social
  già realizzati (restano nella storia di git). Le pagine di prova su claude.ai sono cancellate.
- Da dove ripartire: `PROJECT-CONTEXT.md`, poi questo file, poi `docs/SVILUPPO.md`.

## Richieste nuove

(nessuna)

## Versione 2.7, rilasciata il 09/10/2026

Aperta l'08/10/2026 dalla 2.6, chiusa il 09/10 (branch e tag `2.7`); schema in produzione
l'08/10 (`social_settings`) e il 09/10 (`pending_password_changes`). Contiene:

- Social: grafiche nuove (testo che va a capo, post di solo sottotesto, Sottotesto su più righe)
- Soci: scheda con sezioni colorate (Anagrafica, Tessera, Gite e corsi, Pagamento), testata con
  Stampa ed Elimina, "Chiudi scheda" al posto di "Nuovo socio"
- Soci: Stampa scarica la scheda compilata in PDF (`scheda-COGNOME-NOME.pdf`)
- Logo vettoriale (`logo_sciclubdonbosco.svg`) in tutte le pagine, nei post e in `ricerca/`
- Sezioni colorate anche in Riepilogo, Assicurazione e Bilancio (stile comune in `brand.css`):
  stessi colori della scheda Soci
- Social: due grafiche, **Ritocco** (il biglietto di sempre con la neve) e **Montagna** (foto grande,
  scheda bianca, calendario 1080×1350), scelte per tutta la pagina in Social > Impostazioni guardando
  un post d'esempio (tabella `social_settings`, schema in produzione l'08/10)
- Soci: le finestre di conferma del salvataggio e dell'eliminazione mostrano i dati in una tabellina
  (nome e cognome, codice fiscale, luogo e data di nascita), grande e leggibile
- Account: al primo accesso chi ha un account nuovo deve cambiare la password iniziale (pagina
  `password.html`: attuale, nuova, conferma); gli account di prima no. In Utenti il superadmin ha
  **Reimposta password**, che la riporta a `donbosco26!` con l'obbligo di cambiarla (tabella
  `pending_password_changes`, schema in produzione il 09/10)

## Da fare prima delle iscrizioni di massa (da metà novembre)

- [ ] Prova generale delle iscrizioni (`docs/ISCRIZIONI.md`).
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
