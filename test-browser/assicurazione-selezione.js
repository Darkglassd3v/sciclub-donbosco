// Assicurazione (assicurazione.html): si sceglie chi assicurare, socio per socio.
// - Ogni riga con il codice fiscale ha la casella «Assicura», accesa di default per tutti.
//   Spenta, il socio resta fuori dai file Excel e dall'invio, e i conteggi dicono quanti non
//   sono selezionati. Dalla 3.15.2 la scelta si salva nel database (assicurazione-salvata.js). La riga non selezionata ha un colore
//   suo (dalla 3.15.1 il giallo è di chi ha dato un acconto, il rosso di chi non ha versato nulla:
//   assicurazione-acconto.js), e la riga dell'acconto spenta resta gialla.
// - Chi ha dato un acconto resta selezionato, con quanto ha versato sul totale; la vecchia casella
//   «Escludi dalla lista fino al saldo» non c'è più.
// - Nel titolo della lista aperta la casella «Tutti» spegne e riaccende i soci di quel tipo; con
//   solo alcuni spenti è «a metà», e il clic li riaccende tutti.
// - Cambiata la selezione dopo lo scarico, le liste vanno scaricate di nuovo.
// - «Segna come assicurati» manda solo i soci selezionati del file.
// In un blocco: gli script della pagina e della prova hanno gli stessi nomi globali.
{
  const member = (id, typeName, debt) => ({ id, last_name: id, first_name: "PROVA", birth_date: "1980-01-01",
    tax_code: "RSSMRA80A01F205X", insurance: typeName, debt, household_id: id,
    household_paid: debt ? 20 : 35, household_total: debt ? 20 + debt : 35 });
  FAKE.rpc.insurance_members = [
    member("DEBITO", "BASE", 45),     // acconto (versati 20 su 65): selezionato, riga gialla
    member("PARI", "BASE", 0),
    member("ALTRO", "BASE", 0),
    member("SPORT1", "SPORT", 0),
  ];
  FAKE.rpc.insurance_sent_lists = [];
  FAKE.rpc.set_tax_code = null;
  FAKE.rpc.insurance_send_all = 2;
  FAKE.rpc.set_insurance_choice = 1;
  FAKE.risposta = (t) => (t === "insurances" ? [{ code: "BASE", name: "REALE MUTUA NEVE" }, { code: "SPORT", name: "REALE TOTAL SPORT" }] : []);
  const rpcCalls = [];
  const sent = [];
  FAKE.errore = (t, request) => {
    if (t.startsWith("rpc:") && !["rpc:my_access", "rpc:insurance_members", "rpc:insurance_sent_lists", "rpc:insurance_summary"].includes(t)) rpcCalls.push(t);
    if (t === "rpc:insurance_send_all") sent.push(request.parametri);
    if (t === "rpc:set_insurance_choice") {   // come il database: la scelta resta per chi riapre la pagina
      for (const s of FAKE.rpc.insurance_members) if (request.parametri.member_ids.includes(s.id)) s.insurance_choice = request.parametri.choice;
    }
    return null;
  };

  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const row = (id) => document.querySelector(`#elencoDa tr[data-id="${id}"]`);
  const box = (id) => row(id)?.querySelector(".assicura");
  // Si vede una lista alla volta (dalla 3.15.2): «Tutti» è quella della lista aperta.
  const all = () => document.querySelector("#testataLista .assicura-tutti");
  const openList = async (kind) => { document.querySelector(`#tabListe [data-kind="${kind}"]`)?.click(); await wait(100); };
  const clean = (node) => node?.textContent.replace(/\s+/g, " ").trim() || "";
  const count = (kind) => clean(document.querySelector(`#tipi .progressivo[data-kind="${kind}"] .conta`));

  window.addEventListener("load", () => setTimeout(async () => {
    const r = [];
    const test = (nome, passed, why) => r.push(`${nome}=${passed ? "ok" : `NO(${why})`}`);
    const downloaded = [];
    excelList = async (t, n, d, members) => { downloaded.push(`${t.kind}:${members.map((s) => s.id).join("+")}`); };
    const download = async () => { downloaded.length = 0; await downloadAll(); return downloaded.join(","); };
    el("decorrenza").value = "2026-11-15";

    const ids = ["DEBITO", "PARI", "ALTRO"];
    await openList("SPORT");
    const sport = box("SPORT1")?.checked;
    await openList("BASE");
    test("tutteAccese", ids.every((id) => box(id)?.checked === true) && sport === true,
      ids.map((id) => `${id} ${box(id)?.checked}`).join(", ") + `, SPORT1 ${sport}`);
    test("etichetta", clean(box("PARI")?.closest("label")) === "Assicura: sì", `etichetta «${clean(box("PARI")?.closest("label"))}»`);
    test("accontoGiallo", row("DEBITO")?.classList.contains("con-acconto") && clean(row("DEBITO")).includes("Acconto: versati € 20,00 su € 65,00")
      && !row("PARI")?.classList.contains("con-acconto")
      && !/Escludi/.test(clean(document.getElementById("elencoDa"))),
      `classi «${row("DEBITO")?.className}», riga «${clean(row("DEBITO")).slice(0, 100)}»`);
    if (!box("PARI")) { document.title = "RISULTATO " + r.join(" "); return; }

    test("excelTutti", await download() === "BASE:DEBITO+PARI+ALTRO,SPORT:SPORT1", `scaricati ${downloaded.join(",")}`);

    box("PARI").click();
    await wait(100);
    test("annullaScarico", el("btnSegna").disabled, `segna spento ${el("btnSegna").disabled}`);
    // La riga non selezionata è tutta di un colore suo, diverso dall'acconto; l'acconto spento resta giallo.
    const bg = (id) => getComputedStyle(row(id).querySelector("td")).backgroundColor;
    const off = bg("PARI");
    const yellow = bg("DEBITO");
    test("rigaSpenta", row("PARI")?.classList.contains("non-selezionata") && [...row("PARI").querySelectorAll("td")].every((td) => getComputedStyle(td).backgroundColor === off)
      && off !== bg("ALTRO") && off !== yellow, `classi «${row("PARI")?.className}», sfondo ${off} contro ${bg("ALTRO")} e ${yellow}`);
    box("DEBITO").click();
    await wait(100);
    test("accontoSpentoGiallo", bg("DEBITO") === yellow && !box("DEBITO").checked, `sfondo ${bg("DEBITO")} contro ${yellow}`);
    box("DEBITO").click();
    await wait(100);
    test("conteggi", count("BASE").startsWith("2 da assicurare") && count("BASE").includes("1 non selezionato"),
      `conta «${count("BASE")}»`);
    test("excelSenza", await download() === "BASE:DEBITO+ALTRO,SPORT:SPORT1", `scaricati ${downloaded.join(",")}`);
    test("salvaNelDatabase", rpcCalls.length > 0 && rpcCalls.every((c) => c === "rpc:set_insurance_choice"), `chiamate ${rpcCalls.join(",")}`);

    // Con un socio spento «Tutti» è a metà: il primo clic riaccende tutti, il secondo li spegne.
    test("tuttiAMeta", all("BASE")?.indeterminate === true, `a metà ${all("BASE")?.indeterminate}`);
    all("BASE").click();
    await wait(100);
    test("tuttiAccesi", ["DEBITO", "PARI", "ALTRO"].every((id) => box(id)?.checked) && all("BASE")?.checked,
      `caselle ${["DEBITO", "PARI", "ALTRO"].map((id) => box(id)?.checked).join(",")}`);
    all("BASE").click();
    await wait(100);
    test("tuttiSpenti", ["DEBITO", "PARI", "ALTRO"].every((id) => !box(id)?.checked)
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
    // La scelta è salvata nel database (dalla 3.15.2): dopo l'invio ALTRO resta spento.
    test("dopoInvioSalvata", box("ALTRO")?.checked === false, `ALTRO ${box("ALTRO")?.checked}`);

    document.title = "RISULTATO " + r.join(" ");
  }, 500));
}
