## Come si lavora qui

- Prima di tutto leggere `PROJECT-CONTEXT.md` (in breve) e `TODO.md` (cosa c'è da fare);
  le regole, il rilascio e il database sono in `docs/SVILUPPO.md`.
- **Niente commit senza un sì esplicito** di chi segue il progetto.
- Le richieste nuove si scrivono **in cima** a `TODO.md`, in "Richieste nuove", non in fondo.
- Interfaccia, commenti e variabili JS in italiano; nomi del database in inglese.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
- graphify non vede le funzioni scritte dentro gli script delle pagine HTML (per esempio
  `web/index.html`, `web/social.html`): per quelle si cerca direttamente nei file.
