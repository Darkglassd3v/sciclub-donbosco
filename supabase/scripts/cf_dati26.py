#!/usr/bin/env python3
"""
Codici fiscali dei fogli dell'assicurazione (dati26/*Lista*.xlsx) contro il database.

    python3 supabase/scripts/cf_dati26.py dati26 supabase/migration/cf-AAAA-MM-GG

Legge i fogli e i soci (il database solo in lettura) e scrive nella cartella di uscita:

  correzioni.csv   id,tax_code: le righe di members da aggiornare. Vince il foglio.
  warning-cf.md    cosa controllare a mano: codici che il controllo segnala, persone
                   non trovate, omonimi, date che non tornano, conflitti fra fogli.

La cartella di uscita deve stare fuori da git (es. supabase/migration/, in .gitignore):
contiene nomi e codici fiscali veri.

Regole (decise il 30/09/2026):
  - un codice per persona, preso dai fogli: se nel database è diverso vince il foglio;
  - abbinamento su cognome + nome + data di nascita; senza una data utile, su cognome +
    nome solo se nel database c'è una persona sola con quel nome. Se la data del foglio
    è diversa ma il codice del foglio porta quella del database, è la stessa persona;
  - si correggono tutte le righe della persona, anche quelle delle stagioni vecchie;
  - ogni codice passa dal controllo (web/codicefiscale.js). Se il foglio non lo passa:
      * la riga del database ha già un codice che lo passa → resta quello (il foglio ha
        un errore di battitura: 19 casi il 30/09, 1-3 caratteri diversi);
      * è sbagliato o manca solo l'ultimo carattere → si scrive corretto;
      * altrimenti si scrive com'è nel foglio;
    tutti e tre vanno nei warning;
  - chi è nei fogli e non nel database non si crea: va nei warning (se il suo codice è già
    nel database sotto un nome scritto diverso, non c'è niente da fare).

Per applicare correzioni.csv (backup prima, tutto in una transazione):

    DB="$(cat supabase/.postgre_connect)"; OUT=supabase/migration/cf-AAAA-MM-GG
    psql "$DB" -X -c "\\copy (select id, tax_code from public.members) to '$OUT/backup-tax_code.csv' csv header"
    psql "$DB" -X -1 -v ON_ERROR_STOP=1 \\
      -c "create temp table cf (id uuid primary key, tax_code text)" \\
      -c "\\copy cf from '$OUT/correzioni.csv' csv header" \\
      -c "update public.members m set tax_code = cf.tax_code from cf where m.id = cf.id"
"""

import collections
import csv
import datetime
import glob
import json
import os
import re
import subprocess
import sys
import unicodedata
import xml.etree.ElementTree as ET
import zipfile

QUI = os.path.dirname(os.path.abspath(__file__))
RADICE = os.path.dirname(os.path.dirname(QUI))
NS = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"


# ---------------------------------------------------------------------------
# Lettura dei fogli (un .xlsx è uno zip di XML: niente openpyxl)
# ---------------------------------------------------------------------------

def righe_xlsx(percorso):
    """Righe del primo foglio come dizionari {colonna: valore}, valori come testo."""
    z = zipfile.ZipFile(percorso)
    condivise = []
    if "xl/sharedStrings.xml" in z.namelist():
        for si in ET.fromstring(z.read("xl/sharedStrings.xml")).iter(NS + "si"):
            condivise.append("".join(t.text or "" for t in si.iter(NS + "t")))
    righe = []
    for row in ET.fromstring(z.read("xl/worksheets/sheet1.xml")).iter(NS + "row"):
        riga = {}
        for c in row.findall(NS + "c"):
            colonna = re.match(r"[A-Z]+", c.get("r")).group()
            tipo, v = c.get("t"), c.find(NS + "v")
            if tipo == "inlineStr":
                riga[colonna] = "".join(t.text or "" for t in c.iter(NS + "t"))
            elif v is not None:
                riga[colonna] = condivise[int(v.text)] if tipo == "s" else v.text
        righe.append(riga)
    return righe


def data_di_nascita(valore):
    """Numero di Excel o testo "15\\08\\49", "15/08/1949" → "1949-08-15"; None se non si legge."""
    valore = (valore or "").strip()
    if re.fullmatch(r"\d+(\.\d+)?", valore):
        return (datetime.date(1899, 12, 30) + datetime.timedelta(days=int(float(valore)))).isoformat()
    m = re.fullmatch(r"(\d{1,2})[\\/.\-](\d{1,2})[\\/.\-](\d{2}|\d{4})", valore)
    if not m:
        return None
    giorno, mese, anno = (int(x) for x in m.groups())
    if anno < 100:
        # Due cifre: fino all'anno in corso è 2000 e qualcosa (i bambini dei corsi).
        anno += 2000 if anno <= datetime.date.today().year % 100 else 1900
    try:
        return datetime.date(anno, mese, giorno).isoformat()
    except ValueError:
        return None


def chiave(testo):
    """Solo lettere, maiuscole, senza accenti: "D'Angelo " e "DANGELO" sono lo stesso."""
    testo = unicodedata.normalize("NFKD", testo or "").encode("ascii", "ignore").decode()
    return re.sub(r"[^A-Z]", "", testo.upper())


def leggi_fogli(cartella):
    """Una voce per riga dei fogli, con file e posizione per i warning."""
    voci = []
    for percorso in sorted(glob.glob(os.path.join(cartella, "*Lista*.xlsx"))):
        righe = righe_xlsx(percorso)
        testata = next((r for r in righe if "Cognome" in r.values()), None)
        if not testata:
            continue
        col = {v.strip(): k for k, v in testata.items()}
        for n, r in enumerate(righe, start=1):
            cognome = (r.get(col["Cognome"]) or "").strip()
            if not cognome or r is testata:
                continue
            voci.append({
                "file": os.path.basename(percorso),
                "riga": n,
                "cognome": re.sub(r"\s+", " ", cognome.upper()),
                "nome": re.sub(r"\s+", " ", (r.get(col["Nome"]) or "").strip().upper()),
                "data_testo": (r.get(col["Data di nascita"]) or "").strip(),
                "data": data_di_nascita(r.get(col["Data di nascita"])),
                "cf": re.sub(r"\s", "", (r.get(col["Codice Fiscale"]) or "").upper()),
            })
    return voci


# ---------------------------------------------------------------------------
# Controllo con web/codicefiscale.js (lo stesso delle pagine)
# ---------------------------------------------------------------------------

NODE = r"""
const fs = require("fs");
const sorgente = fs.readFileSync(process.argv[1], "utf8");
const { verificaCF } = (0, eval)(`(() => { ${sorgente}; return { verificaCF }; })()`);
const voci = JSON.parse(fs.readFileSync(0, "utf8"));
process.stdout.write(JSON.stringify(voci.map((v) =>
  verificaCF(v.cf, { cognome: v.cognome, nome: v.nome, dataNascita: v.data || "" }))));
"""


def verifica(voci):
    esito = subprocess.run(["node", "-e", NODE, os.path.join(RADICE, "web", "codicefiscale.js")],
                           input=json.dumps(voci), capture_output=True, text=True, check=True)
    return json.loads(esito.stdout)


# ---------------------------------------------------------------------------
# Database (sola lettura)
# ---------------------------------------------------------------------------

def soci():
    db = open(os.path.join(RADICE, "supabase", ".postgre_connect")).read().strip()
    uscita = subprocess.run(
        ["psql", db, "-X", "-qAt", "-c",
         "set default_transaction_read_only = on",
         "-c", "\\copy (select id, last_name, first_name, birth_date, tax_code from public.members) to stdout csv"],
        capture_output=True, text=True, check=True).stdout
    return [dict(zip(("id", "cognome", "nome", "data", "cf"), r)) for r in csv.reader(uscita.splitlines()) if len(r) == 5]


# ---------------------------------------------------------------------------
# Abbinamento
# ---------------------------------------------------------------------------

MESI = "ABCDEHLMPRST"
OMOCODIA = "LMNPQRSTUV"


def porta_data(cf, iso):
    """True se nel codice c'è quella data di nascita (uomo o donna, omocodia compresa)."""
    if len(cf) < 11 or not iso:
        return False
    cifre = "".join(str(OMOCODIA.index(ch)) if i in (6, 7, 9, 10) and ch in OMOCODIA else ch
                    for i, ch in enumerate(cf[:11]))
    anno, mese, giorno = iso.split("-")
    if not cifre[9:11].isdigit() or cifre[8] not in MESI:
        return False
    return (cifre[6:8] == anno[2:] and MESI.index(cifre[8]) + 1 == int(mese)
            and int(cifre[9:11]) % 40 == int(giorno))


def solo_ultimo_carattere(esito):
    return all(p.startswith(("L'ultimo carattere", "Manca l'ultimo carattere")) for p in esito["problemi"])


def normale(cf):
    return re.sub(r"\s", "", (cf or "").upper())


def principale(cartella, uscita):
    voci = leggi_fogli(cartella)
    for v, e in zip(voci, verifica(voci)):
        v["esito"] = e

    # Un codice per persona: si raccolgono le righe dei fogli per codice.
    per_cf = collections.defaultdict(list)
    for v in voci:
        if v["cf"]:
            per_cf[v["cf"]].append(v)

    warning = collections.defaultdict(list)
    persone = []   # una per codice dei fogli
    for cf, righe in per_cf.items():
        nomi = collections.Counter((r["cognome"], r["nome"]) for r in righe)
        (cognome, nome), _ = nomi.most_common(1)[0]
        if len({(chiave(c), chiave(n)) for c, n in nomi}) > 1:
            warning["stesso_cf_nomi_diversi"].append((cf, sorted(nomi)))
        date = collections.Counter(r["data"] for r in righe if r["data"])
        data = date.most_common(1)[0][0] if date else None
        if len(date) > 1:
            warning["stesso_cf_date_diverse"].append((cf, cognome, nome, sorted(date)))
        esito = righe[0]["esito"] or {"ok": False, "problemi": ["codice vuoto"], "suggerito": None}
        if esito["ok"]:
            scritto, azione = cf, None
        elif esito.get("suggerito") and (len(cf) != 16 or solo_ultimo_carattere(esito)):
            scritto, azione = esito["suggerito"], f"scritto corretto: {esito['suggerito']}"
        elif len(cf) != 16:
            scritto, azione = None, "non scritto (non si ricostruisce)"
        else:
            scritto, azione = cf, "scritto com'è nel foglio"
        persone.append({"cf": cf, "scritto": scritto, "valido": esito["ok"], "problemi": esito["problemi"],
                        "azione": azione, "tenuti": set(), "cognome": cognome, "nome": nome, "data": data,
                        "dove": sorted({f'{r["file"]} r.{r["riga"]}' for r in righe})})
    senza_cf = [v for v in voci if not v["cf"]]

    # Stessa persona (nome + data) con due codici diversi nei fogli.
    per_persona = collections.defaultdict(list)
    for p in persone:
        per_persona[(chiave(p["cognome"]), chiave(p["nome"]), p["data"])].append(p)
    for ps in per_persona.values():
        if len(ps) > 1:
            warning["stessa_persona_piu_cf"].append((ps[0]["cognome"], ps[0]["nome"], ps[0]["data"],
                                                     [p["cf"] for p in ps]))

    righe_db = soci()
    con_cf = [s for s in righe_db if s["cf"]]
    for s, e in zip(con_cf, verifica(con_cf)):
        s["valido"] = bool(e and e["ok"])
    codici_db = {normale(s["cf"]) for s in con_cf}
    per_nome = collections.defaultdict(list)
    for s in righe_db:
        per_nome[(chiave(s["cognome"]), chiave(s["nome"]))].append(s)

    assegnati = collections.defaultdict(set)   # id socio -> codici proposti
    senza_data, data_sbagliata, gia_nel_db = [], [], []
    for p in persone:
        candidati = per_nome.get((chiave(p["cognome"]), chiave(p["nome"])), [])
        if not candidati:
            (gia_nel_db if p["cf"] in codici_db or p["scritto"] in codici_db else warning["non_trovati"]).append(p)
            continue
        date_db = {s["data"] for s in candidati if s["data"]}
        if p["data"] and p["data"] in date_db:
            giusta = p["data"]
        elif len(date_db) <= 1 and (not p["data"] or not date_db):
            # Una persona sola con quel nome e nessuna data da confrontare.
            giusta = None
            senza_data.append((p, date_db))
        else:
            # Data diversa: è la stessa persona se il codice del foglio porta una delle date del database.
            portate = [d for d in sorted(date_db) if porta_data(p["cf"], d)]
            if len(portate) != 1:
                warning["data_diversa" if len(date_db) == 1 else "omonimi"].append((p, sorted(date_db)))
                continue
            giusta = portate[0]
            data_sbagliata.append((p, giusta))
        # Le righe con quella data, più quelle senza data se il nome non ha altre date.
        scelti = candidati if giusta is None else [
            s for s in candidati if s["data"] == giusta or (not s["data"] and date_db == {giusta})]
        for s in scelti:
            if not p["valido"] and s.get("valido") and normale(s["cf"]) != p["scritto"]:
                p["tenuti"].add(normale(s["cf"]))   # il foglio ha un errore, il database no
            elif p["scritto"]:
                assegnati[s["id"]].add(p["scritto"])

    correzioni, cambiati, riempiti, uguali = [], [], [], 0
    per_id = {s["id"]: s for s in righe_db}
    for id_, codici in assegnati.items():
        s = per_id[id_]
        if len(codici) > 1:
            warning["socio_piu_cf"].append((s["cognome"], s["nome"], s["data"], sorted(codici)))
            continue
        nuovo = codici.pop()
        vecchio = normale(s["cf"])
        if vecchio == nuovo:
            uguali += 1
            continue
        correzioni.append((id_, nuovo))
        (cambiati if vecchio else riempiti).append((s, vecchio, nuovo))

    os.makedirs(uscita, exist_ok=True)
    with open(os.path.join(uscita, "correzioni.csv"), "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["id", "tax_code"])
        w.writerows(correzioni)

    scrivi_md(os.path.join(uscita, "warning-cf.md"), locals())
    print(f"righe nei fogli {len(voci)}, codici diversi {len(persone)}, "
          f"righe del database da aggiornare {len(correzioni)} "
          f"(riempite {len(riempiti)}, cambiate {len(cambiati)}, già giuste {uguali})")


def scrivi_md(percorso, x):
    w = x["warning"]
    d = lambda iso: "/".join(reversed(iso.split("-"))) if iso else "—"
    dubbi = [p for p in x["persone"] if not p["valido"]]
    tenuti = [p for p in dubbi if p["tenuti"]]
    out = ["# Codici fiscali dei fogli dati26 — warning", "",
           f"Generato il {datetime.date.today():%d/%m/%Y} da `supabase/scripts/cf_dati26.py`.", "",
           "## In breve", "",
           f"- righe lette nei fogli: {len(x['voci'])}; codici fiscali diversi: {len(x['persone'])}",
           f"- righe del database riempite (codice vuoto): {len(x['riempiti'])}",
           f"- righe del database cambiate (vince il foglio): {len(x['cambiati'])}",
           f"- righe già giuste: {x['uguali']}",
           f"- codici dei fogli che non passano il controllo: {len(dubbi)}, "
           f"di cui {len(tenuti)} lasciati come sono nel database perché lì il codice è giusto",
           f"- già nel database con lo stesso codice ma il nome scritto diverso: {len(x['gia_nel_db'])}",
           f"- persone dei fogli non trovate nel database: {len(w['non_trovati'])}",
           f"- non toccate perché ambigue (omonimi / data diversa): {len(w['omonimi'])} / {len(w['data_diversa'])}",
           ""]

    def sezione(titolo, spiegazione, testata, righe):
        if not righe:
            return
        out.extend([f"## {titolo} ({len(righe)})", "", spiegazione, "",
                    "| " + " | ".join(testata) + " |", "|" + "---|" * len(testata)])
        out.extend("| " + " | ".join(str(c).replace("|", "/") for c in r) + " |" for r in righe)
        out.append("")

    def fatto(p):
        cose = []
        if p["tenuti"]:
            cose.append("tenuto il codice del database: " + ", ".join(sorted(p["tenuti"])))
        if p["azione"]:
            cose.append(p["azione"])
        return "; ".join(cose)

    sezione("Codici del foglio che non passano il controllo",
            "Controllo di web/codicefiscale.js sul nome e sulla data del foglio. Se la riga del database "
            "aveva già un codice giusto è rimasto quello; se era sbagliato solo l'ultimo carattere si è "
            "scritto corretto; altrimenti si è scritto il codice del foglio. Da verificare sul documento.",
            ["Cognome", "Nome", "Nato il", "Codice nel foglio", "Cosa non torna", "Cosa si è fatto"],
            [(p["cognome"], p["nome"], d(p["data"]), p["cf"], "; ".join(p["problemi"]), fatto(p)) for p in dubbi])
    sezione("Persone dei fogli non trovate nel database",
            "Nessun socio creato. Può essere un cognome scritto diverso: cercarle a mano nel form Soci.",
            ["Cognome", "Nome", "Nato il", "Codice", "Dove"],
            [(p["cognome"], p["nome"], d(p["data"]), p["cf"], ", ".join(p["dove"][:3])) for p in w["non_trovati"]])
    sezione("Nome trovato ma con un'altra data di nascita (non toccati)",
            "Stesso cognome e nome, data diversa, e il codice del foglio non porta la data del database.",
            ["Cognome", "Nome", "Nato il (foglio)", "Nato il (database)", "Codice"],
            [(p["cognome"], p["nome"], d(p["data"]), ", ".join(d(i) for i in dd), p["cf"]) for p, dd in w["data_diversa"]])
    sezione("Omonimi (non toccati)",
            "Più persone con lo stesso nome nel database e nessuna con la data del foglio.",
            ["Cognome", "Nome", "Nato il (foglio)", "Date nel database", "Codice"],
            [(p["cognome"], p["nome"], d(p["data"]), ", ".join(d(i) for i in dd), p["cf"]) for p, dd in w["omonimi"]])
    sezione("Data sbagliata nel foglio (abbinati con il codice)",
            "La data del foglio non è quella del database, ma il codice porta quella del database: "
            "stessa persona, codice scritto.",
            ["Cognome", "Nome", "Nato il (foglio)", "Nato il (database)", "Codice"],
            [(p["cognome"], p["nome"], d(p["data"]), d(g), p["cf"]) for p, g in x["data_sbagliata"]])
    sezione("Abbinati senza poter confrontare la data",
            "Una sola persona con quel nome nel database, ma data mancante nel foglio o nel database.",
            ["Cognome", "Nome", "Nato il (foglio)", "Nato il (database)", "Codice"],
            [(p["cognome"], p["nome"], d(p["data"]), ", ".join(d(i) for i in dd) or "—", p["cf"]) for p, dd in x["senza_data"]])
    sezione("Già nel database con lo stesso codice, nome scritto diverso",
            "Niente da fare per il codice; il nome nel foglio e quello nel database sono scritti in modo diverso.",
            ["Cognome", "Nome", "Nato il", "Codice"],
            [(p["cognome"], p["nome"], d(p["data"]), p["cf"]) for p in x["gia_nel_db"]])
    sezione("Stessa persona con più codici nei fogli",
            "Stesso nome e data, codici diversi: se sono finiti sulla stessa riga del database non si è scritto nessuno dei due.",
            ["Cognome", "Nome", "Nato il", "Codici"],
            [(c, n, d(dt), ", ".join(cfs)) for c, n, dt, cfs in w["stessa_persona_piu_cf"]])
    sezione("Stesso socio, codici diversi proposti (non toccati)", "",
            ["Cognome", "Nome", "Nato il", "Codici"],
            [(c, n, d(dt), ", ".join(cfs)) for c, n, dt, cfs in w["socio_piu_cf"]])
    sezione("Stesso codice con nomi diversi nei fogli", "Si è usato il nome che compare più spesso.",
            ["Codice", "Nomi"],
            [(cf, "; ".join(f"{c} {n}" for c, n in nomi)) for cf, nomi in w["stesso_cf_nomi_diversi"]])
    sezione("Stesso codice con date di nascita diverse nei fogli", "Si è usata la data che compare più spesso.",
            ["Codice", "Cognome", "Nome", "Date"],
            [(cf, c, n, ", ".join(d(i) for i in dd)) for cf, c, n, dd in w["stesso_cf_date_diverse"]])
    sezione("Righe dei fogli senza codice fiscale", "",
            ["Cognome", "Nome", "Nato il", "Dove"],
            [(v["cognome"], v["nome"], d(v["data"]) if v["data"] else v["data_testo"] or "—", f'{v["file"]} r.{v["riga"]}') for v in x["senza_cf"]])
    sezione("Codici cambiati nel database (vecchio → nuovo)", "",
            ["Cognome", "Nome", "Nato il", "Prima", "Dopo"],
            [(s["cognome"], s["nome"], d(s["data"]), vecchio, nuovo) for s, vecchio, nuovo in x["cambiati"]])
    open(percorso, "w").write("\n".join(out) + "\n")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    principale(sys.argv[1], sys.argv[2])
