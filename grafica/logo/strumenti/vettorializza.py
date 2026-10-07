"""Ricalca web/logo_sciclubdonbosco.png (228x170) in due maschere, giallo e blu,
ingrandite 12 volte e ammorbidite, pronte per potrace.

    python3 vettorializza.py            # scrive giallo.pbm e blu.pbm qui
    potrace giallo.pbm -s -o giallo.svg --turdsize 400 --alphamax 1.2 --opttolerance 0.4
    potrace blu.pbm    -s -o blu.svg    --turdsize 400 --alphamax 1.2 --opttolerance 0.4

Poi i due <g> vanno in un solo SVG (giallo sotto, blu sopra) con fill #FCCF02 e
#084C8D: è pieno.svg, che esporta.js ritaglia e trasforma in PNG e JPG.
Serve pillow e numpy.
"""
from pathlib import Path
from PIL import Image, ImageFilter
import numpy as np

ORIGINALE = Path(__file__).resolve().parents[3] / "web" / "logo_sciclubdonbosco.png"
K = 12  # ingrandimento prima del ricalco

im = np.array(Image.open(ORIGINALE).convert("RGBA")).astype(float) / 255
rgb = im[..., :3] * im[..., 3:4] + (1 - im[..., 3:4])  # su bianco
W = np.array([1, 1, 1.0])
GIALLO = np.array([252, 207, 2]) / 255
BLU = np.array([8, 76, 141]) / 255
# Ogni pixel = bianco + y*(giallo-bianco) + b*(blu-bianco): quanto c'è di ciascun colore.
M = np.stack([GIALLO - W, BLU - W], 1)
coef, *_ = np.linalg.lstsq(M, (rgb - W).reshape(-1, 3).T, rcond=None)
for nome, c in (("giallo", coef[0]), ("blu", coef[1])):
    m = np.clip(c, 0, 1).reshape(rgb.shape[:2])
    grande = Image.fromarray((m * 255).astype(np.uint8)).resize((m.shape[1] * K, m.shape[0] * K), Image.LANCZOS)
    grande = grande.filter(ImageFilter.GaussianBlur(K * 0.5))
    Image.fromarray(np.where(np.array(grande) > 127, 0, 255).astype(np.uint8)).convert("1").save(f"{nome}.pbm")
