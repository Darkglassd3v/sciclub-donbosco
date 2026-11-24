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

const root = path.join(__dirname, "..");
const file = [
  ...fs.readdirSync(__dirname).filter((f) => /\.(html|js)$/.test(f)).map((f) => path.join(__dirname, f)),
  ...fs.readdirSync(path.join(root, "ricerca")).filter((f) => /\.(html|js)$/.test(f)).map((f) => path.join(root, "ricerca", f)),
].filter((f) => !/test-/.test(path.basename(f)));

const wrongOnes = [];
for (const f of file) {
  const text = fs.readFileSync(f, "utf8");
  const nome = path.relative(root, f);
  for (const [url] of text.matchAll(/https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js@[^"'\s)]*/g)) {
    if (!url.includes("@2.45.4/")) wrongOnes.push(`${nome}: ${url}`);
  }
  for (const [tag] of text.matchAll(/<(?:script|link)\b[^>]*(?:src|href)="https:\/\/cdn\.jsdelivr\.net\/[^"]+"[^>]*>/g)) {
    if (!/\bintegrity="sha384-[A-Za-z0-9+/=]+"/.test(tag) || !/crossorigin="anonymous"/.test(tag)) wrongOnes.push(`${nome}: ${tag} senza integrity`);
  }
  // Script a richiesta: l'url in una stringa, accanto a un integrity.
  for (const m of text.matchAll(/["'](https:\/\/cdn\.jsdelivr\.net\/npm\/(jspdf|xlsx-js-style)@[^"']+)["']/g)) {
    const around = text.slice(Math.max(0, m.index - 300), m.index + m[0].length + 300);
    if (!/integrity|sha384-/.test(around)) wrongOnes.push(`${nome}: ${m[1]} senza integrity`);
  }
}
assert.deepStrictEqual(wrongOnes, [], "librerie dal CDN:\n  " + wrongOnes.join("\n  "));

// Regola del sito (3/11): ogni elenco che si riempie all'apertura parte da «Caricamento…», mai vuoto o con «Nessun…»;
// e tutte le richieste al database passano da fetchWithWaiting(), che mostra la scritta quando durano.
const LISTS = {
  "web/social.html": ["elencoPost", "riassuntoSponsor", "riassuntoContatti", "riassuntoGiorni"],
  "web/admin.html": ["displayArea"],
  "web/riepilogo.html": ["tTess", "tPresc", "tAbb", "tCorsi"],
  "web/gestione.html": ["storicoPermessi", "tabellaPermessi"],
  "web/assicurazione.html": ["tipi", "elencoDa", "elencoListe"],
  "web/bilancio.html": ["elencoMovimenti"],
  "web/elenco.html": ["elencoSoci"],
  "web/stagione.html": ["tabellaStagioni", "tabellaChiuse"],
  "web/impostazioni.html": ["tabellaPrezzi", "tabellaAssicurazioni", "tabellaPartenze"],
  "web/utenti.html": ["tabellaUtenti"],
};
for (const [page, ids] of Object.entries(LISTS)) {
  const text = fs.readFileSync(path.join(root, page), "utf8");
  for (const id of ids) assert.ok(new RegExp(`id="${id}"[^>]*>(?:\\s*<[^>]+>)*\\s*Caricamento…`).test(text), `${page}: #${id} non parte da «Caricamento…»`);
}
for (const f of ["web/shared.js", "ricerca/comune.js"])
  assert.ok(/fetch: fetchWithWaiting/.test(fs.readFileSync(path.join(root, f), "utf8")), `${f}: le richieste non mostrano «Caricamento…»`);

// Elenco soci (dalla 3.8): una voce del menu in ogni pagina, subito dopo Soci, col suo permesso «elenco»; il
// superadmin lo dà ai ruoli e ne sceglie il nome in Gestione > Ruoli; chi ha solo quello arriva lì.
for (const f of file.filter((x) => /\.html$/.test(x))) {
  const text = fs.readFileSync(f, "utf8");
  if (!text.includes('class="barra-voci"')) continue;
  const nome = path.relative(root, f);
  const soci = text.indexOf('data-permesso="soci"'), elenco = text.search(/<a href="(\.\.\/)?elenco\.html" data-permesso="elenco"/);
  assert.ok(elenco > soci && soci > 0, `${nome}: manca la voce «Elenco soci» (data-permesso="elenco") dopo Soci nel menu`);
  assert.ok(!/data-permesso="pagamenti"/.test(text.slice(soci, elenco)), `${nome}: la voce «Elenco soci» non è subito dopo Soci`);
}
const elencoPage = fs.readFileSync(path.join(root, "web/elenco.html"), "utf8");
assert.ok(/<a href="elenco\.html" data-permesso="elenco" hidden aria-current="page">/.test(elencoPage), "elenco.html: la voce segnata non è Elenco soci");
assert.ok(/requirePermission\("elenco"\)/.test(elencoPage), "elenco.html: non chiede il permesso elenco");
const management = fs.readFileSync(path.join(root, "web/gestione.html"), "utf8");
assert.ok(/\["elenco", "Elenco soci", "[^"]+", true\]/.test(management), "gestione.html: «Elenco soci» manca fra i permessi dei ruoli");
assert.ok(/\["elenco", "Elenco soci"\]/.test(management), "gestione.html: «Elenco soci» manca fra i nomi della barra");
assert.ok(/\["soci", "index\.html"\],\s*\["elenco", "elenco\.html"\]/.test(fs.readFileSync(path.join(root, "web/shared.js"), "utf8")),
  "shared.js: chi ha solo elenco non ha una pagina di arrivo");

console.log("test-pagine: tutto a posto");
