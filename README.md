# Sci Club Don Bosco — gestionale soci

Gestione iscrizioni, pagamenti e riepilogo stagionale dello Sci Club Don Bosco.

Nel repository convivono due versioni: quella in uso e quella nuova.

| | Versione 2.0 (`web/` + `ricerca/` + `supabase/`) | Versione 1.x (`legacy/`) |
|---|---|---|
| Database | Supabase (PostgreSQL) | Google Sheet |
| Pagine | HTML statico su GitHub Pages | Web app Google Apps Script |
| Stato | in collaudo | in uso |

La 1.x resta funzionante e intatta in `legacy/` finché la 2.0 non è collaudata.

## Struttura

```
web/           il gestionale: iscrizioni, pagamenti, riepilogo, amministrazione
ricerca/       sito separato per telefono: ricerca soci e abbonamenti gite
supabase/      schema del database, verifiche e generatore della migrazione
legacy/        la versione 1.x su Apps Script, lasciata come riferimento
docs/          documentazione, incluse le linee guida del marchio
```

Niente build: sono file HTML e JavaScript serviti così come sono. I colori e le
misure stanno in `web/brand.css`, che nasce da
[docs/brand-guidelines.md](docs/brand-guidelines.md).

## Le pagine

| Pagina | A cosa serve |
|---|---|
| `web/index.html` | anagrafica e iscrizione soci, con gestione del capofamiglia |
| `web/admin.html` | incassi: un pulsante per nucleo familiare, niente altro |
| `web/riepilogo.html` | riepilogo della stagione: soci, incassato, da incassare, conteggi |
| `web/stagione.html` | chiusura della stagione: archivia e azzera i dati dell'anno |
| `ricerca/index.html` | sito a parte: si cerca un socio, con i pulsanti per chiamarlo o scrivergli su WhatsApp |
| `ricerca/gite.html` | abbonamenti a viaggi: chi ne ha uno, quante gite ha ancora, e si scalano da qui |

Il pannello pagamenti fa una cosa sola: portare a zero il saldo di una famiglia.
Le quote, la polizza e la tessera si scrivono dove si fa l'iscrizione, nella
pagina Soci.

Le due pagine di `ricerca/` sono pensate per il telefono e restano separate fra
loro: una serve a trovare e chiamare un socio, l'altra a scalare le gite. Non
si mescolano.

## Abbonamenti a viaggi

Il listino vende abbonamenti da 5 viaggi per sabato, domenica, martedì o jolly
(jolly = qualsiasi giorno). Quante gite comprende e per che giorno vale sono
colonne del listino (`prices.trips`, `prices.day`), riempite dal nome
dell'opzione la prima volta che si lancia lo schema.

Su `ricerca/gite.html` si filtra per giorno — chiedendo un giorno preciso
compaiono anche i jolly, che valgono lo stesso — si cerca per cognome, e ogni
abbonamento mostra il suo conto: **3/5 — LIBERE 2**.

Per scalare c'è un solo pulsante: **＋ Segna una gita**. Un tocco, una gita, con
la data del giorno in cui si preme. Niente data da scegliere e niente numero di
persone da indicare: chi lo usa è sul pullman alle sette del mattino, e se
salgono in due si preme due volte. La data serve solo a ritrovare una
registrazione sbagliata, non a raccontare la stagione.

Ogni pressione è una riga in `trip_uses` e si annulla da «Gite fatte». Il
controllo sul residuo sta nella funzione `use_trip()` sul database, non nella
pagina: due telefoni che segnano la stessa gita non possono portare il
contatore sotto zero.

Sul pullman la linea va e viene, e una richiesta può arrivare al database
senza che la risposta torni indietro: la pagina non saprebbe se la gita è
stata scalata, e riprovare rischierebbe di scalarla due volte. Per questo
ogni pressione porta con sé un id generato dal telefono
(`trip_uses.client_id`): se la stessa chiamata parte due volte, il database
riconosce la seconda come lo stesso gesto e non scala niente. Riprovare è
sempre sicuro.

L'accesso richiede un utente Supabase: senza login né il gestionale né il sito
di ricerca mostrano qualcosa.

## Chiudere la stagione

A settembre, prima di aprire le iscrizioni nuove, si va su `web/stagione.html`
e si chiude l'anno. Le anagrafiche restano; tesseramento, pagamenti, partenze,
nuclei familiari, note e data di iscrizione vengono prima riepilogati in
`season_history` (i cinque totali della stagione) e `season_breakdown` (i
conteggi per tipologia) e poi azzerati — a differenza dell'anagrafica, che non
viene mai duplicata: resta la stessa riga in `members`, anno dopo anno. Le
gite già registrate restano: portano con sé la stagione in cui sono state
fatte, e a ripartire da zero sono solo i contatori dell'anno nuovo. Serve
scrivere a mano la frase `CHIUDI STAGIONE`: non basta un clic. Ogni stagione
chiusa ha un pulsante Dettaglio che mostra i conteggi per tipologia di
quell'anno.

Il listino prezzi e i luoghi di partenza non vengono toccati: se cambiano le
quote, si aggiornano da Supabase.


## Da dove partire

| Serve | Documento |
|---|---|
| Capire come funziona il sistema attuale e perché è fatto così | [docs/DOCUMENTAZIONE.md](docs/DOCUMENTAZIONE.md) |
| Creare gli account (Supabase, GitHub, utenti del direttivo) | [docs/ACCOUNT.md](docs/ACCOUNT.md) |
| Migrare i dati e pubblicare le pagine | [docs/MIGRAZIONE_2.0.md](docs/MIGRAZIONE_2.0.md) |

## Sviluppo in locale

```bash
cd web && python3 -m http.server 8000     # gestionale, su /login.html
cd ricerca && python3 -m http.server 8001 # sito di ricerca
node ricerca/test-ricerca.js              # controlla la logica della ricerca
```

Non c'è nessuno step di build: le pagine sono HTML e JavaScript serviti così come sono.
Il workflow di GitHub Pages pubblica `web/` alla radice e `ricerca/` sotto `/ricerca/`.

## Dati personali

> Il repository è **pubblico**. Il database contiene anagrafiche reali di soci — nome,
> indirizzo, telefono, codice fiscale, anche di minori.
>
> I fogli Excel di partenza e i file generati in `supabase/migration/` sono esclusi da git
> tramite `.gitignore` e vanno tenuti solo in locale o su Drive. Non vanno committati mai,
> nemmeno temporaneamente: resterebbero nella cronologia git anche dopo essere stati
> cancellati.
>
> La chiave `anon` in `web/config.js` è invece pubblica per definizione: da sola non dà
> accesso a nulla, perché le policy RLS richiedono un utente autenticato. La chiave
> `service_role` non va mai messa nelle pagine.
