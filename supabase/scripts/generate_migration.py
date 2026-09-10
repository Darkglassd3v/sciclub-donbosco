#!/usr/bin/env python3
"""Genera supabase/migration_seed.sql dai fogli del file Google Sheet esportato.

Uso:
    python3 supabase/scripts/generate_migration.py \
        "new_structure/SOCI 2026.xlsx" supabase/migration_seed.sql

Richiede openpyxl. Rigenerare il file SQL dopo ogni nuovo export del foglio.
"""

import re
import sys
from datetime import date, datetime
from pathlib import Path

import openpyxl

# Colonne del foglio SOCI 1.x (1-indexed), come lette da codice.gs/Admin.gs.
COL = {
    "timestamp": 1,
    "numero_polizza": 2,
    "cognome": 3,
    "nome": 4,
    "luogo_nascita": 5,
    "provincia_nascita": 6,
    "codice_fiscale": 7,
    "data_nascita": 8,
    "indirizzo": 9,
    "citta": 10,
    "provincia": 11,
    "cap": 12,
    "telefono": 13,
    "email": 14,
    "tipologia_tessera": 15,
    "agevolazioni_famiglia": 16,
    "tipo_abbonamento": 17,
    "partenza_domenica": 18,
    "partenze_sabato": 19,
    "tipologia_corso": 20,
    # Attenzione: nel foglio le etichette di colonna 21 e 23 sono invertite
    # rispetto al contenuto. Qui si segue il contenuto reale, cioè quello che
    # codice.gs e Admin.gs scrivono davvero.
    "totale": 21,
    "acconto": 22,
    "saldo_ignorato": 23,  # ricalcolato come colonna generata, non migrato
    "legacy_id": 24,
    "numero_tessera": 25,
    "legacy_payer_id": 26,
}

BATCH_SIZE = 500

# Le righe importate sono un archivio anagrafico: nel foglio la colonna
# "Informazioni cronologiche" è vuota al 100%, quindi non esiste una data di
# iscrizione reale da conservare. Se si lasciasse il default (now()) tutte le
# 5.000+ anagrafiche storiche risulterebbero iscritte alla stagione corrente e
# falserebbero il riepilogo. Si assegna quindi una data d'archivio esplicita,
# precedente a qualsiasi stagione: le nuove iscrizioni avranno la data vera.
DATA_ARCHIVIO = "2000-01-01T00:00:00+00:00"

TEXT_FIELDS = [
    "numero_polizza", "cognome", "nome", "luogo_nascita", "provincia_nascita",
    "codice_fiscale", "indirizzo", "citta", "provincia", "cap", "telefono",
    "email", "tipologia_tessera", "agevolazioni_famiglia", "tipo_abbonamento",
    "partenza_domenica", "partenze_sabato", "tipologia_corso", "numero_tessera",
]


def sql_str(value):
    """Letterale SQL per un testo, o NULL."""
    if value is None:
        return "NULL"
    text = str(value).strip()
    if text == "":
        return "NULL"
    return "'" + text.replace("'", "''") + "'"


def sql_num(value):
    if value is None or value == "":
        return "0"
    try:
        return f"{float(value):.2f}"
    except (TypeError, ValueError):
        return "0"


def clean_phone(value):
    """I telefoni sono letti da Excel come float (3468724757.0)."""
    if value is None:
        return None
    if isinstance(value, float) and value.is_integer():
        return str(int(value))
    return str(value).strip()


def parse_date(value):
    """Replica il parser di getMembers() in codice.gs.

    Formati presenti nel foglio: datetime nativo, 'mm/dd/yyyy', 'mm\\dd\\yy'.
    L'anno a due cifre segue la stessa regola della 1.x: <30 -> 2000+, <100 -> 1900+.
    """
    if value is None or value == "":
        return None
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value

    text = str(value).strip().replace("\\", "/")
    parts = [p for p in re.split(r"[/\-.]", text) if p != ""]
    if len(parts) != 3:
        return None
    try:
        month, day, year = int(parts[0]), int(parts[1]), int(parts[2])
    except ValueError:
        return None

    if year < 30:
        year += 2000
    elif year < 100:
        year += 1900

    # Alcune righe hanno giorno e mese invertiti: se il mese non è valido ma il
    # giorno sì, si scambiano invece di scartare la data.
    if month > 12 and day <= 12:
        month, day = day, month
    try:
        return date(year, month, day)
    except ValueError:
        return None


def read_soci(worksheet):
    rows = []
    for row_index in range(2, worksheet.max_row + 1):
        cognome = worksheet.cell(row=row_index, column=COL["cognome"]).value
        nome = worksheet.cell(row=row_index, column=COL["nome"]).value
        if not cognome and not nome:
            continue

        def cell(field):
            return worksheet.cell(row=row_index, column=COL[field]).value

        record = {field: cell(field) for field in TEXT_FIELDS}
        record["telefono"] = clean_phone(record["telefono"])
        record["data_nascita"] = parse_date(cell("data_nascita"))
        record["totale"] = cell("totale")
        record["acconto"] = cell("acconto")
        record["legacy_id"] = cell("legacy_id")
        record["legacy_payer_id"] = cell("legacy_payer_id")
        record["timestamp"] = cell("timestamp")
        record["_row"] = row_index
        rows.append(record)
    return rows


def read_prezzi(worksheet):
    out = []
    for row_index in range(2, worksheet.max_row + 1):
        categoria = worksheet.cell(row=row_index, column=1).value
        nome = worksheet.cell(row=row_index, column=2).value
        prezzo = worksheet.cell(row=row_index, column=3).value
        if not categoria or not nome:
            continue
        out.append((str(categoria).strip().upper(), str(nome).strip(), prezzo))
    return out


def read_partenze(worksheet):
    out = []
    for row_index in range(2, worksheet.max_row + 1):
        giorno = worksheet.cell(row=row_index, column=1).value
        luogo = worksheet.cell(row=row_index, column=2).value
        if not giorno or not luogo:
            continue
        out.append((str(giorno).strip().upper(), str(luogo).strip()))
    return out


def build_sql(soci, prezzi, partenze, source_name):
    lines = [
        "-- Sci Club Don Bosco 2.0 — dati iniziali",
        f"-- Generato da {source_name} con supabase/scripts/generate_migration.py",
        "-- Eseguire DOPO supabase/schema.sql.",
        "--",
        "-- La migrazione è in due fasi: prima si inseriscono i soci conservando",
        "-- l'ID storico del foglio, poi si risolvono i collegamenti familiari",
        "-- (legacy_payer_id -> payer_id). Gli ID del foglio non sono UUID validi,",
        "-- quindi restano in legacy_id e ogni socio riceve un UUID nuovo.",
        "--",
        f"-- created_at è forzato a {DATA_ARCHIVIO}: le righe importate sono un",
        "-- archivio anagrafico senza data di iscrizione (la colonna del foglio è",
        "-- vuota) e non devono essere conteggiate nella stagione corrente.",
        "",
        "begin;",
        "",
        "-- --------------------------------------------------------------------",
        "-- Listino",
        "-- --------------------------------------------------------------------",
        "",
    ]

    for categoria, nome, prezzo in prezzi:
        lines.append(
            "insert into public.prezzi (categoria, nome, prezzo) values "
            f"({sql_str(categoria)}, {sql_str(nome)}, {sql_num(prezzo)}) "
            "on conflict (categoria, nome) do update set prezzo = excluded.prezzo;"
        )

    lines += [
        "",
        "-- --------------------------------------------------------------------",
        "-- Luoghi di partenza",
        "-- --------------------------------------------------------------------",
        "",
    ]
    for giorno, luogo in partenze:
        lines.append(
            "insert into public.partenze (giorno, luogo) values "
            f"({sql_str(giorno)}, {sql_str(luogo)}) on conflict (giorno, luogo) do nothing;"
        )

    lines += [
        "",
        "-- --------------------------------------------------------------------",
        f"-- Soci ({len(soci)} righe)",
        "--",
        "-- legacy_payer_id è una colonna temporanea: serve solo a ricostruire i",
        "-- collegamenti familiari e viene rimossa in fondo al file.",
        "-- --------------------------------------------------------------------",
        "",
        "alter table public.soci add column if not exists legacy_payer_id text;",
        "",
    ]

    columns = (
        "created_at, data_iscrizione, legacy_id, legacy_payer_id, numero_polizza, cognome, nome, luogo_nascita, "
        "provincia_nascita, codice_fiscale, data_nascita, indirizzo, citta, provincia, "
        "cap, telefono, email, tipologia_tessera, agevolazioni_famiglia, tipo_abbonamento, "
        "partenza_domenica, partenze_sabato, tipologia_corso, totale, acconto, numero_tessera"
    )

    # Le righe vengono raggruppate in insert multi-valore: con 5.000+ soci una
    # insert per riga produce un file troppo grande per l'editor SQL di Supabase.
    batch = []
    for record in soci:
        data_nascita = record["data_nascita"]
        values = ", ".join([
            f"TIMESTAMPTZ '{DATA_ARCHIVIO}'",
            f"TIMESTAMPTZ '{DATA_ARCHIVIO}'",
            sql_str(record["legacy_id"]),
            sql_str(record["legacy_payer_id"]),
            sql_str(record["numero_polizza"]),
            sql_str(record["cognome"]),
            sql_str(record["nome"]),
            sql_str(record["luogo_nascita"]),
            sql_str(record["provincia_nascita"]),
            sql_str(record["codice_fiscale"]),
            f"DATE '{data_nascita.isoformat()}'" if data_nascita else "NULL",
            sql_str(record["indirizzo"]),
            sql_str(record["citta"]),
            sql_str(record["provincia"]),
            sql_str(record["cap"]),
            sql_str(record["telefono"]),
            sql_str(record["email"]),
            sql_str(record["tipologia_tessera"]),
            sql_str(record["agevolazioni_famiglia"]),
            sql_str(record["tipo_abbonamento"]),
            sql_str(record["partenza_domenica"]),
            sql_str(record["partenze_sabato"]),
            sql_str(record["tipologia_corso"]),
            sql_num(record["totale"]),
            sql_num(record["acconto"]),
            sql_str(record["numero_tessera"]),
        ])
        batch.append(f"  ({values})")

        if len(batch) == BATCH_SIZE:
            lines.append(f"insert into public.soci ({columns}) values")
            lines.append(",\n".join(batch))
            lines.append("on conflict (legacy_id) do nothing;")
            lines.append("")
            batch = []

    if batch:
        lines.append(f"insert into public.soci ({columns}) values")
        lines.append(",\n".join(batch))
        lines.append("on conflict (legacy_id) do nothing;")
        lines.append("")

    lines += [
        "",
        "-- --------------------------------------------------------------------",
        "-- Fase 2: risoluzione dei collegamenti familiari",
        "-- --------------------------------------------------------------------",
        "",
        "update public.soci d",
        "   set payer_id = c.id",
        "  from public.soci c",
        " where d.legacy_payer_id is not null",
        "   and d.legacy_payer_id <> ''",
        "   and c.legacy_id = d.legacy_payer_id",
        "   and c.id <> d.id;",
        "",
        "-- Collegamenti rimasti irrisolti (pagante non presente nel foglio):",
        "-- vengono elencati e lasciati senza payer_id, non scartati.",
        "do $$",
        "declare orfani int;",
        "begin",
        "  select count(*) into orfani",
        "    from public.soci",
        "   where legacy_payer_id is not null and legacy_payer_id <> '' and payer_id is null;",
        "  if orfani > 0 then",
        "    raise notice 'Collegamenti familiari non risolti: %', orfani;",
        "  end if;",
        "end $$;",
        "",
        "alter table public.soci drop column if exists legacy_payer_id;",
        "",
        "commit;",
        "",
    ]
    return "\n".join(lines)


def main():
    if len(sys.argv) != 3:
        print(__doc__)
        return 1

    source = Path(sys.argv[1])
    target = Path(sys.argv[2])

    workbook = openpyxl.load_workbook(source, data_only=True)
    soci = read_soci(workbook["SOCI"])
    prezzi = read_prezzi(workbook["PREZZI"])
    partenze = read_partenze(workbook["PARTENZE"])

    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(build_sql(soci, prezzi, partenze, source.name), encoding="utf-8")

    senza_data = sum(1 for r in soci if r["data_nascita"] is None)
    print(f"soci: {len(soci)} (senza data di nascita valida: {senza_data})")
    print(f"prezzi: {len(prezzi)}  partenze: {len(partenze)}")
    print(f"scritto: {target}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
