#!/bin/bash
# Prove delle pagine vere sulla copia del database di produzione, in locale.
#
#   bash test-reale/avvia.sh [prova.js ...]     (di default tutte quelle in PROVE)
#
# Prima serve la copia (dati personali: resta in supabase/migration/, fuori da git):
#   pg_dump "$(cat supabase/.postgre_connect)" -Fc -n public --no-owner --no-privileges \
#       -f supabase/migration/copia-test/public.dump
#   psql "$(cat supabase/.postgre_connect)" -c "\copy (select id, email from auth.users) \
#       to 'supabase/migration/copia-test/utenti.csv' csv"
#
# Cosa fa: Postgres 17 in docker con la copia (ambiente.sql, poi la copia, poi
# dopo.sql: permessi di Supabase e un account per ruolo), PostgREST vero davanti,
# e servi.py che serve le pagine e fa da Supabase sullo stesso indirizzo. Ogni
# prova apre la pagina col suo ruolo già entrato (sessione nel localStorage) e
# scrive l'esito nel titolo, come test-browser/esegui.sh. Se accanto alla prova
# c'è un .sql, la sua riga (un json) arriva alla pagina come window.ATTESO:
# quello che la pagina deve mostrare, calcolato dal database e non dalla pagina.
# La produzione non si tocca: la pagina parla solo con 127.0.0.1.
set -u
QUI="$(cd "$(dirname "$0")" && pwd)"
RADICE="$(cd "$QUI/.." && pwd)"
COPIA="${COPIA:-$RADICE/supabase/migration/copia-test}"
CHROME="${CHROME:-$(command -v google-chrome || command -v google-chrome-stable || command -v chromium || true)}"
PORTA="${PORTA:-8766}"
PORTA_REST="${PORTA_REST:-53000}"
PORTA_PG="${PORTA_PG:-55432}"
[ -s "$COPIA/public.dump" ] || { echo "Manca la copia: $COPIA/public.dump (vedi in cima a questo file)"; exit 1; }
[ -n "$CHROME" ] || { echo "Chrome non trovato"; exit 1; }
# Un'altra copia accesa (es. TIENI=1) sulle stesse porte: questa si attaccherebbe al suo database.
for p in "$PORTA" "$PORTA_REST" "$PORTA_PG"; do
  (echo > "/dev/tcp/127.0.0.1/$p") 2>/dev/null && { echo "porta $p già usata: un altro avvia.sh acceso? (PORTA, PORTA_REST, PORTA_PG)"; exit 1; }
done

# Ogni prova: script, ruolo e, se serve, larghezza della finestra. La pagina la dice lo script (// PAGINA: ...).
PROVE=(${@:-$(cd "$QUI" && grep -l '^// PAGINA:' *.js 2>/dev/null)})   # chrome.js è lo strumento, non una prova

N=$$
RETE="scdb-reale-$N"; PG="scdb-reale-pg-$N"; REST="scdb-reale-rest-$N"
SEGRETO="$(head -c 32 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c 40)"
TMP="$(mktemp -d)"
pulisci() {
  [ -n "${SERVER:-}" ] && kill "$SERVER" 2>/dev/null
  docker rm -f "$REST" "$PG" >/dev/null 2>&1
  docker network rm "$RETE" >/dev/null 2>&1
  rm -rf "$TMP"
}
trap pulisci EXIT

docker network create "$RETE" >/dev/null
docker run -d --name "$PG" --network "$RETE" -p "127.0.0.1:$PORTA_PG:5432" -e POSTGRES_PASSWORD=prova postgres:17 >/dev/null
for _ in $(seq 60); do docker exec "$PG" pg_isready -U postgres >/dev/null 2>&1 && break; sleep 1; done
sleep 2
URL_PG="postgresql://postgres:prova@127.0.0.1:$PORTA_PG/postgres"
psql_() { psql "$URL_PG" -X -q -v ON_ERROR_STOP=1 "$@"; }

psql_ -f "$QUI/ambiente.sql" >/dev/null || { echo "ambiente.sql non va"; exit 1; }
psql_ -c "\copy auth.users (id, email) from '$COPIA/utenti.csv' csv" >/dev/null || exit 1
# Lo schema public c'è già (lo crea Postgres): quell'errore del ripristino non conta.
pg_restore -d "$URL_PG" --no-owner --no-privileges "$COPIA/public.dump" 2> "$TMP/ripristino.txt"
grep -v 'schema "public" already exists\|errors ignored on restore\|^pg_restore: from TOC entry\|^pg_restore: error: could not execute query: ERROR:  schema "public"\|^Command was: CREATE SCHEMA public' "$TMP/ripristino.txt" | grep -i "error" | head -5
psql_ -f "$QUI/dopo.sql" >/dev/null || { echo "dopo.sql non va"; exit 1; }
echo "copia pronta: $(psql "$URL_PG" -X -At -c 'select count(*) from public.members') soci"

docker run -d --name "$REST" --network "$RETE" -p "127.0.0.1:$PORTA_REST:3000" \
  -e PGRST_DB_URI="postgres://authenticator:prova-locale@$PG:5432/postgres" \
  -e PGRST_DB_SCHEMAS=public -e PGRST_DB_ANON_ROLE=anon -e PGRST_JWT_SECRET="$SEGRETO" \
  postgrest/postgrest:v12.2.3 >/dev/null
for _ in $(seq 60); do (echo > "/dev/tcp/127.0.0.1/$PORTA_REST") 2>/dev/null && break; sleep .5; done
sleep 1

# Token firmati col segreto di questa esecuzione: anon (la chiave della pagina) e uno per ruolo.
token() {
  python3 - "$SEGRETO" "$@" <<'PY'
import base64, hashlib, hmac, json, sys, time
segreto, ruolo, sub, email = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
b = lambda d: base64.urlsafe_b64encode(json.dumps(d, separators=(",", ":")).encode()).rstrip(b"=")
dati = {"role": ruolo, "exp": int(time.time()) + 86400}
if sub: dati.update(sub=sub, email=email, aud="authenticated")
testa = b({"alg": "HS256", "typ": "JWT"}) + b"." + b(dati)
firma = base64.urlsafe_b64encode(hmac.new(segreto.encode(), testa, hashlib.sha256).digest()).rstrip(b"=")
print((testa + b"." + firma).decode())
PY
}
declare -A UTENTE=( [superadmin]=1 [admin]=2 [tesoriere]=3 [assicurazione]=4 [gite]=5 [social]=6 )
ANON="$(token anon "" "")"

# supabase-js della stessa versione delle pagine, scaricato una volta: il CDN a volte non risponde.
CACHE="$HOME/.cache/sciclub-prove"; JS="$CACHE/supabase-js-2.45.4.min.js"
if [ ! -s "$JS" ]; then
  mkdir -p "$CACHE"
  python3 -c "import urllib.request,sys; urllib.request.urlretrieve(sys.argv[1], sys.argv[2])" \
    "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js" "$JS" || { echo "supabase-js non scaricato"; exit 1; }
fi

mkdir -p "$TMP/sito"
cp -r "$RADICE/web/." "$TMP/sito/"
mkdir -p "$TMP/sito/ricerca" && cp -r "$RADICE/ricerca/." "$TMP/sito/ricerca/"
cp "$QUI"/*.js "$TMP/sito/" 2>/dev/null
cp "$JS" "$TMP/sito/supabase-locale.js"
printf 'window.SUPABASE_CONFIG = { url: "http://127.0.0.1:%s", anonKey: "%s" };\n' "$PORTA" "$ANON" > "$TMP/sito/config.js"
cp "$TMP/sito/config.js" "$TMP/sito/ricerca/config.js" 2>/dev/null
python3 "$QUI/servi.py" "$PORTA" "$TMP/sito" "http://127.0.0.1:$PORTA_REST" "$SEGRETO" &
SERVER=$!
for _ in $(seq 50); do (echo > "/dev/tcp/127.0.0.1/$PORTA") 2>/dev/null && break; sleep .1; done

# TIENI=1: niente prove, tutto acceso finché non si ferma lo script (per guardare a mano).
if [ -n "${TIENI:-}" ]; then
  echo "acceso: sito http://127.0.0.1:$PORTA, PostgREST $PORTA_REST, Postgres $PORTA_PG; token in $TMP/token"
  token authenticated 70000000-0000-0000-0000-000000000001 prova-superadmin@locale > "$TMP/token"
  echo "$TMP" > "$QUI/.tieni-cartella"
  while :; do sleep 60; done
fi

# FOTO=cartella: niente prove, una foto per pagina a 1280 e 500 px (superadmin), e gli
# errori JavaScript di ognuna. Le foto hanno dati veri: la cartella va tenuta fuori da git.
if [ -n "${FOTO:-}" ]; then
  mkdir -p "$FOTO"
  cat > "$TMP/sito/foto-prova.js" <<'JS'
// PAGINA: (ognuna)
{
  const errori = [];
  window.addEventListener("error", (e) => errori.push(e.message));
  window.addEventListener("unhandledrejection", (e) => errori.push(String(e.reason?.message || e.reason)));
  window.addEventListener("load", () => setTimeout(() => {
    // Tabelle che scorrono di lato (colonne fuori schermo) e pagina più larga dello schermo.
    const tabelle = [...document.querySelectorAll(".tabella-scorrevole")].filter((c) => c.scrollWidth > c.clientWidth + 1).length;
    const pagina = document.documentElement.scrollWidth > innerWidth + 1;
    document.title = `RISULTATO senzaErrori=${errori.length ? `NO(${errori.join(" / ").slice(0, 160)})` : "ok"}`
      + ` tabelleDentro=${tabelle ? `NO(${tabelle} scorrono di lato)` : "ok"} paginaDentro=${pagina ? `NO(larga ${document.documentElement.scrollWidth})` : "ok"}`;
  }, 5000));
}
JS
  cp "$TMP/sito/foto-prova.js" "$TMP/sito/ricerca/foto-prova.js"
  PROVE=()
  # FOTO_PAGINE="admin.html riepilogo.html": solo quelle.
  PAGINE_FOTO="${FOTO_PAGINE:-$(cd "$RADICE/web" && ls *.html | grep -v 'social-contatti') $(cd "$RADICE/ricerca" && ls *.html | sed 's#^#ricerca/#')}"
fi

falliti=0
for script in "${PROVE[@]}"; do
  pagina="$(grep -m1 -o '// PAGINA: .*' "$QUI/$script" | sed 's#// PAGINA: ##')"
  ruolo="$(grep -m1 -o '// RUOLO: .*' "$QUI/$script" | sed 's#// RUOLO: ##')"; ruolo="${ruolo:-superadmin}"
  larghezza="$(grep -m1 -o '// LARGHEZZA: .*' "$QUI/$script" | sed 's#// LARGHEZZA: ##')"
  [ -n "$pagina" ] || { echo "$script: manca // PAGINA:"; falliti=1; continue; }
  id="70000000-0000-0000-0000-00000000000${UTENTE[$ruolo]}"
  accesso="$(token authenticated "$id" "prova-$ruolo@locale")"
  sessione="{\"access_token\":\"$accesso\",\"token_type\":\"bearer\",\"expires_in\":86400,\"expires_at\":$(( $(date +%s) + 86400 )),\"refresh_token\":\"prova\",\"user\":{\"id\":\"$id\",\"aud\":\"authenticated\",\"role\":\"authenticated\",\"email\":\"prova-$ruolo@locale\",\"app_metadata\":{},\"user_metadata\":{}}}"
  atteso="null"
  if [ -f "$QUI/${script%.js}.sql" ]; then
    atteso="$(psql "$URL_PG" -X -At -v ON_ERROR_STOP=1 -f "$QUI/${script%.js}.sql" 2>"$TMP/sql.txt" | tail -1)"
    [ -n "$atteso" ] || { echo "$script: ${script%.js}.sql non dà niente: $(head -2 "$TMP/sql.txt")"; falliti=1; continue; }
  fi
  dir="$(dirname "$pagina")"; base="$(basename "$pagina")"
  copia="$dir/prova-${script%.js}.html"
  inizio="<script>localStorage.setItem('sb-127-auth-token', JSON.stringify($sessione)); window.ATTESO = $atteso;</script>"
  # supabase-js vero (copia locale); la prova subito dopo, prima degli script della pagina.
  su="$( [ "$dir" = "." ] && echo "" || echo "../")"
  python3 - "$TMP/sito/$pagina" "$TMP/sito/$copia" "$inizio" "$su$script" "${su}supabase-locale.js" <<'PY'
import re, sys
sorgente, destinazione, inizio, prova, locale = sys.argv[1:6]
testo = open(sorgente, encoding="utf-8").read()
tag = re.search(r'<script src="https://cdn\.jsdelivr\.net/npm/@supabase/supabase-js@[^"]*"[^>]*></script>', testo)
if not tag: sys.exit(f"in {sorgente} non trovo supabase-js")
testo = testo[:tag.start()] + inizio + f'<script src="{locale}"></script><script src="{prova}"></script>' + testo[tag.end():]
open(destinazione, "w", encoding="utf-8").write(testo)
PY
  [ $? -eq 0 ] || { falliti=1; continue; }
  # A tempo reale (chrome.js): col tempo virtuale di --dump-dom e la rete vera le pagine si chiudevano a metà.
  titolo=$(node "$QUI/chrome.js" "$CHROME" "http://127.0.0.1:$PORTA/$copia" "${larghezza:-1280}" 90000 2> "$TMP/console.txt")
  esito="${titolo#RISULTATO }"
  nome="$script ($ruolo${larghezza:+, $larghezza px})"
  if [[ "$titolo" != RISULTATO* ]]; then
    echo "$nome: nessun risultato (${titolo:-Chrome non risponde}); $(head -c 300 "$TMP/console.txt")"; falliti=1
  elif [[ "$esito" == *"=NO"* ]]; then echo "$nome: FALLITA: $esito"; falliti=1
  else echo "$nome: $esito"; fi
done
for pagina in ${PAGINE_FOTO:-}; do
  for larghezza in 1280 500; do
    id="70000000-0000-0000-0000-000000000001"
    accesso="$(token authenticated "$id" "prova-superadmin@locale")"
    sessione="{\"access_token\":\"$accesso\",\"token_type\":\"bearer\",\"expires_in\":86400,\"expires_at\":$(( $(date +%s) + 86400 )),\"refresh_token\":\"prova\",\"user\":{\"id\":\"$id\",\"aud\":\"authenticated\",\"role\":\"authenticated\",\"email\":\"prova-superadmin@locale\",\"app_metadata\":{},\"user_metadata\":{}}}"
    dir="$(dirname "$pagina")"; base="$(basename "$pagina" .html)"
    copia="$dir/foto-$base.html"; su="$( [ "$dir" = "." ] && echo "" || echo "../")"
    nomefoto="$( [ "$dir" = "." ] && echo "$base" || echo "$dir-$base")"   # ricerca/index.html non copre index.html
    python3 - "$TMP/sito/$pagina" "$TMP/sito/$copia" "<script>localStorage.setItem('sb-127-auth-token', JSON.stringify($sessione));</script>" "${su}foto-prova.js" "${su}supabase-locale.js" <<'PY' || continue
import re, sys
sorgente, destinazione, inizio, prova, locale = sys.argv[1:6]
testo = open(sorgente, encoding="utf-8").read()
tag = re.search(r'<script src="https://cdn\.jsdelivr\.net/npm/@supabase/supabase-js@[^"]*"[^>]*></script>', testo)
if not tag: sys.exit(1)
testo = testo[:tag.start()] + inizio + f'<script src="{locale}"></script><script src="{prova}"></script>' + testo[tag.end():]
open(destinazione, "w", encoding="utf-8").write(testo)
PY
    titolo=$(node "$QUI/chrome.js" "$CHROME" "http://127.0.0.1:$PORTA/$copia" "$larghezza" 60000 "$FOTO/${nomefoto}-$larghezza.png" 2> "$TMP/console.txt")
    echo "$pagina ($larghezza px): ${titolo#RISULTATO } $(grep -m2 . "$TMP/console.txt" | tr '\n' ' ' | head -c 200)"
  done
done
exit "$falliti"
