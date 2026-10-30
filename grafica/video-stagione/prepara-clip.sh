#!/usr/bin/env bash
# Scarica le 7 clip del video (6 Mixkit, Stock Video Free License; 1 Pexels, licenza Pexels)
# e le ritaglia in verticale 1080×1920.
# Le clip restano fuori da git (assets/clip/ in .gitignore): questo script le ricrea.
set -euo pipefail
cd "$(dirname "$0")/assets"
mkdir -p clip/originali clip/verticali
# file originale, indirizzo, ritaglio (larghezza:altezza:x:y), nome della clip verticale
while read -r file url crop nome; do
  src="clip/originali/$file"
  [ -f "$src" ] || curl -fL -A "Mozilla/5.0" -o "$src" "$url"
  ffmpeg -nostdin -v error -y -i "$src" -an -vf "crop=$crop,scale=1080:1920:flags=lanczos,fps=30,format=yuv420p" \
    -c:v libx264 -preset medium -crf 19 -movflags +faststart "clip/verticali/$nome.mp4"
done <<'LISTA'
4283-2160.mp4 https://assets.mixkit.co/videos/4283/4283-2160.mp4 1215:2160:1312:0 cime
pexels-30598012-1080.mp4 https://videos.pexels.com/video-files/30598012/13101387_1080_1920_30fps.mp4 1080:1920:0:0 sciatore
3338-2160.mp4 https://assets.mixkit.co/videos/3338/3338-2160.mp4 1012:1800:1414:300 pista
4395-1080.mp4 https://assets.mixkit.co/videos/4395/4395-1080.mp4 607:1080:656:0 funivia
3340-2160.mp4 https://assets.mixkit.co/videos/3340/3340-2160.mp4 1215:2160:1312:0 scarpone
4017-1080.mp4 https://assets.mixkit.co/videos/4017/4017-1080.mp4 607:1080:656:0 attrezzatura
3387-2160.mp4 https://assets.mixkit.co/videos/3387/3387-2160.mp4 1215:2160:1312:0 bosco
LISTA
