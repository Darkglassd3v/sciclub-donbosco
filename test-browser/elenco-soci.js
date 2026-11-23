// Elenco soci (elenco.html): i soci della stagione in ordine di tessera, a pagine, nello stile dei Pagamenti
// (richieste del 18/11/2026).
// - Ordine del numero di tessera come numero (2 prima di 10, 100 dopo 63); senza numero in fondo, per cognome.
// - I nuclei familiari restano uniti, come nei Pagamenti: il nucleo sta al posto della sua tessera più bassa, con
//   una riga d'intestazione «Nucleo COGNOME NOME · N persone · tessere …», prima il capofamiglia e poi i familiari
//   rientrati con la pillola «a carico». Un capofamiglia che quest'anno non è tesserato si legge a parte e
//   l'intestazione lo dice.
// - La prima colonna è sempre il socio: nome (link alla scheda), «Tessera n° …» o «Senza numero tessera».
// - In alto le cifre: soci, nuclei familiari, familiari a carico, numeri di tessera liberi; sotto i numeri liberi
//   fra 1 e il più alto, con gli intervalli scritti «da–a».
// - Pagine da 50 persone al massimo, senza spezzare un nucleo; «Pagina N di M · X soci in Y nuclei».
// - La ricerca filtra come quella dei soci (cognome, nome, codice fiscale, «D'ANGELO» = «DANGELO», anche il nome
//   del capofamiglia non tesserato) e mostra il nucleo intero, con evidenziato chi è stato trovato.
// - «Colonne» apre una finestra: caselle per mostrarle e pulsanti «Su»/«Giù» per l'ordine (mai solo
//   trascinare), con un annuncio per chi usa il lettore di schermo; la scelta e l'ordine restano nel browser.
// - Sul telefono (500 px) ogni socio è una scheda con le righe «etichetta … valore».
// In un blocco: gli script della pagina e della prova hanno gli stessi nomi globali.
{
  localStorage.removeItem("sciclub-elenco-colonne");
  const id = (n) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
  const SOCI = [];
  for (let n = 1; n <= 63; n++) if (n !== 5 && n !== 12) SOCI.push({ id: id(n), card_number: String(n), last_name: `COGNOME${n}`, first_name: "NOME",
    card_type: "ORDINARIA", tax_code: null, course_type: null, course_day: null, phone: `333${n}`, member_insurance: null, payer_id: null });
  const socio = (n) => SOCI.find((s) => s.id === id(n));
  Object.assign(socio(1), { last_name: "ROSSI", first_name: "MARIO", course_type: "CORSO SCI", course_day: "SABATO", tax_code: "RSSMRA80A01A479X",
    club: { name: "SCI CLUB MONCALVO" } });
  Object.assign(socio(2), { last_name: "D'ANGELO", first_name: "<i>ANNA</i>" });
  // Nucleo ROSSI: la tessera 40 è a carico della 1. Nucleo VERDI: il capofamiglia (900) quest'anno non è tesserato.
  Object.assign(socio(40), { last_name: "BIANCHI", first_name: "LUCIA", payer_id: id(1) });
  Object.assign(socio(7), { payer_id: id(900) });
  Object.assign(socio(50), { payer_id: id(900) });
  // Nucleo della 52: alla 51 la prima pagina ha 49 persone, il nucleo di due passa intero alla seconda.
  Object.assign(socio(60), { payer_id: id(52) });
  SOCI.push({ id: id(100), card_number: "100", last_name: "CENTO", first_name: "UNO", card_type: "JUNIOR", phone: null, member_insurance: null, payer_id: null });
  SOCI.push({ id: id(201), card_number: null, last_name: "ZETA", first_name: "Z", card_type: null, phone: null, member_insurance: null, payer_id: null });
  SOCI.push({ id: id(202), card_number: null, last_name: "ALFA", first_name: "A", card_type: null, phone: null, member_insurance: null, payer_id: null });
  SOCI.reverse(); // la pagina deve ordinare da sé
  const REQ = [];
  FAKE.rpc.current_season = "2026-09-01T00:00:00+00:00";
  FAKE.risposta = (t, r) => {
    REQ.push([t, r.colonne, r.filtri]);
    if (t === "members" && r.filtri.some((f) => f[0] === "in")) return [{ id: id(900), last_name: "VERDI", first_name: "GINO" }];
    if (t === "members") return SOCI;
    if (t === "member_passes") return [{ member_id: id(1), pass_type: "10 VIAGGI SABATO" }, { member_id: id(1), pass_type: "JOLLY" }];
    if (t === "prices") return [];
    return [];
  };
  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const text = (node) => node?.textContent.replace(/\s+/g, " ").trim() || "";
  const rows = () => [...document.querySelectorAll("#elencoSoci tr[data-socio]")];
  const cardOf = (row) => text(row?.querySelector(".numero-tessera")).replace("Tessera n° ", "");
  const nameOf = (row) => text(row?.querySelector("td b"));
  const cell = (row, i) => text(row?.children[i]);
  const headers = () => [...document.querySelectorAll("#elencoSoci thead th")].map(text);
  const nuclei = () => [...document.querySelectorAll("#elencoSoci tr.riga-nucleo")].map(text);
  const search = async (q) => { el("cercaSoci").value = q; el("cercaSoci").dispatchEvent(new Event("input")); await wait(300); };
  const dialogItems = () => [...el("sceltaColonne").querySelectorAll("li")];
  const itemKeys = () => dialogItems().map((li) => li.querySelector("input").value);
  const button = (key, dir) => el("sceltaColonne").querySelector(`[data-sposta="${dir}"][data-colonna="${key}"]`);

  window.addEventListener("load", () => setTimeout(async () => { try {
    const r = [];
    const test = (nome, passed, why) => r.push(`${nome}=${passed ? "ok" : `NO(${why})`}`);
    await wait(400);
    const table = el("elencoSoci");
    test("stile", table?.matches("table.custom-table.a-schede") && Boolean(document.querySelector(".cifre .kpi")), table?.className);
    test("colonne", headers().join("|") === "Socio|Tipo tessera|Abbonamento|Corso|Sci club", headers().join("|"));
    // Lo sci club da cui arriva il socio (dalla 3.12), letto con la scheda: vuoto per chi non arriva da un club affiliato.
    const rossi = rows().find((tr) => /ROSSI MARIO/.test(nameOf(tr)));
    test("sciClub", cell(rossi, 4) === "SCI CLUB MONCALVO" && cell(rows().find((tr) => !/ROSSI/.test(nameOf(tr))), 4) === ""
      && REQ.some(([t, c]) => t === "members" && /club:affiliated_clubs\(name\)/.test(c)), `«${cell(rossi, 4)}»`);
    const kpi = (i) => text(document.querySelectorAll(".cifre .kpi-value")[i]);
    test("cifre", [0, 1, 2, 3].map(kpi).join("|") === "64|61|4|38", [0, 1, 2, 3].map(kpi).join("|"));
    test("liberi", /5, 12, 64–99/.test(text(el("tessereLibere"))), text(el("tessereLibere")));

    const order = rows().map(cardOf);
    test("ordine", order.slice(0, 9).join(",") === "1,40,2,3,4,6,7,50,8", order.slice(0, 9).join(","));
    test("nucleo", nuclei()[0] === "Nucleo ROSSI MARIO · 2 persone · tessere 1, 40", nuclei()[0]);
    test("aCarico", rows()[1].matches(".row-dependent") && /a carico/.test(text(rows()[1].querySelector(".a-carico")))
      && !rows()[0].matches(".row-dependent") && !rows()[0].querySelector(".a-carico"), rows()[1].outerHTML.slice(0, 120));
    test("capoFuori", nuclei()[1] === "Nucleo VERDI GINO · capofamiglia non tesserato quest'anno · 2 persone · tessere 7, 50"
      && rows()[6].matches(".row-dependent") && rows()[7].matches(".row-dependent"), nuclei()[1]);
    const asked = REQ.find(([t, , f]) => t === "members" && f.some((x) => x[0] === "in"));
    test("capoLetto", asked && JSON.stringify(asked[2]).includes(id(900)) && !JSON.stringify(asked[2]).includes(id(1)), JSON.stringify(asked?.[2]).slice(0, 100));
    test("chiedePagante", REQ.some(([t, c]) => t === "members" && String(c).includes("payer_id")), "payer_id non letto");
    test("soloNuclei", !nuclei().some((n) => /COGNOME3 /.test(n)) && nuclei().length === 2, nuclei().join(" / "));

    const first = rows()[0];
    test("dati", nameOf(first) === "ROSSI MARIO" && cardOf(first) === "1" && cell(first, 1) === "ORDINARIA" && cell(first, 2) === "10 VIAGGI SABATO + JOLLY"
      && cell(first, 3) === "CORSO SCI (SABATO)", [1, 2, 3].map((i) => cell(first, i)).join(" | "));
    test("etichette", first.children[1]?.dataset.etichetta === "Tipo tessera" && first.children[3]?.dataset.etichetta === "Corso",
      `${first.children[1]?.dataset.etichetta} ${first.children[3]?.dataset.etichetta}`);
    test("link", first.querySelector("a")?.getAttribute("href") === `index.html?socio=${id(1)}`, first.querySelector("a")?.getAttribute("href"));
    test("testo", !rows()[2].querySelector("td i") && /<i>ANNA<\/i>/.test(nameOf(rows()[2])), rows()[2].innerHTML.slice(0, 120));

    test("primaPagina", rows().length === 49 && cardOf(rows().at(-1)) === "51", `${rows().length} persone, ultima ${cardOf(rows().at(-1))}`);
    test("pagine", /Pagina 1 di 2 · 64 soci in 61 nuclei/.test(text(el("paginaSoci"))), text(el("paginaSoci")));
    test("pagineSotto", Boolean(el("pagSuccessivaSotto")) && el("paginaSociSotto")?.textContent === el("paginaSoci").textContent,
      el("paginaSociSotto")?.textContent);
    el("pagSuccessivaSotto").click();
    await wait(200);
    const second = rows().map((x) => `${cardOf(x)}:${nameOf(x)}`);
    test("secondaPagina", rows().length === 15 && second[0].startsWith("52:") && second[1].startsWith("60:")
      && second.at(-3).startsWith("100:") && /:ALFA A$/.test(second.at(-2)) && /:ZETA Z$/.test(second.at(-1)), second.slice(0, 2).concat(second.slice(-3)).join(" , "));
    test("nucleoIntero", nuclei()[0] === "Nucleo COGNOME52 NOME · 2 persone · tessere 52, 60", nuclei()[0]);
    test("senzaNumero", /Senza numero tessera/.test(text(rows().at(-1))), text(rows().at(-1)).slice(0, 80));
    test("fuocoInizio", document.activeElement === el("elencoSoci") || el("elencoSoci").contains(document.activeElement)
      || document.activeElement?.id === "titoloElenco", document.activeElement?.id || document.activeElement?.tagName);

    await search("bianchi");
    test("cercaFamiliare", rows().length === 2 && nameOf(rows()[0]) === "ROSSI MARIO" && rows()[1].matches(".trovato") && !rows()[0].matches(".trovato")
      && /Pagina 1 di 1 · 2 soci in 1 nucleo$/.test(text(el("paginaSoci"))), `${rows().length} righe, ${text(el("paginaSoci"))}`);
    await search("rossi");
    test("cercaCapo", rows().length === 2 && rows()[0].matches(".trovato") && !rows()[1].matches(".trovato"), `${rows().length} righe`);
    await search("verdi gino");
    test("cercaCapoFuori", rows().map(cardOf).join(",") === "7,50", rows().map(cardOf).join(","));
    await search("dangelo");
    test("cercaApostrofo", rows().length === 1 && /D'ANGELO/.test(nameOf(rows()[0])), `${rows().length} righe`);
    await search("RSSMRA80");
    test("cercaCodice", rows().length === 2, `${rows().length} righe`);
    await search("mario rossi");
    test("dueParole", rows().length === 2, `${rows().length} righe`);
    await search("nessunocosi");
    test("nessuno", !rows().length && /Nessun socio trovato/.test(text(el("elencoSoci"))), text(el("elencoSoci")).slice(0, 80));
    await search("");

    el("btnColonne").click();
    await wait(200);
    test("finestra", el("dlgColonne")?.open === true, "la finestra delle colonne non si apre");
    test("ordineFinestra", itemKeys().slice(0, 3).join(",") === "tipo,abbonamento,corso" && !itemKeys().includes("nome") && !itemKeys().includes("tessera"),
      itemKeys().join(","));
    test("estremi", button("tipo", "su")?.disabled === true && button("tipo", "giu")?.disabled === false && button(itemKeys().at(-1), "giu")?.disabled === true,
      `${button("tipo", "su")?.disabled} ${button("tipo", "giu")?.disabled} ${button(itemKeys().at(-1), "giu")?.disabled}`);
    test("nomePulsanti", button("corso", "su")?.getAttribute("aria-label") === "Sposta Corso più su"
      && button("corso", "giu")?.getAttribute("aria-label") === "Sposta Corso più giù", button("corso", "su")?.getAttribute("aria-label"));
    button("tipo", "giu").click();
    await wait(50);
    test("sposta", itemKeys().slice(0, 3).join(",") === "abbonamento,tipo,corso", itemKeys().slice(0, 3).join(","));
    test("annuncio", /Tipo tessera ora è la colonna 3/.test(text(el("annuncioColonne"))) && el("annuncioColonne").getAttribute("aria-live") === "polite",
      text(el("annuncioColonne")));
    test("fuocoSulPulsante", document.activeElement?.dataset?.colonna === "tipo", document.activeElement?.outerHTML?.slice(0, 80));
    el("sceltaColonne").querySelector('input[value="telefono"]').click();
    el("sceltaColonne").querySelector('input[value="corso"]').click();
    while (!button("telefono", "su").disabled) { button("telefono", "su").click(); await wait(10); }
    test("inCima", itemKeys()[0] === "telefono" && document.activeElement === button("telefono", "giu"), `${itemKeys()[0]} ${document.activeElement?.outerHTML?.slice(0, 60)}`);
    el("applicaColonne").click();
    await wait(200);
    test("applica", headers().join("|") === "Socio|Telefono|Abbonamento|Tipo tessera|Sci club" && !el("dlgColonne").open, headers().join("|"));
    test("telefono", cell(rows()[0], 1) === "3331", cell(rows()[0], 1));
    const saved = JSON.parse(localStorage.getItem("sciclub-elenco-colonne") || "[]");
    test("ricordate", saved.join(",") === "telefono,abbonamento,tipo,club", JSON.stringify(saved));

    el("btnColonne").click();
    await wait(100);
    test("ritrovate", itemKeys().slice(0, 3).join(",") === "telefono,abbonamento,tipo"
      && el("sceltaColonne").querySelector('input[value="telefono"]').checked && !el("sceltaColonne").querySelector('input[value="corso"]').checked,
      itemKeys().slice(0, 3).join(","));
    el("predefiniteColonne").click();
    test("partenza", itemKeys().slice(0, 3).join(",") === "tipo,abbonamento,corso" && !el("sceltaColonne").querySelector('input[value="telefono"]').checked
      && el("sceltaColonne").querySelector('input[value="corso"]').checked, itemKeys().slice(0, 4).join(","));
    el("annullaColonne").click();
    await wait(100);
    test("annulla", headers().join("|") === "Socio|Telefono|Abbonamento|Tipo tessera|Sci club" && !el("dlgColonne").open, headers().join("|"));

    // Sul telefono: intestazioni nascoste, ogni socio una scheda, il nucleo una fascia sopra le sue schede.
    if (window.innerWidth <= 600) {
      const shown = (node) => node && getComputedStyle(node).display !== "none";
      test("telefonoSchede", !shown(document.querySelector("#elencoSoci thead")) && getComputedStyle(rows()[0]).display === "block"
        && shown(document.querySelector("#elencoSoci tr.riga-nucleo th")), getComputedStyle(rows()[0]).display);
      test("telefonoLargo", document.documentElement.scrollWidth <= window.innerWidth + 1, `${document.documentElement.scrollWidth} > ${window.innerWidth}`);
    }
    localStorage.removeItem("sciclub-elenco-colonne");
    document.title = "RISULTATO " + r.join(" ");
  } catch (e) { document.title = `RISULTATO eccezione=NO(${String(e?.message || e).slice(0, 120)})`; } }, 500));
}
