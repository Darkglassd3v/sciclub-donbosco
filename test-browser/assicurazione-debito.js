// Assicurazione (assicurazione.html): soci con un importo da saldare.
// - Chi ha un importo da saldare (saldo del nucleo familiare maggiore di zero) resta nell'elenco
//   «Da assicurare»; la sua riga ha la casella «Escludi dalla lista fino al saldo», spenta di
//   default, e l'importo da saldare accanto.
// - Casella spenta: il socio entra nei file Excel. Casella accesa: ne resta fuori, e i conteggi
//   dicono quanti soci sono esclusi.
// - Chi è a credito o in pari non ha la casella; una spunta rimasta accesa dopo il saldo non conta.
// - La scelta si salva subito (set_insurance_hold); se il salvataggio non riesce, la casella torna
//   com'era e i conteggi non cambiano.
// - Escludere un socio presente in una lista già scaricata annulla lo scarico: il file va
//   scaricato di nuovo prima dell'invio.
// In un blocco: gli script della pagina e della prova hanno gli stessi nomi globali.
{
  const member = (id, typeName, debt, hold) => ({ id, last_name: id, first_name: "PROVA", birth_date: "1980-01-01",
    tax_code: "RSSMRA80A01F205X", insurance: typeName, debt, insurance_hold: hold });
  FAKE.rpc.insurance_members = [
    member("DEBITO", "BASE", 45, false),    // importo da saldare, casella spenta: entra nella lista
    member("ESCLUSO", "BASE", 30, true),    // importo da saldare, casella accesa: resta fuori
    member("CREDITO", "BASE", 0, false),    // a credito o in pari: nessuna casella
    member("SALDATO", "BASE", 0, true),     // spunta rimasta dopo il saldo: entra nella lista
    member("SPORT1", "SPORT", 0, false),
  ];
  FAKE.rpc.insurance_sent_lists = [];
  FAKE.rpc.set_tax_code = null;
  FAKE.rpc.set_insurance_hold = null;
  FAKE.risposta = (t) => (t === "insurances" ? [{ code: "BASE", name: "REALE MUTUA NEVE" }, { code: "SPORT", name: "REALE TOTAL SPORT" }] : []);
  const calls = [];
  let failSave = false;
  FAKE.errore = (t, request) => {
    if (t !== "rpc:set_insurance_hold") return null;
    calls.push(request.parametri);
    return failSave ? { message: "Errore di prova" } : null;
  };

  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const row = (id) => document.querySelector(`#elencoDa tr[data-id="${id}"]`);
  const box = (id) => row(id)?.querySelector(".escludi-lista");
  const clean = (node) => node?.textContent.replace(/\s+/g, " ").trim() || "";
  const count = (kind) => clean(document.querySelector(`#tipi .progressivo[data-kind="${kind}"] .conta`));
  const title = (kind) => clean(document.querySelector(`#elencoDa tr.gruppo[data-kind="${kind}"]`));

  window.addEventListener("load", () => setTimeout(async () => {
    const r = [];
    const test = (nome, passed, why) => r.push(`${nome}=${passed ? "ok" : `NO(${why})`}`);
    const downloaded = [];
    excelList = async (t, n, d, members) => { downloaded.push(`${t.kind}:${members.map((s) => s.id).join("+")}`); };

    test("casella", Boolean(box("DEBITO")) && !box("DEBITO").checked && box("ESCLUSO")?.checked === true
      && !box("CREDITO") && !box("SALDATO") && !box("SPORT1"),
      `DEBITO ${box("DEBITO")?.checked}, ESCLUSO ${box("ESCLUSO")?.checked}, CREDITO ${Boolean(box("CREDITO"))}, SALDATO ${Boolean(box("SALDATO"))}`);
    test("etichetta", clean(row("DEBITO")).includes("Escludi dalla lista fino al saldo") && clean(row("DEBITO")).includes("45,00"),
      `riga «${clean(row("DEBITO")).slice(0, 120)}»`);
    test("conteggi", count("BASE").startsWith("3 da assicurare") && count("BASE").includes("1 escluso fino al saldo")
      && title("BASE").includes("1 escluso fino al saldo"), `conta «${count("BASE")}», titolo «${title("BASE")}»`);

    el("decorrenza").value = "2026-11-15";
    await downloadAll();
    // Senza le caselle le prove successive non hanno niente da cliccare.
    if (!box("DEBITO") || !box("ESCLUSO")) { document.title = "RISULTATO " + r.join(" ") + ` excel=NO(scaricati ${downloaded.join(",")})`; return; }
    test("excel", downloaded.join(",") === "BASE:DEBITO+CREDITO+SALDATO,SPORT:SPORT1", `scaricati ${downloaded.join(",")}`);

    box("DEBITO").click();
    await wait(300);
    test("salva", calls.length === 1 && calls[0]?.member_id === "DEBITO" && calls[0]?.hold === true, JSON.stringify(calls));
    test("annullaScarico", el("btnSegna").disabled, `segna spento ${el("btnSegna").disabled}`);
    test("rigaEsclusa", box("DEBITO")?.checked === true && row("DEBITO")?.classList.contains("esclusa"),
      `casella ${box("DEBITO")?.checked}, classi «${row("DEBITO")?.className}»`);
    test("conteggiDopo", count("BASE").startsWith("2 da assicurare") && count("BASE").includes("2 esclusi fino al saldo"),
      `conta «${count("BASE")}»`);
    downloaded.length = 0;
    await downloadAll();
    test("excelDopo", downloaded.join(",") === "BASE:CREDITO+SALDATO,SPORT:SPORT1", `scaricati ${downloaded.join(",")}`);

    failSave = true;
    box("ESCLUSO").click();
    await wait(300);
    test("erroreRipristina", box("ESCLUSO")?.checked === true && count("BASE").startsWith("2 da assicurare"),
      `casella ${box("ESCLUSO")?.checked}, conta «${count("BASE")}»`);
    failSave = false;
    box("ESCLUSO").click();
    await wait(300);
    test("includi", calls.at(-1)?.member_id === "ESCLUSO" && calls.at(-1)?.hold === false && count("BASE").startsWith("3 da assicurare"),
      `ultima ${JSON.stringify(calls.at(-1))}, conta «${count("BASE")}»`);

    document.title = "RISULTATO " + r.join(" ");
  }, 500));
}
