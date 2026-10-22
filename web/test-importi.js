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

const ECCEZIONI = { "bilancio.html": ["saldoInizio", "mPrezzo"] };
const sbagliati = [];
for (const file of fs.readdirSync(__dirname).filter((f) => f.endsWith(".html"))) {
  const testo = fs.readFileSync(path.join(__dirname, file), "utf8");
  for (const [campo] of testo.matchAll(/<input\b[^>]*type="number"[^>]*>/g)) {
    const id = campo.match(/\bid="([^"]+)"/)?.[1] || campo.match(/data-[a-z-]+/)?.[0] || campo.slice(0, 60);
    if ((ECCEZIONI[file] || []).includes(id)) continue;
    const passo = campo.match(/\bstep="([^"]+)"/)?.[1];
    if (passo !== "0.5" && passo !== "1") sbagliati.push(`${file} ${id}: step=${passo ?? "(nessuno)"}`);
  }
}
assert.deepStrictEqual(sbagliati, [], "campi numerici che non vanno a 0,5 o a 1:\n  " + sbagliati.join("\n  "));

// Le eccezioni prendono i centesimi davvero.
const bilancio = fs.readFileSync(path.join(__dirname, "bilancio.html"), "utf8");
for (const id of ECCEZIONI["bilancio.html"]) {
  const campo = bilancio.match(new RegExp(`<input\\b[^>]*\\bid="${id}"[^>]*>`))?.[0] || "";
  assert.ok(/\bstep="0\.01"/.test(campo), `bilancio.html ${id}: deve prendere i centesimi (step 0.01): ${campo}`);
}
console.log("test-importi: tutto a posto");
