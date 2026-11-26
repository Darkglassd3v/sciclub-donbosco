// Assicurazione (assicurazione.html), dalla 3.15.2: una lista alla volta e pagine chiare.
// - Sopra l'elenco un pulsante grande per lista («REALE MUTUA NEVE · 60 soci»), come le schede del
//   Riepilogo: si vede solo la lista scelta, con il suo titolo, e la colonna «Assicurazione» non c'è più.
// - Le pagine stanno sopra e sotto la tabella: «Pagina 1 di 3 · soci 1–25 di 60», «‹ Pagina precedente» e
//   «Pagina successiva ›», spenti agli estremi; con 25 soci o meno le pagine non si vedono.
// - Ogni lista ricorda la sua pagina; un codice fiscale scritto e non salvato si chiede anche cambiando lista.
// - Gli Excel prendono sempre tutte le liste; se la lista aperta si svuota, si apre l'altra.
// In un blocco: gli script della pagina e della prova hanno gli stessi nomi globali.
{
  const number = (i) => String(i).padStart(3, "0");
  const member = (letter, i, typeName) => ({ id: letter + number(i), last_name: letter + number(i), first_name: "PROVA",
    birth_date: "1980-01-01", tax_code: "RSSMRA80A01F205X", insurance: typeName });
  const list = (letter, n, typeName) => Array.from({ length: n }, (_, i) => member(letter, i + 1, typeName));
  FAKE.rpc.insurance_members = [...list("B", 60, "BASE"), ...list("S", 3, "SPORT")];
  FAKE.rpc.insurance_sent_lists = [];
  FAKE.risposta = (t) => (t === "insurances"
    ? [{ code: "BASE", name: "REALE MUTUA NEVE" }, { code: "SPORT", name: "REALE TOTAL SPORT" }] : []);

  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const clean = (node) => node?.textContent.replace(/\s+/g, " ").trim() || "";
  const tab = (kind) => document.querySelector(`#tabListe [role="tab"][data-kind="${kind}"]`);
  const rows = () => [...document.querySelectorAll("#elencoDa tr[data-id]")].map((tr) => tr.dataset.id);
  const pager = (where) => document.querySelector(`.pagine-assic[data-dove="${where}"]`);
  const shown = (node) => Boolean(node) && !node.hidden && node.getClientRects().length > 0;
  const text = (where) => clean(pager(where)?.querySelector(".pagine-testo"));
  const title = () => clean(document.querySelector("#testataLista .titolo-lista"));
  const question = () => document.getElementById("finestraDomanda");

  window.addEventListener("load", () => setTimeout(async () => {
    const r = [];
    const test = (nome, passed, why) => r.push(`${nome}=${passed ? "ok" : `NO(${why})`}`);
    if (!tab("BASE")) { document.title = "RISULTATO pulsanti=NO(nessun pulsante della lista)"; return; }

    test("pulsanti", tab("BASE").getAttribute("aria-selected") === "true" && tab("SPORT").getAttribute("aria-selected") === "false"
      && clean(tab("BASE")).includes("REALE MUTUA NEVE") && clean(tab("BASE")).includes("60 soci")
      && clean(tab("SPORT")).includes("REALE TOTAL SPORT") && clean(tab("SPORT")).includes("3 soci"),
      `Neve «${clean(tab("BASE"))}» ${tab("BASE").getAttribute("aria-selected")}, Sport «${clean(tab("SPORT"))}»`);
    test("unaLista", rows().length === 25 && rows().every((id) => id.startsWith("B")) && title().includes("REALE MUTUA NEVE")
      && title().includes("60 soci"), `${rows().length} righe, prima ${rows()[0]}, titolo «${title()}»`);
    const headers = [...document.querySelectorAll(".tabella-assic thead th")].map(clean);
    test("senzaColonnaTipo", !headers.includes("Assicurazione") && !document.querySelector("#elencoDa .tipo"),
      `intestazioni ${headers.join("|")}`);
    test("pagineSopraSotto", shown(pager("sopra")) && shown(pager("sotto"))
      && text("sopra") === "Pagina 1 di 3 · soci 1–25 di 60" && text("sotto") === text("sopra")
      && pager("sopra").querySelector("[data-indietro]").disabled && clean(pager("sopra").querySelector("[data-avanti]")).includes("Pagina successiva"),
      `sopra «${text("sopra")}» sotto «${text("sotto")}»`);

    pager("sotto").querySelector("[data-avanti]").click();
    await wait(100);
    test("avanti", rows()[0] === "B026" && text("sopra") === "Pagina 2 di 3 · soci 26–50 di 60"
      && document.activeElement === pager("sotto").querySelector("[data-avanti]"),
      `prima ${rows()[0]}, «${text("sopra")}», fuoco ${clean(document.activeElement).slice(0, 30)}`);
    pager("sopra").querySelector("[data-avanti]").click();
    await wait(100);
    test("ultima", rows().length === 10 && text("sotto") === "Pagina 3 di 3 · soci 51–60 di 60"
      && pager("sopra").querySelector("[data-avanti]").disabled && document.activeElement === pager("sopra").querySelector("[data-indietro]"),
      `${rows().length} righe, «${text("sotto")}», fuoco ${clean(document.activeElement).slice(0, 30)}`);

    tab("SPORT").click();
    await wait(100);
    test("sport", tab("SPORT").getAttribute("aria-selected") === "true" && rows().join(",") === "S001,S002,S003"
      && title().includes("REALE TOTAL SPORT") && !shown(pager("sopra")) && !shown(pager("sotto")),
      `righe ${rows().join(",")}, titolo «${title()}», pagine ${shown(pager("sopra"))}`);
    tab("BASE").click();
    await wait(100);
    test("ricordaPagina", text("sopra") === "Pagina 3 di 3 · soci 51–60 di 60", `«${text("sopra")}»`);

    document.querySelector("#elencoDa tr[data-id] .cf").value = "ABC";
    tab("SPORT").click();
    await wait(100);
    test("chiede", Boolean(question()) && tab("BASE").getAttribute("aria-selected") === "true", `domanda ${Boolean(question())}`);
    question()?.querySelector("[data-si]").click();
    await wait(100);
    test("cambiaDopo", rows()[0] === "S001", `prima ${rows()[0]}`);

    const downloaded = [];
    excelList = async (t, n, d, members) => { downloaded.push(`${t.kind}:${members.length}`); };
    await downloadAll();
    test("excelTutte", downloaded.join(",") === "BASE:60,SPORT:3", `scaricati ${downloaded.join(",")}`);

    FAKE.rpc.insurance_members = list("B", 4, "BASE");
    await load();
    await wait(100);
    test("listaVuota", tab("BASE")?.getAttribute("aria-selected") === "true" && rows().length === 4 && !tab("SPORT"),
      `Neve ${tab("BASE")?.getAttribute("aria-selected")}, righe ${rows().length}, Sport ${Boolean(tab("SPORT"))}`);

    document.title = "RISULTATO " + r.join(" ");
  }, 500));
}
