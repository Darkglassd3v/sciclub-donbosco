// Controllo dei pezzi dei post social che possono sbagliare in silenzio
// (web/social-templates.js): colore del giorno, prezzo facoltativo, testo del
// post, indirizzo con UTM, contrasto dei colori di uno sponsor, cosa manca a
// un post per essere pronto.
//
//   node web/test-social.js

const assert = require("assert");
const { dataLunga, dataCorta, categoriaGita, categoria, impostaColoriGita, impostaContatti, contattiDi, modelloPost,
        contrasto, schiarisci, indirizzoUtm, testoPost, mancanti, SOCIAL } = require("./social-templates.js");

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
// Senza contatti il testo non ha la riga dei telefoni (vuota).
assert.doesNotMatch(testo, /Info e iscrizioni/, "riga dei telefoni senza contatti");

// Ogni post ha i suoi contatti, scelti dalla rubrica: nome, telefono e, se
// ci sono, gli orari fra parentesi, nell'ordine del post.
impostaContatti([
  { id: "s", name: "Segreteria", phone: "011 123 4567", hours: "lun–ven 18–20", is_default: true },
  { id: "m", name: "Marco", phone: "333 765 4321", hours: null },
  { id: "x", name: "", phone: "347 000 0000" },  // riga a metà: non va nei post
]);
assert.strictEqual(SOCIAL.contatti.length, 2);
assert.doesNotMatch(testoPost(gita), /Info e iscrizioni/, "contatti della rubrica su un post che non li ha scelti");
assert.match(testoPost({ ...gita, contacts: ["m", "s"] }),
  /Info e iscrizioni: Marco 333 765 4321 · Segreteria 011 123 4567 \(lun–ven 18–20\)\n/);
assert.match(testoPost({ ...gita, contacts: ["m"] }), /Info e iscrizioni: Marco 333 765 4321\n/);
// Un contatto tolto dalla rubrica sparisce dal post, e uno a metà non c'entra.
assert.deepStrictEqual(contattiDi({ contacts: ["tolto", "x", "s"] }).map((c) => c.name), ["Segreteria"]);
assert.deepStrictEqual(modelloPost({ ...gita, contacts: ["s"] }, "post").contatti.map((c) => c.phone), ["011 123 4567"]);
impostaContatti([]);

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

// --- Pronto o da completare (elenco e testata del post) ---------------------

assert.deepStrictEqual(mancanti(gita), [], "gita completa segnata da completare");
assert.deepStrictEqual(mancanti({ ...gita, deadline: null }), ["la scadenza delle iscrizioni"]);
assert.deepStrictEqual(mancanti({ kind: "gita", title: " ", stops: [["", ""]], prices: [[null, ""]] }),
  ["la meta", "il giorno", "le partenze", "la quota", "la scadenza delle iscrizioni"]);
assert.deepStrictEqual(mancanti({ ...senzaPrezzo, prices: [] }), [], "quota chiesta anche se nascosta");
assert.deepStrictEqual(mancanti({ kind: "cena", title: "Cena sociale" }), ["la data"]);
assert.deepStrictEqual(mancanti({ kind: "corso", title: "Corso bambini" }), [], "il corso senza data non è un errore");
assert.deepStrictEqual(mancanti({ kind: "sponsor", title: "Brindiamo" }), ["lo sponsor"]);
assert.deepStrictEqual(mancanti({ kind: "sponsor", title: "Brindiamo", sponsor_id: "s1" }), []);

// --- Colori -----------------------------------------------------------------

assert.strictEqual(contrasto("#000000", "#FFFFFF").toFixed(1), "21.0");
assert.strictEqual(contrasto("#FFFFFF", "#000000").toFixed(1), "21.0");   // l'ordine non conta
assert.ok(contrasto(santero.color_light, santero.color_dark) > 4.5, "crema su marrone non si legge");
assert.strictEqual(schiarisci("#000000", .5), "#808080");

console.log("social: tutti i controlli passati");
