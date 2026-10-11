# TODO — aggiornato il 2026-10-10

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

- [ ] **In corso (11/10): le tre proposte di grafica nel generatore dei post** (Social > Genera
      post), scelte in Social > Impostazioni accanto a Ritocco e Montagna. Riferimento:
      `grafica/proposte-post-social/` (tavole, sorgenti HTML/CSS, regole fisse nel README).
      Piano, in ordine (ripartire dal primo non spuntato):
  - [ ] `supabase/schema.sql`: `social_settings_style_valid` accetta anche `biglietto`,
        `calendario`, `divano`; schema in produzione con backup.
  - [ ] `web/social-templates.js`: `STILI` con i tre nuovi; `disegnaPost` (post 4:5 e story
        9:16) per gita, eventi (cena, gara, corso, servizi) nei tre stili; calendario del mese
        (`disegnaCalendario`, `misureCalendario`). Regole fisse: un solo blu `#084C8D` e un solo
        giallo `#FCCF02`; titolo sempre alto 2 righe; testo dallo stesso punto; orari, prezzi e
        scadenze in evidenza; iscrizioni grandi.
  - [ ] `web/social.html`: scelta in Impostazioni con l'esempio per ogni stile.
  - [ ] `web/test-social.js` aggiornato; `node web/test-social.js` e prova nel browser col
        client finto (post e story di ogni tipo, A+ e 400 px).
  - [ ] Commit, push su `2.8-SNAPSHOT` (deploy: `gh run list --workflow deploy-pages.yml`),
        allineare `dev` (non esiste `master`; procedura in `docs/SVILUPPO.md`, niente force).
  - [ ] `/open-code-review:review` del codice nuovo; correggere Alto e Medio; commit, push,
        deploy, riallineare `dev`.
  - [ ] Spegnere: `~/.local/bin/spegni-tutto` (la presa), poi in background
        `sleep 60; gnome-session-quit --power-off --no-prompt` (`systemctl poweroff` è
        bloccato dalla sessione GNOME, `sudo` chiede la password).

  **Per chi riparte da una sessione nuova** (contesto pulito l'11/10):
  - L'utente ha dato tutte le autorizzazioni per questo lavoro: database di produzione
    (backup, schema, psql), bash, commit, push, deploy, allineamento di `dev`, spegnimento.
    Non chiedere: andare avanti fino in fondo. Al limite d'uso il sistema riprende da solo.
  - Le tre proposte, da rifare uguali nel generatore: `grafica/proposte-post-social/`
    (tavole `tavola-a/b/c.jpg`, post in `post/`, sorgenti `sorgenti/corso-a.html` ...
    `calendario-c.html`, stili `a.css`, `b.css`, `c.css`, `comune.css`; regole fisse nel
    README: misure per proposta, un solo blu e un solo giallo, titolo alto 2 righe, testo
    dallo stesso punto, evidenze, iscrizioni grandi). Nomi negli stili: A `biglietto`,
    B `calendario`, C `divano`.
  - Nel sito: `web/social-templates.js` (`STILI`, `impostaStile`, `modelloPost`,
    `disegnaPost(s, stile)`, `disegnaMontagna`, `disegnaCalendario`, `misureCalendario`,
    `fit()`, `SAFE` per le fasce della story), `web/social.html` (Impostazioni: radio dello
    stile con `esempioRitocco`/`esempioMontagna`, `disegnaEsempiStile()`), test
    `web/test-social.js`. I post del sito caricano Barlow da Google Fonts (per le prove si
    può usare `grafica/font/barlow/`). Prova nel browser: copia di `web/` con supabase-js
    finto, vedi `docs/SVILUPPO.md`, "Provare le pagine senza login".

## Versione aperta: 2.8-SNAPSHOT

Aperta il 09/10/2026 dalla 2.7 (branch e tag `2.7`, cosa contiene: `git show 2.7` e il TODO del
tag). Le pagine si pubblicano dal branch `2.8-SNAPSHOT`. Fatto finora (10/10, review del codice
prima delle iscrizioni): salvataggio Soci che non cancella pagamenti e abbonamenti scritti
intanto da altri; nomi e dati dal database passati da `esc()` in Soci e Pagamenti; conferma
dell'incasso col saldo del momento; gite in coda tenute se la sessione scade; Elimina movimento
del Bilancio in finestra; rinomina delle voci di listino estesa ai soci; `set_amounts()` che
segnala il socio non trovato; saldo di chiusura non più leggibile senza login.

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

- [ ] Scegliere fra le tre proposte di grafica dei post (`grafica/proposte-post-social/`: una
      tavola per proposta con corso, gita, evento e calendario). Se va A: i corsi passano al giallo in Genera post (colore della
      categoria corso in `web/social-templates.js`, accenti blu sul giallo) e logo più grande.
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
