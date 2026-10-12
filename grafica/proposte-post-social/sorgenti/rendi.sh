#!/usr/bin/env bash
# Rifà i JPEG delle proposte con Chrome headless (Barlow in ../../font/) e
# Pillow per il JPEG, a misura esatta:
#   ../post/        un post per tipo e proposta (corso-a.jpg, gita-b.jpg...);
#                   il corso anche in story (corso-a-story.jpg) e la panoramica
#   ../tavola-*.jpg una tavola per proposta, coi suoi quattro post
#   ./rendi.sh            tutte le immagini
#   ./rendi.sh verifica   solo i controlli di comune.js (corpi, fasce, tagli)
set -euo pipefail
cd "$(dirname "$0")"
chrome() { google-chrome --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 --virtual-time-budget=8000 "$@" 2>/dev/null; }
TIPI="corso gita evento calendario"
PROPOSTE="a b c d e f g h i k"
# La story c'è solo per il corso, e non nelle idee G, H, I (solo post finché non se ne sceglie una).
formati() { [[ $1 == corso && $2 != [ghi] ]] && echo "post story" || echo post; }
altezza() { [[ $1 == post ]] && echo 1350 || echo 1920; }

if [[ "${1:-}" == verifica ]]; then
  for t in $TIPI; do for s in $PROPOSTE; do for f in $(formati $t $s); do
    echo "$t-$s $f: $(chrome --window-size=1080,$(altezza $f) --dump-dom "file://$PWD/$t-$s.html#$f-verifica" | grep -o 'VERIFICA[^<]*')"
  done; done; done
  exit
fi

# pagina larghezza altezza uscita
foto() {
  chrome --window-size="$2,$3" --screenshot="$4.png" "file://$PWD/$1" >/dev/null
  python3 -c "import sys; from PIL import Image; Image.open(sys.argv[1]).convert('RGB').save(sys.argv[2], quality=90, optimize=True)" "$4.png" "$4"
  rm "$4.png"
  echo "$4"
}
for t in $TIPI; do for s in $PROPOSTE; do for f in $(formati $t $s); do
  foto "$t-$s.html#$f" 1080 "$(altezza $f)" "../post/$t-$s$([[ $f == story ]] && echo -story).jpg"
done; done; done
foto panoramica.html 1720 1980 ../post/corso-panoramica.jpg
for s in $PROPOSTE; do foto "tavola.html#$s" 1720 820 "../tavola-$s.jpg"; done
