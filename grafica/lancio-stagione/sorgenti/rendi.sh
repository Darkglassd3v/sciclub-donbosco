#!/usr/bin/env bash
# Rifà le immagini del lancio della stagione da pagine.html con Chrome headless e Pillow per il JPEG.
# Ogni pagina deve dire «PRONTO []» nel titolo (nessun testo troppo lungo, nessuna immagine mancante).
set -euo pipefail
cd "$(dirname "$0")"
chrome() { google-chrome --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
  --virtual-time-budget=8000 --allow-file-access-from-files "$@" 2>/dev/null; }
for voce in invito-post:1350 invito-story:1920 promemoria-mercoledi:1920 promemoria-stasera:1920 \
            si-parte-1:1350 si-parte-2:1350 si-parte-3:1350; do
  nome=${voce%%:*} altezza=${voce##*:}
  titolo=$(chrome --window-size=1080,"$altezza" --dump-dom "file://$PWD/pagine.html#$nome" | grep -o '<title>[^<]*' || true)
  [[ "$titolo" == "<title>PRONTO []" ]] || { echo "$nome: ${titolo#<title>}" >&2; exit 1; }
  chrome --window-size=1080,"$altezza" --screenshot="../$nome.png" "file://$PWD/pagine.html#$nome" >/dev/null
  python3 -c "import sys; from PIL import Image; Image.open(sys.argv[1]).convert('RGB').save(sys.argv[2], quality=92, optimize=True)" \
    "../$nome.png" "../$nome.jpg"
  rm "../$nome.png"
  echo "../$nome.jpg"
done
