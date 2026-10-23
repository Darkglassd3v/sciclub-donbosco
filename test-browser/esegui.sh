#!/bin/bash
# Prove delle pagine vere in Chrome headless, senza dipendenze: copia web/ in
# una cartella temporanea, in ogni pagina provata mette fake-supabase.js al
# posto di supabase-js (le risposte arrivano quando e come dice la prova) e
# legge l'esito dal titolo: "RISULTATO scheda=ok ricerca=NO(...)".
#
#   bash test-browser/esegui.sh [cartella web]    (di default ../web)
#
# Ogni prova: pagina, script e, se serve, la larghezza della finestra in px
# (la stessa prova a 1280 e a 500, il minimo di Chrome headless, vede la tabella
# e le schede del telefono).
#
# Chrome: google-chrome o chromium, oppure la variabile CHROME.
set -u
QUI="$(cd "$(dirname "$0")" && pwd)"
WEB="${1:-$QUI/../web}"
CHROME="${CHROME:-$(command -v google-chrome || command -v google-chrome-stable || command -v chromium || command -v chromium-browser || true)}"
[ -n "$CHROME" ] || { echo "Chrome non trovato: installalo o imposta CHROME."; exit 1; }
PORTA="${PORTA:-8765}"

TMP="$(mktemp -d)"
cp -r "$WEB/." "$TMP/"
cp "$QUI"/*.js "$TMP/"
(cd "$TMP" && exec python3 -m http.server "$PORTA" --bind 127.0.0.1 >/dev/null 2>&1) &
SERVER=$!
trap 'kill "$SERVER" 2>/dev/null; rm -rf "$TMP"' EXIT
for _ in $(seq 50); do (echo > "/dev/tcp/127.0.0.1/$PORTA") 2>/dev/null && break; sleep .1; done

falliti=0
for prova in "index.html scheda-socio.js" "index.html doppioni.js" "index.html presciistica.js" "index.html famiglia.js" "index.html tessere-libere.js" "index.html errori.js" "index.html codice-fiscale.js" "index.html importi.js" "index.html arrivo.js" "index.html soci-campi.js" "index.html accesso-errore.js" "index.html scheda-a-meta.js" "index.html ricerca-soci.js" "index.html salva-ripetuto.js" "index.html pagante-illeggibile.js" "index.html totale-fisso.js" "social.html importi-social.js" "social.html social-salva.js" "social.html post-rubrica.js" "assicurazione.html assicurazione.js" "assicurazione.html assicurazione-scarico.js" "assicurazione.html ricerca-vecchia.js" \
             "admin.html realtime.js" "admin.html pagamenti-cerca.js" "utenti.html utenti-superadmin.js" "stagione.html stagione.js" "password.html password.js" "impostazioni.html impostazioni.js 1280" "impostazioni.html impostazioni.js 500"; do
  read -r pagina script larghezza <<< "$prova"
  # Una copia della pagina per prova, accanto all'originale: i percorsi relativi restano giusti.
  copia="prova-${script%.js}${larghezza:+-$larghezza}.html"
  sed "s#<script src=\"https://cdn.jsdelivr.net/npm/@supabase/supabase-js@[^\"]*\"[^>]*></script>#<script src=\"fake-supabase.js\"></script><script src=\"$script\"></script>#" \
    "$TMP/$pagina" > "$TMP/$copia"
  if ! grep -q "fake-supabase.js" "$TMP/$copia"; then
    echo "$script: in $pagina non trovo lo script di supabase-js da sostituire"; falliti=1; continue
  fi
  # timeout: una pagina bloccata (ciclo infinito, Chrome appeso) non deve fermare il deploy.
  esito=$(timeout 90 "$CHROME" --headless=new --disable-gpu --no-sandbox --virtual-time-budget=8000 ${larghezza:+--window-size=$larghezza,1000} --dump-dom \
    "http://127.0.0.1:$PORTA/$copia" 2>/dev/null | grep -o "<title>RISULTATO[^<]*" | sed "s/<title>RISULTATO //")
  if [ -z "$esito" ]; then
    echo "$script${larghezza:+ ($larghezza px)}: nessun risultato (la pagina si è fermata prima?)"; falliti=1
  elif [[ "$esito" == *"=NO"* ]]; then
    echo "$script${larghezza:+ ($larghezza px)}: FALLITA: $esito"; falliti=1
  else
    echo "$script${larghezza:+ ($larghezza px)}: $esito"
  fi
done
exit "$falliti"
