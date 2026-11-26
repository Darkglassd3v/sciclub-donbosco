// Fogli dei soci (stampe.html), richieste del 19/11/2026:
// - sotto ogni pulsante l'anteprima di quanti soci ci saranno in ogni file, letta all'apertura della pagina
//   (Corsisti, Abbonamenti 5 gite, Jolly; il martedì niente corsi);
// - in ogni file il primo foglio è «Tutti»: l'elenco intero del giorno con la colonna Partenza, anche per chi
//   non ce l'ha (la partenza non è obbligatoria: chi non l'aveva finiva nell'ultima linguetta e non si vedeva);
//   poi un foglio per partenza, e chi ne ha due sta in quello di ognuna;
// - l'esito dello scarico conta le persone, non le righe dei fogli.
// In un blocco: gli script della pagina e della prova hanno gli stessi nomi globali.
{
  const SHEETS = [];   // [nome del foglio di lavoro, righe]
  const BOOKS = [];    // [nome del file, nomi dei fogli di lavoro]
  const letters = (c) => String.fromCharCode(65 + c);
  window.XLSX = { utils: {
    aoa_to_sheet: (rows) => {
      const sheet = { rows };
      rows.forEach((row, r) => row.forEach((v, c) => { sheet[letters(c) + (r + 1)] = { v, t: typeof v === "number" ? "n" : "s" }; }));
      return sheet;
    },
    decode_cell: (a) => ({ c: a.charCodeAt(0) - 65, r: Number(a.slice(1)) - 1 }),
    encode_cell: ({ r, c }) => letters(c) + (r + 1),
    book_new: () => ({ SheetNames: [], Sheets: {} }),
    book_append_sheet: (book, sheet, name) => { book.SheetNames.push(name); book.Sheets[name] = sheet; SHEETS.push([name, sheet.rows]); },
  } };
  const member = (id, last_name, extra = {}) => ({ id, last_name, first_name: "PROVA", card_number: id.slice(1), birth_place: "ASTI",
    birth_date: "2012-03-04", phone: "333", saturday_departure: null, sunday_departure: null, course_type: null, course_day: null, ...extra });
  FAKE.risposta = (t) => {
    if (t === "members") return [
      member("m1", "BIANCHI", { course_type: "CORSO SCI 10 - 14", course_day: "SABATO" }),
      member("m2", "ALBERTI", { course_type: "CORSO SCI ADULTI", course_day: "SABATO", sunday_departure: "OPESSINA - MONTEGROSSO" }),
      member("m3", "CARLI", { course_type: "CORSO SCI ADULTI", course_day: "SABATO", saturday_departure: "ASTI" }),
      member("m4", "DORIA", { course_type: "CORSO SCI BABY FINO 10", course_day: "DOMENICA" }),
      member("m5", "ELIA", { saturday_departure: "ASTI, FELIZZANO" }),
      member("m6", "FANTI"),
    ];
    if (t === "pass_status") return [
      { member_id: "m5", day: "SABATO", trips_used: 1, trips_total: 5 },
      { member_id: "m6", day: "JOLLY", trips_used: 0, trips_total: 5 },
    ];
    return [];
  };
  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const text = (node) => node?.textContent.replace(/\s+/g, " ").trim() || "";
  const preview = (day) => text(document.querySelector(`[data-anteprima="${day}"]`));

  window.addEventListener("load", () => setTimeout(async () => {
    const r = [];
    const test = (nome, passed, why) => r.push(`${nome}=${passed ? "ok" : `NO(${why})`}`);
    try {
      window.downloadPrintableExcel = (book, file) => BOOKS.push([file, [...book.SheetNames]]);
      // Dal 26/11/2026 a blocchi, come le cifre delle altre pagine: etichetta e numero grande, uno per file.
      const blocks = (day) => [...document.querySelectorAll(`[data-anteprima="${day}"] .blocco-anteprima`)]
        .map((b) => `${text(b.querySelector(".blocco-etichetta"))}=${text(b.querySelector(".blocco-numero"))}`).join(" | ");
      test("anteprimaSabato", blocks("SABATO") === "Corsisti=3 | Abbonamenti 5 gite=1 | Jolly=1", blocks("SABATO"));
      test("anteprimaDomenica", blocks("DOMENICA") === "Corsisti=1 | Abbonamenti 5 gite=0 | Jolly=1", blocks("DOMENICA"));
      test("anteprimaMartedi", blocks("MARTEDI") === "Abbonamenti 5 gite=0 | Jolly=1", blocks("MARTEDI"));
      const number = document.querySelector('[data-anteprima="SABATO"] .blocco-numero');
      const label = document.querySelector('[data-anteprima="SABATO"] .blocco-etichetta');
      test("leggibile", number && parseFloat(getComputedStyle(number).fontSize) >= 28 && parseFloat(getComputedStyle(label).fontSize) >= 17,
        `numero ${number && getComputedStyle(number).fontSize}, etichetta ${label && getComputedStyle(label).fontSize}`);

      document.querySelector('.giorni-stampa [data-giorno="SABATO"]').click();
      await wait(800);
      const [file, names] = BOOKS[0] || [];
      test("primoFile", /^Corsisti sabato /.test(file || "") && names?.join("|") === "Tutti|ASTI|Senza partenza", `${file} ${names?.join("|")}`);
      const [, rows = []] = SHEETS.find(([n]) => n === "Tutti") || [];
      const head = rows[1] || [];
      const col = (label) => head.indexOf(label);
      const people = rows.slice(2).map((row) => `${row[col("Cognome")]}:${row[col("Partenza")] ?? "?"}`);
      test("tuttiDentro", people.join(",") === "ALBERTI:,BIANCHI:,CARLI:ASTI", people.join(","));
      test("colonnaPartenza", col("Partenza") === 3, head.join("|"));
      const doubled = BOOKS.find(([f]) => /^Abbonamenti 5 gite sabato /.test(f));
      test("duePartenze", doubled?.[1].join("|") === "Tutti|ASTI|FELIZZANO", doubled?.[1].join("|"));
      test("esito", /Corsisti sabato [^:]*: 3 soci, 2 partenze/.test(text(el("esito"))), text(el("esito")).slice(0, 160));
      test("anteprimaDopo", preview("SABATO") === "Corsisti: 3 · Abbonamenti 5 gite: 1 · Jolly: 1", preview("SABATO"));
    } catch (e) { r.push(`eccezione=NO(${String(e?.message || e).slice(0, 120)})`); }
    document.title = "RISULTATO " + r.join(" ");
  }, 800));
}
