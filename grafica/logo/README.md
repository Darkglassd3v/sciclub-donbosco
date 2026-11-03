# Logo Sci Club Don Bosco

Il logo è quello **ufficiale**: `logo-ufficiale.JPG` (728×468, scansione stampata col retino, su
cielo blu), con «Sci Club» in alto a sinistra e «ASTI» in basso a destra. Il deploy copia solo
`web/` e `ricerca/`: il sito e le grafiche usano ovunque solo il logo tondo, `logo-ufficiale-blu-tondo.svg` e
`logo-ufficiale-tondo.svg` (barra, accesso, post, campagne, scheda PDF del socio, icona della scheda in `ricerca/`),
copiati in `web/`. Se un SVG qui cambia, va ricopiato in `web/`.

| File | Cosa | Per |
|---|---|---|
| `logo-ufficiale.JPG` | l'originale, col cielo: lo storico, a bassa qualità | sorgente del ricalco: non si pubblica, non si ritocca |
| `logo-ufficiale-trasparente-lettere-blu.svg` | l'ufficiale ricalcato in vettoriale, senza cielo, per fondo chiaro | non si usa più (dal 3/11): base dei loghi tondi |
| `logo-ufficiale.svg` | l'ufficiale ricalcato, su fondo blu, contorni bianchi | stampe, grafiche su blu |
| `logo-ufficiale-blu-tondo.svg` | l'ufficiale blu nel cerchio, in vettoriale (copia in `web/`) | fondi chiari e gialli: post, story, carosello, scheda PDF |
| `logo-ufficiale-tondo.svg` | cerchio bianco con l'anello giallo, lettere blu (copia in `web/`) | fondi scuri, barra e accesso del sito, campagne, cartello, volantino |
| `logo-ufficiale-blu-tondo.png` | 1080×1080, cerchio blu, fuori trasparente | immagine del profilo |
| `logo-ufficiale-bianco-tondo.png` | 1080×1080, cerchio bianco con filo blu e giallo, fuori trasparente | immagine del profilo |
| `logo-ufficiale-blu-quadrato.png` | 1080×1080, quadrato blu (il logo sta nel cerchio) | profilo, post |
| `logo-ufficiale-bianco-quadrato.png` | 1080×1080, quadrato bianco | profilo, post |
| `logo-ufficiale-trasparente-lettere-blu.png` | 1080×1080, senza fondo | post su fondi chiari |
| `logo-ufficiale-trasparente-contorni-bianchi.png` | 1080×1080, senza fondo | post su fondi scuri e foto |

Colori: giallo `#FCCF02`, blu `#084C8D` (gli stessi di `docs/brand-guidelines.md`).

**È un ricalco** del JPG, non il file del grafico: `strumenti/ricalca_ufficiale.py` separa il giallo
e il bianco dal cielo per colore; il riempimento di BOSCO, blu come il cielo, lo ricava dai contorni
bianchi. Sul fondo chiaro i contorni bianchi spariscono: resta la sagoma blu con il giallo sopra.
Per rifarlo, dalla cartella `grafica/logo/`:

    uv run --with numpy --with pillow --with scipy --with potracer \
      python strumenti/ricalca_ufficiale.py logo-ufficiale.JPG logo-ufficiale-trasparente-lettere-blu.svg

Se si ritrova il file originale (PDF, AI, SVG), usare quello. I PNG `logo-ufficiale-*` si rifanno
da `strumenti/profilo.html` (`#blu`, `#bianco-quadrato`, `#trasparente-blu`, …).
La ricostruzione vecchia (`logo_sciclubdonbosco.*`, 07/10, senza «Sci Club» né «ASTI») è stata tolta
il 15/10: è nella storia di git.
