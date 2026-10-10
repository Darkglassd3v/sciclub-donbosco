#!/usr/bin/env bash
# Rende le proposte in JPEG nella cartella sopra, a misura esatta, con Chrome
# headless (serve la rete per Barlow da Google Fonts) e Pillow per il JPEG.
#   ./rendi.sh            tutte le immagini
#   ./rendi.sh verifica   solo i controlli di comune.js (corpi, fasce, tagli)
set -euo pipefail
cd "$(dirname "$0")"
chrome() { google-chrome --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 --virtual-time-budget=8000 "$@" 2>/dev/null; }
PROPOSTE="a-biglietto b-calendario c-divano"

if [[ "${1:-}" == verifica ]]; then
  for p in $PROPOSTE; do for f in post story; do
    h=$([[ $f == post ]] && echo 1350 || echo 1920)
    echo "$p $f: $(chrome --window-size=1080,$h --dump-dom "file://$PWD/$p.html#$f-verifica" | grep -o 'VERIFICA[^<]*')"
  done; done
  exit
fi

# pagina formato larghezza altezza uscita
foto() {
  chrome --window-size="$3,$4" --screenshot="../$5.png" "file://$PWD/$1${2:+#$2}" >/dev/null
  python3 -c "import sys; from PIL import Image; Image.open(sys.argv[1]).convert('RGB').save(sys.argv[2], quality=90, optimize=True)" "../$5.png" "../$5"
  rm "../$5.png"
  echo "../$5"
}
for p in $PROPOSTE; do
  [[ -f $p.html ]] || continue
  foto "$p.html" post 1080 1350 "$p-post.jpg"
  foto "$p.html" story 1080 1920 "$p-story.jpg"
done
[[ -f panoramica.html ]] && foto panoramica.html "" 1720 1980 00-panoramica.jpg
true
