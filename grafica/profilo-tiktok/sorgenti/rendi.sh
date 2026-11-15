#!/usr/bin/env bash
# Rifà con Chrome headless il post del profilo TikTok, 1080×1350, per Instagram e Facebook.
set -euo pipefail
cd "$(dirname "$0")"
google-chrome --headless=new --disable-gpu --hide-scrollbars --virtual-time-budget=8000 \
  --window-size=1080,1350 --screenshot=../post-profilo-tiktok.png "file://$PWD/post.html" >/dev/null 2>&1
python3 -c "import sys; from PIL import Image; Image.open(sys.argv[1]).convert('RGB').save(sys.argv[2], quality=90, optimize=True)" \
  ../post-profilo-tiktok.png ../post-profilo-tiktok.jpg
rm ../post-profilo-tiktok.png
echo ../post-profilo-tiktok.jpg
