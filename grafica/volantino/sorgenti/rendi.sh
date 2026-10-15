#!/usr/bin/env bash
# Rifà il volantino A5 fronte-retro da volantino.html con Chrome headless:
#   ../volantino-2026-2027.pdf              A5 (148×210 mm), per stampare in casa o mandare
#   ../volantino-2026-2027-tipografia.pdf   154×216 mm: 3 mm di abbondanza per lato, per la tipografia
#   ../volantino-2026-2027-fronte.jpg, -retro.jpg   anteprime
set -euo pipefail
cd "$(dirname "$0")"
chrome() { google-chrome --headless=new --disable-gpu --allow-file-access-from-files --virtual-time-budget=8000 "$@" 2>/dev/null; }
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
# Foto sfumate e velo della copertina dentro i JPEG (vedi sfuma.py).
python3 sfuma.py >/dev/null
for v in ""; do
  src="volantino$v.html" out="../volantino-2026-2027$v"
  # La pagina scrive nel titolo cosa esce dal formato: deve essere una lista vuota.
  for h in "" "#tipografia"; do
    t=$(chrome --dump-dom "file://$PWD/$src$h" | grep -o '<title>[^<]*' || true)
    [[ "$t" == "<title>PRONTO []" ]] || { echo "$src$h: $t" >&2; exit 1; }
  done
  chrome --no-pdf-header-footer --print-to-pdf="$out.pdf" "file://$PWD/$src" >/dev/null
  chrome --no-pdf-header-footer --print-to-pdf="$out-tipografia.pdf" "file://$PWD/$src#tipografia" >/dev/null
  pdftoppm -r 150 -jpeg -jpegopt quality=88 "$out.pdf" "$TMP/v"
  # La copertina deve arrivare al bordo destro: niente striscia bianca.
  python3 - "$TMP/v-1.jpg" <<'PY'
import sys
from PIL import Image
im = Image.open(sys.argv[1]).convert("RGB"); w, h = im.size
bianchi = [y for y in range(int(h * .22), int(h * .30)) if min(im.getpixel((w - 1, y))) > 235]
sys.exit(f"striscia bianca sul bordo destro della copertina ({len(bianchi)} righe)" if bianchi else 0)
PY
  mv "$TMP/v-1.jpg" "$out-fronte.jpg"; mv "$TMP/v-2.jpg" "$out-retro.jpg"
  echo "$out.pdf  $(pdfinfo "$out.pdf" | grep 'Page size' | cut -c18-)"
done
