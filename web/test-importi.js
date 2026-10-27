// Importi in euro: in tutto il sito interi o con i 50 centesimi (regola del club).
//
//   node web/test-importi.js
//
// Ogni campo numerico delle pagine (anche quelli scritti dagli script, come
// quota_${id}) va a passi di 0,5 (euro) o di 1 (quantità, ordine, numeri). In
// Bilancio no (scelta dell'utente, 23/10): il saldo della banca lo dice l'estratto
// conto, e i movimenti sono spese ed entrate vere (es. 1,35 di commissione), coi centesimi.

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const EXCEPTIONS = { "bilancio.html": ["saldoInizio", "mPrezzo"] };
const wrongOnes = [];
for (const file of fs.readdirSync(__dirname).filter((f) => f.endsWith(".html"))) {
  const text = fs.readFileSync(path.join(__dirname, file), "utf8");
  for (const [field] of text.matchAll(/<input\b[^>]*type="number"[^>]*>/g)) {
    const id = field.match(/\bid="([^"]+)"/)?.[1] || field.match(/data-[a-z-]+/)?.[0] || field.slice(0, 60);
    if ((EXCEPTIONS[file] || []).includes(id)) continue;
    const step = field.match(/\bstep="([^"]+)"/)?.[1];
    if (step !== "0.5" && step !== "1") wrongOnes.push(`${file} ${id}: step=${step ?? "(nessuno)"}`);
  }
}
assert.deepStrictEqual(wrongOnes, [], "campi numerici che non vanno a 0,5 o a 1:\n  " + wrongOnes.join("\n  "));

// Le eccezioni prendono i centesimi davvero.
const budget = fs.readFileSync(path.join(__dirname, "bilancio.html"), "utf8");
for (const id of EXCEPTIONS["bilancio.html"]) {
  const field = budget.match(new RegExp(`<input\\b[^>]*\\bid="${id}"[^>]*>`))?.[0] || "";
  assert.ok(/\bstep="0\.01"/.test(field), `bilancio.html ${id}: deve prendere i centesimi (step 0.01): ${field}`);
}
console.log("test-importi: tutto a posto");
