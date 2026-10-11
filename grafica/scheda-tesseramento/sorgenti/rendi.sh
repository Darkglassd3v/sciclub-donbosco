#!/usr/bin/env bash
# Rifà la scheda di tesseramento col QR del canale WhatsApp:
#   ../tesseramento-con-qr.xlsx   il file da usare (solo in locale: vedi il README)
#   ../scheda-con-qr.pdf          la scheda, una pagina, come la stampa LibreOffice
#   ../ricevuta-con-qr.pdf        la ricevuta
#   ../*.jpg                      le anteprime
# L'originale è legacy/dati26/1TESSERAMENTO Scheda e Ricevuta.xlsx e non si tocca.
set -euo pipefail
cd "$(dirname "$0")"
ORIGINALE="../../../legacy/dati26/1TESSERAMENTO Scheda e Ricevuta.xlsx"
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

# La scritta accanto al QR (47×9 mm del foglio), a ~760 dpi.
chrome() { google-chrome --headless=new --disable-gpu --hide-scrollbars --virtual-time-budget=8000 "$@" >/dev/null 2>&1; }
chrome --window-size=178,34 --force-device-scale-factor=8 --screenshot=../scritta-qr.png "file://$PWD/etichetta.html#scritta"
# Il riquadro della ricevuta (19×30 mm del foglio).
chrome --window-size=72,114 --force-device-scale-factor=8 --screenshot=../riquadro-qr.png "file://$PWD/etichetta.html#riquadro"

python3 metti-qr.py "$ORIGINALE" ../tesseramento-con-qr.xlsx

# PDF da LibreOffice, come l'originale: immagini senza perdita e alla loro risoluzione.
# Il file esportato è una copia senza l'autore nelle proprietà, che finirebbe nel PDF.
python3 - ../tesseramento-con-qr.xlsx "$TMP/tesseramento.xlsx" <<'EOF'
import re, sys, zipfile
with zipfile.ZipFile(sys.argv[1]) as z, zipfile.ZipFile(sys.argv[2], "w", zipfile.ZIP_DEFLATED) as out:
    for n in z.namelist():
        dati = z.read(n)
        if n == "docProps/core.xml":
            dati = re.sub(rb"<(dc:creator|cp:lastModifiedBy)>[^<]*</", rb"<\1></", dati)
        out.writestr(n, dati)
EOF
soffice --headless -env:UserInstallation="file://$TMP/lo" --convert-to \
  'pdf:calc_pdf_Export:{"UseLosslessCompression":{"type":"boolean","value":"true"},"ReduceImageResolution":{"type":"boolean","value":"false"}}' \
  --outdir "$TMP" "$TMP/tesseramento.xlsx" >/dev/null 2>&1
# Pagina 1 la ricevuta, pagina 2 la scheda (l'ordine dei fogli nel file).
pdfseparate -f 1 -l 1 "$TMP/tesseramento.pdf" ../ricevuta-con-qr.pdf
pdfseparate -f 2 -l 2 "$TMP/tesseramento.pdf" ../scheda-con-qr.pdf

for f in scheda ricevuta; do
  pdftoppm -r 100 -png "../$f-con-qr.pdf" "$TMP/$f"
  python3 -c "import sys; from PIL import Image; Image.open(sys.argv[1]).convert('RGB').save(sys.argv[2], quality=85, optimize=True)" "$TMP/$f-1.png" "../$f-con-qr.jpg"
  echo "../$f-con-qr.pdf"
done
