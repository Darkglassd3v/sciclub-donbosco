#!/usr/bin/env python3
"""
Aggiorna uno dei file elencati in librerie.toml, copiati nel sito in web/vendor/.

    python3 strumenti/aggiorna-libreria.py SEZIONE [VERSIONE]

Senza VERSIONE prende l'ultima pubblicata su npm del pacchetto della sezione. Scarica il
pacchetto, ne verifica l'impronta con quella dichiarata da npm (dist.integrity), copia in
web/vendor/ il file e le licenze, cambia il nome del file nelle pagine che lo caricano e la
versione in librerie.toml. Lanciato con la versione già in uso non cambia niente: è anche il
modo di controllare che la copia sia intatta (git diff vuoto).

Non fa commit: dopo vanno lanciate le prove (bash test-browser/esegui.sh) e guardato il diff.
Solo libreria standard di Python (3.11 o successivo, per tomllib).
"""

import base64
import hashlib
import io
import json
import pathlib
import re
import sys
import tarfile
import tomllib
import urllib.request

RADICE = pathlib.Path(__file__).resolve().parent.parent
ELENCO = RADICE / "librerie.toml"
VENDOR = RADICE / "web" / "vendor"


def leggi_json(url):
    with urllib.request.urlopen(url, timeout=60) as risposta:
        return json.load(risposta)


def main(argomenti):
    if len(argomenti) not in (2, 3):
        sys.exit(__doc__)
    nome = argomenti[1]
    libreria = tomllib.loads(ELENCO.read_text(encoding="utf-8")).get(nome)
    if libreria is None:
        sys.exit(f"{nome} non è in librerie.toml.")
    pacchetto_npm = libreria["package"]
    versione = argomenti[2] if len(argomenti) == 3 else leggi_json(f"https://registry.npmjs.org/{pacchetto_npm}/latest")["version"]
    if not re.fullmatch(r"\d+\.\d+\.\d+", versione):
        sys.exit(f"Versione non valida: {versione}")

    vecchio, nuovo = f"{nome}-{libreria['version']}.js", f"{nome}-{versione}.js"
    pagine = {pagina: (RADICE / pagina).read_text(encoding="utf-8") for pagina in libreria["pages"]}
    for pagina, testo in pagine.items():
        if f"vendor/{vecchio}" not in testo:
            sys.exit(f"{pagina} non carica vendor/{vecchio}: niente è stato cambiato.")

    pacchetto = leggi_json(f"https://registry.npmjs.org/{pacchetto_npm}/{versione}")
    with urllib.request.urlopen(pacchetto["dist"]["tarball"], timeout=120) as risposta:
        dati = risposta.read()
    algoritmo, attesa = pacchetto["dist"]["integrity"].split("-", 1)
    if algoritmo != "sha512" or base64.b64encode(hashlib.sha512(dati).digest()).decode() != attesa:
        sys.exit("L'impronta del pacchetto scaricato non è quella dichiarata da npm: niente è stato cambiato.")
    # Si leggono solo i file indicati, senza estrarre l'archivio.
    with tarfile.open(fileobj=io.BytesIO(dati), mode="r:gz") as archivio:
        def leggi(percorso):
            return archivio.extractfile(archivio.getmember(f"package/{percorso}")).read()
        codice = leggi(libreria["file"])
        licenze = {percorso: leggi(percorso) for percorso in libreria["licenses"]}

    VENDOR.mkdir(exist_ok=True)
    (VENDOR / nuovo).write_bytes(codice)
    for percorso, testo in licenze.items():
        (VENDOR / f"{nome}-{pathlib.PurePosixPath(percorso).name}.txt").write_bytes(testo)
    if nuovo != vecchio:
        (VENDOR / vecchio).unlink(missing_ok=True)
    for pagina, testo in pagine.items():
        (RADICE / pagina).write_text(testo.replace(f"vendor/{vecchio}", f"vendor/{nuovo}"), encoding="utf-8")
    # La versione si cambia solo nella sezione della libreria.
    sezione = re.compile(rf'(^\[{re.escape(nome)}\]$.*?^version = ")[^"]*(")', re.S | re.M)
    ELENCO.write_text(sezione.sub(rf"\g<1>{versione}\g<2>", ELENCO.read_text(encoding="utf-8"), count=1), encoding="utf-8")

    print(f"{nome}: {libreria['version']} -> {versione} ({len(codice)} byte, impronta verificata).")
    print("Ora: bash test-browser/esegui.sh, poi git diff e commit.")


if __name__ == "__main__":
    main(sys.argv)
