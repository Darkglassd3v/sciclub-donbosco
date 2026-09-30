// Controllo dei fogli da stampare (web/stampe.js).
//
//   node web/test-stampe.js
//
// Soci inventati.

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const sorgente = fs.readFileSync(path.join(__dirname, "stampe.js"), "utf8");
const { gruppiDelFoglio, tipoRiga, nomePartenza } =
  (0, eval)(`(() => { ${sorgente}; return { gruppiDelFoglio, tipoRiga, nomePartenza }; })()`);

const socio = (id, last_name, extra = {}) => ({ id, last_name, first_name: "A", ...extra });
const soci = [
  socio("zeta",  "ZETA",   { saturday_departure: "ASTI" }),
  socio("alfa",  "ALFA",   { saturday_departure: " asti  " }),               // refuso di maiuscole e spazi
  socio("felix", "FELIX",  { saturday_departure: "FELIZZANO" }),
  socio("nessa", "NESSA"),                                                   // abbonato senza partenza
  socio("corso", "CORSO",  { course_type: "CORSO SCI ADULTI", course_day: "SABATO", saturday_departure: "FELIZZANO" }),
  socio("dom",   "DOMINI", { course_type: "CORSO SCI ADULTI", course_day: "DOMENICA", sunday_departure: "ASTI" }),
  socio("jolly", "JOLLY",  { saturday_departure: "ASTI" }),
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

const nomi = (gruppi) => gruppi.map((g) => [g.titolo, g.righe.map((r) => r.socio.id)]);

// Sabato: per partenza, "Senza partenza" in fondo, per cognome dentro il gruppo,
// una riga sola con due abbonamenti, il corso del sabato compreso, jolly escluso.
assert.deepStrictEqual(nomi(gruppiDelFoglio("SABATO", soci, abbonamenti)), [
  ["Partenza da ASTI", ["alfa", "zeta"]],
  ["Partenza da FELIZZANO", ["corso", "felix"]],
  ["Senza partenza", ["nessa"]],
]);

// Domenica: solo il corso della domenica e l'abbonato della domenica.
assert.deepStrictEqual(nomi(gruppiDelFoglio("DOMENICA", soci, abbonamenti)), [
  ["Partenza da ASTI", ["dom"]],
  ["Senza partenza", ["fuori"]],
]);

// Martedì e jolly: un gruppo solo, niente corsi.
assert.deepStrictEqual(nomi(gruppiDelFoglio("MARTEDI", soci, abbonamenti)), [["Martedì", ["marte"]]]);
assert.deepStrictEqual(nomi(gruppiDelFoglio("JOLLY", soci, abbonamenti)), [["Jolly", ["jolly"]]]);

// Nessuno quel giorno: nessun gruppo (la pagina lo dice).
assert.deepStrictEqual(gruppiDelFoglio("MARTEDI", soci, []), []);
assert.deepStrictEqual(gruppiDelFoglio("LUNEDI", soci, abbonamenti), []);

// Tipo della riga.
const sabato = gruppiDelFoglio("SABATO", soci, abbonamenti).flatMap((g) => g.righe);
assert.strictEqual(tipoRiga(sabato.find((r) => r.socio.id === "corso")), "Abbonamento e corso");
assert.strictEqual(tipoRiga(sabato.find((r) => r.socio.id === "zeta")), "Abbonamento");
assert.strictEqual(tipoRiga(gruppiDelFoglio("DOMENICA", soci, abbonamenti)[0].righe[0]), "Corso");

assert.strictEqual(nomePartenza("  nizza   m. "), "NIZZA M.");

console.log("test stampe: tutto a posto");
