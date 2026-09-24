// Controllo dei pezzi dei post social che possono sbagliare in silenzio
// (web/social-templates.js): colore del giorno, prezzo facoltativo, testo del
// post, indirizzo con UTM, contrasto dei colori di uno sponsor.
//
//   node web/test-social.js

const assert = require("assert");
const { dataLunga, dataCorta, categoriaGita, modelloPost, contrasto, schiarisci,
        indirizzoUtm, testoPost, SOCIAL } = require("./social-templates.js");

// --- Date e colore del giorno -----------------------------------------------

assert.strictEqual(dataLunga("2027-01-12"), "Martedì 12 gennaio");
assert.strictEqual(dataCorta("2027-01-09"), "09/01");
assert.strictEqual(categoriaGita("2027-01-12"), "mar");   // martedì: rosso
assert.strictEqual(categoriaGita("2027-01-16"), "sab");   // sabato: blu
assert.strictEqual(categoriaGita("2027-01-17"), "dom");   // domenica: giallo
assert.strictEqual(categoriaGita("2027-01-15"), "gita");  // venerdì: blu del club
assert.strictEqual(categoriaGita(null), "gita");

// --- Prezzo facoltativo -----------------------------------------------------

const gita = {
  kind: "gita", event_date: "2027-01-12", title: "La Thuile",
  prices: [[null, "€ 52"]], show_price: true,
  stops: [["6:30", "Asti"], ["6:45", "Moncalvo"]], deadline: "2027-01-10", course: false,
};
assert.deepStrictEqual(modelloPost(gita, "post").prices, [[null, "€ 52"]]);
assert.strictEqual(modelloPost(gita, "post").deadline, "entro domenica 10");
assert.match(testoPost(gita), /Quota soci: € 52/);

const senzaPrezzo = { ...gita, show_price: false };
assert.deepStrictEqual(modelloPost(senzaPrezzo, "post").prices, [], "prezzo nascosto ma ancora nel disegno");
assert.doesNotMatch(testoPost(senzaPrezzo), /€/, "prezzo nascosto ma ancora nel testo del post");

// Una riga di prezzo lasciata vuota nel form non diventa una cifra vuota.
assert.deepStrictEqual(modelloPost({ ...gita, prices: [["Adulti", ""]] }, "post").prices, []);

// --- Testo del post ---------------------------------------------------------

const testo = testoPost(gita);
assert.match(testo, /^🚌 Martedì 12 gennaio: gita a La Thuile!/);
assert.match(testo, /Partenze: ore 6:30 Asti, ore 6:45 Moncalvo/);
assert.match(testo, /Iscrizioni entro domenica 10 gennaio/);
assert.match(testo, /#lathuile/);
assert.ok(testo.includes(SOCIAL.telefoni[0][1]), "mancano i telefoni");

// --- Campagna sponsor -------------------------------------------------------

const santero = {
  name: "958 Santero", level: "Main sponsor", url: "www.santero.it/bollicine?lang=it", handle: "@santero958",
  color_dark: "#432A09", color_light: "#F7F0E2", color_accent: "#E6AC34", alcohol: true,
};
const campagna = { kind: "sponsor", title: "Una stagione\nda brindare.", subtitle: "Gite, corsi e gare sociali.", cta: "Scopri" };

const url = new URL(indirizzoUtm(santero, campagna, "story", "2026/27"));
assert.strictEqual(url.hostname, "www.santero.it");
assert.strictEqual(url.searchParams.get("lang"), "it", "persi i parametri che l'indirizzo aveva già");
assert.strictEqual(url.searchParams.get("utm_source"), "instagram");
assert.strictEqual(url.searchParams.get("utm_medium"), "story");
assert.strictEqual(url.searchParams.get("utm_campaign"), "958santero-202627");
assert.strictEqual(url.searchParams.get("utm_content"), "unastagionedabrindare");
assert.strictEqual(indirizzoUtm({ ...santero, url: "" }, campagna, "post", "2026/27"), "");

const testoSponsor = testoPost(campagna, santero, "2026/27");
assert.match(testoSponsor, /^Una stagione da brindare\./);
assert.match(testoSponsor, /@santero958/);
assert.ok(testoSponsor.includes(SOCIAL.avvertenzaAlcol), "sponsor alcolico senza avvertenza");
assert.ok(!testoPost(campagna, { ...santero, alcohol: false }, "2026/27").includes(SOCIAL.avvertenzaAlcol),
  "avvertenza su uno sponsor non alcolico");

// --- Colori -----------------------------------------------------------------

assert.strictEqual(contrasto("#000000", "#FFFFFF").toFixed(1), "21.0");
assert.strictEqual(contrasto("#FFFFFF", "#000000").toFixed(1), "21.0");   // l'ordine non conta
assert.ok(contrasto(santero.color_light, santero.color_dark) > 4.5, "crema su marrone non si legge");
assert.strictEqual(schiarisci("#000000", .5), "#808080");

console.log("social: tutti i controlli passati");
