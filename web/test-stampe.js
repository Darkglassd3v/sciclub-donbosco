// Controllo dei fogli da stampare (web/stampe.js).
//
//   node web/test-stampe.js
//
// Soci inventati.

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const sorgente = fs.readFileSync(path.join(__dirname, "stampe.js"), "utf8");
const { fogliDelGiorno, nomePartenza } =
  (0, eval)(`(() => { ${sorgente}; return { fogliDelGiorno, nomePartenza }; })()`);

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

// Sabato: corsisti, abbonamenti del sabato, jolly. Per partenza, "Senza
// partenza" in fondo, per cognome dentro il gruppo, una riga sola con due
// abbonamenti. Chi ha abbonamento e corso è su tutti e due i fogli.
assert.deepStrictEqual(riassunto(fogliDelGiorno("SABATO", soci, abbonamenti)), [
  ["Corsisti", [["Partenza da FELIZZANO", ["corso"]]]],
  ["Abbonamenti 5 gite", [
    ["Partenza da ASTI", ["alfa", "zeta"]],
    ["Partenza da FELIZZANO", ["corso", "felix"]],
    ["Senza partenza", ["nessa"]],
  ]],
  ["Jolly", [["Partenza da ASTI", ["jolly"]]]],
]);

// Domenica: il jolly con la partenza della domenica.
assert.deepStrictEqual(riassunto(fogliDelGiorno("DOMENICA", soci, abbonamenti)), [
  ["Corsisti", [["Partenza da ASTI", ["dom"]]]],
  ["Abbonamenti 5 gite", [["Senza partenza", ["fuori"]]]],
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

console.log("test stampe: tutto a posto");
