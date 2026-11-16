#!/usr/bin/env bash
# Rifà il Reel della serata per TikTok: i primi 9,5 s del Reel pubblicato su Instagram, fino al lampo della neve,
# e poi il finale «Seguici» con TikTok e il canale WhatsApp (finale-tiktok.html). Il risultato resta sotto i 10 MB,
# il massimo caricabile da TikTok nel browser con l'estensione di Chrome.
set -euo pipefail
cd "$(dirname "$0")"
INIZIO=renders/invito-serata-post-16s.mp4
[ -f "$INIZIO" ] || { echo "manca $INIZIO: va reso prima con npx hyperframes render (servono le clip di prepara-clip.sh)" >&2; exit 1; }
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
npx --yes hyperframes@0.8.174 render -c finale-tiktok.html -o "$TMP/finale.mp4" >/dev/null
# Taglio al fotogramma 286 (9,533 s), quando il lampo bianco copre già quasi tutto: il finale riparte dal bianco pieno.
FILTRO="[0:v]trim=end_frame=286,setpts=PTS-STARTPTS,fps=30,format=yuv420p[a];[1:v]fps=30,format=yuv420p,setpts=PTS-STARTPTS[b];[a][b]concat=n=2:v=1[v]"
for PASSO in 1 2; do
  USCITA=renders/invito-serata-tiktok.mp4; [ "$PASSO" = 1 ] && USCITA=/dev/null
  ffmpeg -loglevel error -y -i "$INIZIO" -i "$TMP/finale.mp4" -filter_complex "$FILTRO" -map "[v]" -an \
    -c:v libx264 -preset slow -b:v 4200k -pass "$PASSO" -passlogfile "$TMP/passi" -movflags +faststart -f mp4 "$USCITA"
done
echo renders/invito-serata-tiktok.mp4
