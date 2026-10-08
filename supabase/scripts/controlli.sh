#!/usr/bin/env bash
# Controlli delle iscrizioni con l'utente di sola lettura (crea_monitor.sql).
#   supabase/scripts/controlli.sh
# Stampa le anomalie (nessuna riga = tutto a posto) e il riassunto.
set -euo pipefail
QUI="$(cd "$(dirname "$0")" && pwd)"
psql "$(cat "$QUI/../.monitor_connect")" -X -q -v ON_ERROR_STOP=1 -f "$QUI/controlli.sql"
