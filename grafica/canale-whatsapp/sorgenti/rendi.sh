#!/usr/bin/env bash
# Rifà il cartello (PDF da stampare e JPEG di anteprima) con Chrome headless.
# Il QR nella scheda di tesseramento sta in ../../scheda-tesseramento/.
set -euo pipefail
cd "$(dirname "$0")"
chrome() { google-chrome --headless=new --disable-gpu --hide-scrollbars --virtual-time-budget=8000 "$@" 2>/dev/null; }
chrome --no-pdf-header-footer --print-to-pdf=../cartello-canale-whatsapp.pdf "file://$PWD/cartello.html" >/dev/null
chrome --window-size=794,1123 --force-device-scale-factor=2 --screenshot=../cartello.png "file://$PWD/cartello.html" >/dev/null
python3 -c "from PIL import Image; Image.open('../cartello.png').convert('RGB').save('../cartello-canale-whatsapp.jpg', quality=88, optimize=True)"
rm ../cartello.png
echo ../cartello-canale-whatsapp.pdf

