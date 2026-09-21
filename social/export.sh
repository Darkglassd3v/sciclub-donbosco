#!/bin/sh
# Esporta ogni template in PNG a misura reale: ./export.sh  →  export/{direzione}-{template}-{formato}.png
cd "$(dirname "$0")"
rm -f export/*.png
shot() { # direzione template formato larghezza,altezza
  google-chrome --headless=new --disable-gpu --hide-scrollbars --allow-file-access-from-files --virtual-time-budget=4000 \
    --window-size=$4 --screenshot="$PWD/export/$1-$2-$3.png" "file://$PWD/templates.html?dir=$1&tpl=$2&fmt=$3" 2>/dev/null
}
for d in a b c; do
  for t in gita-mar gita-sab gita-dom corso cena gara servizi; do
    shot $d $t post 1080,1080; shot $d $t story 1080,1920
  done
  shot $d cal post 1080,1080; shot $d cover cover 820,312
done

# Tavole di confronto per il direttivo: export/confronto-{caso}.png, le tre grafiche affiancate.
tavola() { # caso larghezza,altezza
  google-chrome --headless=new --disable-gpu --hide-scrollbars --allow-file-access-from-files --virtual-time-budget=6000 \
    --window-size=$2 --screenshot="$PWD/export/confronto-$1.png" "file://$PWD/confronto.html?caso=$1" 2>/dev/null
}
for c in gita-post corso-post evento-post cena-post cal-post; do tavola $c 1530,680; done
tavola gita-story 1130,810
tavola cover 1640,420
