// Assicurazione (assicurazione.html): dopo «Scarica le liste».
// - Più liste in un click: il browser può bloccare i file dopo il primo. Sotto
//   compare un pulsante per lista, per riscaricarla da sola.
// - Un codice fiscale corretto dopo lo scarico: il file ha quello vecchio. Lo
//   scarico si annulla («Segna come assicurati» si spegne) e lo si dice.
// In un blocco: gli script della pagina e della prova hanno gli stessi nomi globali.
{
  const socio = (id, tipo) => ({ id, last_name: id, first_name: "PROVA", birth_date: "1980-01-01", tax_code: "RSSMRA80A01F205X", insurance: tipo });
  FINTO.rpc.insurance_members = [socio("B1", "BASE"), socio("B2", "BASE"), socio("S1", "SPORT")];
  FINTO.rpc.insurance_sent_lists = [];
  FINTO.rpc.set_tax_code = null;
  FINTO.risposta = (t) => (t === "insurances" ? [{ code: "BASE", name: "REALE MUTUA NEVE" }, { code: "SPORT", name: "REALE TOTAL SPORT" }] : []);
  const aspetta = (ms) => new Promise((ok) => setTimeout(ok, ms));

  window.addEventListener("load", () => setTimeout(async () => {
    const r = [];
    const prova = (nome, vero, perche) => r.push(`${nome}=${vero ? "ok" : `NO(${perche})`}`);
    const scaricati = [];
    excelLista = async (t, n) => { scaricati.push(`${t.kind}:${n}`); };
    el("decorrenza").value = "2026-11-15";
    await scaricaTutte();
    const pulsanti = [...document.querySelectorAll("#passo [data-riscarica]")];
    prova("unoPerLista", pulsanti.length === 2, `${pulsanti.length} pulsanti per riscaricare`);
    pulsanti.find((b) => b.dataset.riscarica === "SPORT")?.click();
    await aspetta(200);
    prova("riscaricaSola", scaricati.length === 3 && scaricati[2].startsWith("SPORT:"), `scaricati ${scaricati.join(",")}`);

    const riga = document.querySelector('#elencoDa tr[data-id="B1"]');
    riga.querySelector(".cf").value = "BNCLCU80A01F205X";
    riga.querySelector(".salva-riga").click();
    await aspetta(300);
    prova("cfDopoLoScarico", el("btnSegna").disabled && /riscaric/i.test(el("passo").textContent + (el("statusToast")?.textContent || "")),
      `segna spento ${el("btnSegna").disabled}, «${el("passo").textContent.trim().slice(0, 80)}»`);
    document.title = "RISULTATO " + r.join(" ");
  }, 500));
}
