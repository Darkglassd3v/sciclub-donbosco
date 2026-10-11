#!/usr/bin/env bash
# Rifà il cartello (PDF da stampare e JPEG di anteprima) e le etichette col
# QR per la scheda e la ricevuta del tesseramento, con Chrome headless.
set -euo pipefail
cd "$(dirname "$0")"
chrome() { google-chrome --headless=new --disable-gpu --hide-scrollbars --virtual-time-budget=8000 "$@" 2>/dev/null; }
chrome --no-pdf-header-footer --print-to-pdf=../cartello-canale-whatsapp.pdf "file://$PWD/cartello.html" >/dev/null
chrome --window-size=794,1123 --force-device-scale-factor=2 --screenshot=../cartello.png "file://$PWD/cartello.html" >/dev/null
python3 -c "from PIL import Image; Image.open('../cartello.png').convert('RGB').save('../cartello-canale-whatsapp.jpg', quality=88, optimize=True)"
rm ../cartello.png
echo ../cartello-canale-whatsapp.pdf

# Etichette per il file del tesseramento (PNG a ~760 dpi della misura del foglio).
# etichetta larghezza altezza (px a 96 dpi)
etichetta() {
  chrome --window-size="$2,$3" --force-device-scale-factor=8 --screenshot="../etichetta-$1.png" "file://$PWD/etichetta.html#$1" >/dev/null
  echo "../etichetta-$1.png"
}
etichetta scheda 257 72
etichetta ricevuta 272 113
