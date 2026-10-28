# Piano: Social «Campagne» (immagini degli sponsor, inserzioni Meta, spese)

Richiesta del 28/10/2026, piano scritto lo stesso giorno. **Stato (28/10): fatto in locale con
TDD, grafica B «Piani K» scelta dall'utente (senza bordo bianco attorno all'immagine). Pubblicato
il 28/10: schema in produzione (solo le istruzioni nuove, con `lock_timeout`), poi il sito.** Esito in fondo, «Esito TDD».

## Cosa si vuole

1. Una voce **Campagne** nel menu Social, separata da **Post** (gite, corsi, cene, gare).
2. Post con **immagini date dallo sponsor** (es. BMW lancia un'auto e manda la foto), con la
   cornice del club e il logo dello sponsor, oltre alle storie col solo logo che ci sono già.
3. Una scheda per preparare le **inserzioni Meta** (Facebook/Instagram Ads): testi, link, immagini
   da caricare in Gestione inserzioni.
4. **Spese** delle inserzioni (ed eventuali rimborsi dello sponsor) tenute nei conti.

## Cosa c'è già (da riusare, non rifare)

| Cosa | Dove |
|---|---|
| Campagne = post `social_events.kind = 'sponsor'` con `sponsor_id` | `supabase/schema.sql:3338`, vincolo a `:3379` |
| Sponsor: nome, livello, url, handle, loghi, 3 colori, `alcohol` | `supabase/schema.sql:3309`, Social > Impostazioni |
| Formati della campagna: Collab 4:5, Story, Grazie 1:1, Copertina FB | `web/social-templates.js:766` `campaignFormats()` |
| Link con UTM | `web/social-templates.js:834` `utmAddress()` |
| Foto del post come data URL, ridotta dal browser | `web/social.html:1441` `shrinkImage()`, colonna `photo` (vincolo jpeg/png/webp) |
| Sezioni della pagina scelte dall'indirizzo (`#post`, `#grafiche`, `#impostazioni`) | `web/social.html:614` `SECTIONS`, `showSection()` |
| Pulsante «Campagna sponsor» dentro Post | `web/social.html:257` |
| Movimenti di Bilancio (ENTRATA/USCITA, categoria libera), permesso `bilancio` | `supabase/schema.sql:2043` `ledger_entries`, `web/bilancio.html` |
| Permessi: post e sponsor col permesso `social` | `supabase/schema.sql:3536` |
| Menu Social ripetuto in 13 pagine (11 in `web/`, 2 in `ricerca/`) | `<a href="social.html#post">` |
| Conferme in finestra sopra la pagina | `chiedi()` di `web/shared.js` |
| PNG dal browser con html-to-image (SRI) | `web/social.html` `loadHtmlToImage()` |

Decisione del 2.5 da cambiare: «una campagna = un post, niente tabella campagne». Resta così:
ogni immagine dello sponsor è un post `sponsor` suo; più post dello stesso sponsor si raggruppano
nell'elenco per sponsor. Una tabella `campaigns` non serve.

## Decisioni (con la proposta di default)

| Domanda aperta | Proposta |
|---|---|
| Chi carica le immagini? | Chi ha il permesso `social`. Darlo anche agli admin = un clic in Gestione > Ruoli, nessun codice. |
| La spesa va in Bilancio o nella campagna? | **Solo in Bilancio** (un posto solo per i soldi), con un collegamento facoltativo alla campagna: la scheda della campagna mostra il totale. Niente doppioni da tenere allineati. |
| Lo sponsor rimborsa le inserzioni? | Se sì, è un'ENTRATA in Bilancio collegata alla stessa campagna; la scheda mostra speso, rimborsato e netto. Stesso collegamento, nessun lavoro in più. |
| Risultati (copertura, clic)? | **Non salvati** per ora: stanno in Gestione inserzioni. Si aggiungono se servono per i resoconti agli sponsor. |
| Un'immagine sola o una per formato? | **Una** per post (il disegno la adatta ai tre formati senza tagliarla). Se uno sponsor manda la versione verticale apposta, si fa un secondo post. |

## Fasi

### Fase 1: voce «Campagne» (nessuna modifica al database)

- `web/social.html`: sezione `campagne` in `SECTIONS`/`PHRASES`; elenco dei soli post `sponsor`,
  raggruppati per sponsor, con filtro per sponsor; la sezione Post mostra tutto il resto.
  Il pulsante «Campagna sponsor» passa da Post a Campagne. L'editor resta lo stesso.
- Menu: `<a href="social.html#campagne">Campagne<span class="conta"></span></a>` dopo Post nelle
  13 pagine, con il conteggio «da fare» come Post; nomi personalizzabili da Gestione > Ruoli come
  le altre voci (`sciclub-voci`, `web/shared.js:458`); `?v=` nuovo in tutte le pagine.
- Test (prima rosso): `test-browser/campagne.js`: `#campagne` mostra solo i post sponsor, `#post`
  nessuno, il filtro funziona, il conteggio è giusto; `bar-steady.js` vede la voce nuova.

### Fase 2: immagine dello sponsor e grafiche nuove

Caricamento (nessuna modifica al database):
- Nell'editor di un post `sponsor` compare il campo immagine (oggi il riquadro foto è solo per
  gite ed eventi, `data-per="gita evento"`). Per gli sponsor `shrinkImage(file, 1920, ...)`
  invece di 1080, perché la storia è alta 1920. Le immagini con trasparenza restano PNG.
- Avviso sotto il campo: usare l'immagine solo come lo sponsor permette (niente ritagli o scritte
  sopra se le sue regole del marchio lo vietano).

Disegno con `/ui-ux-pro-max:design` (procedura «Social Photos», regole delle memorie sulle grafiche):
1. **Brief** dai colori e dalle regole del club (`docs/brand-guidelines.md`) e dai campi di
   `sponsors`. Vincoli fissi: immagine **intera e mai coperta** (contain, fondo nel colore scuro
   dello sponsor, niente sfocature dell'immagine); logo del club solo su bianco; avvertenza alcol
   se `alcohol`; zone sicure della storia (`SAFE`); poco testo (Meta penalizza oltre ~20%).
2. **Abbozzo piccolo**: 3 direzioni, ciascuna in un solo formato (4:5) su un'immagine di prova,
   più un foglio di confronto. Proposte:
   - **A · Cornice**: immagine intera sul colore dello sponsor; in alto «MAIN SPONSOR · STAGIONE»;
     in basso la fascia bianca con la firma club × sponsor (come il Collab di oggi).
   - **B · Piani K**: immagine in una scheda bianca; nei margini i piani a 45° della grafica K
     del club, nei colori dello sponsor; logo dello sponsor nell'angolo.
   - **C · Divisa**: immagine nei 3/4 alti, blocco sotto con titolo, invito e loghi.
   Ogni variante è una copia con suffisso, mai sovrascritta; bozze fuori da git.
3. L'utente sceglie; poi il **set intero** della scelta: feed 4:5 (1080×1350), storia 9:16
   (1080×1920), inserzione 1:1 (1080×1080). Prova con tre forme d'immagine (orizzontale 16:9,
   verticale, quadrata), due sponsor (logo chiaro e scuro) e uno con `alcohol`.
4. Dentro `campaignFormats()` come formati in più quando il post ha l'immagine; PNG con
   html-to-image come gli altri.
5. **Banco delle regressioni**: tutte le grafiche (post, story, calendario, copertina, campagne
   di oggi) prima e dopo, nessun dato perso o rimpicciolito.

### Fase 3: scheda «Inserzione Meta»

- Database: `social_events` + `ad_text`, `ad_headline`, `ad_description`, `ad_cta` (text,
  facoltative).
- Nella campagna, riquadro «Inserzione Meta» con i campi e un contatore di caratteri sui limiti
  consigliati da Meta (testo principale ~125 visibili, titolo e descrizione corti: i numeri esatti
  si ricontrollano sulla Guida alle inserzioni di Meta prima di scriverli). Invito all'azione
  scelto fra quelli che Meta offre. Pulsanti «Copia» per ogni campo.
- Link per l'inserzione: indirizzo dello sponsor e parametri UTM da incollare nel campo
  «Parametri URL» di Meta (`utm_medium=paid_social`, sorgente con i parametri dinamici di Meta,
  da verificare). Nuova funzione accanto a `utmAddress()`, che resta com'è per i post organici.
- Scarico delle tre immagini dell'inserzione in un colpo (1:1, 4:5, 9:16).
- Sponsor con `alcohol`: promemoria «pubblico 18+ e regole Meta sugli alcolici».
- Trasparenza: oggi il testo dei post sponsor non dice che è pubblicità (`postText()` non ha
  #adv). Proposta: `#adv` in fondo al testo delle campagne e promemoria di attivare l'etichetta
  «Partnership retribuita» di Instagram. Da confermare.

### Fase 4: spese e rimborsi

- Database: `ledger_entries` + `social_event_id uuid references social_events(id) on delete set
  null`, con indice. Le regole di accesso non cambiano: i movimenti restano visibili solo col
  permesso `bilancio`.
- In Campagne, pulsante «Registra spesa» (visibile solo con `bilancio`): finestra con data,
  importo, tipo «Pubblicità Meta» (USCITA) o «Rimborso sponsor» (ENTRATA); conferma con
  `chiedi()`. Scrive in `ledger_entries` con la categoria e il titolo della campagna nella
  descrizione: in Bilancio esce come ogni altro movimento della stagione.
- Sulla scheda della campagna: speso, rimborsato, netto (somma dei movimenti collegati). Chi non
  ha `bilancio` non vede niente: il database non glieli dà.
- Test: in `supabase/test_ruoli.sh`, chi ha solo `social` non legge né scrive i movimenti
  collegati; eliminare la campagna lascia il movimento senza collegamento. In
  `test-browser/campagne.js`, il totale e il pulsante nascosto senza `bilancio`.

### Fase 5: verifica e rilascio

- Test del browser (`test-browser/esegui.sh`) in Chrome e Firefox, poi controllo nel Chrome
  dell'utente (claude-in-chrome) a 1280 e al telefono.
- Review OCR (`ocr delegate`) prima della produzione.
- Database in produzione: backup, poi solo le istruzioni nuove (Fasi 3 e 4) con `lock_timeout`.
- Commit locali per fase; push solo col sì (il push pubblica il sito).

## File toccati

| File | Cosa |
|---|---|
| `web/social.html` | sezione Campagne, filtro, immagine per gli sponsor, scheda Meta, spese |
| `web/social-templates.js` | formati con l'immagine dello sponsor, UTM delle inserzioni, `#adv` |
| 11 `web/*.html` e 2 `ricerca/*.html` | voce di menu, `?v=` |
| `supabase/schema.sql`, `supabase/test_ruoli.sh` | 4 colonne in `social_events`, collegamento in `ledger_entries`, test |
| `test-browser/campagne.js`, `test-browser/esegui.sh` | test nuovi |
| `docs/` (guida d'uso, se c'è la pagina Social) | come si fa una campagna con l'immagine e un'inserzione |

## Rischi

| Rischio | Quanto | Cosa si fa |
|---|---|---|
| Diritti delle immagini di terzi e regole del marchio dello sponsor | medio | immagine mai tagliata né coperta; avviso nel form; chiedere allo sponsor |
| Peso del database: immagini a 1920 px in `social_events` (~0,3-0,6 MB l'una) | basso | l'elenco già non le carica (`LIST_COLUMNS`); se crescono molto, bucket Storage |
| Pubblicità non dichiarata | medio | `#adv` e etichetta «Partnership retribuita» (Fase 3) |
| Inserzioni di alcolici | medio | promemoria 18+ e avvertenza sulle immagini |
| Limiti e parametri di Meta cambiano | basso | numeri ricontrollati sulla guida Meta prima di scriverli |
| Regressioni sulle grafiche di oggi | medio | banco di tutte le grafiche prima e dopo |

**Complessità: media.** Fase 1 piccola; Fase 2 la più lunga (giri di bozze con l'utente);
Fasi 3 e 4 piccole.

## Serve dall'utente

1. Sì al piano (o cosa cambiare).
2. Un'immagine vera di uno sponsor per le bozze (se non c'è, una foto neutra di prova).
3. Conferma su `#adv` nel testo delle campagne.

## Esito TDD (28/10/2026)

Commit: `38159f5` test in rosso, `efb2bf3` verde senza i formati con l'immagine, `0b5cea4` grafica B.

| Cosa è garantito | Prova | Rosso | Verde |
|---|---|---|---|
| Voce Campagne nel menu e conteggi separati Post/Campagne | `test-browser/campagne.js` voceMenu, contaCampagne, contaPost | manca `filtroSponsor` | ok |
| #campagne solo sponsor, filtro per sponsor, #post il resto; una campagna si apre in #campagne | campagne.js soloCampagne, filtro, postSenzaCampagne, apreInCampagne, nuovaCampagna | idem | ok |
| Immagine dello sponsor: campo visibile, ridotta a 1920 px, senza comandi per spostarla | campagne.js campoImmagine, immagine1920, senzaSposta, posizioneVuota | idem | ok |
| Tre formati con l'immagine intera, nessun testo sopra | campagne.js formatiImmagine, immagineScoperta; `web/test-social.js` | «0 formati con l'immagine» | ok |
| Inserzione Meta: campi salvati, contatore oltre il limite, parametri URL, 18+ per gli alcolici | campagne.js contatore, campiMeta, parametri, alcol18; test-social.js `adUrlParams` | idem | ok |
| `#adv` nel testo delle campagne, non in quello delle gite | test-social.js | assert | ok |
| Spese: totali e movimento in Bilancio dopo la conferma; senza `bilancio` niente riquadro né lettura | campagne.js totali, chiedeConferma, movimento; `campagne-solo-social.js` | idem | ok |
| Database: colonne ad_*, collegamento on delete set null, permessi invariati | `supabase/test_ruoli.sh` | manca `social_event_id` | «tutto a posto» |

Review indipendente (agente code-reviewer sul diff): nessun problema critico o alto; corretti
tutti i medi e i bassi con TDD (`bc26036` rosso, poi verde): errore dell'importo dentro la
finestra delle spese e «1.250» rifiutato; i campi dell'inserzione non ridisegnano le immagini;
contatori legati ai campi; titolo troppo lungo con avviso; «Copia il sito» spento senza
indirizzo; domande di eliminazione che dicono che le spese restano in Bilancio; «Duplica» tiene
l'immagine dello sponsor; un'immagine pronta dopo l'apertura di un altro post non ci finisce
dentro; riquadro vuoto di Campagne. Prove in `test-browser/campagne-modifiche.js`.

Comandi: `node web/test-social.js`, `bash test-browser/esegui.sh` (45 prove), `bash supabase/test_ruoli.sh`.
Differenze dal piano: un solo pulsante «Scarica» per immagine (scaricarle tutte insieme fa chiedere al
browser il permesso dei download multipli, scelta già fatta per i post); l'immagine dello sponsor
diventa sempre JPEG (un PNG a 1920 px peserebbe troppo nel database).

## Testi uguali in tutte le grafiche (28/10/2026, dopo le prove dell'utente)

Richiesta: «testi uguali in tutte le pagine». Tre campi (Titolo, Testo, Pulsante) usati identici
nelle sette grafiche (Immagine, Story immagine, Inserzione, Collab, Story, Grazie, Copertina);
tolto il campo «Titolo della story» e le frasi fisse («Grazie a chi ci sostiene», «… è sponsor
dello Sci Club», «Stagione … · Iscrizioni aperte»). L'ultima riga del titolo, anche se è l'unica,
nel colore d'accento ovunque; il pulsante è anche il testo dello sticker link delle story.
«Grazie» ora su fondo scuro come le altre. Con l'immagine dello sponsor restano anche le grafiche
col logo. Prove: `web/test-social.js` (ogni grafica ha titolo con accento, testo e pulsante;
nessuna frase fissa; il form non ha più il titolo della story).
