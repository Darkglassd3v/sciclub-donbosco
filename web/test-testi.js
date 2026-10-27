// I testi del sito (web/ e ricerca/) in registro professionale: niente seconda persona
// («premi», «scrivi», «hai», «tuo»), niente prima persona del sito («non riesco»),
// niente parlato («mandare», «escono», «uguali»).
// Le istruzioni sono impersonali o all'infinito («Inserire il codice fiscale»); i
// pulsanti restano verbi brevi («Salva», «Scarica»). Vedi docs/SVILUPPO.md, «Testi».
//
//   node web/test-testi.js
//
// Si leggono il testo dell'HTML, gli attributi che si vedono o si ascoltano
// (placeholder, aria-label, title, alt, data-etichetta) e le stringhe del JS
// (commenti esclusi). I post dei social (social-templates.js) parlano al pubblico:
// restano fuori.

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const file = [
  ...fs.readdirSync(__dirname).filter((f) => /\.(html|js)$/.test(f)).map((f) => path.join(__dirname, f)),
  ...fs.readdirSync(path.join(root, "ricerca")).filter((f) => /\.(html|js)$/.test(f)).map((f) => path.join(root, "ricerca", f)),
].filter((f) => !/^test-|^config\.js$|^social-templates\.js$/.test(path.basename(f)));

// Parole intere (anche con le lettere accentate), in qualunque maiuscola.
const parole = (...p) => new RegExp(`(?<![\\p{L}])(${p.join("|")})(?![\\p{L}])`, "iu");
const FORBIDDEN = [
  ["seconda persona", parole("premi", "scrivi", "scegli", "cerchi", "controlla", "guarda", "rifai", "riaprilo", "riaprila",
    "annullala", "annullalo", "mandal[aeio]", "riscaricale", "aggiungine", "toglila", "toglilo", "spuntala", "spuntalo",
    "compila", "inserisci", "sceglilo", "sai", "hai", "puoi", "devi", "vuoi", "ti", "tuo", "tua", "tuoi", "tue")],
  ["prima persona", parole("riesco", "ho", "sto", "mi")],
  ["parlato", parole("mandat[aeio]", "mandare", "manda", "escono", "uguali", "la volta dopo", "lo stesso\\?")],
];

const row = (text, i) => text.slice(0, i).split("\n").length;
const spaces = (m) => m.replace(/[^\n]/g, " ");

/** Le stringhe di un pezzo di JS, coi commenti tolti (le righe restano al loro posto). */
function jsStrings(js, start, texts) {
  const clean = js.replace(/\/\*[\s\S]*?\*\//g, spaces).replace(/(^|[\s;{}(),])\/\/[^\n]*/g, (m, p) => p + spaces(m.slice(p.length)));
  for (const m of clean.matchAll(/"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`/g)) {
    texts.push([start + row(js, m.index) - 1, m[0].slice(1, -1).replace(/<[^>]+>/g, " ")]);
  }
}

function textsOf(f) {
  const text = fs.readFileSync(f, "utf8");
  const texts = [];
  if (f.endsWith(".js")) { jsStrings(text, 1, texts); return texts; }
  let pos = 0;
  for (const part of text.split(/(<script\b[^>]*>[\s\S]*?<\/script>)/)) {
    if (part.startsWith("<script")) jsStrings(part, row(text, pos), texts);
    else {
      const html = part.replace(/<!--[\s\S]*?-->|<style[\s\S]*?<\/style>/g, spaces);
      for (const m of html.matchAll(/(?:placeholder|aria-label|title|alt|data-etichetta)="([^"]+)"/g)) texts.push([row(text, pos + m.index), m[1]]);
      for (const m of html.matchAll(/>([^<>]+)</g)) texts.push([row(text, pos + m.index), m[1]]);
    }
    pos += part.length;
  }
  return texts;
}

const found = [];
for (const f of file) {
  for (const [n, t] of textsOf(f)) {
    for (const [typeName, re] of FORBIDDEN) {
      const m = t.match(re);
      if (m) found.push(`${path.relative(root, f)}:${n}: ${typeName} «${m[1]}» in «${t.replace(/\s+/g, " ").trim().slice(0, 110)}»`);
    }
  }
}
assert.deepStrictEqual(found, [], `testi da riscrivere (${found.length}):\n${found.join("\n")}`);
console.log(`test-testi: ${file.length} file, nessun testo colloquiale`);
