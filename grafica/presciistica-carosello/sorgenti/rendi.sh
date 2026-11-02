#!/usr/bin/env bash
# Rifà le quattro pagine del carosello (1080×1350) con Chrome headless e Pillow per il JPEG.
set -euo pipefail
cd "$(dirname "$0")"
for n in 1 2 3 4; do
  google-chrome --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 --virtual-time-budget=8000 \
    --allow-file-access-from-files --window-size=1080,1350 --screenshot="../presciistica-$n.png" "file://$PWD/carosello.html#$n" >/dev/null 2>&1
  python3 -c "import sys; from PIL import Image; Image.open(sys.argv[1]).convert('RGB').save(sys.argv[2], quality=92, optimize=True)" "../presciistica-$n.png" "../presciistica-$n.jpg"
  rm "../presciistica-$n.png"
  echo "../presciistica-$n.jpg"
done
