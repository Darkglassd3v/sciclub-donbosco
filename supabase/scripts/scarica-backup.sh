#!/usr/bin/env bash
#
# Seconda copia dei backup su questo PC. Scarica da GitHub i backup nuovi
# (.github/workflows/backup-db.yml), controlla che si aprano con la frase e
# avvisa sul desktop se qualcosa non va: download non riuscito, backup che non
# si apre, ultimo backup troppo vecchio (il workflow si è fermato). Su GitHub i
# backup durano 90 giorni, qui restano. Vedi docs/BACKUP.md.
#
#   bash supabase/scripts/scarica-backup.sh [cartella]   (di default ~/Backup/sciclub-donbosco)
#   bash supabase/scripts/scarica-backup.sh --installa   lo fa partire ogni giorno (timer di systemd)
#
# Serve gh entrato (gh auth status), jq, gpg, 7z e la frase in supabase/.backup_passphrase.
# Registro del timer: journalctl --user -u sciclub-backup
set -euo pipefail

QUI="$(cd "$(dirname "$0")" && pwd)"
REPO="${REPO:-darkglassd3v/sciclub-donbosco}"
FRASE_FILE="${FRASE_FILE:-$QUI/../.backup_passphrase}"
OGGI="${OGGI:-$(date +%F)}"
MAX_GIORNI=4   # backup martedì, giovedì e sabato: fra sabato e martedì ne passano 3

if [ "${1:-}" = --installa ]; then
  U="$HOME/.config/systemd/user"
  mkdir -p "$U"
  cat > "$U/sciclub-backup.service" <<EOF
[Unit]
Description=Seconda copia dei backup dello Sci Club Don Bosco

[Service]
Type=oneshot
ExecStart=/usr/bin/env bash "$QUI/scarica-backup.sh"
EOF
  cat > "$U/sciclub-backup.timer" <<EOF
[Unit]
Description=Ogni giorno la seconda copia dei backup dello Sci Club Don Bosco

[Timer]
OnCalendar=*-*-* 13:00
Persistent=true
RandomizedDelaySec=15min

[Install]
WantedBy=timers.target
EOF
  systemctl --user daemon-reload
  systemctl --user enable --now sciclub-backup.timer
  systemctl --user list-timers sciclub-backup.timer --no-pager
  exit 0
fi

DEST="${1:-$HOME/Backup/sciclub-donbosco}"
avvisa() {
  echo "ERRORE: $*" >&2
  command -v notify-send >/dev/null && notify-send -u critical "Backup Sci Club Don Bosco" "$*" || true
}

[ -s "$FRASE_FILE" ] || { avvisa "manca la frase dei backup ($FRASE_FILE)"; exit 1; }
mkdir -p "$DEST"
chmod 700 "$DEST"

# Si apre se il dump comincia con PGDMP e l'archivio supera la prova di 7z.
si_apre() {
  local f
  for f in "$1"/*.dump.gpg; do
    [ -e "$f" ] || continue
    ( set +o pipefail
      gpg --batch --quiet --pinentry-mode loopback --passphrase-file "$FRASE_FILE" -d "$f" 2>/dev/null | head -c 5
    ) | grep -q PGDMP || return 1
  done
  for f in "$1"/*.7z; do
    [ -e "$f" ] || continue
    7z t -p"$(cat "$FRASE_FILE")" "$f" >/dev/null 2>&1 || return 1
  done
}

elenco="$(gh run list -R "$REPO" --workflow backup-db.yml --status success -L 100 --json databaseId,createdAt)" \
  || { avvisa "GitHub non risponde o gh non è entrato (gh auth status)"; exit 1; }
# Oltre i 90 giorni GitHub cancella i file: quei backup non si scaricano più.
dal="$(date -d "$OGGI - 85 days" +%F)"
errori=0
ultimo=""
while read -r id giorno; do
  [ -n "$id" ] || continue
  [[ "$giorno" > "$ultimo" ]] && ultimo="$giorno"
  [[ "$giorno" < "$dal" ]] && continue
  cartella="$DEST/backup-$giorno"
  [ -d "$cartella" ] && continue
  # Uno che la volta prima non si apriva si ricontrolla a ogni giro, senza riscaricarlo.
  if [ ! -d "$cartella.da-controllare" ]; then
    rm -rf "$cartella.parziale"
    if ! gh run download "$id" -R "$REPO" -D "$cartella.parziale" >/dev/null; then
      avvisa "download del backup del $giorno non riuscito"; errori=1; continue
    fi
    # Con più file nello stesso backup gh fa una sottocartella: tutto allo stesso livello.
    find "$cartella.parziale" -mindepth 2 -type f -exec mv -t "$cartella.parziale" {} +
    find "$cartella.parziale" -mindepth 1 -type d -empty -delete
    mv "$cartella.parziale" "$cartella.da-controllare"
  fi
  if si_apre "$cartella.da-controllare"; then
    mv "$cartella.da-controllare" "$cartella"
    echo "backup del $giorno in $cartella: si apre con la frase"
  else
    avvisa "il backup del $giorno non si apre con la frase di $FRASE_FILE"; errori=1
  fi
done < <(jq -r '.[] | "\(.databaseId) \(.createdAt[:10])"' <<< "$elenco")

[ -n "$ultimo" ] || { avvisa "su GitHub non c'è nessun backup riuscito"; exit 1; }
giorni=$(( ($(date -d "$OGGI" +%s) - $(date -d "$ultimo" +%s)) / 86400 ))
if [ "$giorni" -gt "$MAX_GIORNI" ]; then
  avvisa "l'ultimo backup riuscito è del $ultimo ($giorni giorni fa): controllare «Backup del database» in GitHub Actions"
  errori=1
fi
exit "$errori"
