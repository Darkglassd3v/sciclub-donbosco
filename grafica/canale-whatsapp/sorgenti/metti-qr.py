#!/usr/bin/env python3
"""Mette il QR del canale WhatsApp nel file del tesseramento.

    python3 metti-qr.py "1TESSERAMENTO Scheda e Ricevuta.xlsx" "uscita.xlsx"

Lavora sull'XML dentro l'xlsx e non con openpyxl, che riscrivendo il file
perderebbe le forme disegnate (i quadratini da spuntare della scheda). Le
modifiche sono poche:

- foglio "iscrizione": l'avvertenza "Lo sci-club declina..." (riga 81) era
  unita da B a M; ora da B a H, così a destra, accanto a "data / firma",
  c'è posto per l'etichetta col QR (righe 78-82, colonne I-M); la riga
  vuota 82 passa da 6,75 a 12 punti;
- foglio "ricevuta": la riga di "visto: per ricevuta" (23) è più alta e a
  destra, nelle colonne G-M libere, c'è l'etichetta col QR. L'area di stampa
  non cambia: il regolamento sotto resta fuori come prima.

Le etichette sono ../etichetta-scheda.png e ../etichetta-ricevuta.png (le fa
rendi.sh). Il file d'origine non si tocca.
"""
import os
import re
import sys
import zipfile

QUI = os.path.dirname(os.path.abspath(__file__))
MM = 36000  # EMU per millimetro

# foglio, disegno, immagine, colonna e riga di partenza (da 0), spostamento in mm, misura in mm
ETICHETTE = [
    ("sheet2", "drawing2", "etichetta-scheda.png", 8, 77, (2, 0), (68, 19)),
    ("sheet1", "drawing1", "etichetta-ricevuta.png", 6, 22, (0, 1), (72, 30)),
]


def ancora(col, riga, spost, misura, rid, nid):
    """Un'immagine ancorata a una cella, con la sua misura (non si deforma se cambiano le righe)."""
    cx, cy = misura[0] * MM, misura[1] * MM
    return (
        f'<xdr:oneCellAnchor><xdr:from><xdr:col>{col}</xdr:col><xdr:colOff>{spost[0] * MM}</xdr:colOff>'
        f'<xdr:row>{riga}</xdr:row><xdr:rowOff>{spost[1] * MM}</xdr:rowOff></xdr:from>'
        f'<xdr:ext cx="{cx}" cy="{cy}"/><xdr:pic><xdr:nvPicPr>'
        f'<xdr:cNvPr id="{nid}" name="QR canale WhatsApp" descr="QR del canale WhatsApp dello Sci Club Don Bosco"/>'
        f'<xdr:cNvPicPr><a:picLocks noChangeAspect="1"/></xdr:cNvPicPr></xdr:nvPicPr>'
        f'<xdr:blipFill><a:blip xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:embed="{rid}"/>'
        f'<a:stretch><a:fillRect/></a:stretch></xdr:blipFill>'
        f'<xdr:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="{cx}" cy="{cy}"/></a:xfrm>'
        f'<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr></xdr:pic><xdr:clientData/></xdr:oneCellAnchor>'
    )


def sostituisci(testo, vecchio, nuovo, quante=1):
    assert testo.count(vecchio) == quante, f"atteso {quante} volte: {vecchio}"
    return testo.replace(vecchio, nuovo)


def main(origine, uscita):
    with zipfile.ZipFile(origine) as z:
        parti = {n: z.read(n) for n in z.namelist()}
    assert not any("etichetta" in n for n in parti), "il QR c'è già"

    for i, (foglio, disegno, png, col, riga, spost, misura) in enumerate(ETICHETTE):
        media = f"xl/media/qr-canale-whatsapp-{i + 1}.png"
        with open(os.path.join(QUI, "..", png), "rb") as f:
            parti[media] = f.read()
        rels = f"xl/drawings/_rels/{disegno}.xml.rels"
        r = parti[rels].decode()
        rid = f"rIdQr{i + 1}"
        r = sostituisci(r, "</Relationships>",
                        f'<Relationship Id="{rid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" '
                        f'Target="../media/{os.path.basename(media)}"/></Relationships>')
        parti[rels] = r.encode()
        d = parti[f"xl/drawings/{disegno}.xml"].decode()
        nid = max(int(x) for x in re.findall(r'cNvPr id="(\d+)"', d)) + 1
        d = sostituisci(d, "</xdr:wsDr>", ancora(col, riga, spost, misura, rid, nid) + "</xdr:wsDr>")
        parti[f"xl/drawings/{disegno}.xml"] = d.encode()

    # Scheda: l'avvertenza lascia libere le colonne I-M per il QR.
    s = parti["xl/worksheets/sheet2.xml"].decode()
    s = sostituisci(s, '<mergeCell ref="B81:M81"/>', '<mergeCell ref="B81:H81"/>')
    # E la riga vuota sotto l'avvertenza un po' più alta: 5 punti, la pagina ne ha una decina liberi.
    s = sostituisci(s, '<row r="82" spans="1:17" ht="6.75" customHeight="1">', '<row r="82" spans="1:17" ht="12" customHeight="1">')
    parti["xl/worksheets/sheet2.xml"] = s.encode()

    # Ricevuta: la riga di "visto" alta quanto l'etichetta (30 mm più il margine).
    s = parti["xl/worksheets/sheet1.xml"].decode()
    s = sostituisci(s, '<row r="23" spans="1:13" ht="40.5" customHeight="1">',
                    '<row r="23" spans="1:13" ht="90" customHeight="1">')
    parti["xl/worksheets/sheet1.xml"] = s.encode()

    with zipfile.ZipFile(uscita, "w", zipfile.ZIP_DEFLATED) as z:
        # [Content_Types].xml per primo, come lo scrive Excel.
        for nome in sorted(parti, key=lambda n: n != "[Content_Types].xml"):
            z.writestr(nome, parti[nome])


if __name__ == "__main__":
    main(*sys.argv[1:3])
