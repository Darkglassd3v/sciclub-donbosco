// Controllo dei fogli da stampare (web/stampe.js).
//
//   node web/test-stampe.js
//
// Soci inventati.

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const sorgente = fs.readFileSync(path.join(__dirname, "stampe.js"), "utf8");
const { fogliDelGiorno, nomePartenza, nomeFoglioExcel, titoloExcel, giteFatte } =
  (0, eval)(`(() => { ${sorgente}; return { fogliDelGiorno, nomePartenza, nomeFoglioExcel, titoloExcel, giteFatte }; })()`);

const socio = (id, last_name, extra = {}) => ({ id, last_name, first_name: "A", ...extra });
const soci = [
  socio("zeta",  "ZETA",   { saturday_departure: "ASTI" }),
  socio("alfa",  "ALFA",   { saturday_departure: " asti  " }),               // refuso di maiuscole e spazi
  socio("felix", "FELIX",  { saturday_departure: "FELIZZANO" }),
  socio("nessa", "NESSA"),                                                   // abbonato senza partenza
  socio("corso", "CORSO",  { course_type: "CORSO SCI ADULTI", course_day: "SABATO", saturday_departure: "FELIZZANO" }),
  socio("dom",   "DOMINI", { course_type: "CORSO SCI ADULTI", course_day: "DOMENICA", sunday_departure: "ASTI" }),
  socio("jolly", "JOLLY",  { saturday_departure: "ASTI", sunday_departure: "NIZZA M." }),
  socio("marte", "MARTE"),
  socio("fuori", "FUORI",  { saturday_departure: "ASTI" }),                  // niente sabato
];
const abbonamenti = [
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

const riassunto = (fogli) => fogli.map((f) => [f.titolo, f.gruppi.map((g) => [g.titolo, g.soci.map((s) => s.id)])]);

// Sabato: corsisti del sabato, abbonamenti del sabato, jolly. Per partenza,
// "Senza partenza" in fondo, per cognome dentro il gruppo, una riga sola con
// due abbonamenti. Chi ha abbonamento e corso è su tutti e due i fogli.
assert.deepStrictEqual(riassunto(fogliDelGiorno("SABATO", soci, abbonamenti)), [
  ["Corsisti", [["Partenza da FELIZZANO", ["corso"]]]],
  ["Abbonamenti 5 gite", [
    ["Partenza da ASTI", ["alfa", "zeta"]],
    ["Partenza da FELIZZANO", ["corso", "felix"]],
    ["Senza partenza", ["nessa"]],
  ]],
  ["Jolly", [["Partenza da ASTI", ["jolly"]]]],
]);

// Domenica: le partenze della domenica, jolly compreso.
assert.deepStrictEqual(riassunto(fogliDelGiorno("DOMENICA", soci, abbonamenti)), [
  ["Corsisti", [["Partenza da ASTI", ["dom"]]]],
  ["Abbonamenti 5 gite", [["Senza partenza", ["fuori"]]]],               // fuori: domenica senza partenza
  ["Jolly", [["Partenza da NIZZA M.", ["jolly"]]]],
]);

// Martedì: niente corsi e niente partenze, jolly sempre.
assert.deepStrictEqual(riassunto(fogliDelGiorno("MARTEDI", soci, abbonamenti)), [
  ["Abbonamenti 5 gite", [["", ["marte"]]]],
  ["Jolly", [["", ["jolly"]]]],
]);

// Nessuno quel giorno: i fogli restano, vuoti (la pagina scrive "Nessuno").
assert.deepStrictEqual(riassunto(fogliDelGiorno("MARTEDI", soci, [])), [
  ["Abbonamenti 5 gite", []],
  ["Jolly", []],
]);
assert.deepStrictEqual(fogliDelGiorno("LUNEDI", soci, abbonamenti), []);
assert.strictEqual(fogliDelGiorno("SABATO", soci, abbonamenti)[2].nota, "valido per tutti i giorni");

assert.strictEqual(nomePartenza("  nizza   m. "), "NIZZA M.");

// Nomi dei fogli di lavoro Excel: senza "Partenza da", senza caratteri vietati, 31 al massimo.
assert.strictEqual(nomeFoglioExcel("Partenza da NIZZA M."), "NIZZA M.");
assert.strictEqual(nomeFoglioExcel("Senza partenza"), "Senza partenza");
assert.strictEqual(nomeFoglioExcel("Partenza da ASTI/CENTRO"), "ASTI CENTRO");
assert.strictEqual(nomeFoglioExcel("Partenza da " + "X".repeat(40)).length, 31);
assert.strictEqual(nomeFoglioExcel(""), "Foglio1");

// Il martedì non ha corsi: niente foglio dei corsisti, mai.
assert.ok(!fogliDelGiorno("MARTEDI", soci, abbonamenti).some((f) => f.titolo === "Corsisti"));

// Il titolo dei fogli scaricati: solo cosa sono, come li chiamano al club.
assert.strictEqual(titoloExcel("SABATO", "Corsisti"), "CORSI SABATO");
assert.strictEqual(titoloExcel("DOMENICA", "Abbonamenti 5 gite"), "ABBONAMENTI DOMENICA");
assert.strictEqual(titoloExcel("MARTEDI", "Abbonamenti 5 gite"), "ABBONAMENTI MARTEDÌ");
assert.strictEqual(titoloExcel("DOMENICA", "Jolly"), "ABBONAMENTI JOLLY");
// Ogni foglio del giorno ha il suo titolo.
for (const ch of ["SABATO", "DOMENICA", "MARTEDI"]) {
  for (const f of fogliDelGiorno(ch, [], [])) assert.match(titoloExcel(ch, f.titolo), /^(CORSI|ABBONAMENTI) [A-ZÌ]+$/, `${ch} ${f.titolo}`);
}

// Gite fatte: solo gli abbonamenti di quei giorni, uno dopo l'altro; i corsi no.
{
  const passi = [
    { member_id: "alfa", day: "SABATO", trips_used: 5, trips_total: 5 },
    { member_id: "alfa", day: "SABATO", trips_used: 1, trips_total: 5 },
    { member_id: "alfa", day: "JOLLY", trips_used: 2, trips_total: 5 },
    { member_id: "beta", day: "DOMENICA", trips_used: 0, trips_total: 5 },
  ];
  assert.strictEqual(giteFatte(passi, "alfa", ["SABATO"]), "5/5, 1/5");
  assert.strictEqual(giteFatte(passi, "alfa", ["JOLLY"]), "2/5");
  assert.strictEqual(giteFatte(passi, "beta", ["DOMENICA"]), "0/5");
  assert.strictEqual(giteFatte(passi, "beta", ["SABATO"]), "");
  const fogli = fogliDelGiorno("SABATO", soci, abbonamenti);
  assert.deepStrictEqual(fogli.map((f) => f.gite), [undefined, ["SABATO"], ["JOLLY"]], "gite nei soli fogli degli abbonamenti");
}

// Larghezze delle colonne degli Excel (larghezzeColonne in shared.js): dalla
// cella più lunga, il titolo sopra le colonne non conta, una data vale 10.
{
  const shared = fs.readFileSync(path.join(__dirname, "shared.js"), "utf8");
  const pezzo = (inizio) => shared.slice(shared.indexOf(inizio), shared.indexOf("\n}\n", shared.indexOf(inizio)) + 3);
  const { larghezzeColonne } = (0, eval)(`(() => { ${shared.match(/const lunghezzaCella = [^\n]*\n/)[0]}
    ${pezzo("function larghezzeColonne(")}; return { larghezzeColonne }; })()`);
  const righe = [["Domenica · Corsisti · Partenza da ASTI CENTRO STAZIONE"], ["N.", "Cognome", "Nato il"],
    ["1", "DELLA VALLE BRUNETTI", new Date(1950, 0, 31)], ["22", "", null]];
  assert.deepStrictEqual(larghezzeColonne(righe, 1).map((c) => c.wch), [8, 23, 13], "minimo 8, cella più lunga + 3, data 10");
  assert.deepStrictEqual(larghezzeColonne([["X".repeat(80)]]).map((c) => c.wch), [50], "massimo 50");
  // L'intestazione in grassetto più grande pesa di più dei dati.
  assert.strictEqual(larghezzeColonne([["Data di nascita"], ["31/01/1950"]], 0, 1.3, 1.5)[0].wch, Math.ceil(15 * 1.5) + 3);
}

console.log("test stampe: tutto a posto");
