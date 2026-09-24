// Controllo dei pezzi dei post social che possono sbagliare in silenzio
// (web/social-templates.js): colore del giorno, prezzo facoltativo, testo del
// post, indirizzo con UTM, contrasto dei colori di uno sponsor.
//
//   node web/test-social.js

const assert = require("assert");
const { dataLunga, dataCorta, categoriaGita, categoria, impostaColoriGita, modelloPost,
        contrasto, schiarisci, indirizzoUtm, testoPost, SOCIAL } = require("./social-templates.js");

// --- Date e colore del giorno -----------------------------------------------

assert.strictEqual(dataLunga("2027-01-12"), "Martedì 12 gennaio");
assert.strictEqual(dataCorta("2027-01-09"), "09/01");
// Colori di partenza, prima che la pagina carichi trip_days.
assert.strictEqual(categoriaGita("2027-01-12"), "g2");    // martedì: rosso
assert.strictEqual(categoriaGita("2027-01-16"), "g6");    // sabato: blu
assert.strictEqual(categoriaGita("2027-01-17"), "g0");    // domenica: giallo
assert.strictEqual(categoriaGita("2027-01-15"), "gita");  // venerdì: blu del club
assert.strictEqual(categoriaGita(null), "gita");
assert.strictEqual(categoria("g2").c, "#B3261E");
assert.strictEqual(categoria("g2").day, "Mar");
assert.strictEqual(categoria("g2").ink, "#FFFFFF");          // bianco sul rosso
assert.strictEqual(categoria("g0").ink, "#06396A");       // blu scuro sul giallo
assert.strictEqual(categoria("g2").txt, "#B3261E");       // il rosso si legge già su bianco
assert.ok(contrasto(categoria("g0").txt, "#FFFFFF") >= 4.5, "il giallo dei prezzi non si legge su bianco");
assert.strictEqual(categoria("corso").c, "#147A45");      // gli altri tipi non cambiano

// Giorni cambiati dalla pagina: sabato giallo, domenica blu, venerdì verde, niente martedì.
impostaColoriGita({ 6: "#FCCF02", 0: "#084C8D", 5: "#147A45" });
assert.strictEqual(categoriaGita("2027-01-12"), "gita", "il martedì tolto colora ancora");
assert.strictEqual(categoriaGita("2027-01-15"), "g5");
assert.strictEqual(categoria(categoriaGita("2027-01-16")).c, "#FCCF02");
assert.strictEqual(categoria(categoriaGita("2027-01-17")).c, "#084C8D");
assert.strictEqual(modelloPost({ kind: "gita", event_date: "2027-01-15", title: "X" }, "post").cat, "g5");
impostaColoriGita({ 2: "#B3261E", 6: "#084C8D", 0: "#FCCF02" });

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
