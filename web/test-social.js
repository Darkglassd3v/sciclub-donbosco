// Controllo dei pezzi dei post social che possono sbagliare in silenzio
// (web/social-templates.js): colore del giorno, prezzo facoltativo, testo del
// post, indirizzo con UTM, contrasto dei colori di uno sponsor, cosa manca a
// un post per essere pronto.
//
//   node web/test-social.js

const assert = require("assert");
const { dataLunga, dataCorta, categoriaGita, categoria, impostaColoriGita, impostaContatti, contattiDi, modelloPost,
        contrasto, schiarisci, indirizzoUtm, testoPost, mancanti, nomePost, SOCIAL,
        disegnaPost, disegnaCalendario, misurePost, evidenzia, coloreNuovo, giornoMese, posFoto, zoomFoto,
        formatiCampagna, disegnaCopertina, photo } = require("./social-templates.js");

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
// La scadenza come la vuole chi pubblica: "giovedì 8/12", uguale nell'immagine e nel testo.
assert.strictEqual(modelloPost(gita, "post").deadline, "entro domenica 10/1");
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
assert.match(testo, /Iscrizioni entro domenica 10\/1\n/);
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
assert.deepStrictEqual(mancanti({ ...gita, deadline: null, prices: [] }), [], "quota e scadenza della gita sono facoltative");
assert.deepStrictEqual(mancanti({ kind: "gita", title: " ", stops: [["", ""]], prices: [[null, ""]] }),
  ["la meta", "il giorno", "le partenze"]);
assert.deepStrictEqual(mancanti({ kind: "cena", title: "Cena sociale" }), ["la data"]);
assert.deepStrictEqual(mancanti({ kind: "corso", title: "Corso bambini" }), [], "il corso senza data non è un errore");
assert.deepStrictEqual(mancanti({ kind: "sponsor", title: "Brindiamo" }), ["lo sponsor"]);
assert.deepStrictEqual(mancanti({ kind: "sponsor", title: "Brindiamo", sponsor_id: "s1" }), []);
// Un post può essere fatto solo di sottotesto; senza né titolo né sottotesto manca qualcosa.
assert.deepStrictEqual(mancanti({ kind: "servizi", title: "", subtitle: "Palestra aperta il martedì" }), []);
assert.deepStrictEqual(mancanti({ kind: "servizi", title: " ", subtitle: "" }), ["il titolo o il sottotesto"]);
assert.deepStrictEqual(mancanti({ kind: "gita", title: "", subtitle: "x", event_date: "2027-01-10", stops: [["7", "Asti"]],
  prices: [[null, "40 €"]], deadline: "2027-01-05" }), ["la meta"], "la gita senza meta");
assert.strictEqual(nomePost({ title: "", subtitle: "Prima riga\nseconda" }), "Prima riga");
assert.strictEqual(nomePost({ title: "Cena\nsociale", subtitle: "x" }), "Cena");

// --- Colori -----------------------------------------------------------------

assert.strictEqual(contrasto("#000000", "#FFFFFF").toFixed(1), "21.0");
assert.strictEqual(contrasto("#FFFFFF", "#000000").toFixed(1), "21.0");   // l'ordine non conta
assert.ok(contrasto(santero.color_light, santero.color_dark) > 4.5, "crema su marrone non si legge");
assert.strictEqual(schiarisci("#000000", .5), "#808080");

// --- Grafica dei post: la K, post e calendario 4:5 -----------------------------

assert.deepStrictEqual(misurePost(), { w: 1080, h: 1350 }, "il post non è 4:5");

// Un solo blu e un solo giallo: corsi gialli, eventi e calendario blu, le gite col colore del loro giorno.
assert.deepStrictEqual(coloreNuovo("corso"), { c: "#FCCF02", ink: "#084C8D" });
assert.deepStrictEqual(coloreNuovo("cena"), { c: "#084C8D", ink: "#FFFFFF" });
assert.deepStrictEqual(coloreNuovo("cal"), { c: "#084C8D", ink: "#FFFFFF" });
assert.deepStrictEqual(coloreNuovo("g0"), { c: "#FCCF02", ink: "#084C8D" });
assert.deepStrictEqual(coloreNuovo("g2"), { c: "#B3261E", ink: "#FFFFFF" });
assert.strictEqual(coloreNuovo("gita").c, "#084C8D", "gita in un giorno senza colore");

// Orari, prezzi e date scritti a mano finiscono in evidenza, il resto no.
assert.strictEqual(evidenzia("ore 20:00"), "<b>ore 20:00</b>");
assert.strictEqual(evidenzia("soci € 30 · bambini 15 €"), "soci <b>€ 30</b> · bambini <b>15 €</b>");
assert.strictEqual(evidenzia("entro mercoledì 7 aprile"), "entro <b>mercoledì 7 aprile</b>");
assert.strictEqual(evidenzia("fino al 13 gennaio, dal 14/01"), "fino al <b>13 gennaio</b>, dal <b>14/01</b>");
assert.strictEqual(evidenzia("Palestra Way Assauto, Asti"), "Palestra Way Assauto, Asti");
assert.strictEqual(evidenzia("<i>12.50 €</i>"), "&lt;i&gt;<b>12.50 €</b>&lt;/i&gt;", "il testo non è passato da escS");
// Evidenziato a mano (pulsante Evidenzia): fra asterischi, che spariscono; nel sottotesto niente automatico.
assert.strictEqual(evidenzia("Tutti i mercoledì *fino al 13 gennaio*"), "Tutti i mercoledì <b>fino al 13 gennaio</b>");
assert.strictEqual(evidenzia("dal 21 ottobre *fino al 13 gennaio*", false), "dal 21 ottobre <b>fino al 13 gennaio</b>");
assert.strictEqual(evidenzia("*<i>*"), "<b>&lt;i&gt;</b>", "il pezzo evidenziato non passa da escS");
assert.strictEqual(evidenzia("2 * 3 = 6"), "2 * 3 = 6", "un asterisco solo non è un'evidenza");
{
  const ev = { kind: "corso", title: "Presciistica", event_date: "2026-10-21", subtitle: "Ogni mercoledì\n*fino al 13 gennaio*",
    facts: [["Per chi", "*soci* tesserati"]] };
  assert.ok(!testoPost(ev).includes("*"), "asterischi nel testo da incollare");
  assert.match(testoPost(ev), /Ogni mercoledì\nfino al 13 gennaio/);
  // (il CSS ha i suoi asterischi, nei calc(): si cercano i segni attaccati alle parole)
  const segni = /\*(fino|soci)|(gennaio|soci)\*/;
  const html = disegnaPost(modelloPost(ev, "post"));
  assert.ok(html.includes("<b>fino al 13 gennaio</b>") && !segni.test(html), "evidenza del sottotesto");
}
assert.strictEqual(giornoMese("2027-01-14"), "giovedì 14 gennaio");
assert.strictEqual(giornoMese(null), "");
{
  impostaContatti([{ id: 1, name: "Marco", phone: "333 1" }]);
  const ev = { kind: "gita", title: "La Thuile", event_date: "2027-01-17", stops: [["ore 6:30", "Asti"]], prices: [[null, "€ 52"]],
    deadline: "2027-01-14", course: true, hook: " Tutti in pista! ", contacts: [1] };
  const m = modelloPost(ev, "post");
  assert.strictEqual(m.scadenza, "giovedì 14 gennaio");
  assert.strictEqual(m.hook, "Tutti in pista!");
  assert.strictEqual(m.iso, "2027-01-17");
  // Il corso nello stesso giorno: la coccarda verde, appesa alla tessera.
  for (const fmt of ["post", "story"]) {
    assert.ok(disegnaPost(modelloPost(ev, fmt)).includes('class="stella"'), `${fmt}: manca la coccarda del corso`);
    assert.ok(!disegnaPost(modelloPost({ ...ev, course: false }, fmt)).includes('class="stella"'), `${fmt}: coccarda senza corso`);
  }
  // K: il titolo è solo la meta (fino a due righe), la data nella tessera con la prima partenza, il testo che si adatta.
  for (const fmt of ["post", "story"]) {
    const html = disegnaPost(modelloPost(ev, fmt));
    assert.ok(!html.includes("<small>Gita a</small>") && html.includes(`<div class="tit meta" data-cede><div data-righe="2" data-due="${fmt === "story" ? 124 : 104}" style="--t:${fmt === "story" ? 168 : 150}px">La Thuile`), `k ${fmt}: titolo della gita`);
    assert.ok(html.includes('class="gancio">Tutti in pista!<'), `k ${fmt}: il gancio scritto`);
    assert.ok(disegnaPost(modelloPost({ ...ev, hook: "" }, fmt)).includes('class="gancio">Gita a<'), `k ${fmt}: senza gancio dice «Gita a»`);
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
  const kEv = disegnaPost(modelloPost({ kind: "corso", title: "Presciistica", event_date: "2026-10-21", place: "Palestra Way Assauto, Asti" }, "story"));
  assert.ok(kEv.includes('<p class="dove"><svg') && (kEv.match(/Palestra Way Assauto/g) || []).length === 1, "k: il luogo dell'evento");
  const kFoto = disegnaPost(modelloPost({ ...ev, photo: "https://x/foto.jpg" }, "post"));
  assert.ok(kFoto.includes('class="foto" src="https://x/foto.jpg"') && kFoto.includes("piano finestra") && !kFoto.includes("senza-foto"), "k: la foto");
  assert.ok(!disegnaPost(modelloPost({ ...ev, hook: "", title: "Gita sociale a Pila" }, "post")).includes('class="gancio">Gita a<'), "k: «Gita a Gita»");
  // Un titolo con caratteri HTML resta testo.
  assert.ok(!disegnaPost(modelloPost({ ...ev, title: "<img src=x>" }, "post")).includes("<img src=x>"), "titolo non passato da escS");

  // Evento: l'Orario va nella tessera, il luogo nella riga col segnaposto, le Iscrizioni in fondo.
  const cena = { kind: "cena", title: "Cena di fine stagione", event_date: "2027-04-10", prices: [["soci", "€ 30"]],
    facts: [["Orario", "ore 20:00"], ["Dove", "Salone dell'oratorio"], ["Iscrizioni", "entro mercoledì 7 aprile"]] };
  const k = disegnaPost(modelloPost(cena, "post"));
  assert.ok(k.includes('<em data-fit style="font-size:58px">ore 20:00</em>') && (k.match(/20:00/g) || []).length === 1, "l'orario ripetuto fuori dalla tessera");
  assert.ok(k.includes("<span>Salone dell'oratorio</span></p>") && k.includes("<p>Iscrizioni entro <b>mercoledì 7 aprile</b></p>"));
  // Senza data: niente tessera, e l'informazione resta fra i dati.
  const corso = modelloPost({ kind: "corso", title: "Corso bambini", facts: [["Età", "5–12 anni"]] }, "post");
  assert.ok(!disegnaPost(corso).includes('class="tessera"') && disegnaPost(corso).includes("<p>Età: 5–12 anni</p>"));
  // Un post di solo sottotesto prende il nome del tipo come titolo.
  assert.ok(disegnaPost(modelloPost({ kind: "servizi", title: "", subtitle: "Negozio aperto" }, "post")).includes(">Servizi</div>"));

  // Calendario del mese: la tessera col mese e quante gite, il giorno corto, il corso.
  const righe = [["g0", "10/01", "Prato Nevoso", true], ["g6", "16/01", "Sestriere", false]];
  const cal = disegnaCalendario("Calendario di gennaio", righe, "2027-01");
  assert.ok(cal.includes('font-size:54px">gennaio</span><b>2</b>') && cal.includes(">Dom 10<") && cal.includes('class="corso">corso<')
    && cal.includes("height:1350px"));
  // Il calendario anche in story.
  assert.ok(disegnaCalendario("Gennaio", righe, "2027-01", true).includes("height:1920px"), "manca la story del calendario");
  // La tessera della gita prende il colore del giorno: il sabato blu con le scritte bianche, la domenica resta gialla.
  const tessera = (iso) => disegnaPost(modelloPost({ ...gita, event_date: iso }, "post")).match(/<div class="tessera"[^>]*>/)[0];
  assert.ok(tessera("2027-01-16").includes("background:#084C8D;color:#FFFFFF;--em:#FCCF02"), "tessera del sabato");
  assert.ok(tessera("2027-01-19").includes("background:#B3261E"), "tessera del martedì");
  assert.strictEqual(tessera("2027-01-17"), '<div class="tessera">', "tessera della domenica");
  // Ora, luogo e scadenza di un evento hanno un campo loro e diventano le informazioni che le grafiche conoscono.
  const presci = { kind: "corso", title: "Ginnastica presciistica", event_date: "2026-10-21", event_time: "ore 19:30",
    place: "Palestra Way Assauto, Asti", deadline: "2026-10-19",
    facts: [["Orario", "19:00"], ["Dove", "vecchio"], ["Quando", "ogni mercoledì"], ["Iscrizioni", "in negozio"]] };
  assert.deepStrictEqual(modelloPost(presci, "post").facts, [["Orario", "ore 19:30"], ["Dove", "Palestra Way Assauto, Asti"],
    ["Quando", "ogni mercoledì"], ["Iscrizioni", "entro lunedì 19 ottobre"]], "campi nuovi o doppioni delle informazioni scritte a mano");
  assert.deepStrictEqual(modelloPost({ ...presci, event_time: "", place: null, deadline: null }, "post").facts, presci.facts,
    "senza i campi nuovi le informazioni scritte a mano devono restare tutte");
  assert.deepStrictEqual(modelloPost({ ...presci, event_time: "dalle 18 alle 20" }, "post").facts[0], ["Orario", "dalle 18 alle 20"]);
  assert.match(testoPost(presci), /Orario: ore 19:30\nDove: Palestra Way Assauto, Asti\nQuando: ogni mercoledì\nIscrizioni: entro lunedì 19 ottobre/);
  assert.ok(disegnaPost(modelloPost(presci, "post")).includes('<em data-fit style="font-size:58px">ore 19:30</em>'), "l'ora nella tessera");
  // I telefoni stanno in una riga sola (un elemento), e la frase dice che si può anche telefonare.
  impostaContatti([{ id: 3, name: "Cesare", phone: "3485171707" }, { id: 4, name: "Irene", phone: "3487324789" }]);
  const html = disegnaPost(modelloPost({ ...presci, contacts: [3, 4] }, "post"));
  assert.strictEqual((html.match(/class="tel"/g) || []).length, 1, "un telefono per riga");
  assert.ok(html.includes("Iscrizioni in negozio, via mail o al telefono") && html.includes("<b>3487324789</b>"));
  assert.ok(disegnaPost(modelloPost(presci, "post")).includes("Iscrizioni in negozio o via mail"));
  impostaContatti([]);
}

// L'ordine dei campi del form in social.html: salvare un post con un ordine
// mancante dava "Cannot read properties of undefined (reading 'gita')".
{
  const pagina = require("fs").readFileSync(require("path").join(__dirname, "social.html"), "utf8");
  const leggi = (nome) => (0, eval)(`(${pagina.match(new RegExp(`const ${nome} = (\\{[^\\n]*\\}|\\{[\\s\\S]*?\\n  \\});`))[1]})`);
  const ordine = leggi("ORDINE_CAMPI");
  for (const g of ["gita", "evento"]) assert.ok(Array.isArray(ordine[g]), `manca ORDINE_CAMPI.${g}`);
  // Ogni nome dell'ordine è un campo del form: ordinaCampi() lo cerca per
  // data-campo, e uno che non c'è finirebbe nel form come la scritta "null".
  const campi = new Set([...pagina.matchAll(/data-campo="([A-Za-z]+)"/g)].map((m) => m[1]));
  const sponsor = (0, eval)(pagina.match(/const ORDINE_SPONSOR = (\[[^\]]*\]);/)[1]);
  for (const [dove, elenco] of [...Object.entries(ordine), ["ORDINE_SPONSOR", sponsor]]) {
    for (const nome of elenco) assert.ok(campi.has(nome), `${dove}: "${nome}" non è un data-campo di social.html`);
  }
}

// --- Classi che la pagina (Bulma) ha già: nel post prenderebbero colori e margini di Bulma ---
{
  const ev = { kind: "gita", title: "La Thuile", event_date: "2026-10-03", stops: [["06:40", "Asti"], ["06:20", "Nizza Monferrato"]],
    deadline: "2026-10-23", course: true, contacts: [] };
  for (const fmt of ["post", "story"]) {
    const classi = [...disegnaPost(modelloPost(ev, fmt)).matchAll(/class="([^"]+)"/g)].flatMap((m) => m[1].split(/\s+/));
    for (const c of ["box", "tag", "title", "button", "card", "content", "notification", "column", "columns", "media", "level"])
      assert.ok(!classi.includes(c), `${fmt}: la classe "${c}" è anche di Bulma`);
  }
}


// --- Foto spostata (photo_x, photo_y) ---------------------------------------

assert.strictEqual(posFoto({}), "50% 45%", "senza posizione la foto deve restare dov'era");
assert.strictEqual(posFoto({ photo_x: null, photo_y: "" }), "50% 45%");
assert.strictEqual(posFoto({ photo_x: 0, photo_y: 100 }), "0% 100%", "lo zero è una posizione, non «vuoto»");
assert.strictEqual(posFoto({ photo_x: 150, photo_y: -3 }), "100% 0%");
assert.strictEqual(posFoto({ photo_x: "20;color:red", photo_y: 12.6 }), "50% 13%", "nello style solo numeri");
assert.strictEqual(zoomFoto({}), 1);
assert.strictEqual(zoomFoto({ photo_zoom: 130 }), 1.3);
assert.strictEqual(zoomFoto({ photo_zoom: 50 }), 1, "la foto non deve mai essere più piccola del riquadro");
assert.strictEqual(zoomFoto({ photo_zoom: 999 }), 3);
{
  const html = disegnaPost(modelloPost({ kind: "gita", title: "Pila", event_date: "2027-01-17", photo: "data:image/jpeg;base64,AA", photo_x: 10, photo_y: 80 }, "post"));
  assert.ok(html.includes("--pos:10% 80%"), "la posizione non arriva al post");
  assert.ok(html.includes("--zoom:1"), "senza ingrandimento la foto deve restare 1");
  const gita = { kind: "gita", title: "Pila", event_date: "2027-01-17", stops: [["7:00", "Asti"], ["6:45", "Montegrosso"]] };
  const conNota = disegnaPost(modelloPost({ ...gita, subtitle: "Prova *gratuita* <b>maestri</b>" }, "post"));
  assert.ok(conNota.includes('<p class="nota">Prova gratuita &lt;b&gt;maestri&lt;/b&gt;</p>'), "la nota gialla della gita manca o non è escapata");
  assert.ok(!disegnaPost(modelloPost(gita, "post")).includes('class="nota"'), "senza nota niente riga gialla");
  assert.ok(testoPost({ ...gita, subtitle: "Prova gratuita" }, null, "2026/27").includes("Prova gratuita"), "la nota manca nel testo del post");
  const brutta = disegnaPost(modelloPost({ ...gita, photo: "data:image/gif;base64,AA\f);outline:77px solid red;--k:" }, "post"));
  const stile = (brutta.match(/--immagine:url\(&quot;(.*?)&quot;\)/) || [])[1] || "";
  // Dentro url("…") la stringa CSS si chiude solo con " \ e gli a capo (\n \r \f): nessuno deve restare.
  assert.ok(stile.includes("%0C") && !/["\\\n\r\f]|&quot;/.test(stile), "la foto esce dall'url() del CSS");
  assert.ok(disegnaPost(modelloPost(gita, "post")).includes("ore 7:00"), "senza scelta va sotto la data la prima partenza");
  assert.ok(disegnaPost(modelloPost({ ...gita, card_stop: "Montegrosso" }, "post")).includes("ore 6:45"), "la partenza scelta non va sotto la data");
  assert.ok(disegnaPost(modelloPost({ ...gita, card_stop: "Altrove" }, "post")).includes("ore 7:00"), "un luogo tolto deve tornare alla prima");
  assert.ok(disegnaPost(modelloPost({ kind: "gita", title: "Pila", event_date: "2027-01-17", photo: "data:image/jpeg;base64,AA", photo_zoom: 150 }, "post")).includes("--zoom:1.5"));
  assert.ok(!disegnaPost(modelloPost({ kind: "gita", title: "Pila", event_date: "2027-01-17", photo_x: 10 }, "post")).includes("--pos"), "senza foto niente posizione");
}


// --- Formati della campagna sponsor e copertina -------------------------------
// Nome, livello, logo e testi li scrive a mano chi gestisce gli sponsor: nei disegni
// devono restare testo, mai HTML (le anteprime vanno in pagina con innerHTML).

{
  const cattivo = { ...santero, name: '<img src=x onerror=alert(1)>', level: 'Main "x"', logo: '" onerror="alert(1)', logo_dark: null };
  const c = { kind: "sponsor", title: "Riga 1\n<b>Riga 2</b>", subtitle: "<script>x</script>", cta: "<i>Vai</i>", story_title: null };
  const f = formatiCampagna(c, cattivo, "2026/27");
  assert.deepStrictEqual(Object.keys(f), ["collab", "story", "grazie", "cover"]);
  assert.deepStrictEqual(Object.values(f).map(({ w, h }) => `${w}×${h}`), ["1080×1350", "1080×1920", "1080×1080", "820×312"]);
  for (const [k, { html, nome, breve }] of Object.entries(f)) {
    assert.ok(nome && breve, `${k}: manca il nome del formato`);
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
  const conScuro = formatiCampagna(c, { ...santero, logo: "a.png", logo_dark: "b.png" }, "2026/27");
  assert.ok(conScuro.story.html.includes('src="b.png"') && conScuro.collab.html.includes('src="a.png"'));
  const senzaLogo = formatiCampagna({ ...c, cta: "" }, { ...santero, logo: null, alcohol: false }, "2026/27");
  assert.ok(senzaLogo.cover.html.includes("958 Santero"), "senza logo deve comparire il nome");
  assert.ok(!senzaLogo.collab.html.includes("padding:.45em 1.1em"), "pulsante della campagna senza testo");
  for (const { html } of Object.values(senzaLogo)) assert.ok(!html.includes(SOCIAL.avvertenzaAlcol), "avvertenza su uno sponsor non alcolico");
  assert.ok(formatiCampagna({ ...c, story_title: "Solo story" }, santero, "2026/27").story.html.includes("Solo story"));
}
{
  const cop = disegnaCopertina("<b>Stagione</b>", "Gite & corsi");
  assert.ok(cop.includes("width:820px;height:312px"));
  assert.ok(cop.includes("&lt;b&gt;Stagione&lt;/b&gt;") && cop.includes("Gite &amp; corsi"), "titolo della copertina non escapato");
  assert.ok(cop.includes("<svg"), "senza foto la copertina deve avere il paesaggio disegnato");
  assert.ok(photo(10, 20, 'x" onerror="y').includes('src="x&quot; onerror=&quot;y"'), "la foto esce dall'attributo src");
}


// --- Meta della gita su due righe ---------------------------------------------
// Una meta lunga va a capo invece di rimpicciolirsi; gli a capo scritti contano, al massimo due righe.
// Fuori dal titolo del post (calendario, testo, nome nell'elenco) l'a capo diventa uno spazio.

{
  const gita = { kind: "gita", event_date: "2027-01-17", stops: [["7:00", "Asti"]] };
  const titolo = (title, fmt = "post") => (disegnaPost(modelloPost({ ...gita, title }, fmt)).match(/<div class="tit meta"[^>]*>([\s\S]*?)<\/div><\/div>/) || [])[1] || "";
  assert.ok(titolo("Cervinia\nValtournenche").includes('data-righe="2"'), "la meta deve poter andare su due righe");
  assert.ok(titolo("Cervinia\nValtournenche").includes("Cervinia<br>Valtournenche"), "l'a capo scritto nella meta si perde");
  assert.ok(titolo("Cervinia\nValtournenche").includes("--t:104px") && titolo("Cervinia\nValtournenche", "story").includes("--t:124px"),
    "su due righe la meta deve scendere a 104 (124 nella story)");
  assert.ok(titolo("La Thuile").includes("--t:150px") && titolo("La Thuile", "story").includes("--t:168px"), "su una riga la meta resta grande");
  assert.ok(titolo("Cervinia\r\n\n  Valtournenche \n\nZermatt").includes("Cervinia<br>Valtournenche Zermatt"), "più di due righe: le altre vanno sulla seconda");
  assert.ok(titolo("La Thuile").endsWith(">La Thuile"), "una meta corta resta su una riga");
  assert.ok(!titolo("La Thuile").includes("<br>"));
  assert.ok(titolo("<b>X</b>\nY").includes("&lt;b&gt;X&lt;/b&gt;<br>Y"), "la meta deve restare testo");
  assert.ok(testoPost({ ...gita, title: "Cervinia\nValtournenche" }, null, "2026/27").includes("gita a Cervinia Valtournenche!"), "a capo nel testo del post");
  assert.strictEqual(nomePost({ ...gita, title: "Cervinia\nValtournenche" }), "Cervinia Valtournenche");
  const cal = disegnaCalendario("Calendario", [["g0", "17/01", "Cervinia\nValtournenche", false]], "2027-01");
  assert.ok(cal.includes("Cervinia Valtournenche") && !/Cervinia\s*<br>/.test(cal), "a capo nel calendario del mese");
}

console.log("social: tutti i controlli passati");
