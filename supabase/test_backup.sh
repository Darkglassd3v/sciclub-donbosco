#!/usr/bin/env bash
#
# Prova dei backup leggibili senza il sito.
#
#   ./supabase/test_backup.sh
#
# Serve docker, psql e 7z. Il container viene creato e distrutto ad ogni esecuzione.
#
# Cosa si prova:
#  - scripts/esporta-tutto.sh: ogni tabella in un file che Excel apre col doppio
#    clic (separatore «;», UTF-8 col BOM, decimali con la virgola, sì/no, ore
#    italiane), più i conti in LEGGIMI.txt; con FRASE un .7z cifrato che senza
#    la frase non mostra nemmeno i nomi dei file;
#  - scripts/scarica-backup.sh: scarica solo i backup nuovi, controlla che si
#    aprano con la frase e avvisa se l'ultimo backup è troppo vecchio (gh finto).
set -euo pipefail

QUI="$(cd "$(dirname "$0")" && pwd)"
CONTENITORE="scdb-test-backup-$$"
TMP="$(mktemp -d)"
trap 'docker rm -f "$CONTENITORE" >/dev/null 2>&1 || true; rm -rf "$TMP"' EXIT

ERRORI=0
prova() { # nome, condizione già valutata (0 = vera), spiegazione
  if [ "$2" -eq 0 ]; then echo "ok   $1"; else echo "NO   $1: $3"; ERRORI=$((ERRORI + 1)); fi
}
vero() { "$@" >/dev/null 2>&1 && echo 0 || echo 1; }

docker run -d --name "$CONTENITORE" -p 127.0.0.1::5432 -e POSTGRES_PASSWORD=test postgres:17 >/dev/null
for _ in $(seq 1 30); do
  docker exec "$CONTENITORE" pg_isready -U postgres >/dev/null 2>&1 && break
  sleep 1
done
sleep 1
DB="postgresql://postgres:test@$(docker port "$CONTENITORE" 5432/tcp | head -1)/postgres"

psql "$DB" -X -q -v ON_ERROR_STOP=1 >/dev/null <<'SQL'
create schema auth;
create table auth.users (id uuid primary key, email text, created_at timestamptz, encrypted_password text);
insert into auth.users values ('a0000000-0000-0000-0000-000000000001', 'segreteria@prova.it', '2026-10-01 10:00+00', 'segreta');
create table public.members (id uuid primary key, last_name text, first_name text, total numeric(8,2),
  total_manual boolean, enrolled_at date, updated_at timestamptz, notes text, tags text[]);
insert into public.members values
  ('b0000000-0000-0000-0000-000000000001', 'ROSSI', 'MARIO', 12.50, true, '2026-10-14', '2026-10-23 08:21:16+00',
   'paga; a rate "due"' || chr(10) || 'seconda riga', '{a,b}'),
  ('b0000000-0000-0000-0000-000000000002', 'NICOLÒ', 'ANNA', null, false, null, null, null, null);
create table public.prices (name text, price numeric);
insert into public.prices values ('TESSERA', 40);
create table public.nuova_tabella (x int);
create view public.vista as select count(*) from public.members;
SQL

# --- esporta-tutto.sh, senza frase: una cartella da guardare subito ---
bash "$QUI/scripts/esporta-tutto.sh" "$DB" "$TMP/chiaro" > "$TMP/uscita.txt" 2>&1 || true
SOCI="$TMP/chiaro/soci.csv"
prova "file dei soci" "$(vero test -s "$SOCI")" "manca $SOCI ($(tail -3 "$TMP/uscita.txt" | tr '\n' ' '))"
prova "listino col suo nome" "$(vero test -s "$TMP/chiaro/listino.csv")" "manca listino.csv"
prova "tabella nuova col nome del database" "$(vero test -f "$TMP/chiaro/nuova_tabella.csv")" "manca nuova_tabella.csv"
prova "account senza password" "$(vero grep -q 'segreteria@prova.it' "$TMP/chiaro/account.csv")" "account.csv senza l'email"
prova "nessuna password cifrata" "$(! grep -rq 'segreta' "$TMP/chiaro" 2>/dev/null; echo $?)" "encrypted_password esportata"
prova "le viste no" "$(! test -e "$TMP/chiaro/vista.csv"; echo $?)" "vista esportata"
prova "BOM per Excel" "$(vero bash -c "head -c 3 '$SOCI' | od -An -tx1 | grep -q 'ef bb bf'")" "senza BOM"
prova "intestazione con ;" "$(vero grep -q '^.*id;last_name;first_name;total;total_manual' "$SOCI")" "$(head -1 "$SOCI" 2>/dev/null)"
prova "decimali con la virgola" "$(vero grep -q ';12,50;' "$SOCI")" "$(sed -n 2p "$SOCI" 2>/dev/null)"
prova "sì/no" "$(vero grep -q ';sì;2026-10-14;' "$SOCI")" "$(sed -n 2p "$SOCI" 2>/dev/null)"
prova "ora italiana" "$(vero grep -q '2026-10-23 10:21:16' "$SOCI")" "attesa 2026-10-23 10:21:16 (ora legale)"
prova "testo col ; fra virgolette" "$(vero grep -q '"paga; a rate ""due""' "$SOCI")" "$(sed -n 2p "$SOCI" 2>/dev/null)"
prova "accenti" "$(vero grep -q 'NICOLÒ' "$SOCI")" "NICOLÒ perso"
prova "conti in LEGGIMI" "$(vero grep -Eq 'soci\.csv.*\b2\b' "$TMP/chiaro/LEGGIMI.txt")" "$(grep soci "$TMP/chiaro/LEGGIMI.txt" 2>/dev/null)"

# --- con la frase: un archivio solo, cifrato anche nei nomi dei file ---
FRASE="frase di prova lunga" bash "$QUI/scripts/esporta-tutto.sh" "$DB" "$TMP/dati-2026-10-23" > "$TMP/uscita.txt" 2>&1 || true
ARCHIVIO="$TMP/dati-2026-10-23.7z"
prova "archivio" "$(vero test -s "$ARCHIVIO")" "manca $ARCHIVIO ($(tail -3 "$TMP/uscita.txt" | tr '\n' ' '))"
prova "niente in chiaro accanto" "$(! test -e "$TMP/dati-2026-10-23"; echo $?)" "è rimasta la cartella in chiaro"
prova "senza frase non si legge l'elenco" "$(! 7z l -p"sbagliata" "$ARCHIVIO" 2>/dev/null | grep -q soci.csv; echo $?)" "nomi dei file visibili"
mkdir -p "$TMP/aperto"
prova "con la frase si apre" "$(vero 7z x -y -p"frase di prova lunga" -o"$TMP/aperto" "$ARCHIVIO")" "7z x non va"
prova "dentro i soci" "$(vero grep -rq 'ROSSI' "$TMP/aperto")" "soci assenti"

# --- scarica-backup.sh con un gh finto: due backup su GitHub, uno già sul PC ---
mkdir -p "$TMP/bin" "$TMP/pc/backup-2026-10-20" "$TMP/github"
printf 'frase di prova lunga' > "$TMP/frase"
cp "$ARCHIVIO" "$TMP/github/dati-2026-10-23.7z" 2>/dev/null || true
printf 'PGDMP finto' | gpg --batch --yes --pinentry-mode loopback --passphrase-file "$TMP/frase" \
  --symmetric -o "$TMP/github/backup-2026-10-23.dump.gpg" 2>/dev/null
cat > "$TMP/bin/gh" <<EOF
#!/usr/bin/env bash
echo "\$*" >> "$TMP/gh.log"
case "\$1 \$2" in
  "run list") printf '%s\n' "\${GH_RUN_LIST:-[{\"databaseId\":2,\"createdAt\":\"2026-10-23T08:21:16Z\"},{\"databaseId\":1,\"createdAt\":\"2026-10-20T08:14:17Z\"}]}" ;;
  "run download") d=""; while [ \$# -gt 0 ]; do [ "\$1" = -D ] && d="\$2"; shift; done
                  mkdir -p "\$d"; cp "$TMP/github/"* "\$d/" ;;
esac
EOF
cat > "$TMP/bin/notify-send" <<EOF
#!/usr/bin/env bash
echo "\$*" >> "$TMP/avvisi.log"
EOF
chmod +x "$TMP/bin/gh" "$TMP/bin/notify-send"
OGGI=2026-10-24
PATH="$TMP/bin:$PATH" OGGI=$OGGI FRASE_FILE="$TMP/frase" \
  bash "$QUI/scripts/scarica-backup.sh" "$TMP/pc" > "$TMP/uscita.txt" 2>&1 || true
prova "scarica il nuovo" "$(vero test -s "$TMP/pc/backup-2026-10-23/dati-2026-10-23.7z")" "$(tail -3 "$TMP/uscita.txt" | tr '\n' ' ')"
prova "non riscarica quello che c'è" "$(! grep -q 'download 1' "$TMP/gh.log" 2>/dev/null; echo $?)" "$(cat "$TMP/gh.log" 2>/dev/null | tr '\n' ' ')"
prova "controlla che si apra" "$(vero grep -q 'si apre' "$TMP/uscita.txt")" "$(cat "$TMP/uscita.txt")"
prova "nessun avviso se è recente" "$(! test -s "$TMP/avvisi.log"; echo $?)" "$(cat "$TMP/avvisi.log" 2>/dev/null)"

# Frase sbagliata: deve avvisare, non tacere.
printf 'altra' > "$TMP/frase2"; rm -rf "$TMP/pc/backup-2026-10-23"
PATH="$TMP/bin:$PATH" OGGI=$OGGI FRASE_FILE="$TMP/frase2" \
  bash "$QUI/scripts/scarica-backup.sh" "$TMP/pc" > "$TMP/uscita.txt" 2>&1 && stato=0 || stato=$?
prova "frase sbagliata = errore e avviso" "$( [ "$stato" -ne 0 ] && grep -q 'non si apre' "$TMP/avvisi.log" 2>/dev/null; echo $?)" "uscita $stato, avvisi: $(cat "$TMP/avvisi.log" 2>/dev/null)"

# Ultimo backup di 10 giorni prima: il workflow si è fermato (succede d'estate).
: > "$TMP/avvisi.log"
PATH="$TMP/bin:$PATH" OGGI=2026-11-02 FRASE_FILE="$TMP/frase" \
  GH_RUN_LIST='[{"databaseId":2,"createdAt":"2026-10-23T08:21:16Z"}]' \
  bash "$QUI/scripts/scarica-backup.sh" "$TMP/pc" > "$TMP/uscita.txt" 2>&1 && stato=0 || stato=$?
prova "backup vecchio = avviso" "$( [ "$stato" -ne 0 ] && grep -q 'ultimo backup' "$TMP/avvisi.log" 2>/dev/null; echo $?)" "uscita $stato, avvisi: $(cat "$TMP/avvisi.log" 2>/dev/null)"

echo
if [ "$ERRORI" -eq 0 ]; then echo "test_backup: tutto ok"; else echo "test_backup: $ERRORI prove fallite"; exit 1; fi
