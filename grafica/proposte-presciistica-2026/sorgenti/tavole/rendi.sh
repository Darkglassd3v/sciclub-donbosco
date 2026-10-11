#!/usr/bin/env bash
# Rende i post delle tavole di confronto (gita, calendario, evento × A, B, C)
# e le tre tavole in ../../tavole/, con Chrome headless come ../rendi.sh.
#   ./rendi.sh            tutte le immagini
#   ./rendi.sh verifica   solo i controlli di comune.js (corpi, tagli)
set -euo pipefail
cd "$(dirname "$0")"
chrome() { google-chrome --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 --virtual-time-budget=8000 "$@" 2>/dev/null; }
TIPI="${TIPI:-gita calendario evento}"
OUT=../../tavole

if [[ "${1:-}" == verifica ]]; then
  for t in $TIPI; do for s in a b c; do
    [[ -f $t-$s.html ]] || continue
    echo "$t-$s: $(chrome --window-size=1080,1350 --dump-dom "file://$PWD/$t-$s.html#post-verifica" | grep -o 'VERIFICA[^<]*')"
  done; done
  exit
fi

# pagina larghezza altezza uscita
foto() {
  chrome --window-size="$2,$3" --screenshot="$OUT/$4.png" "file://$PWD/$1" >/dev/null
  python3 -c "import sys; from PIL import Image; Image.open(sys.argv[1]).convert('RGB').save(sys.argv[2], quality=90, optimize=True)" "$OUT/$4.png" "$OUT/$4"
  rm "$OUT/$4.png"
  echo "$OUT/$4"
}
for t in $TIPI; do
  for s in a b c; do [[ -f $t-$s.html ]] && foto "$t-$s.html#post" 1080 1350 "$t-$s.jpg"; done
  [[ -f tavola.html && -f $OUT/$t-c.jpg ]] && foto "tavola.html#$t" 1720 1084 "tavola-$t.jpg"
done
true
