// Riepilogo (riepilogo.html): l'Excel di tutti i soci della stagione, per capire la stagione in corso.
// - In ordine di numero di tessera, contato come numero (2, 10, 100); senza numero (o «NO») in fondo, per cognome.
// - Colonne a gruppi, ognuno col suo colore nella riga sopra i nomi delle colonne (richiesta del 29/10):
//   TESSERA (numero, tipo), ANAGRAFICA (cognome, nome, data, luogo e provincia di nascita, codice fiscale),
//   CORSI E ABBONAMENTI (corso col giorno, abbonamenti della stagione uniti con « + », presciistica),
//   RECAPITI (telefono, indirizzo, città, provincia, CAP).
// - Mentre si scorre restano ferme le due righe d'intestazione e le colonne da Numero a Nome.
// - frozenPaneXml(): il blocco scritto nel foglio, che xlsx-js-style da solo non scrive.
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
  book_new: () => ({}), book_append_sheet() {} }, writeFile() {} };
const REQ = [];
FAKE.rpc.current_season = "2026-09-01T00:00:00+00:00";
FAKE.risposta = (t, r) => {
  REQ.push([t, r.colonne, r.filtri]);
  if (t === "members") return [
    { id: "a", last_name: "ROSSI", first_name: "ANNA", card_number: "10", card_type: "ORDINARIA", birth_date: "1980-05-02", birth_place: "ASTI",
      birth_province: "AT", tax_code: "RSSNNA80E42A479X", course_type: "CORSO SCI ADULTI", course_day: "SABATO", preski_type: null, city: "ASTI",
      phone: "333 1234567" },
    { id: "b", last_name: "BIANCHI", first_name: "LUCA", card_number: "2", card_type: "ORDINARIA", course_type: null, course_day: null, preski_type: "CORSO PRESCIISTICA" },
    { id: "c", last_name: "VERDI", first_name: "ELIA", card_number: "100", card_type: "JUNIOR", course_type: "CORSO SCI BABY", course_day: null },
    { id: "d", last_name: "ZETA", first_name: "ZOE", card_number: null },
    { id: "e", last_name: "ALFA", first_name: "ALDO", card_number: "NO" },
  ];
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
  const [rows = [], sheet = {}] = SHEETS[SHEETS.length - 1] || [];
  const [groups = [], head = [], ...data] = rows;
  test("gruppi", groups.join("|") === "TESSERA||ANAGRAFICA||||||CORSI E ABBONAMENTI|||RECAPITI||||", groups.join("|"));
  test("colonne", head.join("|") === "Numero tessera|Tipo tessera|Cognome|Nome|Data di nascita|Luogo di nascita|Provincia di nascita|Codice fiscale"
    + "|Corso|Abbonamento|Presciistica|Telefono|Indirizzo|Città|Provincia|CAP", head.join("|").slice(0, 120));
  const merges = (sheet["!merges"] || []).map(({ s, e }) => `${letters(s.c)}${s.r + 1}:${letters(e.c)}${e.r + 1}`).join(" ");
  test("unioni", merges === "A1:B1 C1:H1 I1:K1 L1:P1", merges);
  const fill = (a) => sheet[a]?.s?.fill?.fgColor?.rgb;
  test("colori", fill("A1") === "084C8D" && fill("C1") === "0B6E69" && fill("I1") === "8A5300" && fill("L1") === "4A5868"
    && sheet.A1.s.font.color.rgb === "FFFFFF" && sheet.C2.s.font.color.rgb === "0B6E69" && fill("C2") && fill("C2") !== "0B6E69",
    `${fill("A1")} ${fill("C1")} ${fill("I1")} ${fill("L1")} testa ${fill("C2")}`);
  test("blocco", saved.length === 1 && saved[0][2]?.righe === 2 && saved[0][2]?.colonne === 4 && /^soci-stagione-.*\.xlsx$/.test(saved[0][1]),
    JSON.stringify(saved.map((s) => s.slice(1))).slice(0, 80));
  test("ordineTessere", data.map((d) => d[2]).join(",") === "BIANCHI,ROSSI,VERDI,ALFA,ZETA", data.map((d) => d[2]).join(","));
  const rossi = data.find((d) => d[2] === "ROSSI") || [];
  test("riga", rossi.slice(0, 11).join("|") === "10|ORDINARIA|ROSSI|ANNA|02/05/1980|ASTI|AT|RSSNNA80E42A479X|CORSO SCI ADULTI (SABATO)|10 VIAGGI SABATO + 5 VIAGGI DOMENICA|",
    rossi.join("|").slice(0, 120));
  test("telefono", rossi[11] === "333 1234567" && rossi[13] === "ASTI", `${rossi[11]} ${rossi[13]}`);
  const verdi = data.find((d) => d[2] === "VERDI") || [], bianchi = data.find((d) => d[2] === "BIANCHI") || [];
  test("corsoSenzaGiorno", verdi[8] === "CORSO SCI BABY" && verdi[9] === "STAGIONALE", `${verdi[8]} ${verdi[9]}`);
  test("presciistica", bianchi[10] === "CORSO PRESCIISTICA" && bianchi[8] === "", `${bianchi[10]} «${bianchi[8]}»`);
  const passes = REQ.find(([t]) => t === "member_passes");
  test("abbonamentiStagione", passes && passes[2].some((f) => f[0] === "eq" && f[1] === "season" && f[2] === FAKE.rpc.current_season),
    String(JSON.stringify(passes && passes[2])).slice(0, 80));
  const xml = typeof frozenPaneXml === "function"
    ? frozenPaneXml('<worksheet><sheetViews><sheetView workbookViewId="0"/></sheetViews><sheetData/></worksheet>', 2, 4) : "";
  test("bloccoNelFoglio", xml.includes('<sheetView workbookViewId="0"><pane xSplit="4" ySplit="2" topLeftCell="E3" activePane="bottomRight" state="frozen"/>')
    && xml.endsWith("<sheetData/></worksheet>"), xml.slice(0, 100) || "frozenPaneXml mancante");
  document.title = "RISULTATO " + r.join(" ");
} catch (e) { document.title = `RISULTATO eccezione=NO(${String(e?.message || e).slice(0, 120)})`; } }, 600));
