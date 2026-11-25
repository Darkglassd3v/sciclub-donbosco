#!/usr/bin/env bash
# Sorveglianza delle iscrizioni dal vivo (serata del 25/11/2026 e campagne successive): ripete controlli.sql con
# l'utente di sola lettura (supabase/.monitor_connect) e stampa solo quello che cambia rispetto al giro prima:
#   - NUOVA: un'anomalia comparsa (controllo e socio), RISOLTA: un'anomalia sparita;
#   - ISCRITTI: il numero dei soci iscritti quando cresce o cala;
#   - ERRORE: il database non risponde (una volta sola, finché non torna).
# Al primo giro stampa le anomalie già presenti come BASE. Non modifica mai dati.
#   supabase/scripts/sorveglia.sh [secondi fra un giro e l'altro, default 120] [ora di fine HH:MM, default 23:59]
set -uo pipefail
QUI="$(cd "$(dirname "$0")" && pwd)"
INTERVALLO="${1:-120}"
FINE="${2:-23:59}"
CONNESSIONE="$(cat "$QUI/../.monitor_connect")"

prima=""; iscritti_prima=""; giro=0; in_errore=0
while [[ "$(date +%H:%M)" < "$FINE" ]]; do
  if uscita=$(psql "$CONNESSIONE" -X -q -A -t -F $'\t' -v ON_ERROR_STOP=1 -f "$QUI/controlli.sql" 2>&1); then
    if (( in_errore )); then echo "$(date +%H:%M) DATABASE DI NUOVO RAGGIUNGIBILE"; in_errore=0; fi
    # Campi separati da tabulazioni (negli esempi c'è già « | »): le anomalie hanno tre campi (controllo, quante,
    # esempi), il riassunto cinque. Ogni esempio diventa una riga «controllo: socio».
    adesso=$(awk -F'\t' 'NF == 3 { n = split($3, a, / \| /); for (i = 1; i <= n; i++) print $1 ": " a[i] }' <<< "$uscita" | sort)
    iscritti=$(awk -F'\t' 'NF == 5 { print $1 }' <<< "$uscita" | tail -1)
    if (( giro == 0 )); then
      echo "$(date +%H:%M) INIZIO: $iscritti iscritti, $(grep -c . <<< "$adesso") anomalie già presenti"
      [[ -n "$adesso" ]] && sed 's/^/  BASE /' <<< "$adesso"
    else
      comm -13 <(echo "$prima") <(echo "$adesso") | grep . | sed "s/^/$(date +%H:%M) NUOVA /"
      comm -23 <(echo "$prima") <(echo "$adesso") | grep . | sed "s/^/$(date +%H:%M) RISOLTA /"
      [[ "$iscritti" != "$iscritti_prima" ]] && echo "$(date +%H:%M) ISCRITTI $iscritti_prima → $iscritti"
    fi
    prima="$adesso"; iscritti_prima="$iscritti"; giro=$((giro + 1))
  elif (( ! in_errore )); then
    echo "$(date +%H:%M) ERRORE: il database non risponde: $(head -c 200 <<< "$uscita")"
    in_errore=1
  fi
  sleep "$INTERVALLO"
done
echo "$(date +%H:%M) FINE della sorveglianza"
