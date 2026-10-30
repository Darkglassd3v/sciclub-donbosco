#!/usr/bin/env bash
# Scarica da Mixkit (Stock Video Free License) le 6 clip del video e le ritaglia in verticale 1080×1920.
# Le clip restano fuori da git (assets/clip/ in .gitignore): questo script le ricrea.
set -euo pipefail
cd "$(dirname "$0")/assets"
mkdir -p clip/originali clip/verticali
# id Mixkit, risoluzione, ritaglio (larghezza:altezza:x:y), nome della clip verticale
while read -r id res crop nome; do
  src="clip/originali/$id-$res.mp4"
  [ -f "$src" ] || curl -fL -o "$src" "https://assets.mixkit.co/videos/$id/$id-$res.mp4"
  ffmpeg -nostdin -v error -y -i "$src" -an -vf "crop=$crop,scale=1080:1920:flags=lanczos,fps=30,format=yuv420p" \
    -c:v libx264 -preset medium -crf 19 -movflags +faststart "clip/verticali/$nome.mp4"
done <<'LISTA'
4283 2160 1215:2160:1312:0 cime
3338 2160 1012:1800:1414:300 pista
4395 1080 607:1080:656:0 funivia
3340 2160 1215:2160:1312:0 scarpone
4017 1080 607:1080:656:0 attrezzatura
3387 2160 1215:2160:1312:0 bosco
LISTA
