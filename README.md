# Sci Club Don Bosco — gestionale soci

Gestione iscrizioni, pagamenti e riepilogo stagionale dello Sci Club Don Bosco.

Nel repository convivono due versioni: quella in uso e quella nuova.

| | Versione 2.0 (`web/` + `supabase/`) | Versione 1.x (`legacy/`) |
|---|---|---|
| Database | Supabase (PostgreSQL) | Google Sheet |
| Pagine | HTML statico su GitHub Pages | Web app Google Apps Script |
| Stato | in collaudo | in uso |

La 1.x resta funzionante e intatta in `legacy/` finché la 2.0 non è collaudata.

## Struttura

```
web/           le tre pagine della 2.0 + login (HTML statico, nessun build)
supabase/      schema del database, verifiche e generatore della migrazione
legacy/        la versione 1.x su Apps Script, lasciata come riferimento
docs/          documentazione
```

## Le tre pagine

| Pagina | A cosa serve |
|---|---|
| `web/index.html` | anagrafica e iscrizione soci, con gestione del capofamiglia |
| `web/admin.html` | pannello pagamenti: saldi per nucleo familiare, incassi |
| `web/riepilogo.html` | riepilogo della stagione: soci, incassato, da incassare, conteggi |

L'accesso richiede un utente Supabase: senza login le pagine non mostrano nulla.

## Da dove partire

| Serve | Documento |
|---|---|
| Capire come funziona il sistema attuale e perché è fatto così | [docs/DOCUMENTAZIONE.md](docs/DOCUMENTAZIONE.md) |
| Creare gli account (Supabase, GitHub, utenti del direttivo) | [docs/ACCOUNT.md](docs/ACCOUNT.md) |
| Migrare i dati e pubblicare le pagine | [docs/MIGRAZIONE_2.0.md](docs/MIGRAZIONE_2.0.md) |

## Sviluppo in locale

```bash
cd web && python3 -m http.server 8000
# poi apri http://localhost:8000/login.html
```

Non c'è nessuno step di build: le pagine sono HTML e JavaScript serviti così come sono.

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
