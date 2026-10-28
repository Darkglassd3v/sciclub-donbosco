// Controllo dei pezzi dei post social che possono sbagliare in silenzio
// (web/social-templates.js): colore del giorno, prezzo facoltativo, testo del
// post, indirizzo con UTM, contrasto dei colori di uno sponsor, cosa manca a
// un post per essere pronto.
//
//   node web/test-social.js

const assert = require("assert");
const { dataLunga: longDate, dataCorta: shortDate, categoriaGita: tripCategory, categoria: categoryName, impostaColoriGita: setTripColors, impostaContatti: setContacts, contattiDi: contactsOf, modelloPost: postTemplate,
        contrasto: contrast, schiarisci: lighten, indirizzoUtm: utmAddress, testoPost: postText, mancanti: missingItems, nomePost, SOCIAL,
        disegnaPost: drawPost, disegnaCalendario: drawCalendar, misurePost: postSizes, evidenzia: highlight, coloreNuovo: newColor, giornoMese: dayOfMonth, posFoto: photoPos, zoomFoto: zoomPhoto,
        formatiCampagna: campaignFormats, disegnaCopertina: drawCover, photo, parametriInserzione: adUrlParams, LIMITI_META: META_LIMITS,
        INVITI_META: META_CTAS } = require("./social-templates.js");

// --- Date e colore del giorno -----------------------------------------------

assert.strictEqual(longDate("2027-01-12"), "Martedì 12 gennaio");
assert.strictEqual(shortDate("2027-01-09"), "09/01");
// Colori di partenza, prima che la pagina carichi trip_days.
assert.strictEqual(tripCategory("2027-01-12"), "g2");    // martedì: rosso
assert.strictEqual(tripCategory("2027-01-16"), "g6");    // sabato: blu
assert.strictEqual(tripCategory("2027-01-17"), "g0");    // domenica: giallo
assert.strictEqual(tripCategory("2027-01-15"), "gita");  // venerdì: blu del club
assert.strictEqual(tripCategory(null), "gita");
assert.strictEqual(categoryName("g2").c, "#B3261E");
assert.strictEqual(categoryName("g2").day, "Mar");
assert.strictEqual(categoryName("g2").ink, "#FFFFFF");          // bianco sul rosso
assert.strictEqual(categoryName("g0").ink, "#06396A");       // blu scuro sul giallo
assert.strictEqual(categoryName("g2").txt, "#B3261E");       // il rosso si legge già su bianco
assert.ok(contrast(categoryName("g0").txt, "#FFFFFF") >= 4.5, "il giallo dei prezzi non si legge su bianco");
assert.strictEqual(categoryName("corso").c, "#147A45");      // gli altri tipi non cambiano

// Giorni cambiati dalla pagina: sabato giallo, domenica blu, venerdì verde, niente martedì.
setTripColors({ 6: "#FCCF02", 0: "#084C8D", 5: "#147A45" });
assert.strictEqual(tripCategory("2027-01-12"), "gita", "il martedì tolto colora ancora");
assert.strictEqual(tripCategory("2027-01-15"), "g5");
assert.strictEqual(categoryName(tripCategory("2027-01-16")).c, "#FCCF02");
assert.strictEqual(categoryName(tripCategory("2027-01-17")).c, "#084C8D");
assert.strictEqual(postTemplate({ kind: "gita", event_date: "2027-01-15", title: "X" }, "post").cat, "g5");
setTripColors({ 2: "#B3261E", 6: "#084C8D", 0: "#FCCF02" });

// --- Prezzo facoltativo -----------------------------------------------------

const trip = {
  kind: "gita", event_date: "2027-01-12", title: "La Thuile",
  prices: [[null, "€ 52"]], show_price: true,
  stops: [["6:30", "Asti"], ["6:45", "Moncalvo"]], deadline: "2027-01-10", course: false,
};
assert.deepStrictEqual(postTemplate(trip, "post").prices, [[null, "€ 52"]]);
// La scadenza come la vuole chi pubblica: "giovedì 8/12", uguale nell'immagine e nel testo.
assert.strictEqual(postTemplate(trip, "post").deadline, "entro domenica 10/1");
assert.match(postText(trip), /Quota soci: € 52/);

const withoutPrice = { ...trip, show_price: false };
assert.deepStrictEqual(postTemplate(withoutPrice, "post").prices, [], "prezzo nascosto ma ancora nel disegno");
assert.doesNotMatch(postText(withoutPrice), /€/, "prezzo nascosto ma ancora nel testo del post");

// Una riga di prezzo lasciata vuota nel form non diventa una cifra vuota.
assert.deepStrictEqual(postTemplate({ ...trip, prices: [["Adulti", ""]] }, "post").prices, []);

// --- Testo del post ---------------------------------------------------------

const text = postText(trip);
assert.match(text, /^🚌 Martedì 12 gennaio: gita a La Thuile!/);
assert.match(text, /Partenze: ore 6:30 Asti, ore 6:45 Moncalvo/);
assert.match(text, /Iscrizioni entro domenica 10\/1\n/);
assert.match(text, /#lathuile/);
// Senza contatti il testo non ha la riga dei telefoni (vuota).
assert.doesNotMatch(text, /Info e iscrizioni/, "riga dei telefoni senza contatti");

// Ogni post ha i suoi contatti, scelti dalla rubrica: nome, telefono e, se
// ci sono, gli orari fra parentesi, nell'ordine del post.
setContacts([
  { id: "s", name: "Segreteria", phone: "011 123 4567", hours: "lun–ven 18–20", is_default: true },
  { id: "m", name: "Marco", phone: "333 765 4321", hours: null },
  { id: "x", name: "", phone: "347 000 0000" },  // riga a metà: non va nei post
]);
assert.strictEqual(SOCIAL.contatti.length, 2);
assert.doesNotMatch(postText(trip), /Info e iscrizioni/, "contatti della rubrica su un post che non li ha scelti");
assert.match(postText({ ...trip, contacts: ["m", "s"] }),
  /Info e iscrizioni: Marco 333 765 4321 · Segreteria 011 123 4567 \(lun–ven 18–20\)\n/);
assert.match(postText({ ...trip, contacts: ["m"] }), /Info e iscrizioni: Marco 333 765 4321\n/);
// Un contatto tolto dalla rubrica sparisce dal post, e uno a metà non c'entra.
assert.deepStrictEqual(contactsOf({ contacts: ["tolto", "x", "s"] }).map((c) => c.name), ["Segreteria"]);
assert.deepStrictEqual(postTemplate({ ...trip, contacts: ["s"] }, "post").contatti.map((c) => c.phone), ["011 123 4567"]);
setContacts([]);

// --- Campagna sponsor -------------------------------------------------------

const santero = {
  name: "958 Santero", level: "Main sponsor", url: "www.santero.it/bollicine?lang=it", handle: "@santero958",
  color_dark: "#432A09", color_light: "#F7F0E2", color_accent: "#E6AC34", alcohol: true,
};
const campaign = { kind: "sponsor", title: "Una stagione\nda brindare.", subtitle: "Gite, corsi e gare sociali.", cta: "Scopri" };

const url = new URL(utmAddress(santero, campaign, "story", "2026/27"));
assert.strictEqual(url.hostname, "www.santero.it");
assert.strictEqual(url.searchParams.get("lang"), "it", "persi i parametri che l'indirizzo aveva già");
assert.strictEqual(url.searchParams.get("utm_source"), "instagram");
assert.strictEqual(url.searchParams.get("utm_medium"), "story");
assert.strictEqual(url.searchParams.get("utm_campaign"), "958santero-202627");
assert.strictEqual(url.searchParams.get("utm_content"), "unastagionedabrindare");
assert.strictEqual(utmAddress({ ...santero, url: "" }, campaign, "post", "2026/27"), "");
// Un indirizzo dello sponsor scritto male («www.santero it») non deve rompere il
// testo del post (testoPost), né l'apertura dei post della campagna: niente link.
assert.doesNotThrow(() => utmAddress({ ...santero, url: "www.santero it" }, campaign, "post", "2026/27"));
assert.strictEqual(utmAddress({ ...santero, url: "www.santero it" }, campaign, "post", "2026/27"), "");

const sponsorText = postText(campaign, santero, "2026/27");
assert.match(sponsorText, /^Una stagione da brindare\./);
assert.match(sponsorText, /@santero958/);
assert.ok(sponsorText.includes(SOCIAL.avvertenzaAlcol), "sponsor alcolico senza avvertenza");
assert.ok(!postText(campaign, { ...santero, alcohol: false }, "2026/27").includes(SOCIAL.avvertenzaAlcol),
  "avvertenza su uno sponsor non alcolico");

// --- Pronto o da completare (elenco e testata del post) ---------------------

assert.deepStrictEqual(missingItems(trip), [], "gita completa segnata da completare");
assert.deepStrictEqual(missingItems({ ...trip, deadline: null, prices: [] }), [], "quota e scadenza della gita sono facoltative");
assert.deepStrictEqual(missingItems({ kind: "gita", title: " ", stops: [["", ""]], prices: [[null, ""]] }),
  ["la meta", "il giorno", "le partenze"]);
assert.deepStrictEqual(missingItems({ kind: "cena", title: "Cena sociale" }), ["la data"]);
assert.deepStrictEqual(missingItems({ kind: "corso", title: "Corso bambini" }), [], "il corso senza data non è un errore");
assert.deepStrictEqual(missingItems({ kind: "sponsor", title: "Brindiamo" }), ["lo sponsor"]);
assert.deepStrictEqual(missingItems({ kind: "sponsor", title: "Brindiamo", sponsor_id: "s1" }), []);
// Un post può essere fatto solo di sottotesto; senza né titolo né sottotesto manca qualcosa.
assert.deepStrictEqual(missingItems({ kind: "servizi", title: "", subtitle: "Palestra aperta il martedì" }), []);
assert.deepStrictEqual(missingItems({ kind: "servizi", title: " ", subtitle: "" }), ["il titolo o il sottotesto"]);
assert.deepStrictEqual(missingItems({ kind: "gita", title: "", subtitle: "x", event_date: "2027-01-10", stops: [["7", "Asti"]],
  prices: [[null, "40 €"]], deadline: "2027-01-05" }), ["la meta"], "la gita senza meta");
assert.strictEqual(nomePost({ title: "", subtitle: "Prima riga\nseconda" }), "Prima riga");
assert.strictEqual(nomePost({ title: "Cena\nsociale", subtitle: "x" }), "Cena");

// --- Colori -----------------------------------------------------------------

assert.strictEqual(contrast("#000000", "#FFFFFF").toFixed(1), "21.0");
assert.strictEqual(contrast("#FFFFFF", "#000000").toFixed(1), "21.0");   // l'ordine non conta
assert.ok(contrast(santero.color_light, santero.color_dark) > 4.5, "crema su marrone non si legge");
assert.strictEqual(lighten("#000000", .5), "#808080");

// --- Grafica dei post: la K, post e calendario 4:5 -----------------------------

assert.deepStrictEqual(postSizes(), { w: 1080, h: 1350 }, "il post non è 4:5");

// Un solo blu e un solo giallo: corsi gialli, eventi e calendario blu, le gite col colore del loro giorno.
assert.deepStrictEqual(newColor("corso"), { c: "#FCCF02", ink: "#084C8D" });
assert.deepStrictEqual(newColor("cena"), { c: "#084C8D", ink: "#FFFFFF" });
assert.deepStrictEqual(newColor("cal"), { c: "#084C8D", ink: "#FFFFFF" });
assert.deepStrictEqual(newColor("g0"), { c: "#FCCF02", ink: "#084C8D" });
assert.deepStrictEqual(newColor("g2"), { c: "#B3261E", ink: "#FFFFFF" });
assert.strictEqual(newColor("gita").c, "#084C8D", "gita in un giorno senza colore");

// Orari, prezzi e date scritti a mano finiscono in evidenza, il resto no.
assert.strictEqual(highlight("ore 20:00"), "<b>ore 20:00</b>");
assert.strictEqual(highlight("soci € 30 · bambini 15 €"), "soci <b>€ 30</b> · bambini <b>15 €</b>");
assert.strictEqual(highlight("entro mercoledì 7 aprile"), "entro <b>mercoledì 7 aprile</b>");
assert.strictEqual(highlight("fino al 13 gennaio, dal 14/01"), "fino al <b>13 gennaio</b>, dal <b>14/01</b>");
assert.strictEqual(highlight("Palestra Way Assauto, Asti"), "Palestra Way Assauto, Asti");
assert.strictEqual(highlight("<i>12.50 €</i>"), "&lt;i&gt;<b>12.50 €</b>&lt;/i&gt;", "il testo non è passato da escS");
// Evidenziato a mano (pulsante Evidenzia): fra asterischi, che spariscono; nel sottotesto niente automatico.
assert.strictEqual(highlight("Tutti i mercoledì *fino al 13 gennaio*"), "Tutti i mercoledì <b>fino al 13 gennaio</b>");
assert.strictEqual(highlight("dal 21 ottobre *fino al 13 gennaio*", false), "dal 21 ottobre <b>fino al 13 gennaio</b>");
assert.strictEqual(highlight("*<i>*"), "<b>&lt;i&gt;</b>", "il pezzo evidenziato non passa da escS");
assert.strictEqual(highlight("2 * 3 = 6"), "2 * 3 = 6", "un asterisco solo non è un'evidenza");
{
  const ev = { kind: "corso", title: "Presciistica", event_date: "2026-10-21", subtitle: "Ogni mercoledì\n*fino al 13 gennaio*",
    facts: [["Per chi", "*soci* tesserati"]] };
  assert.ok(!postText(ev).includes("*"), "asterischi nel testo da incollare");
  assert.match(postText(ev), /Ogni mercoledì\nfino al 13 gennaio/);
  // (il CSS ha i suoi asterischi, nei calc(): si cercano i segni attaccati alle parole)
  const signs = /\*(fino|soci)|(gennaio|soci)\*/;
  const html = drawPost(postTemplate(ev, "post"));
  assert.ok(html.includes("<b>fino al 13 gennaio</b>") && !signs.test(html), "evidenza del sottotesto");
}
assert.strictEqual(dayOfMonth("2027-01-14"), "giovedì 14 gennaio");
assert.strictEqual(dayOfMonth(null), "");
{
  setContacts([{ id: 1, name: "Marco", phone: "333 1" }]);
  const ev = { kind: "gita", title: "La Thuile", event_date: "2027-01-17", stops: [["ore 6:30", "Asti"]], prices: [[null, "€ 52"]],
    deadline: "2027-01-14", course: true, hook: " Tutti in pista! ", contacts: [1] };
  const m = postTemplate(ev, "post");
  assert.strictEqual(m.scadenza, "giovedì 14 gennaio");
  assert.strictEqual(m.hook, "Tutti in pista!");
  assert.strictEqual(m.iso, "2027-01-17");
  // Il corso nello stesso giorno: la coccarda verde, appesa alla tessera.
  for (const fmt of ["post", "story"]) {
    assert.ok(drawPost(postTemplate(ev, fmt)).includes('class="stella"'), `${fmt}: manca la coccarda del corso`);
    assert.ok(!drawPost(postTemplate({ ...ev, course: false }, fmt)).includes('class="stella"'), `${fmt}: coccarda senza corso`);
  }
  // K: il titolo è solo la meta (fino a due righe), la data nella tessera con la prima partenza, il testo che si adatta.
  for (const fmt of ["post", "story"]) {
    const html = drawPost(postTemplate(ev, fmt));
    assert.ok(!html.includes("<small>Gita a</small>") && html.includes(`<div class="tit meta" data-cede><div data-righe="2" data-due="${fmt === "story" ? 124 : 104}" style="--t:${fmt === "story" ? 168 : 150}px">La Thuile`), `k ${fmt}: titolo della gita`);
    assert.ok(html.includes('class="gancio">Tutti in pista!<'), `k ${fmt}: il gancio scritto`);
    assert.ok(drawPost(postTemplate({ ...ev, hook: "" }, fmt)).includes('class="gancio">Gita a<'), `k ${fmt}: senza gancio dice «Gita a»`);
    // Le partenze in riquadri, una per fermata, con l'ora; il titolo cede la riga vuota se serve.
    assert.strictEqual((html.match(/class="fermata"/g) || []).length, ev.stops.length, `k ${fmt}: un riquadro per partenza`);
    assert.ok(html.includes("<b>6:30</b>") && !html.includes("Partenze: "), `k ${fmt}: partenze ancora in riga`);
    assert.ok(html.includes('class="tit meta" data-cede'), `k ${fmt}: il titolo non cede lo spazio`);
    assert.ok(html.includes("data-adatta") && html.includes(">domenica<") && html.includes(">ore 6:30<") && !html.includes("ore ore"), `k ${fmt}: tessera o adattamento`);
    assert.ok(html.includes("sciclubdonboscoasti@gmail.com") && html.includes("333 1") && html.includes("giovedì 14 gennaio"), `k ${fmt}: iscrizioni, telefono o scadenza`);
    assert.ok(html.includes(`height:${fmt === "story" ? 1920 : 1350}px`) && html.includes(" senza-foto"), `k ${fmt}: misura o fondo senza foto`);
    assert.strictEqual(html.includes(" story"), fmt === "story");
  }
  // Il luogo dell'evento: una riga sua col segnaposto, una volta sola.
  const kEv = drawPost(postTemplate({ kind: "corso", title: "Presciistica", event_date: "2026-10-21", place: "Palestra Way Assauto, Asti" }, "story"));
  assert.ok(kEv.includes('<p class="dove"><svg') && (kEv.match(/Palestra Way Assauto/g) || []).length === 1, "k: il luogo dell'evento");
  const kPhoto = drawPost(postTemplate({ ...ev, photo: "https://x/foto.jpg" }, "post"));
  assert.ok(kPhoto.includes('class="foto" src="https://x/foto.jpg"') && kPhoto.includes("piano finestra") && !kPhoto.includes("senza-foto"), "k: la foto");
  assert.ok(!drawPost(postTemplate({ ...ev, hook: "", title: "Gita sociale a Pila" }, "post")).includes('class="gancio">Gita a<'), "k: «Gita a Gita»");
  // Un titolo con caratteri HTML resta testo.
  assert.ok(!drawPost(postTemplate({ ...ev, title: "<img src=x>" }, "post")).includes("<img src=x>"), "titolo non passato da escS");

  // Evento: l'Orario va nella tessera, il luogo nella riga col segnaposto, le Iscrizioni in fondo.
  const dinner = { kind: "cena", title: "Cena di fine stagione", event_date: "2027-04-10", prices: [["soci", "€ 30"]],
    facts: [["Orario", "ore 20:00"], ["Dove", "Salone dell'oratorio"], ["Iscrizioni", "entro mercoledì 7 aprile"]] };
  const k = drawPost(postTemplate(dinner, "post"));
  assert.ok(k.includes('<em data-fit style="font-size:58px">ore 20:00</em>') && (k.match(/20:00/g) || []).length === 1, "l'orario ripetuto fuori dalla tessera");
  assert.ok(k.includes("<span>Salone dell'oratorio</span></p>") && k.includes("<p>Iscrizioni entro <b>mercoledì 7 aprile</b></p>"));
  // Senza data: niente tessera, e l'informazione resta fra i dati.
  const courseItem = postTemplate({ kind: "corso", title: "Corso bambini", facts: [["Età", "5–12 anni"]] }, "post");
  assert.ok(!drawPost(courseItem).includes('class="tessera"') && drawPost(courseItem).includes("<p>Età: 5–12 anni</p>"));
  // Un post di solo sottotesto prende il nome del tipo come titolo.
  assert.ok(drawPost(postTemplate({ kind: "servizi", title: "", subtitle: "Negozio aperto" }, "post")).includes(">Servizi</div>"));

  // Calendario del mese: la tessera col mese e quante gite, il giorno corto, il corso.
  const rows = [["g0", "10/01", "Prato Nevoso", true], ["g6", "16/01", "Sestriere", false]];
  const cal = drawCalendar("Calendario di gennaio", rows, "2027-01");
  assert.ok(cal.includes('font-size:54px">gennaio</span><b>2</b>') && cal.includes(">Dom 10<") && cal.includes('class="corso">corso<')
    && cal.includes("height:1350px"));
  // Il calendario anche in story.
  assert.ok(drawCalendar("Gennaio", rows, "2027-01", true).includes("height:1920px"), "manca la story del calendario");
  // La tessera della gita prende il colore del giorno: il sabato blu con le scritte bianche, la domenica resta gialla.
  const card = (iso) => drawPost(postTemplate({ ...trip, event_date: iso }, "post")).match(/<div class="tessera"[^>]*>/)[0];
  assert.ok(card("2027-01-16").includes("background:#084C8D;color:#FFFFFF;--em:#FCCF02"), "tessera del sabato");
  assert.ok(card("2027-01-19").includes("background:#B3261E"), "tessera del martedì");
  assert.strictEqual(card("2027-01-17"), '<div class="tessera">', "tessera della domenica");
  // Ora, luogo e scadenza di un evento hanno un campo loro e diventano le informazioni che le grafiche conoscono.
  const preski = { kind: "corso", title: "Ginnastica presciistica", event_date: "2026-10-21", event_time: "ore 19:30",
    place: "Palestra Way Assauto, Asti", deadline: "2026-10-19",
    facts: [["Orario", "19:00"], ["Dove", "vecchio"], ["Quando", "ogni mercoledì"], ["Iscrizioni", "in negozio"]] };
  assert.deepStrictEqual(postTemplate(preski, "post").facts, [["Orario", "ore 19:30"], ["Dove", "Palestra Way Assauto, Asti"],
    ["Quando", "ogni mercoledì"], ["Iscrizioni", "entro lunedì 19 ottobre"]], "campi nuovi o doppioni delle informazioni scritte a mano");
  assert.deepStrictEqual(postTemplate({ ...preski, event_time: "", place: null, deadline: null }, "post").facts, preski.facts,
    "senza i campi nuovi le informazioni scritte a mano devono restare tutte");
  assert.deepStrictEqual(postTemplate({ ...preski, event_time: "dalle 18 alle 20" }, "post").facts[0], ["Orario", "dalle 18 alle 20"]);
  assert.match(postText(preski), /Orario: ore 19:30\nDove: Palestra Way Assauto, Asti\nQuando: ogni mercoledì\nIscrizioni: entro lunedì 19 ottobre/);
  assert.ok(drawPost(postTemplate(preski, "post")).includes('<em data-fit style="font-size:58px">ore 19:30</em>'), "l'ora nella tessera");
  // I telefoni stanno in una riga sola (un elemento), e la frase dice che si può anche telefonare.
  setContacts([{ id: 3, name: "Cesare", phone: "3485171707" }, { id: 4, name: "Irene", phone: "3487324789" }]);
  const html = drawPost(postTemplate({ ...preski, contacts: [3, 4] }, "post"));
  assert.strictEqual((html.match(/class="tel"/g) || []).length, 1, "un telefono per riga");
  assert.ok(html.includes("Iscrizioni in negozio, via mail o al telefono") && html.includes("<b>3487324789</b>"));
  assert.ok(drawPost(postTemplate(preski, "post")).includes("Iscrizioni in negozio o via mail"));
  setContacts([]);
}

// L'ordine dei campi del form in social.html: salvare un post con un ordine
// mancante dava "Cannot read properties of undefined (reading 'gita')".
{
  const page = require("fs").readFileSync(require("path").join(__dirname, "social.html"), "utf8");
  const read = (nome) => (0, eval)(`(${page.match(new RegExp(`const ${nome} = (\\{[^\\n]*\\}|\\{[\\s\\S]*?\\n  \\});`))[1]})`);
  const order = read("FIELD_ORDER");
  for (const g of ["gita", "evento"]) assert.ok(Array.isArray(order[g]), `manca ORDINE_CAMPI.${g}`);
  // Ogni nome dell'ordine è un campo del form: sortFields() lo cerca per
  // data-campo, e uno che non c'è finirebbe nel form come la scritta "null".
  const fields = new Set([...page.matchAll(/data-campo="([A-Za-z]+)"/g)].map((m) => m[1]));
  const sponsor = (0, eval)(page.match(/const SPONSOR_ORDER = (\[[^\]]*\]);/)[1]);
  for (const [dove, list] of [...Object.entries(order), ["ORDINE_SPONSOR", sponsor]]) {
    for (const nome of list) assert.ok(fields.has(nome), `${dove}: "${nome}" non è un data-campo di social.html`);
  }
}

// --- Classi che la pagina (Bulma) ha già: nel post prenderebbero colori e margini di Bulma ---
{
  const ev = { kind: "gita", title: "La Thuile", event_date: "2026-10-03", stops: [["06:40", "Asti"], ["06:20", "Nizza Monferrato"]],
    deadline: "2026-10-23", course: true, contacts: [] };
  for (const fmt of ["post", "story"]) {
    const classes = [...drawPost(postTemplate(ev, fmt)).matchAll(/class="([^"]+)"/g)].flatMap((m) => m[1].split(/\s+/));
    for (const c of ["box", "tag", "title", "button", "card", "content", "notification", "column", "columns", "media", "level"])
      assert.ok(!classes.includes(c), `${fmt}: la classe "${c}" è anche di Bulma`);
  }
}


// --- Foto spostata (photo_x, photo_y) ---------------------------------------

assert.strictEqual(photoPos({}), "50% 45%", "senza posizione la foto deve restare dov'era");
assert.strictEqual(photoPos({ photo_x: null, photo_y: "" }), "50% 45%");
assert.strictEqual(photoPos({ photo_x: 0, photo_y: 100 }), "0% 100%", "lo zero è una posizione, non «vuoto»");
assert.strictEqual(photoPos({ photo_x: 150, photo_y: -3 }), "100% 0%");
assert.strictEqual(photoPos({ photo_x: "20;color:red", photo_y: 12.6 }), "50% 13%", "nello style solo numeri");
assert.strictEqual(zoomPhoto({}), 1);
assert.strictEqual(zoomPhoto({ photo_zoom: 130 }), 1.3);
assert.strictEqual(zoomPhoto({ photo_zoom: 50 }), 1, "la foto non deve mai essere più piccola del riquadro");
assert.strictEqual(zoomPhoto({ photo_zoom: 999 }), 3);
{
  const html = drawPost(postTemplate({ kind: "gita", title: "Pila", event_date: "2027-01-17", photo: "data:image/jpeg;base64,AA", photo_x: 10, photo_y: 80 }, "post"));
  assert.ok(html.includes("--pos:10% 80%"), "la posizione non arriva al post");
  assert.ok(html.includes("--zoom:1"), "senza ingrandimento la foto deve restare 1");
  const trip = { kind: "gita", title: "Pila", event_date: "2027-01-17", stops: [["7:00", "Asti"], ["6:45", "Montegrosso"]] };
  const withNote = drawPost(postTemplate({ ...trip, subtitle: "Prova *gratuita* <b>maestri</b>" }, "post"));
  assert.ok(withNote.includes('<p class="nota">Prova gratuita &lt;b&gt;maestri&lt;/b&gt;</p>'), "la nota gialla della gita manca o non è escapata");
  assert.ok(!drawPost(postTemplate(trip, "post")).includes('class="nota"'), "senza nota niente riga gialla");
  assert.ok(postText({ ...trip, subtitle: "Prova gratuita" }, null, "2026/27").includes("Prova gratuita"), "la nota manca nel testo del post");
  const ugly = drawPost(postTemplate({ ...trip, photo: "data:image/gif;base64,AA\f);outline:77px solid red;--k:" }, "post"));
  const stile = (ugly.match(/--immagine:url\(&quot;(.*?)&quot;\)/) || [])[1] || "";
  // Dentro url("…") la stringa CSS si chiude solo con " \ e gli a capo (\n \r \f): nessuno deve restare.
  assert.ok(stile.includes("%0C") && !/["\\\n\r\f]|&quot;/.test(stile), "la foto esce dall'url() del CSS");
  assert.ok(drawPost(postTemplate(trip, "post")).includes("ore 7:00"), "senza scelta va sotto la data la prima partenza");
  assert.ok(drawPost(postTemplate({ ...trip, card_stop: "Montegrosso" }, "post")).includes("ore 6:45"), "la partenza scelta non va sotto la data");
  assert.ok(drawPost(postTemplate({ ...trip, card_stop: "Altrove" }, "post")).includes("ore 7:00"), "un luogo tolto deve tornare alla prima");
  assert.ok(drawPost(postTemplate({ kind: "gita", title: "Pila", event_date: "2027-01-17", photo: "data:image/jpeg;base64,AA", photo_zoom: 150 }, "post")).includes("--zoom:1.5"));
  assert.ok(!drawPost(postTemplate({ kind: "gita", title: "Pila", event_date: "2027-01-17", photo_x: 10 }, "post")).includes("--pos"), "senza foto niente posizione");
}


// --- Formati della campagna sponsor e copertina -------------------------------
// Nome, livello, logo e testi li scrive a mano chi gestisce gli sponsor: nei disegni
// devono restare testo, mai HTML (le anteprime vanno in pagina con innerHTML).

{
  const bad = { ...santero, name: '<img src=x onerror=alert(1)>', level: 'Main "x"', logo: '" onerror="alert(1)', logo_dark: null };
  const c = { kind: "sponsor", title: "Riga 1\n<b>Riga 2</b>", subtitle: "<script>x</script>", cta: "<i>Vai</i>", story_title: null };
  const f = campaignFormats(c, bad, "2026/27");
  assert.deepStrictEqual(Object.keys(f), ["collab", "story", "grazie", "cover"]);
  assert.deepStrictEqual(Object.values(f).map(({ w, h }) => `${w}×${h}`), ["1080×1350", "1080×1920", "1080×1080", "820×312"]);
  for (const [k, { html, nome, breve: short }] of Object.entries(f)) {
    assert.ok(nome && short, `${k}: manca il nome del formato`);
    assert.ok(html.includes(`width:${f[k].w}px;height:${f[k].h}px`), `${k}: la tela non ha la sua misura`);
    assert.ok(!/<script|<img src=x|onerror="|<b>|<i>/.test(html), `${k}: un testo dello sponsor è diventato HTML`);
    assert.ok(html.includes(SOCIAL.avvertenzaAlcol), `${k}: sponsor alcolico senza avvertenza`);
  }
  // Il titolo va a capo riga per riga; nella story l'ultima riga ha il colore d'accento.
  assert.ok(f.collab.html.includes("Riga 1<br>&lt;b&gt;Riga 2&lt;/b&gt;"));
  assert.ok(f.story.html.includes(`Riga 1<br><span style="color:${santero.color_accent}">&lt;b&gt;Riga 2&lt;/b&gt;</span>`));
  assert.ok(f.collab.html.includes("&lt;i&gt;Vai&lt;/i&gt;"), "il pulsante della campagna manca");
  assert.ok(f.story.html.includes("Main &quot;x&quot;".toLowerCase()), "il livello dello sponsor non è nella story");
  // Senza logo per fondi scuri, quello normale su un riquadro chiaro; senza logo, il nome.
  assert.ok(f.story.html.includes(`background:${santero.color_light}`) && f.story.html.includes('src="&quot; onerror=&quot;alert(1)"'));
  const withDark = campaignFormats(c, { ...santero, logo: "a.png", logo_dark: "b.png" }, "2026/27");
  assert.ok(withDark.story.html.includes('src="b.png"') && withDark.collab.html.includes('src="a.png"'));
  const withoutLogo = campaignFormats({ ...c, cta: "" }, { ...santero, logo: null, alcohol: false }, "2026/27");
  assert.ok(withoutLogo.cover.html.includes("958 Santero"), "senza logo deve comparire il nome");
  assert.ok(!withoutLogo.collab.html.includes("padding:.45em 1.1em"), "pulsante della campagna senza testo");
  for (const { html } of Object.values(withoutLogo)) assert.ok(!html.includes(SOCIAL.avvertenzaAlcol), "avvertenza su uno sponsor non alcolico");
  assert.ok(campaignFormats({ ...c, story_title: "Solo story" }, santero, "2026/27").story.html.includes("Solo story"));
}
{
  const cop = drawCover("<b>Stagione</b>", "Gite & corsi");
  assert.ok(cop.includes("width:820px;height:312px"));
  assert.ok(cop.includes("&lt;b&gt;Stagione&lt;/b&gt;") && cop.includes("Gite &amp; corsi"), "titolo della copertina non escapato");
  assert.ok(cop.includes("<svg"), "senza foto la copertina deve avere il paesaggio disegnato");
  assert.ok(photo(10, 20, 'x" onerror="y').includes('src="x&quot; onerror=&quot;y"'), "la foto esce dall'attributo src");
}


// --- Meta della gita su due righe ---------------------------------------------
// Una meta lunga va a capo invece di rimpicciolirsi; gli a capo scritti contano, al massimo due righe.
// Fuori dal titolo del post (calendario, testo, nome nell'elenco) l'a capo diventa uno spazio.

{
  const trip = { kind: "gita", event_date: "2027-01-17", stops: [["7:00", "Asti"]] };
  const titleText = (title, fmt = "post") => (drawPost(postTemplate({ ...trip, title }, fmt)).match(/<div class="tit meta"[^>]*>([\s\S]*?)<\/div><\/div>/) || [])[1] || "";
  assert.ok(titleText("Cervinia\nValtournenche").includes('data-righe="2"'), "la meta deve poter andare su due righe");
  assert.ok(titleText("Cervinia\nValtournenche").includes("Cervinia<br>Valtournenche"), "l'a capo scritto nella meta si perde");
  assert.ok(titleText("Cervinia\nValtournenche").includes("--t:104px") && titleText("Cervinia\nValtournenche", "story").includes("--t:124px"),
    "su due righe la meta deve scendere a 104 (124 nella story)");
  assert.ok(titleText("La Thuile").includes("--t:150px") && titleText("La Thuile", "story").includes("--t:168px"), "su una riga la meta resta grande");
  assert.ok(titleText("Cervinia\r\n\n  Valtournenche \n\nZermatt").includes("Cervinia<br>Valtournenche Zermatt"), "più di due righe: le altre vanno sulla seconda");
  assert.ok(titleText("La Thuile").endsWith(">La Thuile"), "una meta corta resta su una riga");
  assert.ok(!titleText("La Thuile").includes("<br>"));
  assert.ok(titleText("<b>X</b>\nY").includes("&lt;b&gt;X&lt;/b&gt;<br>Y"), "la meta deve restare testo");
  assert.ok(postText({ ...trip, title: "Cervinia\nValtournenche" }, null, "2026/27").includes("gita a Cervinia Valtournenche!"), "a capo nel testo del post");
  assert.strictEqual(nomePost({ ...trip, title: "Cervinia\nValtournenche" }), "Cervinia Valtournenche");
  const cal = drawCalendar("Calendario", [["g0", "17/01", "Cervinia\nValtournenche", false]], "2027-01");
  assert.ok(cal.includes("Cervinia Valtournenche") && !/Cervinia\s*<br>/.test(cal), "a capo nel calendario del mese");
}

// --- Campagne con l'immagine dello sponsor e inserzioni Meta ---------------
// L'immagine data dallo sponsor (es. l'auto nuova) va nei post intera: mai
// tagliata (object-fit: contain), con firma del club e logo dello sponsor.
// I formati: feed 4:5, story 9:16 e quadrato 1:1 per le inserzioni.

{
  const photoSrc = "data:image/jpeg;base64,AAAA";
  const f = campaignFormats({ ...campaign, photo: photoSrc }, { ...santero, logo: "a.png" }, "2026/27");
  assert.deepStrictEqual(Object.keys(f), ["foto", "fotoStory", "fotoQuadrata"], "con l'immagine dello sponsor, i suoi tre formati");
  assert.deepStrictEqual(Object.values(f).map(({ w, h }) => `${w}×${h}`), ["1080×1350", "1080×1920", "1080×1080"]);
  for (const [k, { html, nome, breve: short }] of Object.entries(f)) {
    assert.ok(nome && short, `${k}: manca il nome del formato`);
    assert.ok(html.includes(`width:${f[k].w}px;height:${f[k].h}px`), `${k}: la tela non ha la sua misura`);
    assert.ok(html.includes(`src="${photoSrc}"`), `${k}: manca l'immagine dello sponsor`);
    assert.ok(/class="foto-sponsor"[^>]*object-fit:contain/.test(html), `${k}: l'immagine dello sponsor deve restare intera`);
    assert.ok(html.includes(SOCIAL.logo) && html.includes('src="a.png"'), `${k}: mancano il logo del club o quello dello sponsor`);
    assert.ok(html.includes(SOCIAL.avvertenzaAlcol), `${k}: sponsor alcolico senza avvertenza`);
  }
  // Il testo del post (sottotesto) c'è nel post e nella story, come nel post Collab; resta testo.
  assert.ok(f.foto.html.includes("Gite, corsi e gare sociali.") && f.fotoStory.html.includes("Gite, corsi e gare sociali."),
    "il testo del post non compare nelle grafiche con l'immagine");
  assert.ok(!campaignFormats({ ...campaign, subtitle: "<b>x</b>", photo: photoSrc }, santero, "2026/27").foto.html.includes("<b>x</b>"),
    "il testo del post è diventato HTML");
  const bad = campaignFormats({ ...campaign, photo: 'x" onerror="alert(1)' }, santero, "2026/27");
  for (const { html } of Object.values(bad)) assert.ok(!html.includes('onerror="'), "l'immagine dello sponsor è diventata HTML");
  // Un titolo troppo lungo stringe e, se non basta, fa comparire l'avviso (fit(), data-righe).
  assert.ok(/data-righe="3"[^>]*>La nuova|data-righe="3"/.test(f.foto.html) && /data-righe="2"/.test(f.fotoStory.html),
    "i titoli delle grafiche con l'immagine non si adattano allo spazio");
  // Senza immagine restano i formati col logo.
  assert.deepStrictEqual(Object.keys(campaignFormats(campaign, santero, "2026/27")), ["collab", "story", "grazie", "cover"]);
}

// Le campagne sono pubblicità: il testo lo dichiara (#adv), quello delle gite no.
assert.match(postText(campaign, santero, "2026/27"), /#adv\b/);
assert.ok(!postText({ kind: "gita", title: "Sestriere", event_date: "2027-01-17" }, null, "2026/27").includes("#adv"));

// Inserzione Meta: i parametri da incollare in Gestione inserzioni («Parametri URL»).
// {{site_source_name}} lo riempie Meta (fb, ig, ...): resta scritto così, non codificato.
assert.strictEqual(adUrlParams(santero, campaign, "2026/27"),
  "utm_source={{site_source_name}}&utm_medium=paid_social&utm_campaign=958santero-202627&utm_content=unastagionedabrindare");
assert.deepStrictEqual(META_LIMITS, { ad_text: 125, ad_headline: 40, ad_description: 30 });
assert.ok(META_CTAS.includes("Scopri di più"));

console.log("social: tutti i controlli passati");
