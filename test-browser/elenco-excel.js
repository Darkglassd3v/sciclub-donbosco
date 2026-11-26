// Elenco soci (elenco.html): l'Excel dei soci della stagione, spostato qui dal Riepilogo il 18/11/2026.
// - «Scarica tutti (Excel completo)»: tutti i soci dell'elenco; «Scarica l'elenco filtrato»: solo quelli trovati
//   dalla ricerca, con la ricerca scritta nel titolo. I pulsanti li vede solo chi ha il permesso riepilogo, come
//   prima nel Riepilogo: l'Excel ha tutti i dati personali.
// - In ordine di numero di tessera, contato come numero (2, 10, 100); senza numero (o «NO») in fondo, per cognome.
// - Colonne a gruppi, ognuno col suo colore nella riga sopra i nomi delle colonne (richiesta del 29/10):
//   TESSERA (numero, tipo), ANAGRAFICA (cognome, nome, data, luogo e provincia di nascita, codice fiscale, sci club
//   di provenienza dalla 3.12),
//   CORSI E ABBONAMENTI (corso col giorno, abbonamenti della stagione uniti con « + », presciistica),
//   RECAPITI (telefono, email, indirizzo, città, provincia, CAP).
// - In cima una riga col titolo: stagione, quando è stato scaricato, quanti soci (richiesta del 29/10:
//   il file rinominato o copiato deve dire ancora di che stagione è). Foglio «Soci 2026-27», file
//   soci-stagione-2026-27-AAAA-MM-GG.xlsx.
// - Mentre si scorre restano ferme le tre righe d'intestazione (dal 26/11/2026 non più le colonne da Numero a Nome:
//   poco intuitivo), in tutti i fogli.
// - Dal 26/11/2026 l'Excel completo ha anche un foglio per ogni sci club affiliato, con i suoi soci.
// - «Scarica quello che vedi (Excel)» (prima «Scarica l'elenco filtrato»): i soci mostrati (ricerca e filtro sci club)
//   con Numero tessera, Cognome, Nome e solo le colonne scelte in «Colonne», nel loro ordine.
// - frozenPaneXml(): il blocco scritto nel foglio, che xlsx-js-style da solo non scrive.
// - Chi è tesserato con la presciistica o con l'agevolazione famiglia non ha una tessera sua, ma
//   nella colonna Tipo tessera ha quella ordinaria della sua assicurazione (member_insurance):
//   Base → ordinaria Reale Mutua Neve, Sport → ordinaria Total Sport, nessuna → solo tessera
//   (richiesta del 6/11). Mai una tessera riservata o scontata.
const SHEETS = [];
const letters = (c) => String.fromCharCode(65 + c);
window.XLSX = { utils: {
  aoa_to_sheet: (rows) => {
    const sheet = {};
    rows.forEach((row, r) => row.forEach((v, c) => { sheet[letters(c) + (r + 1)] = { v, t: typeof v === "number" ? "n" : "s" }; }));
    SHEETS.push([rows, sheet]);
    return sheet;
  },
  decode_cell: (a) => ({ c: a.charCodeAt(0) - 65, r: Number(a.slice(1)) - 1 }),
  encode_cell: ({ r, c }) => letters(c) + (r + 1),
  book_new: () => ({}), book_append_sheet: (book, sheet, name) => SHEET_NAMES.push(name) }, writeFile() {} };
const SHEET_NAMES = [];
const REQ = [];
FAKE.rpc.current_season = "2026-09-01T00:00:00+00:00";
FAKE.risposta = (t, r) => {
  REQ.push([t, r.colonne, r.filtri]);
  if (t === "members") return [
    { id: "a", last_name: "ROSSI", first_name: "ANNA", card_number: "10", card_type: "ORDINARIA", birth_date: "1980-05-02", birth_place: "ASTI",
      birth_province: "AT", tax_code: "RSSNNA80E42A479X", course_type: "CORSO SCI ADULTI", course_day: "SABATO", preski_type: null, city: "ASTI",
      phone: "333 1234567", email: "anna@example.it", club: { name: "SCI CLUB MONCALVO" } },
    { id: "b", last_name: "BIANCHI", first_name: "LUCA", card_number: "2", card_type: null, member_insurance: "BASE", course_type: null, course_day: null, preski_type: "CORSO PRESCIISTICA", preski_label: "CORSO PRESCIISTICA + REALE MUTUA NEVE" },
    { id: "c", last_name: "VERDI", first_name: "ELIA", card_number: "100", card_type: "JUNIOR", course_type: "CORSO SCI BABY", course_day: null },
    { id: "d", last_name: "ZETA", first_name: "ZOE", card_number: null, card_type: null, member_insurance: null },
    { id: "e", last_name: "ALFA", first_name: "ALDO", card_number: "NO", card_type: null, member_insurance: "SPORT" },
  ];
  if (t === "prices") return [
    { name: "TESSERA DIRETTIVO", price: 0, insurance: "SPORT", min_role: "admin" },
    { name: "TESSERA SCONTATA - REALE MUTUA NEVE", price: 10, insurance: "BASE", min_role: "utente" },
    { name: "TESSERA ORDINARIA - REALE MUTUA NEVE", price: 20, insurance: "BASE", min_role: "utente" },
    { name: "TESSERA ORDINARIA - REALE TOTAL SPORT", price: 20, insurance: "SPORT", min_role: "utente" },
    { name: "TESSERA SCONTATA - NO ASSICURAZIONE", price: 10, insurance: null, min_role: "utente" },
    { name: "SOLO TESSERA - NO ASSICURAZIONE", price: 20, insurance: null, min_role: "utente" },
  ];
  if (t === "affiliated_clubs") return [{ name: "SCI CLUB MONCALVO" }];
  if (t === "member_passes") return [{ member_id: "a", pass_type: "10 VIAGGI SABATO" }, { member_id: "a", pass_type: "5 VIAGGI DOMENICA" },
    { member_id: "c", pass_type: "STAGIONALE" }];
  return [];
};
window.addEventListener("load", () => setTimeout(async () => { try {
  const r = [];
  const test = (nome, passed, why) => r.push(`${nome}=${passed ? "ok" : `NO(${why})`}`);
  const saved = [];
  window.saveBook = (...args) => saved.push(args);
  await downloadMembers();
  const [rows = [], sheet = {}] = SHEETS[0] || [];
  const [[title = ""] = [], groups = [], head = [], ...data] = rows;
  test("titolo", /^Soci della stagione 2026\/27 · scaricato il \d{2}\/\d{2}\/\d{4} alle \d{2}:\d{2} · 5 soci$/.test(title), title);
  test("foglio", SHEET_NAMES.join(",") === "Soci 2026-27,SCI CLUB MONCALVO", SHEET_NAMES.join(","));
  const clubSheet = SHEETS[SHEETS.length - 1]?.[0] || [];
  test("foglioClub", clubSheet.length === 4 && clubSheet[3][2] === "ROSSI" && /SCI CLUB MONCALVO/.test(clubSheet[0][0]) && /· 1 socio$/.test(clubSheet[0][0]),
    `${clubSheet.length} righe, «${clubSheet[0]?.[0]}»`);
  test("gruppi", groups.join("|") === "TESSERA||ANAGRAFICA|||||||CORSI E ABBONAMENTI|||RECAPITI|||||", groups.join("|"));
  test("colonne", head.join("|") === "Numero tessera|Tipo tessera|Cognome|Nome|Data di nascita|Luogo di nascita|Provincia di nascita|Codice fiscale"
    + "|Sci club di provenienza|Corso|Abbonamento|Presciistica|Telefono|Email|Indirizzo|Città|Provincia|CAP", head.join("|").slice(0, 120));
  const merges = (sheet["!merges"] || []).map(({ s, e }) => `${letters(s.c)}${s.r + 1}:${letters(e.c)}${e.r + 1}`).join(" ");
  test("unioni", merges === "A1:R1 A2:B2 C2:I2 J2:L2 M2:R2", merges);
  const fill = (a) => sheet[a]?.s?.fill?.fgColor?.rgb;
  test("colori", fill("A2") === "084C8D" && fill("C2") === "0B6E69" && fill("J2") === "8A5300" && fill("M2") === "4A5868"
    && sheet.A2.s.font.color.rgb === "FFFFFF" && sheet.C3.s.font.color.rgb === "0B6E69" && fill("C3") && fill("C3") !== "0B6E69",
    `${fill("A2")} ${fill("C2")} ${fill("J2")} ${fill("M2")} testa ${fill("C3")}`);
  test("blocco", saved.length === 1 && saved[0][2]?.righe === 3 && !saved[0][2]?.colonne && /^soci-stagione-2026-27-\d{4}-\d{2}-\d{2}\.xlsx$/.test(saved[0][1]),
    JSON.stringify(saved.map((s) => s.slice(1))).slice(0, 80));
  test("ordineTessere", data.map((d) => d[2]).join(",") === "BIANCHI,ROSSI,VERDI,ALFA,ZETA", data.map((d) => d[2]).join(","));
  const rossi = data.find((d) => d[2] === "ROSSI") || [];
  test("riga", rossi.slice(0, 12).join("|") === "10|ORDINARIA|ROSSI|ANNA|02/05/1980|ASTI|AT|RSSNNA80E42A479X|SCI CLUB MONCALVO|CORSO SCI ADULTI (SABATO)|10 VIAGGI SABATO + 5 VIAGGI DOMENICA|",
    rossi.join("|").slice(0, 120));
  test("telefono", rossi[12] === "333 1234567" && rossi[13] === "anna@example.it" && rossi[15] === "ASTI", `${rossi[12]} ${rossi[13]} ${rossi[15]}`);
  const verdi = data.find((d) => d[2] === "VERDI") || [], bianchi = data.find((d) => d[2] === "BIANCHI") || [];
  test("corsoSenzaGiorno", verdi[9] === "CORSO SCI BABY" && verdi[10] === "STAGIONALE", `${verdi[9]} ${verdi[10]}`);
  test("presciistica", bianchi[11] === "CORSO PRESCIISTICA + REALE MUTUA NEVE" && bianchi[9] === "", `${bianchi[11]} «${bianchi[9]}»`);
  const tipo = (cognome) => (data.find((d) => d[2] === cognome) || [])[1];
  test("tesseraCompresa", tipo("BIANCHI") === "TESSERA ORDINARIA - REALE MUTUA NEVE" && tipo("ALFA") === "TESSERA ORDINARIA - REALE TOTAL SPORT"
    && tipo("ZETA") === "SOLO TESSERA - NO ASSICURAZIONE" && tipo("ROSSI") === "ORDINARIA",
    `${tipo("BIANCHI")} / ${tipo("ALFA")} / ${tipo("ZETA")} / ${tipo("ROSSI")}`);
  const asked = REQ.find(([t, c]) => t === "members" && String(c).includes("tax_code"));
  test("chiedeAssicurazione", String(asked && asked[1]).includes("member_insurance"), String(asked && asked[1]).slice(0, 80));
  const passes = REQ.find(([t]) => t === "member_passes");
  test("abbonamentiStagione", passes && passes[2].some((f) => f[0] === "eq" && f[1] === "season" && f[2] === FAKE.rpc.current_season),
    String(JSON.stringify(passes && passes[2])).slice(0, 80));
  const xml = typeof frozenPaneXml === "function"
    ? frozenPaneXml('<worksheet><sheetViews><sheetView workbookViewId="0"/></sheetViews><sheetData/></worksheet>', 2, 4) : "";
  test("bloccoNelFoglio", xml.includes('<sheetView workbookViewId="0"><pane xSplit="4" ySplit="2" topLeftCell="E3" activePane="bottomRight" state="frozen"/>')
    && xml.endsWith("<sheetData/></worksheet>"), xml.slice(0, 100) || "frozenPaneXml mancante");
  test("pulsanti", !el("zonaScarica")?.hidden && Boolean(el("btnScaricaTutti")) && el("btnScaricaFiltrato")?.textContent.trim() === "Scarica quello che vedi (Excel)",
    "pulsanti di scarico nascosti, mancanti o col nome vecchio");
  // Solo quelli trovati dalla ricerca, con le sole colonne scelte (qui solo Email).
  localStorage.setItem("sciclub-elenco-colonne", JSON.stringify(["email"]));
  el("cercaSoci").value = "rossi";
  el("cercaSoci").dispatchEvent(new Event("input"));
  await new Promise((ok) => setTimeout(ok, 300));
  await downloadMembers(true);
  const [filtered = []] = SHEETS[SHEETS.length - 1] || [];
  const [[filteredTitle = ""] = [], filteredHead = [], ...filteredData] = filtered;
  test("filtrato", filteredData.length === 1 && filteredData[0].join("|") === "10|ROSSI|ANNA|anna@example.it"
    && filteredHead.join("|") === "Numero tessera|Cognome|Nome|Email" && /ricerca «rossi»/.test(filteredTitle) && /· 1 socio$/.test(filteredTitle),
    `${filteredHead.join("|")} / ${filteredData.map((d) => d.join("|")).join(" ; ")} «${filteredTitle}»`);
  test("bloccoFiltrato", saved[saved.length - 1]?.[2]?.righe === 2 && !saved[saved.length - 1]?.[2]?.colonne, JSON.stringify(saved[saved.length - 1]?.[2]));
  test("nomeFiltrato", /^soci-stagione-2026-27-ricerca-\d{4}-\d{2}-\d{2}\.xlsx$/.test(saved[saved.length - 1]?.[1] || ""), saved[saved.length - 1]?.[1]);
  // Filtro sci club: solo i soci di Moncalvo, o solo i nostri (DON BOSCO), sull'elenco e nell'Excel.
  el("cercaSoci").value = "";
  el("filtroClub").value = "SCI CLUB MONCALVO";
  el("filtroClub").dispatchEvent(new Event("change"));
  await new Promise((ok) => setTimeout(ok, 300));
  test("filtroElenco", el("numSoci").textContent === "1" && /ROSSI/.test(el("elencoSoci").textContent) && !/BIANCHI/.test(el("elencoSoci").textContent),
    `soci ${el("numSoci").textContent}`);
  await downloadMembers(true);
  const [clubOnly = []] = SHEETS[SHEETS.length - 1] || [];
  test("filtroClub", clubOnly.length === 3 && clubOnly[2][1] === "ROSSI" && /sci club «SCI CLUB MONCALVO»/.test(clubOnly[0][0])
    && /^soci-stagione-2026-27-sci-club-moncalvo-\d{4}-\d{2}-\d{2}\.xlsx$/.test(saved[saved.length - 1]?.[1] || ""),
    `${clubOnly.length} righe «${clubOnly[0]?.[0]}» ${saved[saved.length - 1]?.[1]}`);
  el("filtroClub").value = "DON BOSCO";
  el("filtroClub").dispatchEvent(new Event("change"));
  await new Promise((ok) => setTimeout(ok, 300));
  test("filtroDonBosco", el("numSoci").textContent === "4" && !/ROSSI/.test(el("elencoSoci").textContent), `soci ${el("numSoci").textContent}`);
  document.title = "RISULTATO " + r.join(" ");
} catch (e) { document.title = `RISULTATO eccezione=NO(${String(e?.message || e).slice(0, 120)})`; } }, 600));
