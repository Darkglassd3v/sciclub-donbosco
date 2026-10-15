"""Ricalca il logo ufficiale (logo-ufficiale.JPG: col cielo e il retino di stampa) in vettoriale,
senza cielo, per fondo chiaro: la sagoma di tutte le lettere e dei contorni bianchi in blu, il giallo sopra.
Il riempimento di BOSCO, blu come il cielo, si ricava dai contorni bianchi.

    cd grafica/logo
    uv run --with numpy --with pillow --with scipy --with potracer python strumenti/ricalca_ufficiale.py logo-ufficiale.JPG logo-ufficiale-trasparente-lettere-blu.svg

Se si ritrova il file originale del grafico (PDF, AI, SVG), usare quello.
"""
import sys, time
from PIL import Image, ImageFilter
import numpy as np
from scipy import ndimage as nd
import potrace

K = 4  # si lavora sull'immagine ingrandita: bordi più lisci per potrace
orig = Image.open(sys.argv[1]).convert("RGB")
grande = orig.resize((orig.width * K, orig.height * K), Image.LANCZOS)
def canali(sigma):
    a = np.asarray(grande.filter(ImageFilter.GaussianBlur(sigma * K))).astype(int)
    return a[..., 0], a[..., 1], a[..., 2]
# Il giallo con più sfumatura (il retino di stampa lo buca), il bianco con meno (i contorni sono sottili).
R, G, B = canali(1.6)
Y = (R > 140) & (G > 110) & (B < 150) & (R - B > 60)
R, G, B = canali(.9)
W = (np.minimum(np.minimum(R, G), B) > 180) & ~Y
def pulisci(m, minimo):
    lab, n = nd.label(m); area = nd.sum(m, lab, range(1, n + 1))
    return np.isin(lab, 1 + np.flatnonzero(area >= minimo))
Y = pulisci(Y, 40 * K * K); Y |= ~pulisci(~Y, 30 * K * K)          # buchi piccoli nel giallo chiusi
W = pulisci(W, 20 * K * K) & ~Y
nonW = ~(W | Y) ; W |= ~pulisci(nonW, 12 * K * K) & ~Y               # puntini scuri nel bianco
# Zone non bianche: profondità alternata attraverso i contorni bianchi
# (cielo 0, lettere 1, buchi delle lettere 2...). Il giallo è sempre lettera.
nonW = ~W
lab, n = nd.label(nonW)
gialle = set(1 + np.flatnonzero(nd.sum(Y, lab, range(1, n + 1)) / nd.sum(nonW, lab, range(1, n + 1)) > .5))
bordo = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
prof = {l: 0 for l in bordo}; prof.update({l: 1 for l in gialle})
fronte = set(prof)
while fronte:
    nuovi = {}
    for k in sorted({prof[l] for l in fronte}):
        m = np.isin(lab, [l for l in fronte if prof[l] == k])
        toccati = set(np.unique(lab[nd.binary_dilation(m, iterations=6 * K)])) - {0} - set(prof)
        for l in toccati: nuovi.setdefault(l, k + 1)
    prof.update(nuovi); fronte = set(nuovi)
riemp = np.isin(lab, [l for l, p in prof.items() if p % 2 == 1 and l not in gialle])
sagoma = W | Y | riemp
print("profondità", {p: sum(1 for v in prof.values() if v == p) for p in set(prof.values())}, "senza", n - len(prof))

def traccia(m):
    g = np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(K * .5))) > 127
    t = time.time()
    # potracer: pieno = scuro, quindi la maschera va invertita.
    plist = potrace.Bitmap(~g).trace(turdsize=60 * K, alphamax=1.15, opticurve=True, opttolerance=.4)
    d = []
    for c in plist:
        p = c.start_point; d.append(f"M{p.x:.0f} {p.y:.0f}")
        for s in c.segments:
            if s.is_corner: d.append(f"L{s.c.x:.0f} {s.c.y:.0f}L{s.end_point.x:.0f} {s.end_point.y:.0f}")
            else: d.append(f"C{s.c1.x:.0f} {s.c1.y:.0f} {s.c2.x:.0f} {s.c2.y:.0f} {s.end_point.x:.0f} {s.end_point.y:.0f}")
        d.append("Z")
    print("tracciato", len(plist), "curve", round(time.time() - t, 1), "s")
    return "".join(d)
ys, xs = np.nonzero(sagoma)
x0, y0, x1, y1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
BLU, GIALLO = "#084C8D", "#FCCF02"
svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x0 - 8} {y0 - 8} {x1 - x0 + 16} {y1 - y0 + 16}">'
       f'<path fill="{BLU}" fill-rule="evenodd" d="{traccia(sagoma)}"/>'
       f'<path fill="{GIALLO}" fill-rule="evenodd" d="{traccia(Y)}"/></svg>')
open(sys.argv[2], "w").write(svg)
print("viewBox", x0 - 8, y0 - 8, x1 - x0 + 16, y1 - y0 + 16, "byte", len(svg))
