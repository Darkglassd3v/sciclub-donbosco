// Assicurazione (assicurazione.html): si sceglie chi assicurare, socio per socio.
// - Ogni riga con il codice fiscale ha la casella «Assicura», accesa di default per tutti.
//   Spenta, il socio resta fuori dai file Excel e dall'invio, e i conteggi dicono quanti non
//   sono selezionati. La scelta non si salva nel database. La riga non selezionata è tutta
//   gialla, anche se il socio è a debito.
// - Chi ha un importo da saldare resta selezionato, con la riga rossa e l'importo accanto; la
//   vecchia casella «Escludi dalla lista fino al saldo» non c'è più.
// - Nel titolo di ogni gruppo la casella «Tutti» spegne e riaccende i soci di quel tipo; con
//   solo alcuni spenti è «a metà», e il clic li riaccende tutti.
// - Cambiata la selezione dopo lo scarico, le liste vanno scaricate di nuovo.
// - «Segna come assicurati» manda solo i soci selezionati del file.
// In un blocco: gli script della pagina e della prova hanno gli stessi nomi globali.
{
  const member = (id, typeName, debt) => ({ id, last_name: id, first_name: "PROVA", birth_date: "1980-01-01",
    tax_code: "RSSMRA80A01F205X", insurance: typeName, debt });
  FAKE.rpc.insurance_members = [
    member("DEBITO", "BASE", 45),     // importo da saldare: selezionato, riga rossa
    member("PARI", "BASE", 0),
    member("ALTRO", "BASE", 0),
    member("SPORT1", "SPORT", 0),
  ];
  FAKE.rpc.insurance_sent_lists = [];
  FAKE.rpc.set_tax_code = null;
  FAKE.rpc.insurance_send_all = 2;
  FAKE.risposta = (t) => (t === "insurances" ? [{ code: "BASE", name: "REALE MUTUA NEVE" }, { code: "SPORT", name: "REALE TOTAL SPORT" }] : []);
  const rpcCalls = [];
  const sent = [];
  FAKE.errore = (t, request) => {
    if (t.startsWith("rpc:") && !["rpc:my_access", "rpc:insurance_members", "rpc:insurance_sent_lists"].includes(t)) rpcCalls.push(t);
    if (t === "rpc:insurance_send_all") sent.push(request.parametri);
    return null;
  };

  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const row = (id) => document.querySelector(`#elencoDa tr[data-id="${id}"]`);
  const box = (id) => row(id)?.querySelector(".assicura");
  const all = (kind) => document.querySelector(`#elencoDa tr.gruppo[data-kind="${kind}"] .assicura-tutti`);
  const clean = (node) => node?.textContent.replace(/\s+/g, " ").trim() || "";
  const count = (kind) => clean(document.querySelector(`#tipi .progressivo[data-kind="${kind}"] .conta`));

  window.addEventListener("load", () => setTimeout(async () => {
    const r = [];
    const test = (nome, passed, why) => r.push(`${nome}=${passed ? "ok" : `NO(${why})`}`);
    const downloaded = [];
    excelList = async (t, n, d, members) => { downloaded.push(`${t.kind}:${members.map((s) => s.id).join("+")}`); };
    const download = async () => { downloaded.length = 0; await downloadAll(); return downloaded.join(","); };
    el("decorrenza").value = "2026-11-15";

    const ids = ["DEBITO", "PARI", "ALTRO", "SPORT1"];
    test("tutteAccese", ids.every((id) => box(id)?.checked === true),
      ids.map((id) => `${id} ${box(id)?.checked}`).join(", "));
    test("etichetta", clean(box("PARI")?.closest("label")) === "Assicura", `etichetta «${clean(box("PARI")?.closest("label"))}»`);
    test("debitoRosso", row("DEBITO")?.classList.contains("a-debito") && clean(row("DEBITO")).includes("Importo da saldare")
      && clean(row("DEBITO")).includes("45,00") && !row("PARI")?.classList.contains("a-debito")
      && !/Escludi/.test(clean(document.getElementById("elencoDa"))),
      `classi «${row("DEBITO")?.className}», riga «${clean(row("DEBITO")).slice(0, 100)}»`);
    if (!box("PARI")) { document.title = "RISULTATO " + r.join(" "); return; }

    test("excelTutti", await download() === "BASE:DEBITO+PARI+ALTRO,SPORT:SPORT1", `scaricati ${downloaded.join(",")}`);

    box("PARI").click();
    await wait(100);
    test("annullaScarico", el("btnSegna").disabled, `segna spento ${el("btnSegna").disabled}`);
    // La riga non selezionata è tutta gialla, anche quella di chi è a debito (rossa).
    const bg = (id) => getComputedStyle(row(id).querySelector("td")).backgroundColor;
    const yellow = bg("PARI");
    test("rigaGialla", row("PARI")?.classList.contains("non-selezionata") && [...row("PARI").querySelectorAll("td")].every((td) => getComputedStyle(td).backgroundColor === yellow)
      && yellow !== bg("ALTRO"), `classi «${row("PARI")?.className}», sfondo ${yellow} contro ${bg("ALTRO")}`);
    box("DEBITO").click();
    await wait(100);
    test("debitoGiallo", bg("DEBITO") === yellow, `sfondo ${bg("DEBITO")} contro ${yellow}`);
    box("DEBITO").click();
    await wait(100);
    test("debitoTornaRosso", bg("DEBITO") !== yellow && bg("DEBITO") !== bg("ALTRO"), `sfondo ${bg("DEBITO")}`);
    test("conteggi", count("BASE").startsWith("2 da assicurare") && count("BASE").includes("1 non selezionato"),
      `conta «${count("BASE")}»`);
    test("excelSenza", await download() === "BASE:DEBITO+ALTRO,SPORT:SPORT1", `scaricati ${downloaded.join(",")}`);
    test("nienteNelDatabase", rpcCalls.length === 0, `chiamate ${rpcCalls.join(",")}`);

    // Con un socio spento «Tutti» è a metà: il primo clic riaccende tutti, il secondo li spegne.
    test("tuttiAMeta", all("BASE")?.indeterminate === true, `a metà ${all("BASE")?.indeterminate}`);
    all("BASE").click();
    await wait(100);
    test("tuttiAccesi", ["DEBITO", "PARI", "ALTRO"].every((id) => box(id)?.checked) && all("BASE")?.checked,
      `caselle ${["DEBITO", "PARI", "ALTRO"].map((id) => box(id)?.checked).join(",")}`);
    all("BASE").click();
    await wait(100);
    test("tuttiSpenti", ["DEBITO", "PARI", "ALTRO"].every((id) => !box(id)?.checked) && box("SPORT1")?.checked
      && await download() === "SPORT:SPORT1", `scaricati ${downloaded.join(",")}`);
    all("BASE").click();
    await wait(100);

    box("ALTRO").click();
    await wait(100);
    await download();
    await send();
    const sentIds = sent.at(-1)?.member_ids?.join("+");
    test("inviaSelezionati", sentIds === "DEBITO+PARI+SPORT1", `inviati ${sentIds}`);
    await wait(200);
    test("dopoInvioTutti", box("ALTRO")?.checked === true, `ALTRO ${box("ALTRO")?.checked}`);

    document.title = "RISULTATO " + r.join(" ");
  }, 500));
}
