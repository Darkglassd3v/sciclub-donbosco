"""Le foto delle gite già sfumate: la sfumatura a 45° (piena in basso a destra, svanisce verso il testo
in alto a sinistra) e la trasparenza sono fuse sul bianco dentro la foto.

Con una maschera CSS molti lettori PDF mostravano la foto senza sfumatura; un JPEG normale si vede
uguale ovunque, anche in stampa. Lo chiama rendi.sh:

    python3 sfuma.py
      foto/colonna-*.jpg               la montagna sul lato destro di ogni gita, alta quanto il riquadro
      foto/copertina-alta-velata.jpg   la copertina col velo blu sotto i contatti
"""
from pathlib import Path
from PIL import Image

QUI = Path(__file__).resolve().parent / "foto"
PIENA, VUOTA = .22, .7     # lungo la diagonale dal basso a destra: piena fino al 22%, sparita al 70%
OPACITA = .88              # la foto al massimo, sopra il bianco del riquadro


def sfuma(nome, uscita, proporzione, largo=None, bordo=0):
    """Ritaglia `nome` alla proporzione larghezza/altezza (centrato, un po' sopra la metà), sfuma e salva.
    `bordo`: quanta larghezza (frazione) usare per sfumare anche il lato sinistro, che altrimenti resta netto."""
    im = Image.open(QUI / f"{nome}.jpg").convert("RGB")
    w, h = im.size
    if w / h > proporzione:
        nw = round(h * proporzione); im = im.crop(((w - nw) // 2, 0, (w - nw) // 2 + nw, h))
    else:
        nh = round(w / proporzione); top = round((h - nh) * .45); im = im.crop((0, top, w, top + nh))
    if largo:  # solo per rimpicciolire: mai ingrandire la foto
        im = im.resize((largo, round(largo / proporzione)), Image.LANCZOS)
    W, H = im.size
    # Sfumatura a 45°: la posizione lungo la diagonale vale 0 nell'angolo in basso a destra, 1 in alto a sinistra.
    alfa = Image.new("L", (W, H))
    sinistra = (lambda x: min(1, x / (bordo * W))) if bordo else (lambda x: 1)
    alfa.putdata([round(255 * OPACITA * sinistra(x) * min(1, max(0, (VUOTA - ((W - 1 - x) + (H - 1 - y)) / (W + H)) / (VUOTA - PIENA))))
                  for y in range(H) for x in range(W)])
    Image.composite(im, Image.new("RGB", (W, H), "white"), alfa).save(QUI / uscita, quality=88, optimize=True)
    print(f"foto/{uscita} {W}×{H}")


# La colonna destra del riquadro, 46% di 136 mm di larghezza per l'altezza dell'elenco
# (misurata sul volantino: domenica e martedì 77,3 mm, sabato 59,2 mm).
for nome, alto in (("monte-bianco", 77.3), ("paramont", 77.3), ("pista-san-bernardo", 59.2)):
    sfuma(nome, f"colonna-{nome}.jpg", 62.6 / alto, bordo=.35)

# Copertina: il velo blu sotto i contatti fuso nella foto (con la trasparenza CSS alcuni lettori
# PDF lo disegnavano male). Misure dal fondo della foto, larga 148 mm: la fascia dei contatti va da 30,6 a
# 9,5 mm dal fondo; sotto c'è la fascia gialla, piena. Il velo sale da 0 a .55 nei primi 4,5 mm, poi fino a .8.
# Il ritaglio di FOTO COPERTINA_mod.JPG (righe 392–2546 dell'originale) portato al fondo: righe 598–2752.
cop = Image.open(QUI.parent.parent / "FOTO COPERTINA.JPG").convert("RGB")
assert cop.size == (4128, 2752), cop.size
cop = cop.crop((0, 598, 4128, 2752)); cop.thumbnail((2600, 2600))
cop.save(QUI / "copertina-alta.jpg", quality=88, optimize=True)
W, H = cop.size
px = W / 148
alto, basso, rampa = 30.6, 9.5, 4.5
def velo(d):
    t = alto - d
    if t <= 0: return 0
    if t < rampa: return .55 * t / rampa
    return .55 + .25 * min(1, (t - rampa) / (alto - basso - rampa))
maschera = Image.new("L", (W, H))
maschera.putdata([round(255 * velo((H - 1 - y) / px)) for y in range(H) for x in range(W)])
Image.composite(Image.new("RGB", (W, H), (6, 57, 106)), cop, maschera).save(QUI / "copertina-alta-velata.jpg", quality=88, optimize=True)
print(f"foto/copertina-alta-velata.jpg {W}×{H}")
