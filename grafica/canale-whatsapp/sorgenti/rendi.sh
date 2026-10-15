#!/usr/bin/env bash
# Rifà il cartello (PDF da stampare e JPEG di anteprima) con Chrome headless, in
# due versioni: chiara (cartello.html) e scura (cartello.html#scuro), e la story (story.html).
# Il QR nella scheda di tesseramento sta in ../../scheda-tesseramento/.
set -euo pipefail
cd "$(dirname "$0")"
chrome() { google-chrome --headless=new --disable-gpu --hide-scrollbars --virtual-time-budget=8000 "$@" 2>/dev/null; }
# pagina uscita (senza estensione)
rendi() {
  chrome --no-pdf-header-footer --print-to-pdf="$2.pdf" "file://$PWD/$1" >/dev/null
  chrome --window-size=794,1123 --force-device-scale-factor=2 --screenshot="$2.png" "file://$PWD/$1" >/dev/null
  python3 -c "import sys; from PIL import Image; Image.open(sys.argv[1]).convert('RGB').save(sys.argv[2], quality=88, optimize=True)" "$2.png" "$2.jpg"
  rm "$2.png"
  echo "$2.pdf"
}
rendi cartello.html ../cartello-canale-whatsapp
rendi "cartello.html#scuro" ../cartello-canale-whatsapp-scuro

# La story del canale, 1080×1920, da caricare su Instagram e Facebook.
chrome --window-size=1080,1920 --screenshot=../story-canale-whatsapp.png "file://$PWD/story.html" >/dev/null
python3 -c "import sys; from PIL import Image; Image.open(sys.argv[1]).convert('RGB').save(sys.argv[2], quality=90, optimize=True)" ../story-canale-whatsapp.png ../story-canale-whatsapp.jpg
rm ../story-canale-whatsapp.png
echo ../story-canale-whatsapp.jpg
