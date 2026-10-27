// Assicurazione (assicurazione.html): «Da assicurare» a pagine di 25, per tipo.
// - Sotto ogni gruppo «‹ Indietro · 26–50 di 60 · Avanti ›»; con 25 o meno niente pulsanti.
// - Nel titolo del gruppo quanti sono senza codice fiscale (le righe rosse, sparse fra le pagine).
// - Dopo Salva si resta sulla pagina, e un codice scritto e non salvato su un'altra riga resta;
//   lista accorciata: l'ultima pagina che c'è.
// - Un codice fiscale scritto e non salvato: prima di cambiare pagina lo si chiede.
// - Gli Excel prendono tutti i soci col codice fiscale, non solo la pagina.
// - Un codice fiscale sbagliato dice solo «Codice fiscale errato» (e il proposto), senza il motivo.
// - Cambiata pagina il fuoco resta su Indietro/Avanti (tastiera), anche all'ultima.
// In un blocco: gli script della pagina e della prova hanno gli stessi nomi globali.
{
  const number = (i) => String(i).padStart(3, "0");
  // 60 Base (senza codice fiscale il 17, il 34 e il 51) e 3 Sport.
  const member = (letter, i, typeName) => ({ id: letter + number(i), last_name: letter + number(i), first_name: "PROVA",
    birth_date: "1980-01-01", tax_code: letter === "B" && i % 17 === 0 ? null : "XXXXXX80A01F205X", insurance: typeName });
  const base = (n) => Array.from({ length: n }, (_, i) => member("B", i + 1, "BASE"));
  const SPORT = [1, 2, 3].map((i) => member("S", i, "SPORT"));
  FAKE.rpc.insurance_members = [...base(60), ...SPORT];
  FAKE.rpc.insurance_sent_lists = [];
  FAKE.rpc.set_tax_code = null;
  FAKE.risposta = (t) => (t === "insurances"
    ? [{ code: "BASE", name: "REALE MUTUA NEVE" }, { code: "SPORT", name: "REALE TOTAL SPORT" }] : []);

  const wait = (ms) => new Promise((fine) => setTimeout(fine, ms));
  const rows = (letter) => [...document.querySelectorAll(`#elencoDa tr[data-id^="${letter}"]`)];
  const pages = (kind) => document.querySelector(`#elencoDa tr.pagine[data-kind="${kind}"]`);
  const text = (kind) => pages(kind)?.querySelector(".pagine-testo")?.textContent.trim();
  const forward = (kind) => pages(kind).querySelector("[data-avanti]");
  const back = (kind) => pages(kind).querySelector("[data-indietro]");
  const question = () => document.getElementById("finestraDomanda");

  window.addEventListener("load", () => setTimeout(async () => {
    const r = [];
    const test = (nome, passed, why) => r.push(`${nome}=${passed ? "ok" : `NO(${why})`}`);
    if (!pages("BASE")) { document.title = `RISULTATO pagine=NO(nessuna riga tr.pagine, ${rows("B").length} righe Base)`; return; }

    const baseTitle = [...document.querySelectorAll("#elencoDa tr.gruppo")].find((t) => t.textContent.includes("REALE MUTUA NEVE"));
    test("prima", rows("B").length === 25 && text("BASE") === "1–25 di 60" && back("BASE").disabled,
      `${rows("B").length} righe, «${text("BASE")}», indietro spento ${back("BASE").disabled}`);
    test("pocheSenzaPagine", rows("S").length === 3 && !pages("SPORT"), `${rows("S").length} Sport, pagine ${Boolean(pages("SPORT"))}`);
    test("senzaCF", baseTitle?.textContent.includes("3 senza codice fiscale"), `titolo «${baseTitle?.textContent.trim()}»`);

    const taxCodeNotice = rows("B")[0]?.querySelector(".avviso-cf");
    const taxCodeText = taxCodeNotice && !taxCodeNotice.hidden ? taxCodeNotice.textContent.replace(/\s+/g, " ").trim() : "";
    test("cfGenerico", taxCodeText.startsWith("Codice fiscale errato") && !/dovrebbe|lettere|carattere/i.test(taxCodeText), `avviso «${taxCodeText}»`);

    forward("BASE").click();
    test("avanti", rows("B")[0]?.dataset.id === "B026" && rows("B").length === 25 && text("BASE") === "26–50 di 60",
      `prima ${rows("B")[0]?.dataset.id}, «${text("BASE")}»`);

    const b026 = rows("B")[0];
    b026.querySelector(".cf").value = "RSSMRA80A01F205X";
    rows("B")[2].querySelector(".cf").value = "ABC";   // B028, scritto e non salvato
    b026.querySelector(".salva-riga").click();
    await wait(300);
    test("salvaResta", text("BASE") === "26–50 di 60" && rows("B")[0]?.dataset.id === "B026", `«${text("BASE")}»`);
    const b028 = rows("B")[2]?.querySelector(".cf");
    test("salvaNonPerde", b028?.value === "ABC", `B028 «${b028?.value}»`);

    rows("B")[1].querySelector(".cf").value = "ABC";
    forward("BASE").click();
    test("chiede", Boolean(question()) && text("BASE") === "26–50 di 60", `domanda ${Boolean(question())}, «${text("BASE")}»`);
    question()?.querySelector("[data-no]").click();
    test("annulla", !question() && text("BASE") === "26–50 di 60" && rows("B")[1].querySelector(".cf").value === "ABC",
      `domanda ${Boolean(question())}, «${text("BASE")}»`);
    forward("BASE").click();
    question()?.querySelector("[data-si]").click();
    test("ultima", rows("B").length === 10 && text("BASE") === "51–60 di 60" && forward("BASE").disabled,
      `${rows("B").length} righe, «${text("BASE")}», avanti spento ${forward("BASE")?.disabled}`);
    // All'ultima pagina Avanti è spento: il fuoco va su Indietro, non si perde.
    test("fuoco", document.activeElement === back("BASE"), `fuoco su ${document.activeElement?.tagName} ${document.activeElement?.textContent.trim().slice(0, 20)}`);
    back("BASE").click();
    test("indietro", !question() && text("BASE") === "26–50 di 60", `domanda ${Boolean(question())}, «${text("BASE")}»`);
    forward("BASE").click();

    const downloaded = [];
    excelList = async (t, n, d, members) => { downloaded.push(`${t.kind}:${members.length}`); };
    await downloadAll();
    test("excelTutti", downloaded.join(",") === "BASE:57,SPORT:3", `scaricati ${downloaded.join(",")}`);

    FAKE.rpc.insurance_members = [...base(30), ...SPORT];
    await load();
    test("accorciata", text("BASE") === "26–30 di 30" && rows("B").length === 5, `«${text("BASE")}», ${rows("B").length} righe`);

    document.title = "RISULTATO " + r.join(" ");
  }, 500));
}
