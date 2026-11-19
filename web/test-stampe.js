// Controllo dei fogli da stampare (web/stampe.js).
//
//   node web/test-stampe.js
//
// Soci inventati.

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const source = fs.readFileSync(path.join(__dirname, "stampe.js"), "utf8");
const { daySheets, departureName, excelSheetName, excelTitle, tripsDone, sheetPeople } =
  (0, eval)(`(() => { ${source}; return { daySheets, departureName, excelSheetName, excelTitle, tripsDone, sheetPeople }; })()`);

const member = (id, last_name, extra = {}) => ({ id, last_name, first_name: "A", ...extra });
const members = [
  member("zeta",  "ZETA",   { saturday_departure: "ASTI" }),
  member("alfa",  "ALFA",   { saturday_departure: " asti  " }),               // refuso di maiuscole e spazi
  member("felix", "FELIX",  { saturday_departure: "FELIZZANO" }),
  member("nessa", "NESSA"),                                                   // abbonato senza partenza
  member("corso", "CORSO",  { course_type: "CORSO SCI ADULTI", course_day: "SABATO", saturday_departure: "FELIZZANO" }),
  member("dom",   "DOMINI", { course_type: "CORSO SCI ADULTI", course_day: "DOMENICA", sunday_departure: "ASTI" }),
  member("jolly", "JOLLY",  { saturday_departure: "ASTI", sunday_departure: "NIZZA M." }),
  member("marte", "MARTE"),
  member("fuori", "FUORI",  { saturday_departure: "ASTI" }),                  // niente sabato
];
const passList = [
  { member_id: "zeta", day: "SABATO" },
  { member_id: "alfa", day: "SABATO" },
  { member_id: "alfa", day: "SABATO" },                                     // secondo abbonamento
  { member_id: "felix", day: "SABATO" },
  { member_id: "nessa", day: "SABATO" },
  { member_id: "corso", day: "SABATO" },                                    // abbonamento e corso
  { member_id: "jolly", day: "JOLLY" },
  { member_id: "marte", day: "MARTEDI" },
  { member_id: "fuori", day: "DOMENICA" },
];

const summary = (sheets) => sheets.map((f) => [f.titolo, f.gruppi.map((g) => [g.titolo, g.soci.map((s) => s.id)])]);

// Sabato: corsisti del sabato, abbonamenti del sabato, jolly. Ogni file comincia con «Tutti», l'elenco intero
// del giorno con o senza partenza (richiesta del 19/11/2026: la partenza non è obbligatoria e chi non l'aveva
// finiva nell'ultima linguetta, che nessuno apriva). Poi un foglio per partenza, "Senza partenza" in fondo, per
// cognome dentro il gruppo, una riga sola con due abbonamenti. Chi ha abbonamento e corso è su tutti e due i fogli.
assert.deepStrictEqual(summary(daySheets("SABATO", members, passList)), [
  ["Corsisti", [["Tutti", ["corso"]], ["Partenza da FELIZZANO", ["corso"]]]],
  ["Abbonamenti 5 gite", [
    ["Tutti", ["alfa", "corso", "felix", "nessa", "zeta"]],
    ["Partenza da ASTI", ["alfa", "zeta"]],
    ["Partenza da FELIZZANO", ["corso", "felix"]],
    ["Senza partenza", ["nessa"]],
  ]],
  ["Jolly", [["Tutti", ["jolly"]], ["Partenza da ASTI", ["jolly"]]]],
]);

// Domenica: le partenze della domenica, jolly compreso.
assert.deepStrictEqual(summary(daySheets("DOMENICA", members, passList)), [
  ["Corsisti", [["Tutti", ["dom"]], ["Partenza da ASTI", ["dom"]]]],
  ["Abbonamenti 5 gite", [["Tutti", ["fuori"]], ["Senza partenza", ["fuori"]]]],   // fuori: domenica senza partenza
  ["Jolly", [["Tutti", ["jolly"]], ["Partenza da NIZZA M.", ["jolly"]]]],
]);

// Il caso del 19/11/2026: corsisti del sabato senza partenza (o con quella della sola domenica) e chi ha
// spuntato due partenze. Nel foglio «Tutti» ci sono tutti, con la partenza scritta; chi ne ha due sta nel foglio
// di ognuna, non in un foglio «ASTI, FELIZZANO» che non è un pullman.
{
  const course = [
    member("c1", "BETA", { course_type: "CORSO SCI 10 - 14", course_day: "SABATO" }),
    member("c2", "ALFA", { course_type: "CORSO SCI ADULTI", course_day: "SABATO", sunday_departure: "OPESSINA - MONTEGROSSO" }),
    member("c3", "GAMMA", { course_type: "CORSO SCI ADULTI", course_day: "SABATO", saturday_departure: "ASTI, felizzano" }),
    member("c4", "DELTA", { course_type: "CORSO SCI BABY FINO 10", course_day: "DOMENICA" }),
  ];
  const [courseSheet] = daySheets("SABATO", course, []);
  assert.deepStrictEqual(summary([courseSheet]), [["Corsisti", [
    ["Tutti", ["c2", "c1", "c3"]],
    ["Partenza da ASTI", ["c3"]],
    ["Partenza da FELIZZANO", ["c3"]],
    ["Senza partenza", ["c2", "c1"]],
  ]]], "corsisti del sabato");
  const all = courseSheet.gruppi[0];
  assert.strictEqual(all.tutti, true, "il primo gruppo è l'elenco intero");
  assert.deepStrictEqual(all.soci.map((s) => all.partenze.get(s.id)), ["", "", "ASTI, FELIZZANO"], "partenze nel foglio Tutti");
  // Quanti soci ha il foglio (l'anteprima della pagina e l'esito dello scarico): persone, non righe dei fogli.
  assert.strictEqual(sheetPeople(courseSheet), 3, "corsisti del sabato contati due volte");
  assert.strictEqual(sheetPeople(daySheets("DOMENICA", course, [])[0]), 1);
  assert.strictEqual(sheetPeople(daySheets("MARTEDI", members, passList)[0]), 1, "martedì: un gruppo solo, senza Tutti");
}

// Martedì: niente corsi e niente partenze, jolly sempre.
assert.deepStrictEqual(summary(daySheets("MARTEDI", members, passList)), [
  ["Abbonamenti 5 gite", [["", ["marte"]]]],
  ["Jolly", [["", ["jolly"]]]],
]);

// Nessuno quel giorno: i fogli restano, vuoti (la pagina scrive "Nessuno").
assert.deepStrictEqual(summary(daySheets("MARTEDI", members, [])), [
  ["Abbonamenti 5 gite", []],
  ["Jolly", []],
]);
assert.deepStrictEqual(daySheets("LUNEDI", members, passList), []);
assert.strictEqual(daySheets("SABATO", members, passList)[2].nota, "valido per tutti i giorni");

assert.strictEqual(departureName("  nizza   m. "), "NIZZA M.");

// Nomi dei fogli di lavoro Excel: senza "Partenza da", senza caratteri vietati, 31 al massimo.
assert.strictEqual(excelSheetName("Partenza da NIZZA M."), "NIZZA M.");
assert.strictEqual(excelSheetName("Senza partenza"), "Senza partenza");
assert.strictEqual(excelSheetName("Partenza da ASTI/CENTRO"), "ASTI CENTRO");
assert.strictEqual(excelSheetName("Partenza da " + "X".repeat(40)).length, 31);
assert.strictEqual(excelSheetName(""), "Foglio1");

// Il martedì non ha corsi: niente foglio dei corsisti, mai.
assert.ok(!daySheets("MARTEDI", members, passList).some((f) => f.titolo === "Corsisti"));

// Il titolo dei fogli scaricati: solo cosa sono, come li chiamano al club.
assert.strictEqual(excelTitle("SABATO", "Corsisti"), "CORSI SABATO");
assert.strictEqual(excelTitle("DOMENICA", "Abbonamenti 5 gite"), "ABBONAMENTI DOMENICA");
assert.strictEqual(excelTitle("MARTEDI", "Abbonamenti 5 gite"), "ABBONAMENTI MARTEDÌ");
assert.strictEqual(excelTitle("DOMENICA", "Jolly"), "ABBONAMENTI JOLLY");
// Ogni foglio del giorno ha il suo titolo.
for (const ch of ["SABATO", "DOMENICA", "MARTEDI"]) {
  for (const f of daySheets(ch, [], [])) assert.match(excelTitle(ch, f.titolo), /^(CORSI|ABBONAMENTI) [A-ZÌ]+$/, `${ch} ${f.titolo}`);
}

// Gite fatte: solo gli abbonamenti di quei giorni, uno dopo l'altro; i corsi no.
{
  const steps = [
    { member_id: "alfa", day: "SABATO", trips_used: 5, trips_total: 5 },
    { member_id: "alfa", day: "SABATO", trips_used: 1, trips_total: 5 },
    { member_id: "alfa", day: "JOLLY", trips_used: 2, trips_total: 5 },
    { member_id: "beta", day: "DOMENICA", trips_used: 0, trips_total: 5 },
  ];
  assert.strictEqual(tripsDone(steps, "alfa", ["SABATO"]), "5/5, 1/5");
  assert.strictEqual(tripsDone(steps, "alfa", ["JOLLY"]), "2/5");
  assert.strictEqual(tripsDone(steps, "beta", ["DOMENICA"]), "0/5");
  assert.strictEqual(tripsDone(steps, "beta", ["SABATO"]), "");
  const sheets = daySheets("SABATO", members, passList);
  assert.deepStrictEqual(sheets.map((f) => f.gite), [undefined, ["SABATO"], ["JOLLY"]], "gite nei soli fogli degli abbonamenti");
}

// Larghezze delle colonne degli Excel (larghezzeColonne in shared.js): dalla
// cella più lunga, il titolo sopra le colonne non conta, una data vale 10.
{
  const shared = fs.readFileSync(path.join(__dirname, "shared.js"), "utf8");
  const piece = (start) => shared.slice(shared.indexOf(start), shared.indexOf("\n}\n", shared.indexOf(start)) + 3);
  const { columnWidths } = (0, eval)(`(() => { ${shared.match(/const cellLength = [^\n]*\n/)[0]}
    ${piece("function columnWidths(")}; return { columnWidths }; })()`);
  const rows = [["Domenica · Corsisti · Partenza da ASTI CENTRO STAZIONE"], ["N.", "Cognome", "Nato il"],
    ["1", "DELLA VALLE BRUNETTI", new Date(1950, 0, 31)], ["22", "", null]];
  assert.deepStrictEqual(columnWidths(rows, 1).map((c) => c.wch), [8, 23, 13], "minimo 8, cella più lunga + 3, data 10");
  assert.deepStrictEqual(columnWidths([["X".repeat(80)]]).map((c) => c.wch), [50], "massimo 50");
  // L'intestazione in grassetto più grande pesa di più dei dati.
  assert.strictEqual(columnWidths([["Data di nascita"], ["31/01/1950"]], 0, 1.3, 1.5)[0].wch, Math.ceil(15 * 1.5) + 3);
}

// Corso «NO» (dai fogli vecchi vuol dire niente corso): non è un corsista, anche
// col giorno del corso rimasto. Come le viste del database (upper(course_type) <> 'NO').
{
  const conNo = [member("no", "NOCORSO", { course_type: "NO", course_day: "SABATO", saturday_departure: "ASTI" })];
  const courseMembers = daySheets("SABATO", conNo, []).find((f) => f.titolo === "Corsisti");
  assert.deepStrictEqual(courseMembers ? courseMembers.gruppi.flatMap((g) => g.soci.map((x) => x.id)) : [], [], "corso NO fra i corsisti");
}

// Due partenze che danno lo stesso nome di foglio («/» e «:» diventano spazi, al
// massimo 31 caratteri): nello stesso file i nomi restano diversi, se no lo
// scarico del giorno si ferma (xlsx non accetta due fogli uguali).
{
  const usedItems = new Set();
  const names = ["Partenza da ASTI/CENTRO", "Partenza da ASTI:CENTRO", "Partenza da asti centro",
    "Partenza da " + "A".repeat(40), "Partenza da " + "A".repeat(35)].map((t) => excelSheetName(t, usedItems));
  assert.strictEqual(new Set(names.map((n) => n.toLowerCase())).size, names.length, `nomi uguali: ${names.join(" | ")}`);
  assert.ok(names.every((n) => n.length <= 31), "un nome oltre 31 caratteri");
  assert.strictEqual(names[0], "ASTI CENTRO");
}

console.log("test stampe: tutto a posto");
