// Assicurazione (assicurazione.html), dalla 3.15.1: chi ha pagato quanto, e i nuclei familiari.
// - Chi ha dato un acconto (il nucleo ha versato qualcosa ma resta da pagare): riga gialla,
//   «Acconto: versati € X su € Y», casella «Assicura» accesa di default.
// - Chi non ha dato nessun acconto (il nucleo non ha versato nulla): riga rossa, «Nessun acconto:
//   da pagare € Y», casella spenta di default; si accende a mano e la scelta resta salvata.
// - Chi ha saldato: riga normale, casella accesa. Una riga spenta a mano non si confonde con
//   l'acconto (giallo) né con chi non ha pagato (rosso).
// - Solo a schermo i soci dello stesso nucleo stanno insieme, capofamiglia prima, con il segno del
//   nucleo, e (dalla 3.15.2) chi non ha dato l'acconto sta in cima, perché resterebbe fuori; i file
//   scaricati e l'invio restano nell'ordine del database (tipo, cognome, nome).
// In un blocco: gli script della pagina e della prova hanno gli stessi nomi globali.
{
  const member = (id, household, paid, total, debt) => ({ id, last_name: id, first_name: "PROVA", birth_date: "1980-01-01",
    tax_code: "RSSMRA80A01F205X", insurance: "BASE", debt, household_id: household, household_paid: paid,
    household_total: total });
  // L'ordine del database: per cognome.
  FAKE.rpc.insurance_members = [
    member("ACCONTO", "ACCONTO", 40, 100, 60),   // acconto
    member("ALFA", "ALFA", 35, 35, 0),           // saldato
    member("BONINO", "LUNGHI", 0, 280, 280),     // a carico di LUNGHI, nessun acconto
    member("CARLO", "CARLO", 35, 35, 0),
    member("LUNGHI", "LUNGHI", 0, 280, 280),     // capofamiglia, nessun acconto
    member("MEZZO", "MEZZO", 35, 35, 0),
  ];
  FAKE.rpc.insurance_sent_lists = [];
  FAKE.rpc.insurance_send_all = 5;
  FAKE.rpc.set_insurance_choice = 1;
  FAKE.risposta = (t) => (t === "insurances" ? [{ code: "BASE", name: "REALE MUTUA NEVE" }] : []);
  const sent = [];
  FAKE.errore = (t, request) => {
    if (t === "rpc:insurance_send_all") sent.push(request.parametri);
    if (t === "rpc:set_insurance_choice") {   // come il database: la scelta resta per chi riapre la pagina
      for (const s of FAKE.rpc.insurance_members) if (request.parametri.member_ids.includes(s.id)) s.insurance_choice = request.parametri.choice;
    }
    return null;
  };

  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const row = (id) => document.querySelector(`#elencoDa tr[data-id="${id}"]`);
  const box = (id) => row(id)?.querySelector(".assicura");
  const clean = (node) => node?.textContent.replace(/\s+/g, " ").trim() || "";
  const bg = (id) => getComputedStyle(row(id).querySelector("td")).backgroundColor;

  window.addEventListener("load", () => setTimeout(async () => {
    const r = [];
    const test = (nome, passed, why) => r.push(`${nome}=${passed ? "ok" : `NO(${why})`}`);
    const downloaded = [];
    excelList = async (t, n, d, members) => { downloaded.push(`${t.kind}:${members.map((s) => s.id).join("+")}`); };
    const download = async () => { downloaded.length = 0; await downloadAll(); return downloaded.join(","); };
    el("decorrenza").value = "2026-11-15";
    if (!row("ALFA")) { document.title = "RISULTATO caricata=NO(nessuna riga)"; return; }

    test("accontoGiallo", row("ACCONTO").classList.contains("con-acconto") && box("ACCONTO").checked
      && clean(row("ACCONTO")).includes("Acconto: versati € 40,00 su € 100,00"),
      `classi «${row("ACCONTO").className}», acceso ${box("ACCONTO").checked}, riga «${clean(row("ACCONTO")).slice(0, 120)}»`);
    test("nessunAccontoRosso", ["BONINO", "LUNGHI"].every((id) => row(id).classList.contains("senza-acconto")
      && !box(id).checked && clean(row(id)).includes("Nessun acconto: da pagare € 280,00")),
      ["BONINO", "LUNGHI"].map((id) => `${id} «${row(id).className}» ${box(id).checked} «${clean(row(id)).slice(0, 100)}»`).join("; "));
    const plain = bg("ALFA");
    const yellow = bg("ACCONTO");
    test("coloriDiversi", new Set([plain, bg("ACCONTO"), bg("LUNGHI")]).size === 3
      && !row("ALFA").classList.contains("con-acconto") && !row("ALFA").classList.contains("senza-acconto") && box("ALFA").checked,
      `saldato ${plain}, acconto ${bg("ACCONTO")}, nessun acconto ${bg("LUNGHI")}`);

    // A schermo il nucleo LUNGHI sta insieme, capofamiglia prima; senza acconto, sta in cima alla lista.
    const order = [...document.querySelectorAll("#elencoDa tr[data-id]")].map((tr) => tr.dataset.id).join(",");
    test("nucleoInsieme", order === "LUNGHI,BONINO,ACCONTO,ALFA,CARLO,MEZZO", `ordine ${order}`);
    test("segnoNucleo", ["LUNGHI", "BONINO"].every((id) => row(id).classList.contains("in-nucleo"))
      && !row("ALFA").classList.contains("in-nucleo") && clean(row("LUNGHI")).includes("Nucleo familiare: 2 soci"),
      `LUNGHI «${row("LUNGHI").className}» «${clean(row("LUNGHI")).slice(0, 120)}», ALFA «${row("ALFA").className}»`);

    // I file restano nell'ordine del database, senza chi non ha dato l'acconto.
    test("excelDiPartenza", await download() === "BASE:ACCONTO+ALFA+CARLO+MEZZO", `scaricati ${downloaded.join(",")}`);
    box("BONINO").click();
    await wait(100);
    test("accesoAMano", box("BONINO").checked && row("BONINO").classList.contains("senza-acconto")
      && await download() === "BASE:ACCONTO+ALFA+BONINO+CARLO+MEZZO", `acceso ${box("BONINO").checked}, scaricati ${downloaded.join(",")}`);

    // Spenta a mano, la riga di chi ha saldato ha un colore suo; quella dell'acconto resta gialla.
    box("ALFA").click();
    box("ACCONTO").click();
    await wait(100);
    test("spentaAMano", row("ALFA").classList.contains("non-selezionata")
      && new Set([bg("ALFA"), plain, yellow, bg("LUNGHI")]).size === 4,
      `spenta ${bg("ALFA")}, saldato ${plain}, acconto ${bg("ACCONTO")}, rosso ${bg("LUNGHI")}`);
    test("accontoRestaGiallo", !box("ACCONTO").checked && row("ACCONTO").classList.contains("con-acconto") && bg("ACCONTO") === yellow,
      `classi «${row("ACCONTO").className}»`);
    box("ALFA").click();
    box("ACCONTO").click();
    await wait(100);

    await download();
    await send();
    const sentIds = sent.at(-1)?.member_ids?.join("+");
    test("inviaInOrdine", sentIds === "ACCONTO+ALFA+BONINO+CARLO+MEZZO", `inviati ${sentIds}`);
    await wait(200);
    // La scelta è salvata nel database (dalla 3.15.2): BONINO acceso a mano resta acceso.
    test("dopoInvioSalvata", box("BONINO")?.checked === true && box("ACCONTO")?.checked,
      `BONINO ${box("BONINO")?.checked}, ACCONTO ${box("ACCONTO")?.checked}`);

    document.title = "RISULTATO " + r.join(" ");
  }, 500));
}
