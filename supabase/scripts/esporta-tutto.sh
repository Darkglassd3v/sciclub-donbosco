#!/usr/bin/env bash
#
# Tutti i dati del gestionale in file che Excel apre col doppio clic, per
# quando il sito non funziona.
#
#   bash supabase/scripts/esporta-tutto.sh "$DB" cartella
#   FRASE="..." bash supabase/scripts/esporta-tutto.sh "$DB" dati-AAAA-MM-GG
#
# Ogni tabella del database (schema public) diventa un file .csv: separatore
# «;», UTF-8 col BOM, decimali con la virgola, sì/no, ore italiane. Gli account
# (auth.users) vanno in account.csv, senza password. LEGGIMI.txt dice cosa c'è
# in ogni file e quante righe. Tutto letto nello stesso istante (una sola
# transazione), così i conti fra i file tornano.
# Con FRASE: un solo archivio dati-AAAA-MM-GG.7z cifrato (AES-256, anche i nomi
# dei file), che si apre con 7-Zip e la frase dei backup; niente resta in chiaro.
# Lo usa .github/workflows/backup-db.yml; vedi docs/BACKUP.md.
set -euo pipefail

DB="${1:?uso: esporta-tutto.sh \"\$DB\" cartella}"
OUT="${2:?uso: esporta-tutto.sh \"\$DB\" cartella}"
case "$OUT" in /*) ;; *) OUT="$PWD/$OUT" ;; esac
[ -e "$OUT" ] && { echo "esiste già: $OUT" >&2; exit 1; }
mkdir -p "$OUT"
chmod 700 "$OUT"
# Con la frase i dati in chiaro non devono restare, nemmeno se qualcosa va storto.
[ -n "${FRASE:-}" ] && trap 'rm -rf "$OUT"' EXIT

psql_() { PGCLIENTENCODING=UTF8 psql "$DB" -X -v ON_ERROR_STOP=1 "$@"; }

# Il nome del file e cosa c'è dentro; una tabella che qui non c'è tiene il suo nome.
declare -A NOME=(
  [members]="soci|Soci: anagrafica, tessera, quote e versato"
  [member_passes]="abbonamenti|Abbonamenti e corsi dei soci"
  [trip_uses]="gite_fatte|Gite fatte con gli abbonamenti"
  [member_amount_changes]="storico_importi|Ogni cambio di totale e versato di un socio"
  [member_deletions]="soci_eliminati|Schede eliminate (per poterle rimettere)"
  [prices]="listino|Listino: tessere, agevolazioni, presciistica, abbonamenti, corsi"
  [departures]="partenze|Luoghi di partenza del pullman"
  [insurances]="assicurazioni|Tipi di assicurazione"
  [insurance_lists]="liste_assicurazione|Liste inviate all'assicurazione"
  [ledger_entries]="movimenti_bilancio|Entrate e uscite oltre alle quote (Bilancio)"
  [season_accounts]="saldi_banca|Saldo in banca a inizio stagione"
  [season_history]="stagioni_chiuse|Totali delle stagioni chiuse"
  [season_breakdown]="stagioni_chiuse_dettaglio|Conteggi per tipologia delle stagioni chiuse"
  [settings]="impostazioni|Impostazioni del sito"
  [profiles]="profili|Ruolo di ogni account"
  [role_grants]="permessi|Permessi di ogni ruolo"
  [role_grant_changes]="permessi_modifiche|Chi ha cambiato i permessi e quando"
  [pending_password_changes]="password_da_cambiare|Account che devono ancora cambiare la password"
  [nav_labels]="nomi_menu|Nomi delle voci del menu"
  [sponsors]="sponsor|Sponsor del club"
  [social_events]="post_social|Post dei social"
  [trip_days]="giorni_gita|Giorni delle gite (Social)"
  [social_settings]="social_impostazioni|Impostazioni di Social"
  [social_contacts]="social_contatti|Contatti da mettere nei post"
)

# Per ogni tabella la select che rende le colonne leggibili in Excel.
SELECT="$(psql_ -q -A -t -F $'\t' <<'SQL'
select c.relname, string_agg(case
    when t.typname in ('numeric', 'float4', 'float8') then format('replace(%1$I::text, ''.'', '','') as %1$I', a.attname)
    when t.typname = 'timestamptz' then format('to_char(%1$I at time zone ''Europe/Rome'', ''YYYY-MM-DD HH24:MI:SS'') as %1$I', a.attname)
    when t.typname = 'bool' then format('case when %1$I then ''sì'' when not %1$I then ''no'' end as %1$I', a.attname)
    -- Una cella di Excel tiene al massimo 32.767 caratteri (le immagini dei post ne hanno milioni).
    when t.typname in ('text', 'varchar', 'json', 'jsonb') then format('case when length(%1$I::text) > 32000 then ''(troppo lungo per Excel: è nel file .dump del backup)'' else %1$I::text end as %1$I', a.attname)
    else format('%I', a.attname) end, ', ' order by a.attnum)
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
join pg_attribute a on a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped
join pg_type t on t.oid = a.atttypid
where n.nspname = 'public' and c.relkind in ('r', 'p')
group by c.relname order by c.relname;
SQL
)"
[ -n "$SELECT" ] || { echo "nessuna tabella in public: database sbagliato?" >&2; exit 1; }
CON_ACCOUNT="$(psql_ -q -A -t -c "select to_regclass('auth.users') is not null")"

# Un solo psql, una sola transazione: ogni \copy scrive «COPY n», nell'ordine dei file.
FILE=()
{
  echo "begin isolation level repeatable read read only;"
  while IFS=$'\t' read -r tabella colonne; do
    nome="${NOME[$tabella]:-$tabella|}"; nome="${nome%%|*}"
    FILE+=("$nome.csv|$tabella")
    echo "\\copy (select $colonne from public.\"$tabella\") to '${OUT//\'/\'\'}/$nome.csv' with (format csv, header, delimiter ';')"
  done <<< "$SELECT"
  if [ "$CON_ACCOUNT" = t ]; then
    FILE+=("account.csv|auth.users")
    echo "\\copy (select id, email, to_char(created_at at time zone 'Europe/Rome', 'YYYY-MM-DD HH24:MI:SS') as created_at from auth.users order by email) to '${OUT//\'/\'\'}/account.csv' with (format csv, header, delimiter ';')"
  fi
  echo "commit;"
} > "$OUT/.comandi.sql"
CONTI=($(psql_ -f "$OUT/.comandi.sql" | sed -n 's/^COPY \([0-9]*\)$/\1/p'))
rm "$OUT/.comandi.sql"
[ "${#CONTI[@]}" -eq "${#FILE[@]}" ] || { echo "esportati ${#CONTI[@]} file su ${#FILE[@]}" >&2; exit 1; }

# Il BOM fa capire a Excel che il file è UTF-8 (senza, «NICOLÒ» diventa «NICOLÃ’»).
for f in "$OUT"/*.csv; do
  { printf '\xef\xbb\xbf'; cat "$f"; } > "$f.tmp" && mv "$f.tmp" "$f"
done

{
  echo "Sci Club Don Bosco Asti - copia di tutti i dati del gestionale"
  echo "Fatta il $(TZ=Europe/Rome date '+%d/%m/%Y alle %H:%M'), tutta nello stesso istante."
  echo
  echo "Ogni file .csv si apre con Excel o LibreOffice (doppio clic)."
  echo "Le colonne hanno i nomi del database, in inglese. In soci.csv: last_name cognome,"
  echo "first_name nome, tax_code codice fiscale, birth_date data di nascita, card_number"
  echo "numero tessera, card_type tessera, total totale, paid versato, balance da versare,"
  echo "payer_id il socio che paga per lui (il suo id), notes note."
  echo
  printf '%-34s %7s  %s\n' "File" "Righe" "Cosa c'è"
  for i in "${!FILE[@]}"; do
    f="${FILE[$i]%%|*}"; tabella="${FILE[$i]#*|}"
    descr="${NOME[$tabella]:-|}"; descr="${descr#*|}"
    [ "$tabella" = auth.users ] && descr="Account per entrare nel sito (senza password)"
    printf '%-34s %7s  %s (%s)\n' "$f" "${CONTI[$i]}" "${descr:-Tabella $tabella}" "$tabella"
  done | sort
  echo
  echo "Per rimettere i dati in un database nuovo serve l'altro file del backup,"
  echo "backup-AAAA-MM-GG.dump.gpg: vedi docs/BACKUP.md nel repository del sito."
} > "$OUT/LEGGIMI.txt"
sed -n '/^File /,/^$/p' "$OUT/LEGGIMI.txt"

# Un database senza soci non è una copia buona: meglio fallire e vederlo.
for i in "${!FILE[@]}"; do
  [ "${FILE[$i]#*|}" = members ] && [ "${CONTI[$i]}" -eq 0 ] && { echo "nessun socio esportato" >&2; exit 1; }
done

if [ -n "${FRASE:-}" ]; then
  # shortcut: la frase passa come argomento di 7z (visibile ai processi dello stesso
  # computer per un attimo); va bene sul runner usa-e-getta e sul PC del club.
  (cd "$(dirname "$OUT")" && 7z a -t7z -mhe=on -mx=9 -p"$FRASE" "$(basename "$OUT").7z" "$(basename "$OUT")" >/dev/null)
  echo "archivio: $OUT.7z"
fi
