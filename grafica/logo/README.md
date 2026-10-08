# Logo Sci Club Don Bosco in alta qualità

Il deploy copia solo `web/` e `ricerca/`: il sito usa `web/logo_sciclubdonbosco.png` (228×170)
nella barra e una copia dell'SVG, `web/logo_sciclubdonbosco.svg`, nella scheda del socio stampata
dalla pagina Soci. Se l'SVG qui cambia, va ricopiato anche là.

| File | Cosa | Per |
|---|---|---|
| `logo_sciclubdonbosco.svg` | vettoriale, nitido a qualsiasi misura | stampe grandi, striscioni, magliette, grafico |
| `logo_sciclubdonbosco.png` | 3000×1857, sfondo trasparente | sopra foto o colori |
| `logo_sciclubdonbosco.jpg` | 3000×1857, sfondo bianco | documenti, allegati |
| `logo_sciclubdonbosco_quadrato.jpg` | 1080×1080, bianco, logo al centro con margine | immagine del canale WhatsApp (ritagliata a cerchio: il logo ci sta dentro) |

Colori: giallo `#FCCF02`, blu `#084C8D` (gli stessi di `docs/brand-guidelines.md`).

**È una ricostruzione**, non il file originale del grafico: ricalcata il 2026-10-07 dal PNG piccolo
del sito (`strumenti/vettorializza.py` + potrace, poi `strumenti/esporta.js` e
`strumenti/quadrato.js` con playwright per ritagliare ed esportare). Le lettere seguono la forma di
quelle piccole; in basso a destra la coda del cerchio giallo finisce in due trattini, come
nell'originale piccolo. Se si ritrova il file originale (PDF, AI, SVG), usare quello.
