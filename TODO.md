# TODO — aggiornato il 2026-10-14

> Le richieste nuove si scrivono qui in cima, in "Richieste nuove". Quando una cosa è fatta si
> toglie: la storia resta nei commit (`git log`). Come si lavora: `docs/SVILUPPO.md`.

## Stato del repository (14/10/2026)

- Branch di lavoro `2.8-SNAPSHOT` (le pagine online sono le sue); `dev` è indietro: da allineare
  (sotto). Restano solo `dev` e `2.8-SNAPSHOT`; gli SHA dei branch tolti l'11/10 sono in
  `.git/branch-cancellati-2026-10-11.txt` (solo su questo PC).
- Produzione: `supabase/schema.sql` applicato il 14/10 ("k" nel check di `social_settings.style`),
  backup in `supabase/migration/backup-2026-10-14-stile-k/` (fuori da git).
- Da dove ripartire: `PROJECT-CONTEXT.md`, poi questo file, poi `docs/SVILUPPO.md`.

## Richieste nuove

> **Ripresa (14/10 sera, limite d'uso).** Autorizzato dall'utente: tutte le query in produzione,
> schema, commit e push ("correggi e fai tutto, pusha"). Ordine: 1) review OCR in delega del
> codice fiscale, commit, push di `2.8-SNAPSHOT`; 2) allineare `dev`; 3) ordine dei campi;
> 4) assicurazioni (schema, backup, review, push). Aggiornare questo blocco dopo ogni passo.
> Fatto finora: codice fiscale (sotto) e COLOMBA corretto in produzione. Niente committato.

- [ ] 14/10: **Ordine dei campi come il modulo di carta** (Tesseramento 2026/2027): la pagina Soci
      e la Stampa chiedono le cose nello stesso ordine del modulo, sezioni come blocchi; i prezzi
      del modulo non contano. Proposta in `docs/ORDINE_CAMPI.md`, **approvata il 14/10**: giorno
      del corso resta sotto il corso; numero tessera primo della sezione Tessera; DIRETTIVO resta
      fra le tessere (in fondo), anche se sul modulo non c'è. Da fare in `web/index.html`:
      Telefono accanto all'Email; Numero tessera in cima a Tessera; in Gite e corsi partenze
      domenica e sabato prima del corso; stesso ordine nel PDF (`datiScheda()`). Voci del listino
      nell'ordine del modulo: colonna `prices.position` (riempita una volta in `schema.sql` per
      nome, `where position is null`), `caricaPrezzi()` e Impostazioni ordinano per position, poi
      prezzo. Nomi in produzione: TESSERA ORDINARIA - GLOBAL NEVE BASE 1, SOLO TESSERA - NO
      ASSICURAZIONE 2, TESSERA ORDINARIA - GLOBAL SPORT 3, TESSERA SCONTATA - NEVE PLUS 4, TESSERA
      SCONTATA - NO ASSICURAZIONE 5, TESSERA DIRETTIVO 6; famiglia 3/4/5 SENZA poi 3/4/5 CON;
      Abbonamento 5 viaggi MARTEDÌ, DOMENICA, SABATO, JOLLY; CORSO SCI ADULTI, CORSO SCI 10 - 14,
      CORSO SCI BABY FINO 10, CORSO SNOWBOARD 4 PARTECIPANTI. Partenze: già in ordine alfabetico =
      modulo. Poi `docs/SVILUPPO.md` ("ordinate per prezzo" → per position) e togliere
      `docs/ORDINE_CAMPI.md`.
- [ ] **Allineare `dev`** a `2.8-SNAPSHOT`: merge in una worktree (`docs/SVILUPPO.md`, punto 4),
      push su `dev` senza force. Controllato il 14/10: merge senza conflitti, albero uguale a
      `origin/2.8-SNAPSHOT`; il push su `dev` non pubblica le pagine. Manca il sì al commit.
- [ ] **Codice fiscale: il controllo non vede un comune sbagliato.** Esempio: COLOMBA GIANFRANCO
      (Torino, 29/04/1958), in produzione `CLMGFR58DC9L21PD`, giusto `CLMGFR58D29L219D`.
  - Fatto il 14/10 (non committato), in `web/codicefiscale.js` e `web/index.html`:
    `verificaCF` riceve comune atteso, luogo e sesso. Comune diverso con carattere finale
    sbagliato → corretto nella proposta; con finale giusto → solo avviso "controlla il luogo"
    (sarà sbagliato il luogo della scheda). Giorno illeggibile → data rifatta col sesso scelto o,
    se non scelto, con `sessoDaiCF` dei soci con lo stesso nome (detto nell'avviso). Proposta
    uguale al codice scritto → nessuna proposta. `comuneDelLuogo()` conta anche i soci con
    provincia di nascita vuota (in produzione sono quasi tutti: per questo prima non trovava
    Torino), esclude il socio aperto; codici contati una volta (doppioni). Almeno 3 codici per
    dire che uno scritto è sbagliato, 1 per proporlo. Simulato su tutto l'archivio: 3 segnalati,
    tutti errori veri (Alessandria A782, Asti 479V, COLOMBA). Test in `web/test-codicefiscale.js`,
    prova nel browser col client finto (scratchpad, `or`/`neq` aggiunti al finto).
  - Fatto: COLOMBA corretto in produzione (`CLMGFR58D29L219D`), backup della riga in
    `supabase/migration/backup-2026-10-14-cf-colomba/`.
  - [ ] Review in delega OCR del diff (la prima review ha già tolto i doppioni dal conteggio),
        commit, push.
- [ ] **Assicurazioni con un menù loro in Impostazioni** (nome e prezzo modificabili, tessera →
      assicurazione). Oggi: codici fissi BASE/PLUS/SPORT in `prices.insurance`, nomi scritti in 8
      punti del codice, prezzo dentro quello della tessera.
  - Deciso il 14/10: il prezzo della tessera è a parte da quello dell'assicurazione (due cifre).
        Le assicurazioni sono due: **Base 20 €** e **Global Neve Sport 45 €**; la Base da 15 €
        del modulo di carta sparisce (diventa 20) e sparisce la Neve Plus. Le quote tornano tutte:
        ORDINARIA NEVE BASE 40 = 20 + 20, GLOBAL SPORT 65 = 20 + 45, SCONTATA con Base 30 = 10 +
        20 (quindi la "TESSERA SCONTATA - NEVE PLUS" con BASE è giusta: il modulo dice Neve Base);
        SOLO TESSERA 20 e SCONTATA NO ASS. 10 senza assicurazione.
  - Deciso il 14/10 sera: il DIRETTIVO ha la Global Sport ma non la paga (resta 0 €): serve un
        segno sulla tessera, es. `prices.insurance_paid boolean default true` (false per il
        DIRETTIVO; casella "pagata dal club" in Impostazioni). La tessera ORDINARIA - GLOBAL NEVE
        PLUS sparisce, e l'assicurazione PLUS con lei. In Impostazioni si possono **aggiungere e
        togliere assicurazioni** (togliere: cancellare se nessuna tessera né lista la usa).
        Nomi: "Global Neve Base" 20 €, "Global Neve Sport" 45 € (modificabili).
  - Visto in produzione il 14/10: nessuna lista mandata (`insurance_lists` vuota); soci della
        stagione con tessera: 10 DIRETTIVO, 3 ORDINARIA - GLOBAL NEVE BASE; nessuno con NEVE PLUS.
        Codici scritti nel codice: `impostazioni.html` (ASSICURAZIONI, select nuova voce),
        `assicurazione.html` (TIPI con nome e colonna Excel "Polizza"/"Tipo" della SPORT, CSS per
        data-kind), check `kind in ('BASE','PLUS','SPORT')` in `insurance_lists` e
        `insurance_send` e `prices_insurance_valid` in `schema.sql`. Prezzi da dividere una volta
        sola (in un blocco DO che parte solo se manca la colonna nuova): GLOBAL NEVE BASE 40 → 20,
        SCONTATA - NEVE PLUS 30 → 10, GLOBAL SPORT 65 → 20; il totale = quota + assicurazione se
        pagata, in `caricaPrezzi()` (così Soci e le altre pagine non cambiano) e in `card_counts`
        e nell'archivio di `close_season()`.
  - [ ] Tabella `public.insurances` (code, name, price, position, active) con chiave esterna da
        `prices.insurance`; il prezzo dell'assicurazione si somma alla quota della tessera nel
        totale del socio (`web/index.html`) e nei conti dello schema che usano `p.price` delle
        tessere: `card_counts` e l'archivio di `close_season()`. I totali già salvati nei soci
        (`members.total`) non cambiano. Sezione "Assicurazioni" in Impostazioni; nomi dalla
        tabella in `impostazioni.html`, `assicurazione.html`, `shared.js`; da tre liste a due
        nella pagina Assicurazione (le liste PLUS già mandate, se ci sono, restano leggibili).
        Prima di scrivere la migrazione: contare in produzione soci e liste con PLUS. Test ruoli,
        review, backup, schema.
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
grafica K «Piani» nel generatore e la proposta del codice fiscale nella scheda del socio nuovo.

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
