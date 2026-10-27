// Assicurazione (assicurazione.html): dopo «Scarica le liste».
// - Più liste in un click: il browser può bloccare i file dopo il primo. Sotto
//   compare un pulsante per lista, per riscaricarla da sola.
// - Un codice fiscale corretto dopo lo scarico: il file ha quello vecchio. Lo
//   scarico si annulla («Segna come assicurati» si spegne) e lo si dice.
// In un blocco: gli script della pagina e della prova hanno gli stessi nomi globali.
{
  const member = (id, typeName) => ({ id, last_name: id, first_name: "PROVA", birth_date: "1980-01-01", tax_code: "RSSMRA80A01F205X", insurance: typeName });
  FAKE.rpc.insurance_members = [member("B1", "BASE"), member("B2", "BASE"), member("S1", "SPORT")];
  FAKE.rpc.insurance_sent_lists = [];
  FAKE.rpc.set_tax_code = null;
  FAKE.risposta = (t) => (t === "insurances" ? [{ code: "BASE", name: "REALE MUTUA NEVE" }, { code: "SPORT", name: "REALE TOTAL SPORT" }] : []);
  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));

  window.addEventListener("load", () => setTimeout(async () => {
    const r = [];
    const test = (nome, real, why) => r.push(`${nome}=${real ? "ok" : `NO(${why})`}`);
    const downloaded = [];
    excelList = async (t, n) => { downloaded.push(`${t.kind}:${n}`); };
    el("decorrenza").value = "2026-11-15";
    await downloadAll();
    const theButtons = [...document.querySelectorAll("#passo [data-riscarica]")];
    test("unoPerLista", theButtons.length === 2, `${theButtons.length} pulsanti per riscaricare`);
    theButtons.find((b) => b.dataset.riscarica === "SPORT")?.click();
    await wait(200);
    test("riscaricaSola", downloaded.length === 3 && downloaded[2].startsWith("SPORT:"), `scaricati ${downloaded.join(",")}`);

    const row = document.querySelector('#elencoDa tr[data-id="B1"]');
    row.querySelector(".cf").value = "BNCLCU80A01F205X";
    row.querySelector(".salva-riga").click();
    await wait(300);
    test("cfDopoLoScarico", el("btnSegna").disabled && /riscaric/i.test(el("passo").textContent + (el("statusToast")?.textContent || "")),
      `segna spento ${el("btnSegna").disabled}, «${el("passo").textContent.trim().slice(0, 80)}»`);
    document.title = "RISULTATO " + r.join(" ");
  }, 500));
}
