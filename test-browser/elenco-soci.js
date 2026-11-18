// Elenco soci (elenco.html, richiesta del 18/11/2026): i soci della stagione in ordine di tessera, a pagine.
// - Ordine del numero di tessera come numero (2 prima di 10, 100 dopo 63); senza numero in fondo, per cognome.
// - In alto i numeri di tessera liberi fra 1 e il più alto, con gli intervalli scritti «da–a».
// - Pagine da 50, «Pagina N di M»; la ricerca filtra come quella dei soci (cognome, nome, codice fiscale,
//   «D'ANGELO» = «DANGELO») e riparte dalla prima pagina.
// - Colonne di partenza: N° tessera, Cognome e nome, Tipo tessera, Abbonamento, Corso. «Colonne» apre una
//   finestra per aggiungerne o toglierne; la scelta resta nel browser.
// - Il nome porta alla scheda del socio nella pagina Soci (index.html?socio=<id>); i testi si leggono come testo.
// In un blocco: gli script della pagina e della prova hanno gli stessi nomi globali.
{
  localStorage.removeItem("sciclub-elenco-colonne");
  const id = (n) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
  const SOCI = [];
  for (let n = 1; n <= 63; n++) if (n !== 5 && n !== 12) SOCI.push({ id: id(n), card_number: String(n), last_name: `COGNOME${n}`, first_name: "NOME",
    card_type: "ORDINARIA", tax_code: null, course_type: null, course_day: null, phone: `333${n}`, member_insurance: null });
  SOCI[0] = { ...SOCI[0], last_name: "ROSSI", first_name: "MARIO", course_type: "CORSO SCI", course_day: "SABATO", tax_code: "RSSMRA80A01A479X" };
  SOCI[1] = { ...SOCI[1], last_name: "D'ANGELO", first_name: "<i>ANNA</i>" };
  SOCI.push({ id: id(100), card_number: "100", last_name: "CENTO", first_name: "UNO", card_type: "JUNIOR", phone: null, member_insurance: null });
  SOCI.push({ id: id(201), card_number: null, last_name: "ZETA", first_name: "Z", card_type: null, phone: null, member_insurance: null });
  SOCI.push({ id: id(202), card_number: null, last_name: "ALFA", first_name: "A", card_type: null, phone: null, member_insurance: null });
  SOCI.reverse(); // la pagina deve ordinare da sé
  FAKE.rpc.current_season = "2026-09-01T00:00:00+00:00";
  FAKE.risposta = (t) => {
    if (t === "members") return SOCI;
    if (t === "member_passes") return [{ member_id: id(1), pass_type: "10 VIAGGI SABATO" }, { member_id: id(1), pass_type: "JOLLY" }];
    if (t === "prices") return [];
    return [];
  };
  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const text = (node) => node?.textContent.replace(/\s+/g, " ").trim() || "";
  const rows = () => [...document.querySelectorAll("#elencoSoci tr")];
  const cell = (row, i) => text(row?.children[i]);
  const headers = () => [...document.querySelectorAll("#testataSoci th")].map(text);
  const search = async (q) => { el("cercaSoci").value = q; el("cercaSoci").dispatchEvent(new Event("input")); await wait(300); };

  window.addEventListener("load", () => setTimeout(async () => { try {
    const r = [];
    const test = (nome, passed, why) => r.push(`${nome}=${passed ? "ok" : `NO(${why})`}`);
    await wait(400);
    test("colonne", headers().join("|") === "N° tessera|Cognome e nome|Tipo tessera|Abbonamento|Corso", headers().join("|"));
    test("primaPagina", rows().length === 50 && cell(rows()[0], 0) === "1" && cell(rows()[1], 0) === "2" && cell(rows()[4], 0) === "6",
      `${rows().length} righe, prime ${rows().slice(0, 5).map((x) => cell(x, 0)).join(",")}`);
    test("pagine", /Pagina 1 di 2/.test(text(el("paginaSoci"))), text(el("paginaSoci")));
    test("liberi", /5, 12, 64–99/.test(text(el("tessereLibere"))), text(el("tessereLibere")));
    const first = rows()[0];
    test("dati", cell(first, 1) === "ROSSI MARIO" && cell(first, 2) === "ORDINARIA" && cell(first, 3) === "10 VIAGGI SABATO + JOLLY"
      && cell(first, 4) === "CORSO SCI (SABATO)", [1, 2, 3, 4].map((i) => cell(first, i)).join(" | "));
    test("link", first.querySelector("a")?.getAttribute("href") === `index.html?socio=${id(1)}`, first.querySelector("a")?.getAttribute("href"));
    test("testo", !rows()[1].querySelector("i") && /<i>ANNA<\/i>/.test(cell(rows()[1], 1)), rows()[1].innerHTML.slice(0, 120));

    el("pagSuccessiva").click();
    await wait(200);
    const last = rows().map((x) => `${cell(x, 0)}:${cell(x, 1)}`);
    test("secondaPagina", rows().length === 14 && last.at(-3).startsWith("100:") && last.at(-2) === ":ALFA A" && last.at(-1) === ":ZETA Z",
      last.slice(-3).join(" , "));

    await search("rossi");
    test("cercaCognome", rows().length === 1 && cell(rows()[0], 1) === "ROSSI MARIO" && /Pagina 1 di 1/.test(text(el("paginaSoci"))),
      `${rows().length} righe, ${text(el("paginaSoci"))}`);
    await search("dangelo");
    test("cercaApostrofo", rows().length === 1 && /D'ANGELO/.test(cell(rows()[0], 1)), `${rows().length} righe`);
    await search("RSSMRA80");
    test("cercaCodice", rows().length === 1, `${rows().length} righe`);
    await search("mario rossi");
    test("dueParole", rows().length === 1, `${rows().length} righe`);
    await search("nessunocosi");
    test("nessuno", rows().length === 1 && /Nessun socio/.test(text(rows()[0])), text(rows()[0]));
    await search("");

    el("btnColonne").click();
    await wait(200);
    test("finestra", el("dlgColonne")?.open === true, "la finestra delle colonne non si apre");
    el("dlgColonne").querySelector('input[value="telefono"]').click();
    el("dlgColonne").querySelector('input[value="corso"]').click();
    el("applicaColonne").click();
    await wait(200);
    test("aggiungiTogli", headers().includes("Telefono") && !headers().includes("Corso") && !el("dlgColonne").open, headers().join("|"));
    test("telefono", cell(rows()[0], headers().indexOf("Telefono")) === "3331", cell(rows()[0], headers().indexOf("Telefono")));
    const saved = JSON.parse(localStorage.getItem("sciclub-elenco-colonne") || "[]");
    test("ricordate", saved.includes("telefono") && !saved.includes("corso"), JSON.stringify(saved));
    localStorage.removeItem("sciclub-elenco-colonne");
    document.title = "RISULTATO " + r.join(" ");
  } catch (e) { document.title = `RISULTATO eccezione=NO(${String(e?.message || e).slice(0, 120)})`; } }, 500));
}
