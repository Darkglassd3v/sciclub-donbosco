// Le librerie dai CDN, in tutte le pagine (web/ e ricerca/).
//
//   node web/test-pagine.js
//
// - supabase-js con la versione intera, la stessa ovunque (2.45.4): con «@2» il
//   CDN dà l'ultima 2.x, che può cambiare sotto i piedi da un giorno all'altro.
// - Gli script caricati a richiesta (jsPDF, xlsx) col controllo integrity
//   (SRI): se il file sul CDN cambia, il browser non lo esegue.
// - Lo stesso per i <script> e i <link> dal CDN scritti nelle pagine (supabase-js,
//   Bulma): supabase-js vede la sessione, un file cambiato leggerebbe tutti i dati.

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const radice = path.join(__dirname, "..");
const file = [
  ...fs.readdirSync(__dirname).filter((f) => /\.(html|js)$/.test(f)).map((f) => path.join(__dirname, f)),
  ...fs.readdirSync(path.join(radice, "ricerca")).filter((f) => /\.(html|js)$/.test(f)).map((f) => path.join(radice, "ricerca", f)),
].filter((f) => !/test-/.test(path.basename(f)));

const sbagliati = [];
for (const f of file) {
  const testo = fs.readFileSync(f, "utf8");
  const nome = path.relative(radice, f);
  for (const [url] of testo.matchAll(/https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js@[^"'\s)]*/g)) {
    if (!url.includes("@2.45.4/")) sbagliati.push(`${nome}: ${url}`);
  }
  for (const [tag] of testo.matchAll(/<(?:script|link)\b[^>]*(?:src|href)="https:\/\/cdn\.jsdelivr\.net\/[^"]+"[^>]*>/g)) {
    if (!/\bintegrity="sha384-[A-Za-z0-9+/=]+"/.test(tag) || !/crossorigin="anonymous"/.test(tag)) sbagliati.push(`${nome}: ${tag} senza integrity`);
  }
  // Script a richiesta: l'url in una stringa, accanto a un integrity.
  for (const m of testo.matchAll(/["'](https:\/\/cdn\.jsdelivr\.net\/npm\/(jspdf|xlsx-js-style)@[^"']+)["']/g)) {
    const intorno = testo.slice(Math.max(0, m.index - 300), m.index + m[0].length + 300);
    if (!/integrity|sha384-/.test(intorno)) sbagliati.push(`${nome}: ${m[1]} senza integrity`);
  }
}
assert.deepStrictEqual(sbagliati, [], "librerie dal CDN:\n  " + sbagliati.join("\n  "));
console.log("test-pagine: tutto a posto");
