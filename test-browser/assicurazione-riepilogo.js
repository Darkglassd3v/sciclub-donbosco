// Assicurazione (assicurazione.html): il riepilogo in cima alla pagina (richiesta del 18/11/2026).
// - Quattro cifre come nei Pagamenti: Soci tesserati, Assicurati, Da assicurare, Senza assicurazione, lette da
//   insurance_summary() (chi ha solo il permesso polizze non legge i soci, ma può contarli).
// - «Da assicurare» in rosso finché ce n'è almeno uno, con sotto quanti sono senza codice fiscale (le righe
//   rosse dell'elenco); a zero in verde e senza nota.
// - Le cifre si rileggono con la pagina: dopo «Segna come assicurati» o «Annulla» cambiano.
// - Sul telefono (500 px) due caselle per riga, niente esce dallo schermo.
// In un blocco: gli script della pagina e della prova hanno gli stessi nomi globali.
{
  const member = (i, tax) => ({ id: "B" + i, last_name: "COGNOME" + i, first_name: "PROVA", birth_date: "1980-01-01",
    tax_code: tax ? "XXXXXX80A01F205X" : null, insurance: "BASE" });
  FAKE.rpc.insurance_members = [member(1, true), member(2, false), member(3, true), member(4, false)];
  FAKE.rpc.insurance_sent_lists = [];
  FAKE.rpc.insurance_summary = [{ card_holders: 80, insured: 69, to_insure: 4, uninsured: 7 }];
  FAKE.risposta = (t) => (t === "insurances" ? [{ code: "BASE", name: "REALE MUTUA NEVE" }] : []);

  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const text = (node) => node?.textContent.replace(/\s+/g, " ").trim() || "";
  const boxes = () => [...document.querySelectorAll(".cifre .kpi")];
  const box = (label) => boxes().find((b) => text(b.querySelector(".kpi-label")) === label);
  const value = (label) => text(box(label)?.querySelector(".kpi-value"));

  window.addEventListener("load", () => setTimeout(async () => {
    const r = [];
    const test = (nome, passed, why) => r.push(`${nome}=${passed ? "ok" : `NO(${why})`}`);
    try {
      test("caselle", boxes().map((b) => text(b.querySelector(".kpi-label"))).join("|") === "Soci tesserati|Assicurati|Da assicurare|Senza assicurazione",
        boxes().map((b) => text(b.querySelector(".kpi-label"))).join("|"));
      test("valori", ["Soci tesserati", "Assicurati", "Da assicurare", "Senza assicurazione"].map(value).join("|") === "80|69|4|7",
        ["Soci tesserati", "Assicurati", "Da assicurare", "Senza assicurazione"].map(value).join("|"));
      test("inCima", Boolean(document.querySelector(".cifre")?.compareDocumentPosition(el("invio")) & Node.DOCUMENT_POSITION_FOLLOWING),
        "il riepilogo non sta sopra le liste");
      test("rosso", box("Da assicurare")?.querySelector(".kpi-value").classList.contains("rosso"), "da assicurare non in rosso");
      test("senzaCodice", /di cui 2 senza codice fiscale/.test(text(box("Da assicurare"))), text(box("Da assicurare")));
      test("spiegazione", /tessera senza assicurazione/i.test(text(box("Senza assicurazione"))), text(box("Senza assicurazione")));

      // Tutti assicurati: le cifre si rileggono con la pagina (dopo un invio o un annullamento la pagina richiama load()).
      FAKE.rpc.insurance_members = [];
      FAKE.rpc.insurance_summary = [{ card_holders: 80, insured: 73, to_insure: 0, uninsured: 7 }];
      await load();
      await wait(100);
      test("aggiornate", value("Assicurati") === "73" && value("Da assicurare") === "0", `${value("Assicurati")} ${value("Da assicurare")}`);
      const zero = box("Da assicurare");
      test("zeroVerde", !zero.querySelector(".kpi-value").classList.contains("rosso") && zero.querySelector(".kpi-value").classList.contains("verde")
        && !/senza codice fiscale/.test(text(zero)), zero.innerHTML.slice(0, 160));

      if (window.innerWidth <= 600) {
        test("telefonoDuePerRiga", boxes()[0].getBoundingClientRect().top === boxes()[1].getBoundingClientRect().top
          && boxes()[2].getBoundingClientRect().top > boxes()[0].getBoundingClientRect().top, boxes().map((b) => Math.round(b.getBoundingClientRect().top)).join(","));
        test("telefonoLargo", document.documentElement.scrollWidth <= window.innerWidth + 1, `${document.documentElement.scrollWidth} > ${window.innerWidth}`);
      }
    } catch (e) { r.push(`eccezione=NO(${String(e?.message || e).slice(0, 120)})`); }
    document.title = "RISULTATO " + r.join(" ");
  }, 800));
}
