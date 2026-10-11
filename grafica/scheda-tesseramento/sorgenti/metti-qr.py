#!/usr/bin/env python3
"""Mette il QR del canale WhatsApp nel file del tesseramento.

    python3 metti-qr.py "1TESSERAMENTO Scheda e Ricevuta.xlsx" "uscita.xlsx"

Il modulo resta com'era: nessuna riga, colonna o cella unita cambia. Si
aggiungono solo immagini nello spazio vuoto: nella scheda il QR nella colonna
M e, a sinistra, la scritta "Seguici su WhatsApp" nelle colonne I-L, sopra
l'avvertenza; nella ricevuta un riquadro con scritta e QR dentro la casella
azzurra, a destra dei totali. Opache e senza sovrapporsi a niente.

Lavora sull'XML dentro l'xlsx e non con openpyxl, che riscrivendo il file
perderebbe le forme disegnate (i quadratini da spuntare della scheda). Le
immagini sono ../qr-modulo.png, ../scritta-qr.png e ../riquadro-qr.png (le fa
rendi.sh). Il file
d'origine non si tocca.
"""
import os
import re
import sys
import zipfile

QUI = os.path.dirname(os.path.abspath(__file__))
MM = 36000  # EMU per millimetro

# foglio, disegno, immagine, colonna e riga di partenza (da 0), spostamento e misura in mm.
# Le misure sono del foglio: in stampa (scala 80%) il QR viene 14 mm.
IMMAGINI = [
    # Scheda ("iscrizione"): righe 78-82 fra l'informativa e la casella dei totali.
    ("sheet2", "drawing2", "qr-modulo.png", 12, 77, (2.5, 0.5), (18, 18)),
    ("sheet2", "drawing2", "scritta-qr.png", 8, 77, (0, 1.5), (47, 9)),
    # Ricevuta: sotto la casella non c'è posto senza alzare le righe; dentro, a
    # destra dei totali, sì: un riquadro bianco con la scritta e il QR.
    ("sheet1", "drawing1", "riquadro-qr.png", 12, 15, (0.4, 4), (19, 30)),
]


def ancora(col, riga, spost, misura, rid, nid, nome):
    """Un'immagine ancorata a una cella, con la sua misura (non si deforma se cambiano le righe)."""
    emu = lambda mm: int(round(mm * MM))
    cx, cy = emu(misura[0]), emu(misura[1])
    return (
        f'<xdr:oneCellAnchor><xdr:from><xdr:col>{col}</xdr:col><xdr:colOff>{emu(spost[0])}</xdr:colOff>'
        f'<xdr:row>{riga}</xdr:row><xdr:rowOff>{emu(spost[1])}</xdr:rowOff></xdr:from>'
        f'<xdr:ext cx="{cx}" cy="{cy}"/><xdr:pic><xdr:nvPicPr>'
        f'<xdr:cNvPr id="{nid}" name="{nome}" descr="Canale WhatsApp dello Sci Club Don Bosco"/>'
        f'<xdr:cNvPicPr><a:picLocks noChangeAspect="1"/></xdr:cNvPicPr></xdr:nvPicPr>'
        f'<xdr:blipFill><a:blip xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:embed="{rid}"/>'
        f'<a:stretch><a:fillRect/></a:stretch></xdr:blipFill>'
        f'<xdr:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="{cx}" cy="{cy}"/></a:xfrm>'
        f'<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr></xdr:pic><xdr:clientData/></xdr:oneCellAnchor>'
    )


def sostituisci(testo, vecchio, nuovo):
    assert testo.count(vecchio) == 1, f"atteso una volta: {vecchio}"
    return testo.replace(vecchio, nuovo)


def main(origine, uscita):
    with zipfile.ZipFile(origine) as z:
        parti = {n: z.read(n) for n in z.namelist()}
    assert not any("canale-whatsapp" in n for n in parti), "il QR c'è già"

    for png in sorted({i[2] for i in IMMAGINI}):
        with open(os.path.join(QUI, "..", png), "rb") as f:
            parti[f"xl/media/canale-whatsapp-{png}"] = f.read()

    for n, (foglio, disegno, png, col, riga, spost, misura) in enumerate(IMMAGINI, 1):
        rels = f"xl/drawings/_rels/{disegno}.xml.rels"
        rid = f"rIdQr{n}"
        parti[rels] = sostituisci(
            parti[rels].decode(), "</Relationships>",
            f'<Relationship Id="{rid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" '
            f'Target="../media/canale-whatsapp-{png}"/></Relationships>').encode()
        d = parti[f"xl/drawings/{disegno}.xml"].decode()
        nid = max(int(x) for x in re.findall(r'cNvPr id="(\d+)"', d)) + 1
        nome = "QR canale WhatsApp" if png.startswith("qr") else "Scritta canale WhatsApp"
        parti[f"xl/drawings/{disegno}.xml"] = sostituisci(
            d, "</xdr:wsDr>", ancora(col, riga, spost, misura, rid, nid, nome) + "</xdr:wsDr>").encode()

    with zipfile.ZipFile(uscita, "w", zipfile.ZIP_DEFLATED) as z:
        # [Content_Types].xml per primo, come lo scrive Excel.
        for nome in sorted(parti, key=lambda n: n != "[Content_Types].xml"):
            z.writestr(nome, parti[nome])


if __name__ == "__main__":
    main(*sys.argv[1:3])
