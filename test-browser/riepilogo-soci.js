// Riepilogo (riepilogo.html): l'Excel di tutti i soci della stagione, per capire la stagione in corso.
// - In ordine di numero di tessera, contato come numero (2, 10, 100); senza numero (o «NO») in fondo, per cognome.
// - Colonne: Numero tessera, Cognome, Nome, Data di nascita, Codice fiscale, Tipo tessera, Corso,
//   Abbonamento, Presciistica, poi il resto (luogo e provincia di nascita, indirizzo, città, provincia, CAP).
// - Corso col giorno; gli abbonamenti della stagione (member_passes), più d'uno uniti con « + ».
const SHEETS = [];
window.XLSX = { utils: { aoa_to_sheet: (rows) => { SHEETS.push(rows); return {}; }, decode_cell: () => ({ r: 0, c: 0 }),
  book_new: () => ({}), book_append_sheet() {} }, writeFile() {} };
const REQ = [];
FAKE.rpc.current_season = "2026-09-01T00:00:00+00:00";
FAKE.risposta = (t, r) => {
  REQ.push([t, r.colonne, r.filtri]);
  if (t === "members") return [
    { id: "a", last_name: "ROSSI", first_name: "ANNA", card_number: "10", card_type: "ORDINARIA", birth_date: "1980-05-02", tax_code: "RSSNNA80E42A479X",
      course_type: "CORSO SCI ADULTI", course_day: "SABATO", preski_type: null, city: "ASTI" },
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
  await downloadMembers();
  const rows = SHEETS[SHEETS.length - 1] || [];
  const [head = [], ...data] = rows;
  test("colonne", head.slice(0, 9).join("|") === "Numero tessera|Cognome|Nome|Data di nascita|Codice fiscale|Tipo tessera|Corso|Abbonamento|Presciistica"
    && head.slice(9).join("|") === "Luogo di nascita|Provincia di nascita|Indirizzo|Città|Provincia|CAP", head.join("|").slice(0, 120));
  test("ordineTessere", data.map((d) => d[1]).join(",") === "BIANCHI,ROSSI,VERDI,ALFA,ZETA", data.map((d) => d[1]).join(","));
  const rossi = data.find((d) => d[1] === "ROSSI") || [];
  test("riga", rossi.slice(0, 9).join("|") === "10|ROSSI|ANNA|02/05/1980|RSSNNA80E42A479X|ORDINARIA|CORSO SCI ADULTI (SABATO)|10 VIAGGI SABATO + 5 VIAGGI DOMENICA|", rossi.join("|").slice(0, 120));
  const verdi = data.find((d) => d[1] === "VERDI") || [], bianchi = data.find((d) => d[1] === "BIANCHI") || [];
  test("corsoSenzaGiorno", verdi[6] === "CORSO SCI BABY" && verdi[7] === "STAGIONALE", `${verdi[6]} ${verdi[7]}`);
  test("presciistica", bianchi[8] === "CORSO PRESCIISTICA" && bianchi[6] === "", `${bianchi[8]} «${bianchi[6]}»`);
  const passes = REQ.find(([t]) => t === "member_passes");
  test("abbonamentiStagione", passes && passes[2].some((f) => f[0] === "eq" && f[1] === "season" && f[2] === FAKE.rpc.current_season), String(JSON.stringify(passes && passes[2])).slice(0, 80));
  const members = REQ.find(([t]) => t === "members");
  test("campiSoci", members && ["course_type", "course_day", "preski_type", "card_number", "id"].every((c) => members[1].includes(c)), members && members[1]);
  document.title = "RISULTATO " + r.join(" ");
} catch (e) { document.title = `RISULTATO eccezione=NO(${String(e?.message || e).slice(0, 120)})`; } }, 600));
