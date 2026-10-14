# Canale WhatsApp · cartello per il negozio

Il QR porta al canale: https://whatsapp.com/channel/0029Vb98yLKIt5s3Y7pk0V2C
(provato con un lettore di QR su tutti i file, anche rimpicciolito come una
foto fatta col telefono).

## Cartello per il negozio

Due versioni, stesso cartello, A4 da stampare a grandezza naturale (senza
"adatta alla pagina"): **chiara** `cartello-canale-whatsapp.pdf`, con poco
inchiostro, e **scura** `cartello-canale-whatsapp-scuro.pdf`; anteprime nei
`.jpg` con lo stesso nome.

<img src="cartello-canale-whatsapp.jpg" width="49%"> <img src="cartello-canale-whatsapp-scuro.jpg" width="49%">

Nello stile di K · Piani, la grafica dei post (14/10), su fondo bianco: le
fasce a 45° della K sugli angoli della pagina (blu scuro e blu in alto a
sinistra, giallo e blu in basso a destra), con ogni diagonale da un bordo
all'altro e lontana da scritte e riquadri. Al centro, grande, **Sci Club Don
Bosco Asti ASD**, sotto «Seguici su WhatsApp» in un riquadro giallo con
l'angolo tagliato, poi il QR di 86 mm nero su bianco, il colore più leggibile,
in una cornice blu con l'angolo tagliato (il fumetto verde appena fuori, per
non interromperla); il logo in alto a destra. Sotto, i passi per seguire il
canale e, in giallo, il quarto: **attivare le notifiche** con la campanella,
perché i canali arrivano senza e gli avvisi dell'ultimo minuto non si
vedrebbero. In basso a sinistra l'indirizzo per chi non riesce a inquadrare il
codice.

La **scura** è lo stesso cartello su fondo blu scuro: scritte bianche, numeri
dei passi nei quadrati gialli, la scheda del QR tutta bianca, il triangolo
interno in alto a sinistra in blu notte e il logo nel suo riquadro bianco. Le
stampanti da ufficio lasciano una cornice bianca di qualche millimetro.

## QR nella scheda di tesseramento

Sta in [`../scheda-tesseramento/`](../scheda-tesseramento/).

Per metterlo altrove: `qr-canale-whatsapp.png` (QR per stampe grandi) e
`qr-canale-whatsapp-piccolo.png` (moduli più grossi, per stampe piccole).

## Sorgenti

In `sorgenti/`: `cartello.html` (la scura è `cartello.html#scuro`), i QR in SVG
e `rendi.sh`, che rifà PDF e anteprime di tutte e due con Chrome (il carattere Barlow è in `../font/barlow/`).
