// Controllo dei pezzi dei post social che possono sbagliare in silenzio
// (web/social-templates.js): colore del giorno, prezzo facoltativo, testo del
// post, indirizzo con UTM, contrasto dei colori di uno sponsor, cosa manca a
// un post per essere pronto.
//
//   node web/test-social.js

const assert = require("assert");
const { dataLunga, dataCorta, categoriaGita, categoria, impostaColoriGita, impostaContatti, contattiDi, modelloPost,
        contrasto, schiarisci, indirizzoUtm, testoPost, mancanti, nomePost, SOCIAL,
        impostaStile, stileCorrente, disegnaPost, disegnaCalendario, misureCalendario, misurePost,
        STILI, evidenzia, coloreNuovo, giornoMese } = require("./social-templates.js");

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
assert.deepStrictEqual(mancanti({ ...gita, deadline: null }), ["la scadenza delle iscrizioni"]);
assert.deepStrictEqual(mancanti({ kind: "gita", title: " ", stops: [["", ""]], prices: [[null, ""]] }),
  ["la meta", "il giorno", "le partenze", "la quota", "la scadenza delle iscrizioni"]);
assert.deepStrictEqual(mancanti({ ...senzaPrezzo, prices: [] }), [], "quota chiesta anche se nascosta");
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

// --- Grafica dei post (social_settings) --------------------------------------

impostaStile("montagna");
assert.strictEqual(stileCorrente(), "montagna");
assert.deepStrictEqual(misureCalendario(), { w: 1080, h: 1350 });
impostaStile("qualcosa");                                  // un valore sconosciuto torna al ritocco
assert.strictEqual(stileCorrente(), "ritocco");
assert.deepStrictEqual(misureCalendario(), { w: 1080, h: 1080 });
{
  impostaContatti([{ id: 1, name: "Marco", phone: "333 1" }]);
  const gita = modelloPost({ kind: "gita", title: "Sestriere", event_date: "2027-01-16", course: true,
    stops: [["6:00", "Asti"]], prices: [["", "45 €"]], deadline: "2027-01-14", contacts: [1] }, "post");
  const ritocco = disegnaPost(gita), montagna = disegnaPost(gita, "montagna");
  assert.ok(ritocco.includes("data-biglietto") && !ritocco.includes("data-titolofoto"), "il ritocco non è il biglietto");
  assert.ok(montagna.includes("data-titolofoto") && montagna.includes("data-biglietto"), "la montagna non ha titolo e scheda");
  assert.ok(montagna.includes("Sabato 16 gennaio") && montagna.includes("333 1") && montagna.includes("Corso"), "manca il nastro, il telefono o il corso");
  // Un post di solo titolo, senza contatti: niente scheda vuota.
  const solo = disegnaPost(modelloPost({ kind: "servizi", title: "Apertura iscrizioni", contacts: [] }, "post"), "montagna");
  assert.ok(!solo.includes("data-biglietto"), "scheda vuota in un post di solo titolo");
  assert.ok(disegnaCalendario("Gennaio", [["g6", "09/01", "Prato Nevoso", true]], "montagna").includes("height:1350px"));
}

// --- Grafiche della 2.8: Biglietto, Calendario, Divano ------------------------

for (const st of ["biglietto", "calendario", "divano", "k"]) {
  impostaStile(st);
  assert.strictEqual(stileCorrente(), st, `grafica ${st} non accettata`);
  assert.deepStrictEqual(misurePost(), { w: 1080, h: 1350 }, `${st}: il post non è 4:5`);
  assert.deepStrictEqual(misureCalendario(), { w: 1080, h: 1350 });
}
impostaStile("ritocco");
assert.deepStrictEqual(misurePost(), { w: 1080, h: 1080 }, "il ritocco ha cambiato misura");
assert.deepStrictEqual(misurePost("montagna"), { w: 1080, h: 1080 });
assert.deepStrictEqual(STILI, ["ritocco", "montagna", "biglietto", "calendario", "divano", "k"],
  "STILI diverso da social_settings_style_valid (supabase/schema.sql)");

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
  assert.ok(!segni.test(disegnaPost(modelloPost(ev, "post"), "ritocco")), "asterischi nel Ritocco");
  assert.ok(!segni.test(disegnaPost(modelloPost(ev, "post"), "montagna")), "asterischi nella Montagna");
  for (const st of ["biglietto", "calendario", "divano", "k"]) {
    const html = disegnaPost(modelloPost(ev, "post"), st);
    assert.ok(html.includes("<b>fino al 13 gennaio</b>") && !segni.test(html), `${st}: evidenza del sottotesto`);
  }
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
  for (const st of ["biglietto", "calendario", "divano"]) {
    for (const fmt of ["post", "story"]) {
      const html = disegnaPost(modelloPost(ev, fmt), st);
      assert.ok(html.includes("data-adatta") && html.includes('data-righe="2"'), `${st} ${fmt}: manca l'adattamento del testo`);
      assert.ok(html.includes("sciclubdonboscoasti@gmail.com") && html.includes("333 1"), `${st} ${fmt}: mancano le iscrizioni o il telefono`);
      assert.ok(/Gita a(<br>| )La Thuile/.test(html), `${st} ${fmt}: il titolo non dice che è una gita`);
      assert.ok(!html.includes("ore ore"), `${st} ${fmt}: "ore" ripetuto nella partenza`);
      assert.ok(html.includes(`height:${fmt === "story" ? 1920 : 1350}px`), `${st} ${fmt}: misura sbagliata`);
      assert.strictEqual(html.includes(" story"), fmt === "story");
    }
  }
  // Lo spazio che può cedere a un testo lungo (fit()): titolo e disegno nel post del Divano, il titolo in A e B.
  const cedeDiv = disegnaPost(m, "divano"), cedeStory = disegnaPost(modelloPost(ev, "story"), "divano");
  assert.ok(/class="nome" data-cede/.test(cedeDiv) && cedeDiv.includes('data-cede="70"') && cedeDiv.includes("data-ancora") && cedeDiv.includes("data-segue"));
  assert.ok(!cedeStory.includes('data-cede="70"'), "nella story il disegno si adatta già da solo");
  assert.ok(disegnaPost(m, "biglietto").includes('class="tit" data-cede') && disegnaPost(m, "calendario").includes('class="tit" data-cede'));
  assert.ok(!disegnaPost(m, "ritocco").includes("data-cede"), "il Ritocco non cambia");
  // Il corso nello stesso giorno: la coccarda verde in alto a destra in Calendario e Divano, una riga nel Biglietto.
  for (const st of ["calendario", "divano", "k"]) for (const fmt of ["post", "story"]) {
    assert.ok(disegnaPost(modelloPost(ev, fmt), st).includes('class="stella"'), `${st} ${fmt}: manca la coccarda del corso`);
    assert.ok(!disegnaPost(modelloPost({ ...ev, course: false }, fmt), st).includes('class="stella"'), `${st} ${fmt}: coccarda senza corso`);
  }
  assert.ok(disegnaPost(m, "biglietto").includes("nello stesso giorno"), "il Biglietto ha perso il corso");
  assert.ok(disegnaPost(m, "divano").includes("Tutti in pista!") && disegnaPost(m, "k").includes("Tutti in pista!")
    && !disegnaPost(m, "biglietto").includes("Tutti in pista!"), "il gancio deve stare solo nel Divano e nella K");
  // K: «Gita a» piccolo e la meta su una riga, la data nella tessera con la prima partenza, il testo che si adatta.
  for (const fmt of ["post", "story"]) {
    const html = disegnaPost(modelloPost(ev, fmt), "k");
    assert.ok(html.includes("<small>Gita a</small>") && html.includes('data-fit style="font-size:150px">La Thuile'), `k ${fmt}: titolo della gita`);
    assert.ok(html.includes("data-adatta") && html.includes(">domenica<") && html.includes(">ore 6:30<") && !html.includes("ore ore"), `k ${fmt}: tessera o adattamento`);
    assert.ok(html.includes("sciclubdonboscoasti@gmail.com") && html.includes("333 1") && html.includes("giovedì 14 gennaio"), `k ${fmt}: iscrizioni, telefono o scadenza`);
    assert.ok(html.includes(`height:${fmt === "story" ? 1920 : 1350}px`) && html.includes(" senza-foto"), `k ${fmt}: misura o fondo senza foto`);
  }
  const kFoto = disegnaPost(modelloPost({ ...ev, photo: "https://x/foto.jpg" }, "post"), "k");
  assert.ok(kFoto.includes('class="foto" src="https://x/foto.jpg"') && kFoto.includes("piano finestra") && !kFoto.includes("senza-foto"), "k: la foto");
  assert.ok(!disegnaPost(modelloPost({ ...ev, title: "Gita sociale a Pila" }, "post"), "k").includes("Gita a</small>"), "k: «Gita a Gita»");
  assert.ok(disegnaPost(m, "biglietto").includes("giovedì 14 gennaio</b>") && disegnaPost(m, "calendario").includes("Iscrizioni entro giovedì 14 gennaio"));
  // Una meta che dice già "Gita" non diventa "Gita a Gita ...".
  assert.ok(!disegnaPost(modelloPost({ ...ev, title: "Gita sociale a Pila" }, "post"), "biglietto").includes("Gita a Gita"));
  // Un titolo con caratteri HTML resta testo.
  assert.ok(!disegnaPost(modelloPost({ ...ev, title: "<img src=x>" }, "post"), "divano").includes("<img src=x>"), "titolo non passato da escS");

  // Evento in B: l'Orario va nel foglio, le Iscrizioni nel riquadro giallo, il resto accanto.
  const cena = { kind: "cena", title: "Cena di fine stagione", event_date: "2027-04-10", prices: [["soci", "€ 30"]],
    facts: [["Orario", "ore 20:00"], ["Dove", "Salone dell'oratorio"], ["Iscrizioni", "entro mercoledì 7 aprile"]] };
  const b = disegnaPost(modelloPost(cena, "post"), "calendario");
  assert.match(b, /<div class="ora">ore 20:00<\/div>/);
  assert.match(b, /<div class="evid">Iscrizioni entro mercoledì 7 aprile<\/div>/);
  assert.ok(b.includes("Salone dell'oratorio") && !/<div class="et">Orario/.test(b), "l'orario ripetuto accanto al foglio");
  // In C l'orario e i prezzi stanno su una riga, le iscrizioni in fondo senza i due punti.
  const c = disegnaPost(modelloPost(cena, "post"), "divano");
  assert.ok(c.includes("<b>Ore 20:00</b> · soci <b>€ 30</b>"), "orario e prezzi non sulla stessa riga");
  assert.ok(c.includes('<div class="poi">Iscrizioni entro <b>mercoledì 7 aprile</b></div>'));
  // Senza data: niente foglio in B, il nome del tipo nella fascia di C e nel bollo di A.
  const corso = modelloPost({ kind: "corso", title: "Corso bambini", facts: [["Età", "5–12 anni"]] }, "post");
  assert.ok(!disegnaPost(corso, "calendario").includes('class="foglio"'));
  assert.ok(disegnaPost(corso, "divano").includes(">Corsi</div>") && disegnaPost(corso, "biglietto").includes('<div class="g">Corsi</div>'));
  // Un post di solo sottotesto prende il nome del tipo come titolo.
  assert.ok(disegnaPost(modelloPost({ kind: "servizi", title: "", subtitle: "Negozio aperto" }, "post"), "biglietto").includes(">Servizi</div>"));

  // Calendario del mese: intestazione col mese, il giorno corto in C, il corso.
  const righe = [["g0", "10/01", "Prato Nevoso", true], ["g6", "16/01", "Sestriere", false]];
  const calA = disegnaCalendario("Calendario di gennaio", righe, "biglietto", "2027-01");
  assert.ok(calA.includes('<div class="g">Gennaio</div><div class="n">2027</div>') && calA.includes("Dom 10/01") && calA.includes("Corso"));
  assert.ok(disegnaCalendario("Calendario di gennaio", righe, "calendario", "2027-01").includes("Gennaio 2027"));
  const calC = disegnaCalendario("Calendario di gennaio", righe, "divano", "2027-01");
  assert.ok(calC.includes(">Dom 10<") && calC.includes("Le gite del mese") && calC.includes("height:1350px"));
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
  assert.match(disegnaPost(modelloPost(presci, "post"), "calendario"), /<div class="ora">ore 19:30<\/div>/);
  assert.ok(disegnaPost(modelloPost(presci, "post"), "divano").includes("<b>Ore 19:30</b> · Palestra Way Assauto, Asti"),
    "nel Divano ora e luogo vanno sulla stessa riga");
  // I telefoni stanno in una riga sola (un elemento), e la frase dice che si può anche telefonare.
  impostaContatti([{ id: 3, name: "Cesare", phone: "3485171707" }, { id: 4, name: "Irene", phone: "3487324789" }]);
  for (const st of ["biglietto", "calendario", "divano"]) {
    const html = disegnaPost(modelloPost({ ...presci, contacts: [3, 4] }, "post"), st);
    assert.strictEqual((html.match(/class="tel"/g) || []).length, 1, `${st}: un telefono per riga`);
    assert.ok(html.includes("Iscrizioni in negozio, via mail o al telefono") && html.includes("<b>3487324789</b>"));
    assert.ok(disegnaPost(modelloPost(presci, "post"), st).includes("Iscrizioni in negozio o via mail"));
  }
  impostaContatti([]);
}

// Ogni grafica ha in social.html il nome e l'ordine dei campi del form: la K
// li aveva senza ORDINE_CAMPI, e salvarla dava "Cannot read properties of
// undefined (reading 'gita')".
{
  const pagina = require("fs").readFileSync(require("path").join(__dirname, "social.html"), "utf8");
  const leggi = (nome) => (0, eval)(`(${pagina.match(new RegExp(`const ${nome} = (\\{[^\\n]*\\}|\\{[\\s\\S]*?\\n  \\});`))[1]})`);
  const ordine = leggi("ORDINE_CAMPI"), nomi = leggi("NOMI_STILE");
  for (const stile of STILI) {
    assert.ok(nomi[stile], `${stile}: manca in NOMI_STILE`);
    for (const g of ["gita", "evento"]) assert.ok(Array.isArray(ordine[stile]?.[g]), `${stile}: manca ORDINE_CAMPI.${g}`);
  }
  // Ogni nome dell'ordine è un campo del form: ordinaCampi() lo cerca per
  // data-campo, e uno che non c'è finirebbe nel form come la scritta "null".
  const campi = new Set([...pagina.matchAll(/data-campo="([A-Za-z]+)"/g)].map((m) => m[1]));
  const sponsor = (0, eval)(pagina.match(/const ORDINE_SPONSOR = (\[[^\]]*\]);/)[1]);
  for (const [dove, elenco] of [...Object.entries(ordine).flatMap(([st, o]) => Object.entries(o).map(([g, e]) => [`${st}.${g}`, e])),
                                 ["ORDINE_SPONSOR", sponsor]]) {
    for (const nome of elenco) assert.ok(campi.has(nome), `${dove}: "${nome}" non è un data-campo di social.html`);
  }
}

console.log("social: tutti i controlli passati");
