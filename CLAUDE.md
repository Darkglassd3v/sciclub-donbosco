## Come si lavora qui

- Prima leggere `PROJECT-CONTEXT.md` (breve) e `TODO.md` (cosa fare);
  regole, rilascio e database in `docs/SVILUPPO.md`.
- Commit locali liberi, limitati ai file toccati (`git commit -- file...`). Il push su
  `3.0-SNAPSHOT` pubblica il sito: è autorizzato senza chiedere quando il lavoro è finito, con le
  prove verdi e la code review fatta. Prima del push si controlla `git status`; poi deploy
  verificato e merge in `dev`. Si chiede prima solo per le modifiche di origine sconosciuta.
- Richieste nuove in **cima** a `TODO.md`, sezione "Richieste nuove", non in fondo.
- "Riprendi il lavoro in cima a TODO.md": dopo `PROJECT-CONTEXT.md` e `TODO.md`, implementare
  nello stesso turno la prima voce di "Richieste nuove" (modifiche, comandi, verifica, resoconto
  di cosa è fatto e cosa no): la sola lettura non chiude il turno.
- Interfaccia, commenti e variabili JS in italiano; nomi database in inglese.
- Campagne Meta (Facebook e Instagram): prima leggere `docs/META-ADS.md` (esperienze reali
  raccolte nei forum, posizionamenti da escludere, età, divisione Facebook/Instagram) e
  aggiungerci ciò che si scopre di utile.

## graphify

Progetto ha knowledge graph in graphify-out/ con god nodes, struttura community e relazioni cross-file.

Rules:
- Per domande codebase, prima `graphify query "<question>"` se graphify-out/graph.json esiste. Usa `graphify path "<A>" "<B>"` per relazioni e `graphify explain "<concept>"` per concetti specifici. Restituiscono subgraph mirato, molto più piccolo di GRAPH_REPORT.md o grep grezzo.
- Se graphify-out/wiki/index.md esiste, usarlo per navigazione ampia invece di browsing sorgente diretto.
- Leggi graphify-out/GRAPH_REPORT.md solo per review architettura ampia o quando query/path/explain non bastano.
- Dopo modifiche codice, `graphify update .` per aggiornare graph (solo AST, zero costo API).
- graphify non vede funzioni scritte dentro script pagine HTML (es. `web/index.html`, `web/social.html`): cercare direttamente nei file.