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

const radice = path.join(__dirname, "..");
const file = [
  ...fs.readdirSync(__dirname).filter((f) => /\.(html|js)$/.test(f)).map((f) => path.join(__dirname, f)),
  ...fs.readdirSync(path.join(radice, "ricerca")).filter((f) => /\.(html|js)$/.test(f)).map((f) => path.join(radice, "ricerca", f)),
].filter((f) => !/^test-|^config\.js$|^social-templates\.js$/.test(path.basename(f)));

// Parole intere (anche con le lettere accentate), in qualunque maiuscola.
const parole = (...p) => new RegExp(`(?<![\\p{L}])(${p.join("|")})(?![\\p{L}])`, "iu");
const VIETATE = [
  ["seconda persona", parole("premi", "scrivi", "scegli", "cerchi", "controlla", "guarda", "rifai", "riaprilo", "riaprila",
    "annullala", "annullalo", "mandal[aeio]", "riscaricale", "aggiungine", "toglila", "toglilo", "spuntala", "spuntalo",
    "compila", "inserisci", "sceglilo", "sai", "hai", "puoi", "devi", "vuoi", "ti", "tuo", "tua", "tuoi", "tue")],
  ["prima persona", parole("riesco", "ho", "sto", "mi")],
  ["parlato", parole("mandat[aeio]", "mandare", "manda", "escono", "uguali", "la volta dopo", "lo stesso\\?")],
];

const riga = (testo, i) => testo.slice(0, i).split("\n").length;
const spazi = (m) => m.replace(/[^\n]/g, " ");

/** Le stringhe di un pezzo di JS, coi commenti tolti (le righe restano al loro posto). */
function stringheJs(js, inizio, testi) {
  const pulito = js.replace(/\/\*[\s\S]*?\*\//g, spazi).replace(/(^|[\s;{}(),])\/\/[^\n]*/g, (m, p) => p + spazi(m.slice(p.length)));
  for (const m of pulito.matchAll(/"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`/g)) {
    testi.push([inizio + riga(js, m.index) - 1, m[0].slice(1, -1).replace(/<[^>]+>/g, " ")]);
  }
}

function testiDi(f) {
  const testo = fs.readFileSync(f, "utf8");
  const testi = [];
  if (f.endsWith(".js")) { stringheJs(testo, 1, testi); return testi; }
  let pos = 0;
  for (const parte of testo.split(/(<script\b[^>]*>[\s\S]*?<\/script>)/)) {
    if (parte.startsWith("<script")) stringheJs(parte, riga(testo, pos), testi);
    else {
      const html = parte.replace(/<!--[\s\S]*?-->|<style[\s\S]*?<\/style>/g, spazi);
      for (const m of html.matchAll(/(?:placeholder|aria-label|title|alt|data-etichetta)="([^"]+)"/g)) testi.push([riga(testo, pos + m.index), m[1]]);
      for (const m of html.matchAll(/>([^<>]+)</g)) testi.push([riga(testo, pos + m.index), m[1]]);
    }
    pos += parte.length;
  }
  return testi;
}

const trovati = [];
for (const f of file) {
  for (const [n, t] of testiDi(f)) {
    for (const [tipo, re] of VIETATE) {
      const m = t.match(re);
      if (m) trovati.push(`${path.relative(radice, f)}:${n}: ${tipo} «${m[1]}» in «${t.replace(/\s+/g, " ").trim().slice(0, 110)}»`);
    }
  }
}
assert.deepStrictEqual(trovati, [], `testi da riscrivere (${trovati.length}):\n${trovati.join("\n")}`);
console.log(`test-testi: ${file.length} file, nessun testo colloquiale`);
