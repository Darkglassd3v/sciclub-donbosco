// Disegni dei post social: le grafiche scelte in Social > Impostazioni
// (Ritocco, Montagna e, dalla 2.8, Biglietto, Calendario e Divano) e i
// formati delle campagne sponsor.
//
// La usa web/social.html, la pagina che genera i post; le funzioni pure le
// prova web/test-social.js. I prototipi da cui viene (social/templates.html
// con le tre proposte A, B, C, social/confronto.html, social/export.sh) sono
// nella storia di git, fino alla 2.4. Ogni funzione restituisce l'HTML di un canvas a misura reale (post
// 1080×1080, o 1080×1350 nelle grafiche della 2.8 (misurePost()), story 1080×1920, collab 1080×1350,
// copertina 820×312); lo stile
// che serve è tutto qui, così la pagina che lo usa non deve sapere niente.
// Colori del club da docs/brand-guidelines.md.

const SOCIAL = {
  // Relativo alla pagina che disegna.
  logo: "logo_sciclubdonbosco.svg",
  // Rubrica dei contatti per info e iscrizioni: la tabella social_contacts,
  // che la pagina carica e passa a impostaContatti(). Ogni post sceglie i suoi
  // (ev.contacts, id in ordine): contattiDi().
  // [{ id, name: "Marco", phone: "333 000 0000", hours: "dopo le 18" }, ...]
  contatti: [],
  avvertenzaAlcol: "Bevi responsabilmente. Vietata la vendita ai minori di 18 anni.",
  // In fondo ai post delle grafiche della 2.8, sopra i telefoni scelti.
  iscrizioni: "Iscrizioni in negozio o via mail",
  mail: "sciclubdonboscoasti@gmail.com",
};

/* Una categoria = un colore. Le gite prendono il colore dal giorno della
 * settimana (COLORI_GITA, sotto); qui il resto. */
const CAT = {
  // Gite in un giorno che non è un giorno di gita: il blu del club.
  gita:    { label: "Gita",                day: "",    c: "#084C8D", ink: "#fff",    txt: "#084C8D" },
  corso:   { label: "Corsi",               c: "#147A45", ink: "#fff", txt: "#147A45" },
  gara:    { label: "Gara sociale",        c: "#5B2A86", ink: "#fff", txt: "#5B2A86" },
  cena:    { label: "Cene e feste",        c: "#C2410C", ink: "#fff", txt: "#C2410C" },
  servizi: { label: "Servizi",             c: "#14202E", ink: "#fff", txt: "#14202E" },
  cal:     { label: "Calendario",          c: "#084C8D", ink: "#FCCF02", txt: "#084C8D" },
};

const MESI = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto",
              "settembre", "ottobre", "novembre", "dicembre"];
const GIORNI = ["domenica", "lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato"];

/* Story: fasce coperte da Instagram (profilo in alto, risposta in basso), su 1920. */
const SAFE = { top: 250, bottom: 340 };

const escS = (s) => String(s ?? "").replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));

// Lo stile dei canvas, messo una volta nella pagina che disegna.
(function stileSocial() {
  if (typeof document === "undefined" || document.getElementById("stile-social")) return;
  const stile = document.createElement("style");
  stile.id = "stile-social";
  stile.textContent = `
    .cv { position: relative; overflow: hidden; background: #fff; letter-spacing: -.01em;
          font-family: Barlow, system-ui, sans-serif; color: #14202E; -webkit-font-smoothing: antialiased; }
    .cv * { box-sizing: border-box; margin: 0; }
    .cv .abs { position: absolute; }
    .cv .logo { display: block; }
    .cv .pill { display: inline-block; border-radius: 999px; font-weight: 700; }
    .cv .t-dest { font-weight: 800; letter-spacing: -.035em; line-height: .95; }`;
  document.head.append(stile);
})();

// ---------------------------------------------------------------------------
// Dati: dalla riga di social_events al modello che i disegni leggono
// ---------------------------------------------------------------------------

const giornoDi = (iso) => (iso ? new Date(`${iso}T12:00:00`) : null);
const maiuscola = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/** "Martedì 13 gennaio" */
function dataLunga(iso) {
  const d = giornoDi(iso);
  return d ? `${maiuscola(GIORNI[d.getDay()])} ${d.getDate()} ${MESI[d.getMonth()]}` : null;
}

/** "entro giovedì 8/12": la scadenza delle iscrizioni, uguale nell'immagine e nel testo. */
function entro(iso) {
  const d = giornoDi(iso);
  return d ? `entro ${GIORNI[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}` : "";
}

/** "giovedì 14 gennaio": la scadenza scritta per esteso, nelle grafiche della 2.8. */
function giornoMese(iso) {
  const d = giornoDi(iso);
  return d ? `${GIORNI[d.getDay()]} ${d.getDate()} ${MESI[d.getMonth()]}` : "";
}

/** "13/01" */
function dataCorta(iso) {
  const d = giornoDi(iso);
  return d ? `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}` : "";
}

/* I giorni di gita e il loro colore, per giorno della settimana (0 = domenica,
 * come getDay()): la tabella trip_days, che la pagina carica e passa a
 * impostaColoriGita(). Finché non arriva, quelli di sempre, gli stessi degli
 * abbonamenti nel gestionale. */
let COLORI_GITA = { 2: "#B3261E", 6: "#084C8D", 0: "#FCCF02" };
function impostaColoriGita(colori) { COLORI_GITA = colori; }

/* La grafica dei post, scelta in Social > Impostazioni (tabella
 * social_settings, chiave "style"): "ritocco" è il biglietto di sempre con la
 * neve sul fondo, "montagna" la foto a tutta immagine con le informazioni in
 * una scheda bianca; "biglietto", "calendario" e "divano" sono le proposte A,
 * B e C della 2.8 (grafica/proposte-post-social/). La pagina la carica e la
 * passa a impostaStile(); gli esempi di Impostazioni la scelgono col secondo
 * argomento dei disegni. */
const STILI = ["ritocco", "montagna", "biglietto", "calendario", "divano"];
let STILE = "ritocco";
function impostaStile(stile) { STILE = STILI.includes(stile) ? stile : "ritocco"; }

/* Fiocchi di neve sparsi su w×h. Generatore a seme fisso: sempre gli stessi
 * fiocchi negli stessi punti, così anteprima e immagine scaricata coincidono. */
const FIOCCO = '<path d="M11 2h2v4l2-2 1.4 1.4L13 8.8V11h2.2l3.4-3.4L20 9l-2 2h4v2h-4l2 2-1.4 1.4-3.4-3.4H13v2.2l3.4 3.4L15 20l-2-2v4h-2v-4l-2 2-1.4-1.4 3.4-3.4V13H8.8l-3.4 3.4L4 15l2-2H2v-2h4L4 9l1.4-1.4L8.8 11H11V8.8L7.6 5.4 9 4l2 2V2Z"/>';
function fiocchi(w, h, opacita = .32, seme = 7) {
  let x = seme, out = "";
  const caso = () => (x = (x * 9301 + 49297) % 233280) / 233280;
  for (let i = Math.round(w * h / 42000); i > 0; i--) {
    const px = Math.round(30 + caso() * 60);
    out += `<svg class="abs" style="left:${Math.round(caso() * w)}px;top:${Math.round(caso() * h)}px;opacity:${(opacita * (.5 + caso() / 2)).toFixed(2)};transform:rotate(${Math.round(caso() * 60)}deg)" width="${px}" height="${px}" viewBox="0 0 24 24" fill="#fff">${FIOCCO}</svg>`;
  }
  return `<div class="abs" style="inset:0;pointer-events:none">${out}</div>`;
}

/** Il colore di una gita viene dal giorno: "g2" se il martedì è un giorno di gita. */
function categoriaGita(iso) {
  const d = giornoDi(iso);
  return d && COLORI_GITA[d.getDay()] ? `g${d.getDay()}` : "gita";
}

/* Scritta sul colore: bianca o blu scuro, quella che si legge meglio (sul
 * giallo il blu scuro, come nel resto del gestionale). */
const inchiostro = (c) => (contrasto(c, "#FFFFFF") >= contrasto(c, "#06396A") ? "#FFFFFF" : "#06396A");

/* Il colore scurito quanto basta per leggersi su bianco (4.5:1): prezzi e
 * scadenza stanno nel biglietto bianco, e il giallo lì non si leggerebbe. */
function suBianco(c) {
  if (contrasto(c, "#FFFFFF") >= 4.5) return c;
  const n = parseInt(c.slice(1), 16), rgb = [n >> 16, (n >> 8) & 255, n & 255];
  for (let k = .95; k > 0; k -= .05) {
    const scuro = "#" + rgb.map((v) => Math.round(v * k).toString(16).padStart(2, "0")).join("");
    if (contrasto(scuro, "#FFFFFF") >= 4.5) return scuro;
  }
  return "#000000";
}

/** La categoria `k` con i suoi colori; "g0"…"g6" sono i giorni di gita. */
function categoria(k) {
  const g = /^g(\d)$/.exec(k);
  if (!g) return CAT[k];
  const c = COLORI_GITA[g[1]];
  return { label: "Gita", day: maiuscola(GIORNI[g[1]].slice(0, 3)), c, ink: inchiostro(c), txt: suBianco(c) };
}

/** Categoria (colore) di un post del database. */
function categoriaDi(ev) {
  return ev.kind === "gita" ? categoriaGita(ev.event_date) : ev.kind;
}

/** Dalla riga di social_events al modello dei disegni, nel formato chiesto. */
function modelloPost(ev, fmt) {
  const prezzi = (ev.prices || []).filter((p) => p && p[1]);
  const base = {
    fmt, photo: ev.photo || null, cat: categoriaDi(ev), iso: ev.event_date || null,
    hook: String(ev.hook || "").trim(),
    prices: ev.show_price === false ? [] : prezzi, contatti: contattiDi(ev),
  };
  if (ev.kind === "gita") {
    return {
      ...base, kind: "gita", dest: ev.title, date: dataLunga(ev.event_date),
      stops: ev.stops || [], corso: !!ev.course, deadline: entro(ev.deadline), scadenza: giornoMese(ev.deadline),
    };
  }
  return {
    ...base, kind: "evento", title: ev.title, sub: ev.subtitle || "",
    date: dataLunga(ev.event_date), facts: ev.facts || [],
  };
}

// ---------------------------------------------------------------------------
// Pezzi comuni
// ---------------------------------------------------------------------------

/* Sciatore: segno del corso, uguale nel bollo della gita e nel calendario. */
const skier = (px) => `<svg width="${px}" height="${px}" viewBox="0 0 24 24" fill="#fff"><circle cx="16" cy="4" r="2.2"/><path d="M4 21.5l17-5.2-.5-1.4-4 1.2-1.9-4.8 2.6-2.2-2.7-3.4-5.4 2.6.8 1.6 3.6-1.7 1.1 1.4-3.4 2.9 2.2 5.5-9.6 2.9z"/></svg>`;

/* Bollo data nel colore della categoria: giorno e DD/MM, che si legge a colpo
 * d'occhio anche postando con settimane d'anticipo. Con il corso nello stesso
 * giorno, una coccarda verde a stella sovrapposta come un adesivo. */
function badge(s, k = 1) {
  const C = categoria(s.cat), [day, n, month] = s.date.split(" ");
  const big = `${n.padStart(2, "0")}/${String(MESI.indexOf(month.toLowerCase()) + 1).padStart(2, "0")}`;
  const box = `border-radius:${28 * k}px;text-align:center;padding:${16 * k}px ${24 * k}px`;
  const d = 210 * k, pts = Array.from({ length: 28 }, (_, i) => {
    const a = Math.PI * i / 14, r = i % 2 ? 84 : 100;
    return `${100 + r * Math.sin(a)},${100 - r * Math.cos(a)}`;
  }).join(" ");
  // Margini verticali di -d/2: la coccarda non occupa altezza, così il
  // riquadro della data resta alto uguale con e senza corso, e lei gli sta
  // centrata sopra.
  const corso = s.corso ? `<div style="position:relative;z-index:2;width:${d}px;height:${d}px;margin:${-d / 2}px ${-8 * k}px ${-d / 2}px 0;align-self:center;transform:rotate(-12deg)">
      <svg class="abs" style="inset:0" width="${d}" height="${d}" viewBox="-6 -6 212 212"><polygon points="${pts}" fill="${CAT.corso.c}" stroke="#fff" stroke-width="7" stroke-linejoin="round"/></svg>
      <div class="abs" style="inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;gap:${4 * k}px">
        ${skier(62 * k)}<div style="font-size:${36 * k}px;font-weight:800;line-height:1">Corso</div></div></div>` : "";
  return `<div style="display:flex;align-items:flex-start">${corso}
    <div style="${box};position:relative;background:${C.c};color:${C.ink};min-width:${190 * k}px">
    <div style="font-size:${34 * k}px;font-weight:700">${escS(day)}</div>
    <div style="font-size:${100 * k}px;font-weight:800;line-height:.95;letter-spacing:-.03em;padding-bottom:${10 * k}px">${escS(big)}</div></div></div>`;
}

/* Etichetta di categoria per ciò che non ha data: stesso riquadro e corpo del bollo. */

function fotoPiena(src) {
  return photo(1, 1, src).replace('width="1" height="1"', 'width="100%" height="100%"')
    .replace("width:1px;height:1px", "width:100%;height:100%");
}

// Corpi di partenza in base a quanto testo c'è (post; la story li moltiplica per k).
const corpoTitolo = (n) => (n <= 14 ? 150 : n <= 24 ? 128 : n <= 45 ? 112 : n <= 80 ? 100 : 88);
// Sottotesto: più grande quando è l'unico testo, poi scende con la lunghezza.
const corpoTesto = (n, solo) => (solo ? (n <= 80 ? 72 : n <= 200 ? 58 : 50) : n <= 160 ? 46 : 42);

// Etichetta di categoria per ciò che non ha data: una pastiglia, non un riquadro alto come il bollo.
const pastiglia = (C, k) => `<div style="background:${C.c};color:${C.ink};border-radius:${20 * k}px;padding:${14 * k}px ${30 * k}px;font-size:${44 * k}px;font-weight:800;white-space:nowrap">${escS(C.label)}</div>`;

const icoTel = (px, col) => `<svg width="${px}" height="${px}" viewBox="0 0 24 24" fill="${col}" style="vertical-align:-.12em"><path d="M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25c1.1.37 2.3.57 3.6.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.6a1 1 0 0 1-.25 1z"/></svg>`;

/* Telefoni dentro il biglietto, scuri su bianco; due contatti che non stanno
 * su una riga vanno a capo invece di rimpicciolirsi. */
function telefoni(lista, k) {
  if (!lista.length) return "";
  return `<div data-fittel style="flex:0 0 auto;margin:0 40px;border-top:4px dashed #C7D0DA;padding:${22 * k}px 16px ${28 * k}px;
      display:flex;flex-wrap:wrap;gap:${4 * k}px ${44 * k}px;font-size:${40 * k}px;font-weight:700;line-height:1.25;color:#14202E">
    ${lista.map((c) => `<span style="white-space:nowrap">${icoTel(Math.round(40 * k), "#14202E")} <span style="font-weight:500">${escS(c.name)}</span> ${escS(c.phone)}${c.hours
      ? ` <span style="font-weight:500;font-size:.85em;color:#4A5361">${escS(c.hours)}</span>` : ""}</span>`).join("")}</div>`;
}

// Orari e intervalli ("18-20", "6-14") non vanno a capo sul trattino.
const intero = (v) => escS(v).replace(/\d+[-–]\d+/g, (x) => `<span style="white-space:nowrap">${x}</span>`);

/* Il testo del biglietto. I corpi sono tre variabili sul contenitore: --t
 * titolo, --b testo (sottotesto, informazioni, partenze, scadenza), --p
 * prezzi; fit() le abbassa se il biglietto non basta. */
function testoBiglietto(s, accent, k, conTitolo = true) {
  const gita = s.kind === "gita", titoloVero = String((gita ? s.dest : s.title) || "").trim();
  const titolo = conTitolo ? titoloVero : "";
  const sub = gita ? "" : String(s.sub || "").trim();
  const prices = s.prices || [], facts = s.facts || [], stops = gita ? s.stops || [] : [];
  const solo = !titoloVero && !facts.length && !prices.length;
  const T = corpoTitolo(titolo.length) * k, B = corpoTesto(sub.length, solo) * k * (s.fmt === "story" ? .9 : 1), P = 116 * k;
  const testa = titolo || sub ? `<div>
      ${titolo ? `<div class="t-dest" data-titolo style="font-size:var(--t);line-height:1.02;color:#14202E;text-wrap:balance">${escS(titolo)}</div>` : ""}
      ${sub ? `<div style="font-size:var(--b);font-weight:600;line-height:1.25;color:#2E3A48;white-space:pre-line;text-wrap:pretty;${titolo ? `margin-top:calc(var(--b) * .35)` : ""}">${escS(sub)}</div>` : ""}</div>` : "";
  const prezzi = prices.length ? `<div style="display:flex;flex-wrap:wrap;gap:calc(var(--b) * .4) calc(var(--p) * .55)">${prices.map(([n, v]) => `<div>
      <div class="t-dest" style="font-size:var(--p);color:${accent};white-space:nowrap">${escS(v)}</div>
      ${n ? `<div style="font-size:calc(var(--b) * .9);font-weight:700;margin-top:${6 * k}px;color:#14202E">${escS(n)}</div>` : ""}</div>`).join("")}</div>` : "";
  const fatti = facts.length ? `<div style="display:grid;grid-template-columns:repeat(${facts.length > 1 ? 2 : 1},minmax(0,1fr));gap:calc(var(--b) * .45) calc(var(--b) * .95)">
      ${facts.map(([n, v]) => `<div><div style="font-size:calc(var(--b) * .72);font-weight:600;color:#4A5361">${escS(n)}</div>
        <div style="font-size:var(--b);font-weight:700;line-height:1.15;color:#14202E">${intero(v)}</div></div>`).join("")}</div>` : "";
  const partenze = stops.length ? `<div style="font-size:calc(var(--b) * 1.15);font-weight:700;line-height:1.18;color:#14202E">
      ${stops.map(([t, l]) => `<div><span style="color:${accent};white-space:nowrap">ore ${escS(t)}</span> · ${escS(l)}</div>`).join("")}</div>` : "";
  const scadenza = gita && s.deadline ? `<div style="font-size:var(--b);font-weight:800;color:${accent}">Iscrizioni ${escS(s.deadline)}</div>` : "";
  const pezzi = gita ? [testa, prezzi, partenze, scadenza] : [testa, fatti, prezzi];
  return { html: pezzi.filter(Boolean).join(""), T, B, P };
}

/* Adatta il testo alla tela. Va chiamata dopo che il canvas è nella pagina e
 * i font sono caricati; restituisce true se qualcosa resta troppo lungo anche
 * al corpo minimo, e la pagina lo segnala prima dell'export.
 * - [data-fit] (titolo del calendario): su una riga, il corpo scende fino a 40 px.
 * - [data-fittel] (telefoni): una riga per contatto; un contatto più largo
 *   della riga scende fino a 26 px.
 * - [data-biglietto] (post e story): prima una parola più larga della riga
 *   (il titolo va a capo, ma una parola sola non si spezza); poi, finché il
 *   biglietto è pieno con la foto già alla misura minima, scende il titolo
 *   fino a 2,2 volte il testo, poi titolo, testo e prezzi insieme, fino a un
 *   testo di 32 px (36 nella story). Oltre, c'è davvero troppo da dire.
 *   Prima il testo era appeso alla riga del prezzo e non si riduceva: nelle
 *   story finiva sopra i telefoni, e un titolo lungo usciva dal biglietto.
 * - [data-righe] (titoli delle grafiche della 2.8): va a capo fino a quelle
 *   righe; oltre, o con una parola più larga della riga, scende (--t) fino a 48 px.
 * - [data-adatta] (la colonna di quelle grafiche): se il contenuto non ci sta,
 *   scende tutto insieme (--s) fino alla scala scritta nell'attributo; i testi
 *   piccoli si fermano al corpo minimo (--min). */
function fit(radice = document) {
  let sborda = false;
  radice.querySelectorAll("[data-fit]").forEach((el) => {
    el.style.whiteSpace = "nowrap";
    let f = parseFloat(el.style.fontSize);
    while (el.scrollWidth > el.clientWidth && f > 40) el.style.fontSize = (f -= 2) + "px";
    if (el.scrollWidth > el.clientWidth) sborda = true;
  });
  radice.querySelectorAll("[data-fittel]").forEach((el) => {
    let f = parseFloat(el.style.fontSize);
    while (el.scrollWidth > el.clientWidth && f > 26) el.style.fontSize = (f -= 1) + "px";
    if (el.scrollWidth > el.clientWidth) sborda = true;
  });
  // Montagna: il titolo bianco sulla foto va a capo fino a data-titolofoto
  // righe; oltre, o con una parola più larga della riga, scende fino a 56 px.
  radice.querySelectorAll("[data-titolofoto]").forEach((el) => {
    const righe = Number(el.dataset.titolofoto);
    let f = parseFloat(el.style.fontSize);
    const troppo = () => el.scrollWidth > el.clientWidth || el.offsetHeight > f * .95 * righe + 4;
    while (troppo() && f > 56) el.style.fontSize = (f -= 2) + "px";
    if (troppo()) sborda = true;
  });
  radice.querySelectorAll("[data-biglietto]").forEach((card) => {
    const box = card.querySelector("[data-testo]"), tit = box.querySelector("[data-titolo]"), k = Number(box.dataset.k);
    const v = (n) => parseFloat(box.style.getPropertyValue(n));
    let T = v("--t"), B = v("--b"), P = v("--p");
    const metti = () => { box.style.setProperty("--t", T + "px"); box.style.setProperty("--b", B + "px"); box.style.setProperty("--p", P + "px"); };
    const pieno = () => card.scrollHeight > card.clientHeight + 1;
    const minB = k > 1 ? 36 : 32;
    while (tit && tit.scrollWidth > tit.clientWidth && T > 40) { T -= 2; metti(); }
    while (pieno()) {
      if (T > Math.max(B * 2.2, 64 * k)) T -= 3;
      else if (B > minB) { B -= 1; T = Math.max(T - 2.2, 48 * k); P = Math.max(P - 2.5, 64 * k); }
      else break;
      metti();
    }
    if (pieno()) sborda = true;
  });
  radice.querySelectorAll("[data-righe]").forEach((el) => {
    const righe = Number(el.dataset.righe);
    let t = parseFloat(getComputedStyle(el).getPropertyValue("--t"));
    const troppo = () => el.scrollWidth > el.clientWidth + 1
      || el.offsetHeight > parseFloat(getComputedStyle(el).lineHeight) * righe + 2;
    while (troppo() && t > 48) el.style.setProperty("--t", (t -= 2) + "px");
    if (troppo()) sborda = true;
  });
  radice.querySelectorAll("[data-adatta]").forEach((el) => {
    const min = Number(el.dataset.adatta);
    let s = 1;
    // 6 px di tolleranza: come nelle proposte, l'ultima riga può entrare un poco nel margine in fondo.
    const pieno = () => el.scrollHeight > el.clientHeight + 6;
    while (pieno() && s > min) el.style.setProperty("--s", s = Math.round((s - .02) * 100) / 100);
    if (pieno()) sborda = true;
  });
  return sborda;
}

/**
 * Cosa manca a un post per essere pronto da pubblicare, a parole ("la
 * quota"): vuoto = pronto. La usano l'elenco (Pronto / Da completare) e la
 * testata del post aperto, così dicono la stessa cosa. Salvare si può lo
 * stesso: salva() blocca solo meta, giorno della gita e sponsor.
 */
/** Come chiamare un post nell'elenco e nei nomi dei file: la prima riga del titolo, o del sottotesto se non ha titolo. */
function nomePost(ev) {
  return (String(ev.title || "").trim() || String(ev.subtitle || "").trim()).split("\n")[0].trim();
}

function mancanti(ev) {
  const manca = [];
  // Un post può essere solo un titolo o solo un sottotesto; la gita ha sempre la meta.
  if (ev.kind === "gita" ? !String(ev.title || "").trim() : !nomePost(ev)) {
    manca.push(ev.kind === "gita" ? "la meta" : "il titolo o il sottotesto");
  }
  if (ev.kind === "gita") {
    if (!ev.event_date) manca.push("il giorno");
    if (!(ev.stops || []).some(([t, l]) => t || l)) manca.push("le partenze");
    if (ev.show_price !== false && !(ev.prices || []).some((p) => p && p[1])) manca.push("la quota");
    if (!ev.deadline) manca.push("la scadenza delle iscrizioni");
  } else if (ev.kind === "cena" || ev.kind === "gara") {
    // Corsi e servizi possono non avere un giorno; una cena o una gara no.
    if (!ev.event_date) manca.push("la data");
  } else if (ev.kind === "sponsor" && !ev.sponsor_id) {
    manca.push("lo sponsor");
  }
  return manca;
}

/** La rubrica della pagina (righe di social_contacts, già in ordine). */
function impostaContatti(righe) {
  SOCIAL.contatti = righe.filter((r) => r && r.name && r.phone)
    .map(({ id, name, phone, hours, is_default }) => ({ id, name, phone, hours: hours || "", is_default: !!is_default }));
}

/** I contatti di un post, nel suo ordine; gli id tolti dalla rubrica si saltano. */
function contattiDi(ev) {
  return (ev.contacts || []).map((id) => SOCIAL.contatti.find((c) => c.id === id)).filter(Boolean);
}

/* Foto della meta; senza, un paesaggio disegnato (la C perdona foto mediocri,
 * e anche nessuna foto). */
function photo(w, h, src) {
  if (src) return `<img class="abs" src="${escS(src)}" style="left:0;top:0;width:${w}px;height:${h}px;object-fit:cover">`;
  return `<svg class="abs" style="left:0;top:0" width="${w}" height="${h}" viewBox="0 0 1080 1080" preserveAspectRatio="xMidYMid slice">
    <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3E7CB8"/><stop offset=".7" stop-color="#BFD7EC"/></linearGradient>
    <linearGradient id="snow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#C9D7E4"/></linearGradient></defs>
    <rect width="1080" height="1080" fill="url(#sky)"/>
    <polygon fill="#8FA9C4" points="0,560 160,420 300,500 470,330 600,450 760,300 900,420 1080,340 1080,1080 0,1080"/>
    <polygon fill="url(#snow)" points="0,700 200,520 340,610 560,420 740,600 900,500 1080,640 1080,1080 0,1080"/>
    <polygon fill="#5E7890" opacity=".35" points="560,420 610,470 590,520 640,600 560,560 520,480"/>
    <polygon fill="#2E4A63" points="0,860 140,780 260,840 420,760 600,880 800,790 1080,900 1080,1080 0,1080"/>
    <polygon fill="#fff" points="0,960 1080,900 1080,1080 0,1080"/></svg>`;
}

/* Righe del calendario: [categoria, "DD/MM", meta, corso]. */
function calRows(rows) {
  return rows.map(([k, d, dest, corso]) => { const C = categoria(k);
    return `<div style="display:flex;align-items:center;gap:22px;padding:14px 0;border-bottom:2px solid #E4E6EB">
      <span class="pill" style="background:${C.c};color:${C.ink};font-size:36px;padding:8px 0;width:250px;flex:none;text-align:center">${escS(C.day)} ${escS(d)}</span>
      <span style="font-size:56px;font-weight:700;line-height:1.1;color:#14202E">${escS(dest)}</span>
      ${corso ? `<span style="margin-left:auto;flex:none;background:${CAT.corso.c};color:#fff;border-radius:14px;padding:6px 16px;display:flex;align-items:center;gap:8px;font-size:34px;font-weight:800">${skier(42)}Corso</span>` : ""}</div>`; }).join("");
}

// ---------------------------------------------------------------------------
// C · Skipass
// ---------------------------------------------------------------------------

/**
 * Post o story di una gita o di un evento (modello da modelloPost()). Il
 * biglietto è una colonna: foto, testo, telefoni. Con poco testo la foto si
 * allunga invece di lasciare bianco in fondo; con tanto, fit() riduce il testo.
 */
function disegnaPost(s, stile = STILE) {
  if (stile === "montagna") return disegnaMontagna(s);
  if (stile === "biglietto") return postBiglietto(s);
  if (stile === "calendario") return postCalendario(s);
  if (stile === "divano") return postDivano(s);
  const C = categoria(s.cat), st = s.fmt === "story", W = 1080, H = st ? 1920 : 1080;
  const m = 60, k = st ? 1.4 : 1;
  // Story: il biglietto finisce sopra la fascia della risposta di Instagram,
  // logo e bollo scendono sotto quella del profilo.
  const cardH = st ? H - m - SAFE.bottom : H - m * 2, su = st ? SAFE.top - m : 0;
  // La foto non scende sotto il bollo della data (la pastiglia è più bassa).
  const fotoMin = st ? (s.date ? 480 : 380) : (s.date ? 225 : 150);
  const t = testoBiglietto(s, C.txt, k);
  const notch = `<div style="position:relative;height:0;flex:0 0 auto">
      <div class="abs" style="left:-30px;top:-30px;width:60px;height:60px;border-radius:50%;background:${C.c}"></div>
      <div class="abs" style="right:-30px;top:-30px;width:60px;height:60px;border-radius:50%;background:${C.c}"></div>
      <div class="abs" style="left:40px;right:40px;top:-2px;border-top:4px dashed #C7D0DA"></div></div>`;
  return `<div class="cv" style="width:${W}px;height:${H}px;background:${C.c}">${fiocchi(W, H)}
    <div class="abs" data-biglietto style="left:${m}px;right:${m}px;top:${m}px;height:${cardH}px;background:#fff;border-radius:40px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 14px 40px rgba(0,0,0,.25)">
      <div style="position:relative;flex:3 1 0;min-height:${fotoMin}px;max-height:${st ? 820 : 460}px">
        ${fotoPiena(s.photo)}
        <div class="abs" style="left:0;top:${su}px;background:#fff;padding:18px 26px;border-radius:0 0 28px 0${su ? ";border-top-right-radius:28px" : ""}">
          <img class="logo" src="${SOCIAL.logo}" style="height:${100 * (st ? 1.2 : 1)}px"></div>
        <div class="abs" style="right:40px;top:${su + 36}px">${s.date ? badge(s, st ? 1.3 : 1) : pastiglia(C, k)}</div>
      </div>
      ${notch}
      <div data-testo data-k="${k}" style="--t:${t.T}px;--b:${t.B}px;--p:${t.P}px;flex:1 0 auto;display:flex;flex-direction:column;justify-content:center;gap:calc(var(--b) * .6);padding:${36 * k}px 56px ${30 * k}px">
        ${t.html}</div>
      ${telefoni(s.contatti, st ? 1.2 : 1)}
    </div>
    ${st ? `<div class="abs" style="left:0;right:0;top:${m + cardH + 56}px;text-align:center;color:${C.ink};font-size:46px;font-weight:800;letter-spacing:.12em;opacity:.9">SCI CLUB DON BOSCO</div>` : ""}
  </div>`;
}

/**
 * Montagna: la foto (o il paesaggio disegnato) a tutta immagine con un velo
 * scuro in alto, il titolo bianco grande, un nastro con il giorno nel colore
 * della gita, e sotto una scheda bianca con tutto il resto. La scheda ha lo
 * stesso contenuto e lo stesso adattamento del biglietto (testoBiglietto(),
 * fit()): il testo grande va a capo e si riduce solo se non ci sta.
 */
function disegnaMontagna(s) {
  const C = categoria(s.cat), st = s.fmt === "story", W = 1080, H = st ? 1920 : 1080;
  const k = st ? 1.3 : 1, m = 50, sopra = st ? SAFE.top : 40, sotto = st ? SAFE.bottom : m;
  const titolo = String((s.kind === "gita" ? s.dest : s.title) || "").trim();
  const t = testoBiglietto(s, C.txt, k, false);
  const corso = s.corso ? `<div style="flex:none;background:${CAT.corso.c};color:#fff;border:6px solid #fff;border-radius:999px;padding:${8 * k}px ${24 * k}px;display:flex;align-items:center;gap:10px;font-size:${42 * k}px;font-weight:800;transform:rotate(-6deg);box-shadow:0 8px 20px rgba(0,0,0,.3)">${skier(46 * k)}Corso</div>` : "";
  // Senza testo per la scheda (post di solo titolo) restano i telefoni, in fondo.
  const scheda = t.html || s.contatti.length ? `<div data-biglietto style="flex:${t.html ? "1 1 0" : "0 0 auto"};min-height:0;margin-top:auto;background:#fff;border-radius:${30 * k}px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 12px 36px rgba(0,0,0,.3)">
        <div data-testo data-k="${k}" style="--t:${t.T}px;--b:${t.B}px;--p:${t.P}px;flex:1 0 auto;display:flex;flex-direction:column;justify-content:center;gap:calc(var(--b) * .5);padding:${t.html ? `${22 * k}px 40px` : "0"}">${t.html}</div>
        ${telefoni(s.contatti, k)}</div>` : "";
  return `<div class="cv" style="width:${W}px;height:${H}px;background:#0B2440">
    ${photo(W, H, s.photo)}
    <div class="abs" style="inset:0;background:linear-gradient(180deg,rgba(6,24,44,.82) 0%,rgba(6,24,44,.6) ${st ? 30 : 38}%,rgba(6,24,44,.15) 75%)"></div>
    ${fiocchi(W, Math.round(H * .45), .3, 5)}
    <div class="abs" style="left:${m}px;right:${m}px;top:${sopra}px;bottom:${sotto}px;display:flex;flex-direction:column;gap:${14 * k}px">
      <div style="flex:none;display:flex;justify-content:space-between;align-items:flex-start;gap:20px">
        <div style="background:#fff;border-radius:18px;padding:8px 16px"><img class="logo" src="${SOCIAL.logo}" style="height:${72 * k}px"></div>${corso}</div>
      ${titolo ? `<div data-titolofoto="${st ? 3 : 2}" style="flex:none;font-size:${corpoTitolo(titolo.length) * k}px;font-weight:800;letter-spacing:-.035em;line-height:.95;color:#fff;text-wrap:balance">${escS(titolo)}</div>` : ""}
      <div style="flex:none;margin:${4 * k}px -${m + 30}px ${10 * k}px;background:${C.c};color:${C.ink};transform:rotate(-3deg);text-align:center;padding:${8 * k}px ${m + 40}px;font-size:${50 * k}px;font-weight:800;box-shadow:0 8px 24px rgba(0,0,0,.25)">${escS(s.date || C.label)}</div>
      ${scheda}
    </div>
  </div>`;
}

/** Calendario Montagna (1080×1350): paesaggio di sera, righe bianche alte. */
function calendarioMontagna(titolo, righe) {
  const W = 1080, H = 1350, m = 50;
  // Con più di sei gite le righe si abbassano un po', fino al 70%.
  const f = righe.length > 6 ? Math.max(.7, 6 / righe.length) : 1;
  const conCorso = righe.some((r) => r[3]);
  const rows = righe.map(([kc, d, dest, corso]) => { const C = categoria(kc);
    return `<div style="display:flex;align-items:center;gap:${24 * f}px;background:#fff;border-radius:22px;padding:${12 * f}px 20px ${12 * f}px 12px;box-shadow:0 6px 18px rgba(0,0,0,.2)">
      <div style="width:${190 * f}px;flex:none;border-radius:16px;background:${C.c};color:${C.ink};text-align:center;padding:${6 * f}px 0 ${8 * f}px">
        ${C.day ? `<div style="font-size:${38 * f}px;font-weight:800">${escS(C.day)}</div>` : ""}<div style="font-size:${62 * f}px;font-weight:800;line-height:.95">${escS(d)}</div></div>
      <div style="flex:1;min-width:0;font-size:${58 * f}px;font-weight:800;letter-spacing:-.02em;line-height:1.05;color:#14202E">${escS(dest)}</div>
      ${corso ? `<div style="width:${88 * f}px;height:${88 * f}px;flex:none;border-radius:50%;background:${CAT.corso.c};display:flex;align-items:center;justify-content:center">${skier(56 * f)}</div>` : ""}</div>`; }).join("");
  return `<div class="cv" style="width:${W}px;height:${H}px;background:#0B2440">
    ${photo(W, H, null)}
    <div class="abs" style="inset:0;background:linear-gradient(180deg,rgba(6,24,44,.88) 0%,rgba(6,24,44,.7) 55%,rgba(6,24,44,.45) 100%)"></div>
    ${fiocchi(W, H, .3, 3)}
    <div class="abs" style="left:${m}px;right:${m}px;top:44px;bottom:40px;display:flex;flex-direction:column;gap:22px">
      <div style="flex:none;display:flex;align-items:center;justify-content:space-between;gap:20px">
        <div style="min-width:0"><div style="font-size:42px;font-weight:800;color:#FCCF02">Calendario gite</div>
          <div data-titolofoto="2" style="font-size:110px;font-weight:800;letter-spacing:-.04em;line-height:.95;color:#fff;text-wrap:balance">${escS(titolo)}</div></div>
        <div style="flex:none;background:#fff;border-radius:22px;padding:12px 18px"><img class="logo" src="${SOCIAL.logo}" style="height:110px"></div></div>
      <div style="flex:1;min-height:0;display:flex;flex-direction:column;gap:${18 * f}px">${rows}</div>
      ${conCorso ? `<div style="flex:none;display:flex;align-items:center;gap:14px;font-size:38px;font-weight:700;color:#fff"><span style="width:60px;height:60px;border-radius:50%;background:${CAT.corso.c};display:inline-flex;align-items:center;justify-content:center">${skier(40)}</span>con il corso</div>` : ""}
    </div>
  </div>`;
}

/** Misure del calendario del mese nella grafica scelta: 4:5 in tutte tranne il ritocco. */
const misureCalendario = (stile = STILE) => (stile === "ritocco" ? { w: 1080, h: 1080 } : { w: 1080, h: 1350 });

/** Misure del post (non della story) nella grafica scelta: le grafiche della 2.8 sono 4:5. */
const misurePost = (stile = STILE) => ({ w: 1080, h: NUOVI.includes(stile) ? 1350 : 1080 });

/** Calendario del mese: righe [categoria, "DD/MM", meta, corso]; `mese` "2027-01" per l'intestazione
 *  delle grafiche della 2.8. Ritocco 1080×1080, le altre 1080×1350 (misureCalendario()). */
function disegnaCalendario(titolo, righe, stile = STILE, mese = "") {
  if (stile === "montagna") return calendarioMontagna(titolo, righe);
  if (stile === "biglietto") return meseBiglietto(titolo, righe, mese);
  if (stile === "calendario") return meseCalendario(titolo, righe, mese);
  if (stile === "divano") return meseDivano(titolo, righe);
  const bg = "#084C8D";
  return `<div class="cv" style="width:1080px;height:1080px;background:${bg}">${fiocchi(1080, 1080)}
    <div class="abs" style="left:60px;width:960px;top:60px;height:960px;background:#fff;border-radius:40px;overflow:hidden;box-shadow:0 14px 40px rgba(0,0,0,.25)">
      <div style="padding:44px 56px">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span class="pill" style="background:#FCCF02;color:#06396A;font-size:34px;padding:10px 26px">Calendario gite</span>
          <img class="logo" src="${SOCIAL.logo}" style="height:110px"></div>
        <div class="t-dest" data-fit style="font-size:88px;color:#084C8D;margin:18px 0 10px">${escS(titolo)}</div>${calRows(righe)}</div></div>
  </div>`;
}

// ---------------------------------------------------------------------------
// Grafiche della 2.8: A · Biglietto, B · Calendario, C · Divano
//
// Rifatte uguali dalle proposte di grafica/proposte-post-social/ (tavole,
// sorgenti e regole fisse nel README): post 4:5 (1080×1350) e story. Un solo
// blu e un solo giallo, quelli del logo; il titolo occupa sempre due righe,
// così il testo parte sempre dallo stesso punto e un testo lungo scende più in
// basso; orari, prezzi e scadenze in evidenza; in fondo le iscrizioni, grandi.
// I corpi stanno nel CSS qui sotto, moltiplicati per --s: fit() la abbassa
// quando il testo non ci sta, e i testi piccoli si fermano a --min (34 px nel
// post, 44 nella story, come nelle proposte).
// ---------------------------------------------------------------------------

const BLU = "#084C8D", GIALLO = "#FCCF02";
const NUOVI = ["biglietto", "calendario", "divano"];

(function stileNuovi() {
  if (typeof document === "undefined" || document.getElementById("stile-social-nuovi")) return;
  // z(): corpo che scende con --s ma non sotto il minimo; q(): misura che scende e basta.
  const z = (n) => `max(var(--min), calc(${n}px * var(--s)))`, q = (n) => `calc(${n}px * var(--s))`;
  const stile = document.createElement("style");
  stile.id = "stile-social-nuovi";
  stile.textContent = `
    .cv.nuovo { --s: 1; --min: 34px; }
    .cv.nuovo.story { --min: 44px; }
    .cv.nuovo b { font-weight: 800; }
    .cv.nuovo .logo-box { background: #fff; }
    .cv.nuovo .logo-box img { display: block; height: 150px; }
    .cv.nuovo .col { position: absolute; inset: 0; display: flex; flex-direction: column; overflow: hidden; }
    .cv.nuovo [data-righe] { font-size: calc(var(--t) * var(--s)); }
    .cv.nuovo .isc .tel { display: block; font-weight: 700; }
    .cv.nuovo .isc .tel span { font-weight: 500; }

    .sa .biglietto { position: absolute; left: 60px; right: 60px; top: 60px; bottom: 60px; background: #fff; border-radius: 40px;
      overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 14px 40px rgba(0,0,0,.25); }
    .sa.story .biglietto { bottom: 340px; }
    .sa .scena { position: relative; flex: 0 0 330px; }
    .sa.story .scena { flex-basis: 500px; }
    .sa .scena .foto, .sa .scena .paesaggio { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
    .sa .scena .figura { position: absolute; left: 330px; bottom: 16px; height: 64%; }
    .sa.story .scena .figura { bottom: 26px; height: 50%; }
    .sa .logo-box { position: absolute; left: 0; top: 0; padding: 18px 26px; border-radius: 0 0 28px 0; }
    .sa.story .logo-box { top: 190px; border-top-right-radius: 28px; }
    .sa.story .logo-box img { height: 195px; }
    .sa .bollo { position: absolute; right: 40px; top: 36px; background: #084C8D; color: #fff; border-radius: 28px; text-align: center; padding: 14px 26px 10px; }
    .sa.story .bollo { top: 226px; border-radius: 36px; padding: 18px 34px 13px; }
    .sa .bollo .g { font-size: 36px; font-weight: 700; }
    .sa.story .bollo .g { font-size: 47px; }
    .sa .bollo .n { font-size: 100px; font-weight: 800; line-height: .95; letter-spacing: -.03em; padding-bottom: 8px; }
    .sa.story .bollo .n { font-size: 130px; padding-bottom: 10px; }
    .sa .taglio { position: relative; height: 0; flex: 0 0 auto; }
    .sa .taglio i { position: absolute; left: 40px; right: 40px; top: -2px; border-top: 4px dashed #C7D0DA; }
    .sa .luna { position: absolute; top: 360px; width: 60px; height: 60px; border-radius: 50%; }
    .sa.story .luna { top: 530px; }
    .sa .testo { flex: 1 0 auto; display: flex; flex-direction: column; gap: ${q(22)}; padding: ${q(34)} 56px ${q(12)}; }
    .sa.story .testo { gap: ${q(29)}; padding: ${q(44)} 56px ${q(21)}; }
    .sa .tit { --t: 104px; min-height: calc((2 * .98 * 104px + 58px) * var(--s)); }
    .sa.story .tit { --t: 134px; min-height: calc(2 * .98 * 134px * var(--s)); }
    .sa .tit > div { font-weight: 800; letter-spacing: -.035em; line-height: .98; }
    .sa .tit small { display: block; font-size: ${z(40)}; font-weight: 700; letter-spacing: -.01em; color: #4A5361; margin-top: 12px; line-height: 1.15; white-space: pre-line; }
    .sa.story .tit small { font-size: ${z(48)}; }
    .sa .fatti { display: grid; grid-template-columns: auto 1fr; column-gap: 30px; row-gap: ${q(14)}; align-items: baseline; }
    .sa.story .fatti { row-gap: ${q(20)}; }
    .sa .fatti dt { font-size: ${z(36)}; font-weight: 600; color: #4A5361; }
    .sa.story .fatti dt { font-size: ${z(44)}; }
    .sa .fatti dd { font-size: ${z(50)}; font-weight: 700; line-height: 1.12; }
    .sa.story .fatti dd { font-size: ${z(56)}; }
    .sa .fatti b { color: #084C8D; }
    .sa .isc { flex: none; margin: 0 40px; border-top: 4px dashed #C7D0DA; padding: 20px 16px 26px; display: flex; gap: 22px; align-items: center; }
    .sa.story .isc { padding: 26px 16px 34px; }
    .sa .isc > svg { flex: none; width: 70px; height: 70px; fill: #084C8D; }
    .sa.story .isc > svg { width: 91px; height: 91px; }
    .sa .isc > div { font-size: ${z(40)}; font-weight: 600; line-height: 1.2; }
    .sa.story .isc > div { font-size: ${z(44)}; }
    .sa .isc > div > b { display: block; font-size: ${z(46)}; color: #084C8D; letter-spacing: -.02em; }
    .sa .firma { position: absolute; left: 0; right: 0; top: 1640px; text-align: center; font-size: 46px; font-weight: 800; letter-spacing: .12em; }
    .sa .righe { display: flex; flex-direction: column; }
    .sa .righe > div { display: flex; align-items: center; gap: 22px; padding: ${q(6)} 0; border-bottom: 2px solid #E4E6EB; }
    .sa .righe .giorno { flex: none; width: ${q(230)}; text-align: center; border-radius: 999px; font-size: ${q(36)}; font-weight: 800; padding: ${q(6)} 0; }
    .sa .righe .meta { font-size: ${q(50)}; font-weight: 700; line-height: 1.1; min-width: 0; }
    .sa .righe .corso { margin-left: auto; flex: none; display: flex; align-items: center; gap: 8px; font-size: ${q(34)}; font-weight: 800;
      color: #084C8D; border: 3px solid #084C8D; border-radius: 14px; padding: 2px 14px 2px 8px; }
    .sa .righe .corso svg, .sc .righe .corso svg { width: 1.2em; height: 1.2em; }

    .sb { background: #084C8D; }
    .sb .monti { position: absolute; left: 0; bottom: 0; width: 1080px; height: 330px; }
    .sb.story .monti { height: 520px; }
    /* Come nella proposta, le iscrizioni scendono fino a 26 px dal fondo del post. */
    .sb .col { padding: 56px 60px 26px; gap: ${q(34)}; }
    .sb.story .col { padding: 262px 60px 350px; gap: ${q(24)}; }
    .sb .testa, .sc .testa { flex: none; display: flex; }
    .sb .logo-box, .sc .logo-box { border-radius: 22px; padding: 12px 18px; }
    .sb .tit { flex: none; --t: 104px; color: #fff; min-height: calc(2 * .95 * 104px * var(--s)); }
    .sb.story .tit { --t: 110px; min-height: calc(2 * .95 * 110px * var(--s)); }
    .sb .tit > div { font-weight: 800; letter-spacing: -.035em; line-height: .95; }
    .sb .tit small { display: block; font-size: ${z(40)}; font-weight: 700; letter-spacing: -.01em; color: #FCCF02; margin-top: 12px; line-height: 1.15; white-space: pre-line; }
    .sb .centro { flex: none; display: flex; gap: ${q(44)}; align-items: center; }
    .sb.story .centro { padding-top: 22px; }
    .sb .foglio { flex: none; width: ${q(430)}; background: #fff; border-radius: 28px; text-align: center; position: relative;
      box-shadow: 0 16px 40px rgba(0,0,0,.35); transform: rotate(-2deg); }
    .sb .foglio .mese { font-size: ${q(46)}; font-weight: 800; border-radius: 28px 28px 0 0; padding: ${q(30)} 0 ${q(14)}; letter-spacing: -.01em; }
    .sb .anello { position: absolute; top: -22px; width: 30px; height: 58px; border-radius: 15px; background: #D5DAE1; border: 5px solid #14202E; }
    .sb .foglio .giorno { font-size: ${z(48)}; font-weight: 700; margin-top: ${q(18)}; }
    .sb .foglio .num { font-size: ${q(250)}; font-weight: 800; line-height: .82; letter-spacing: -.05em; margin-top: ${q(6)}; }
    .sb.story .foglio .num { font-size: ${q(220)}; }
    .sb .foglio .ora { font-size: ${z(58)}; font-weight: 800; padding: ${q(14)} 0 ${q(28)}; }
    .sb .dati { flex: 1; color: #fff; min-width: 0; }
    .sb .dati .et { font-size: ${z(38)}; font-weight: 600; }
    .sb.story .dati .et { font-size: ${z(44)}; }
    .sb .dati .et ~ .et { margin-top: ${q(26)}; }
    .sb .dati .v { font-size: ${z(56)}; font-weight: 800; line-height: 1.08; letter-spacing: -.02em; margin-top: 6px; }
    .sb .dati b { color: #FCCF02; }
    .sb .dati small { font-size: ${z(40)}; font-weight: 600; letter-spacing: 0; color: #fff; }
    .sb.story .dati small { font-size: ${z(44)}; }
    .sb .evid { flex: none; background: #FCCF02; border-radius: 28px; padding: ${q(28)} 40px; color: #084C8D; box-shadow: 0 12px 30px rgba(0,0,0,.3);
      font-size: ${z(54)}; font-weight: 800; letter-spacing: -.02em; line-height: 1.1; }
    .sb .isc { flex: none; margin-top: auto; display: flex; gap: 24px; align-items: center; background: #fff; color: #084C8D;
      border-radius: 28px; padding: 20px 32px; box-shadow: 0 12px 30px rgba(0,0,0,.25); }
    .sb .isc > svg, .sc .isc > svg { flex: none; width: 72px; height: 72px; fill: currentColor; }
    .sb .isc > div, .sc .isc > div { font-size: ${z(40)}; font-weight: 600; line-height: 1.2; }
    .sb.story .isc > div, .sc.story .isc > div { font-size: ${z(44)}; }
    .sb .isc > div > b, .sc .isc > div > b { display: block; font-size: ${z(48)}; letter-spacing: -.02em; }
    .sb.story .isc > div > b { font-size: ${z(46)}; }
    .sb .mese-intero { flex: none; background: #fff; border-radius: 28px; box-shadow: 0 16px 40px rgba(0,0,0,.35); position: relative; padding-bottom: 18px; }
    .sb .mese-intero .mese { background: #FCCF02; color: #084C8D; font-size: ${q(50)}; font-weight: 800; text-align: center;
      border-radius: 28px 28px 0 0; padding: ${q(26)} 0 ${q(12)}; }
    .sb .righe { padding: 6px 28px 0; }
    .sb .righe > div { display: flex; align-items: center; gap: 20px; padding: ${q(13)} 0; border-bottom: 2px solid #E4E6EB; }
    .sb .righe > div:last-child { border-bottom: 0; }
    .sb .righe .giorno { flex: none; width: ${q(210)}; text-align: center; border-radius: 999px; font-size: ${q(36)}; font-weight: 800; padding: ${q(6)} 0; }
    .sb .righe .meta { font-size: ${q(52)}; font-weight: 700; line-height: 1.1; min-width: 0; }
    .sb .righe .corso { margin-left: auto; flex: none; font-size: ${q(34)}; font-weight: 800; color: #084C8D; border: 3px solid #084C8D; border-radius: 14px; padding: 2px 14px; }

    .sc .monti { position: absolute; left: 0; top: 380px; width: 1080px; height: 400px; }
    .sc.story .monti { top: 560px; }
    .sc .col { padding: 56px 64px; }
    .sc.story .col { padding: 262px 64px 352px; }
    .sc .nome { flex: none; --t: 150px; height: ${q(270)}; margin-top: ${q(28)}; }
    .sc.story .nome { height: auto; margin-top: ${q(44)}; }
    .sc .nome > div { font-weight: 800; letter-spacing: -.045em; line-height: .9; }
    .sc .scena { flex: none; height: ${q(150)}; position: relative; z-index: 1; margin-bottom: -14px; }
    .sc.story .scena { flex: 1 1 0; height: auto; min-height: 0; }
    .sc .scena svg { position: absolute; inset: 0; width: 100%; height: 100%; }
    .sc .nastro { flex: none; position: relative; z-index: 2; margin: 0 -110px; transform: rotate(-2deg); text-align: center; font-size: ${q(72)};
      font-weight: 800; letter-spacing: -.03em; padding: 16px 0 22px; white-space: nowrap; box-shadow: 0 10px 24px rgba(6,57,106,.3); }
    .sc.story .nastro { font-size: ${q(88)}; }
    .sc .nastro.mese { margin-top: ${q(34)}; }
    /* Nel post nome, disegno e fascia stanno fermi: se il testo non ci sta si stringe solo il riquadro (data-adatta). */
    .sc .scheda { flex: 1 1 auto; min-height: 0; overflow: hidden; display: flex; flex-direction: column; margin-top: ${q(34)}; background: #fff; color: #084C8D;
      border-radius: 28px; padding: 22px 32px 18px; box-shadow: 0 12px 30px rgba(0,0,0,.18); }
    .sc.story .scheda { flex: none; overflow: visible; margin-top: ${q(44)}; }
    .sc .info { flex: 1 0 auto; }
    .sc .gancio { font-size: ${z(58)}; font-weight: 800; letter-spacing: -.025em; line-height: 1.1; }
    .sc.story .gancio { font-size: ${z(66)}; }
    .sc .riga { font-size: ${z(46)}; font-weight: 700; margin-top: 8px; line-height: 1.15; }
    .sc.story .riga { font-size: ${z(56)}; }
    .sc .poi { font-size: ${z(40)}; font-weight: 600; margin-top: 8px; line-height: 1.2; white-space: pre-line; }
    .sc.story .poi { font-size: ${z(46)}; }
    .sc .info b { background: #084C8D; color: #FCCF02; padding: 0 .16em; border-radius: .14em; -webkit-box-decoration-break: clone; box-decoration-break: clone; }
    .sc .isc { flex: none; display: flex; gap: 24px; align-items: center; margin-top: 14px; padding-top: 14px; border-top: 3px solid #C7D0DA; }
    .sc.story .isc > svg { width: 70px; height: 70px; }
    .sc .righe { flex: 1 0 auto; display: flex; flex-direction: column; justify-content: center; gap: 4px; }
    .sc .righe > div { display: flex; align-items: center; gap: 20px; }
    .sc .righe .giorno { flex: none; width: ${q(210)}; text-align: center; border-radius: 999px; font-size: ${q(36)}; font-weight: 800; padding: 4px 0; }
    .sc .righe .meta { font-size: ${q(50)}; font-weight: 800; letter-spacing: -.02em; min-width: 0; }
    .sc .righe .corso { margin-left: auto; display: flex; align-items: center; gap: 8px; font-size: ${q(36)}; font-weight: 800; }`;
  document.head.append(stile);
})();

/* Il colore del post: le gite quello del loro giorno (trip_days), i corsi il
 * giallo (lo stesso delle domeniche), tutto il resto il blu del club. La
 * scritta sopra è bianca o blu, quella che si legge meglio. */
const scrittaSu = (c) => (contrasto(c, "#FFFFFF") >= contrasto(c, BLU) ? "#FFFFFF" : BLU);
function coloreNuovo(k) {
  const c = k === "corso" ? GIALLO : /^g\d$/.test(k) ? categoria(k).c : BLU;
  return { c, ink: scrittaSu(c) };
}

/* Orari, prezzi e date dentro un testo scritto a mano ("ore 20:00", "€ 30",
 * "mercoledì 7 aprile", "14/01"): finiscono in <b>, che ogni grafica mette in
 * evidenza a modo suo. Il prezzo viene prima dell'orario: "12.50 €" è un prezzo. */
const EVIDENZA = new RegExp(`€\\s?\\d+(?:[.,]\\d{1,2})?|\\d+(?:[.,]\\d{1,2})?\\s?€|(?:ore\\s)?\\d{1,2}[:.]\\d{2}`
  + `|(?:(?:${GIORNI.join("|")})\\s)?\\d{1,2}\\s(?:${MESI.join("|")})|\\d{1,2}\\/\\d{1,2}`, "gi");
const evidenzia = (testo) => escS(testo).replace(EVIDENZA, "<b>$&</b>");

/** "Gita a La Thuile": il titolo dice cos'è (README delle proposte); `capo` va fra "Gita a" e la meta. */
const titoloGita = (dest, capo = " ") => (/^gita\b/i.test(dest || "") ? escS(dest) : `Gita a${capo}${escS(dest)}`);

/* Il titolo del post; un post di solo sottotesto prende il nome del tipo
 * ("Servizi"), così la grafica resta quella e il sottotesto sta al suo posto. */
const titoloNuovo = (s, capo) => (s.kind === "gita" ? titoloGita(s.dest, capo)
  : escS(String(s.title || "").trim() || categoria(s.cat).label));

const partenze = (s) => (s.stops || []).filter(([t, l]) => t || l)
  .map(([t, l]) => [String(t || "").replace(/^ore\s*/i, ""), l || ""]);

const icoMail = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm1 2.4V17h16V7.4l-8 5.3-8-5.3zM5.8 7 12 11.1 18.2 7H5.8z"/></svg>';

/** In fondo a ogni post: come ci si iscrive (in negozio o via mail) e i telefoni scelti per il post. */
function iscrizioni(contatti = []) {
  const tel = contatti.map((c) => `<span class="tel">${icoTel("1em", "currentColor")} <span>${escS(c.name)}</span> ${escS(c.phone)}${c.hours
    ? ` <span>${escS(c.hours)}</span>` : ""}</span>`).join("");
  return `<div class="isc">${icoMail}<div>${escS(SOCIAL.iscrizioni)}<b>${escS(SOCIAL.mail)}</b>${tel}</div></div>`;
}

const logoNuovo = () => `<div class="logo-box"><img src="${SOCIAL.logo}" alt=""></div>`;

/* Lo sciatore sul tappetino del corso, nelle righe del calendario. */
const sciatore = (col = "currentColor") => `<svg viewBox="0 0 250 240" aria-hidden="true"><rect x="4" y="208" width="242" height="16" rx="8" fill="${col}"/>
  <g stroke="${col}" stroke-width="26" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M120 70 L84 136"/><path d="M114 82 L192 92"/>
  <path d="M84 136 L154 142 L140 206 L172 206"/></g><circle cx="134" cy="38" r="27" fill="${col}"/></svg>`;

/** Le gite del mese, una riga ciascuna: il giorno nel colore della gita, la meta, il corso (`corso`, l'HTML). */
function righeMese(righe, breve, corso) {
  return righe.map(([k, d, dest, c]) => {
    const C = categoria(k), giorno = `${C.day} ${breve ? Number(String(d).slice(0, 2)) : d}`.trim();
    return `<div><span class="giorno" style="background:${C.c};color:${scrittaSu(C.c)}">${escS(giorno)}</span>
      <span class="meta">${escS(dest)}</span>${c ? corso : ""}</div>`;
  }).join("");
}

// --- A · Biglietto -----------------------------------------------------------

/* Senza foto, in alto il paesaggio disegnato (largo: il post ne mostra la
 * parte bassa, la story tutto); nel corso, con la figura dell'esercizio. */
const PAESAGGIO = `<svg class="paesaggio" viewBox="0 0 1080 600" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
  <defs><linearGradient id="cielo-a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3E7CB8"/><stop offset=".75" stop-color="#fff"/></linearGradient>
  <linearGradient id="neve-a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#C9D7E4"/></linearGradient></defs>
  <rect width="1080" height="600" fill="url(#cielo-a)"/>
  <polygon fill="#8FA9C4" points="0,400 150,290 290,350 460,230 600,330 760,220 900,310 1080,250 1080,600 0,600"/>
  <polygon fill="url(#neve-a)" points="0,480 200,360 340,430 560,300 740,430 900,360 1080,450 1080,600 0,600"/>
  <polygon fill="#5E7890" opacity=".35" points="560,300 610,350 590,390 640,450 560,420 520,350"/>
  <polygon fill="#2E4A63" points="0,540 140,500 260,530 420,490 600,540 800,500 1080,545 1080,600 0,600"/>
  <polygon fill="#fff" points="0,585 1080,560 1080,600 0,600"/></svg>`;
const FIGURA = `<svg class="figura" viewBox="0 0 230 240" aria-hidden="true"><rect x="18" y="214" width="200" height="18" rx="9" fill="#FCCF02"/>
  <g stroke="#084C8D" stroke-width="24" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M120 70 L84 136"/><path d="M114 82 L192 92"/>
  <path d="M84 136 L154 142 L140 206 L172 206"/></g><circle cx="134" cy="38" r="25" fill="#084C8D"/></svg>`;

/* Il biglietto: in alto la foto con il logo e il bollo, il taglio, il testo, le iscrizioni. */
function biglietto(C, story, scena, bollo, testo, contatti) {
  return `<div class="cv nuovo sa${story ? " story" : ""}" style="width:1080px;height:${story ? 1920 : 1350}px;background:${C.c}">
    ${fiocchi(1080, story ? 1920 : 1350, C.c === GIALLO ? .5 : .3)}
    <div class="biglietto" data-adatta=".6">
      <div class="scena">${scena}${logoNuovo()}<div class="bollo">${bollo}</div></div>
      <div class="taglio"><i></i></div>
      <div class="testo">${testo}</div>
      ${iscrizioni(contatti)}
    </div>
    <div class="luna" style="left:30px;background:${C.c}"></div><div class="luna" style="right:30px;background:${C.c}"></div>
    ${story ? `<div class="firma" style="color:${C.ink}">SCI CLUB DON BOSCO</div>` : ""}
  </div>`;
}

/** A · Biglietto: il biglietto bianco sul colore del post, la foto in alto e il bollo con la data. */
function postBiglietto(s) {
  const C = coloreNuovo(s.cat), g = giornoDi(s.iso), gita = s.kind === "gita";
  const bollo = g ? `<div class="g">${maiuscola(GIORNI[g.getDay()])}</div><div class="n">${dataCorta(s.iso)}</div>`
    : `<div class="g">${escS(categoria(s.cat).label)}</div>`;
  const quota = s.prices.map(([n, v]) => (n ? `${escS(n)} <b>${escS(v)}</b>` : `<b>${escS(v)}</b>`)).join(" · ");
  const righe = gita ? [
    ["Partenze", partenze(s).map(([t, l]) => `${t ? `<b>ore ${escS(t)}</b> ` : ""}${escS(l)}`).join("<br>")],
    ["Quota", quota],
    ["Iscrizioni", s.scadenza && `entro <b>${escS(s.scadenza)}</b>`],
    ["Corso", s.corso && "nello stesso giorno"],
  ] : [...s.facts.map(([n, v]) => [escS(n), evidenzia(v)]), ["Quota", quota]];
  // La quota prima delle iscrizioni, come nella proposta.
  const iscr = righe.findIndex(([n]) => /^iscrizion/i.test(n));
  if (!gita && iscr >= 0) righe.splice(iscr, 0, righe.pop());
  const sub = gita ? "" : String(s.sub || "").trim();
  const testo = `<div class="tit"><div data-righe="2">${titoloNuovo(s)}</div>${sub ? `<small>${escS(sub)}</small>` : ""}</div>
    ${righe.some(([, v]) => v) ? `<dl class="fatti">${righe.filter(([, v]) => v).map(([n, v]) => `<dt>${n}</dt><dd>${v}</dd>`).join("")}</dl>` : ""}`;
  const scena = s.photo ? `<img class="foto" src="${escS(s.photo)}" alt="">` : PAESAGGIO + (s.cat === "corso" ? FIGURA : "");
  return biglietto(C, s.fmt === "story", scena, bollo, testo, s.contatti);
}

/** Calendario del mese in A: il bollo con mese e anno, le gite in righe nel biglietto. */
function meseBiglietto(titolo, righe, mese) {
  const [anno, m] = String(mese || "").split("-");
  const bollo = m ? `<div class="g">${maiuscola(MESI[m - 1])}</div><div class="n">${escS(anno)}</div>` : '<div class="g">Calendario</div>';
  const testo = `<div class="tit"><div data-righe="2">${escS(titolo)}</div></div>
    <div class="righe">${righeMese(righe, false, `<span class="corso">${sciatore()}Corso</span>`)}</div>`;
  return biglietto(coloreNuovo("cal"), false, PAESAGGIO, bollo, testo, []);
}

// --- B · Calendario ----------------------------------------------------------

/* Montagne di sera in bianco trasparente sul blu (un solo blu). */
const MONTI_B = `<svg class="monti" viewBox="0 0 1080 330" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
  <polygon fill="#fff" fill-opacity=".07" points="0,150 160,60 300,120 470,20 610,110 770,10 910,100 1080,40 1080,330 0,330"/>
  <polygon fill="#fff" fill-opacity=".11" points="0,230 200,130 340,190 560,80 740,200 900,140 1080,210 1080,330 0,330"/>
  <polygon fill="#fff" fill-opacity=".16" points="0,300 140,250 260,280 420,240 600,290 800,250 1080,295 1080,330 0,330"/></svg>`;

const fondoB = (story, corpo) => `<div class="cv nuovo sb${story ? " story" : ""}" style="width:1080px;height:${story ? 1920 : 1350}px">
    ${fiocchi(1080, story ? 1920 : 1350, .18)}${MONTI_B}
    <div class="col" data-adatta=".6"><div class="testa">${logoNuovo()}</div>${corpo}</div></div>`;

/**
 * B · Calendario: sempre il blu del club; il foglio a strappo porta la data,
 * con la testata nel colore del post (il giallo al posto del blu, che sul
 * fondo blu non si vedrebbe). Accanto le informazioni; sotto, in un riquadro
 * giallo, la scadenza delle iscrizioni. Negli eventi l'"Orario" va nel foglio
 * e "Iscrizioni" nel riquadro giallo; senza data il foglio non c'è.
 */
function postCalendario(s) {
  const g = giornoDi(s.iso), gita = s.kind === "gita", c = coloreNuovo(s.cat).c, testa = c === BLU ? GIALLO : c;
  const fatti = gita ? [] : s.facts.filter(([, v]) => String(v || "").trim());
  const ora = g && fatti.find(([n]) => /^(ora|orario|ore)$/i.test(String(n || "").trim()));
  const iscr = fatti.find(([n]) => /^iscrizion/i.test(String(n || "").trim()));
  const evid = gita ? s.scadenza && `Iscrizioni entro ${s.scadenza}` : iscr && `Iscrizioni ${iscr[1]}`;
  const quota = s.prices.map(([n, v]) => `<b>${escS(v)}</b>${n ? ` <small>${escS(n)}</small>` : ""}`).join("<br>");
  const dati = (gita ? [
    ["Partenze", partenze(s).map(([t, l]) => `${t ? `<b>${escS(t)}</b> ` : ""}${escS(l)}`).join("<br>")],
    ["Quota", quota],
    ["Corso", s.corso && "nello stesso giorno"],
  ] : [...fatti.filter((f) => f !== ora && f !== iscr).map(([n, v]) => [escS(n), evidenzia(v)]), ["Quota", quota]]).filter(([, v]) => v);
  const foglio = g ? `<div class="foglio"><i class="anello" style="left:26%"></i><i class="anello" style="right:26%"></i>
      <div class="mese" style="background:${testa};color:${scrittaSu(testa)}">${maiuscola(MESI[g.getMonth()])}</div>
      <div class="giorno">${maiuscola(GIORNI[g.getDay()])}</div>
      <div class="num" style="color:${testa === GIALLO ? BLU : suBianco(testa)}">${g.getDate()}</div>
      <div class="ora">${ora ? escS(ora[1]) : "&nbsp;"}</div></div>` : "";
  const sub = gita ? "" : String(s.sub || "").trim();
  return fondoB(s.fmt === "story", `
    <div class="tit"><div data-righe="2">${titoloNuovo(s)}</div>${sub ? `<small>${escS(sub)}</small>` : ""}</div>
    ${foglio || dati.length ? `<div class="centro">${foglio}<div class="dati">${dati.map(([n, v]) => `<div class="et">${n}</div><div class="v">${v}</div>`).join("")}</div></div>` : ""}
    ${evid ? `<div class="evid">${escS(evid)}</div>` : ""}
    ${iscrizioni(s.contatti)}`);
}

/** Calendario del mese in B: le gite in righe dentro il foglio, con la testata del mese (senza la griglia dei giorni). */
function meseCalendario(titolo, righe, mese) {
  const [anno, m] = String(mese || "").split("-");
  return fondoB(false, `
    <div class="tit"><div data-righe="2">${escS(titolo)}</div></div>
    <div class="mese-intero"><i class="anello" style="left:22%"></i><i class="anello" style="right:22%"></i>
      <div class="mese">${m ? `${maiuscola(MESI[m - 1])} ${escS(anno)}` : "Le gite del mese"}</div>
      <div class="righe">${righeMese(righe, false, '<span class="corso">Corso</span>')}</div></div>
    ${iscrizioni()}`);
}

// --- C · Divano --------------------------------------------------------------

/* Fondo di C: fiocchi e montagne stilizzate in bianco trasparente, più opache
 * sul giallo, dove il bianco si vede meno. */
const montiC = (giallo) => `<svg class="monti" viewBox="0 0 1080 400" preserveAspectRatio="none" aria-hidden="true">
  <polygon fill="#fff" fill-opacity="${giallo ? .34 : .16}" points="0,250 150,140 270,200 430,60 570,180 710,100 870,210 1080,110 1080,400 0,400"/>
  <polygon fill="#fff" fill-opacity="${giallo ? .5 : .24}" points="0,330 180,225 330,295 520,180 700,295 880,230 1080,305 1080,400 0,400"/></svg>`;

/* I disegni sopra la fascia, uno per tipo di post. Il divano vuoto con il
 * telecomando e gli sci (il corso, sempre sul giallo). */
const DIVANO = `<svg viewBox="0 0 780 370" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
  <ellipse cx="350" cy="352" rx="330" ry="14" fill="#084C8D" opacity=".18"/>
  <rect x="72" y="300" width="28" height="48" rx="6" fill="#14202E"/><rect x="560" y="300" width="28" height="48" rx="6" fill="#14202E"/>
  <rect x="80" y="56" width="500" height="196" rx="50" fill="#084C8D"/>
  <rect x="118" y="86" width="206" height="118" rx="38" fill="#fff" fill-opacity=".16"/><rect x="336" y="86" width="206" height="118" rx="38" fill="#fff" fill-opacity=".16"/>
  <rect x="40" y="222" width="580" height="92" rx="28" fill="#084C8D"/>
  <rect x="112" y="186" width="214" height="70" rx="26" fill="#fff" fill-opacity=".28"/><rect x="334" y="186" width="214" height="70" rx="26" fill="#fff" fill-opacity=".28"/>
  <rect x="18" y="138" width="104" height="176" rx="48" fill="#084C8D"/><rect x="538" y="138" width="104" height="176" rx="48" fill="#084C8D"/>
  <g transform="rotate(-10 215 205)"><rect x="160" y="190" width="110" height="30" rx="12" fill="#14202E"/>
    <circle cx="182" cy="205" r="7" fill="#B3261E"/><circle cx="208" cy="205" r="5" fill="#fff"/><circle cx="228" cy="205" r="5" fill="#fff"/><circle cx="248" cy="205" r="5" fill="#fff"/></g>
  <g transform="rotate(-9 700 350)">
    <line x1="752" y1="350" x2="752" y2="40" stroke="#14202E" stroke-width="9" stroke-linecap="round"/>
    <circle cx="752" cy="318" r="15" fill="none" stroke="#14202E" stroke-width="6"/><rect x="743" y="30" width="18" height="46" rx="8" fill="#14202E"/>
    <rect x="650" y="16" width="36" height="336" rx="18" fill="#B3261E"/><rect x="694" y="8" width="36" height="344" rx="18" fill="#B3261E"/>
    <rect x="650" y="16" width="36" height="46" rx="18" fill="#fff"/><rect x="694" y="8" width="36" height="46" rx="18" fill="#fff"/>
    <rect x="646" y="190" width="44" height="34" rx="8" fill="#14202E"/><rect x="690" y="186" width="44" height="34" rx="8" fill="#14202E"/></g></svg>`;
/* Il pullman della gita con gli sci sul tetto: blu sul giallo, bianco sugli altri colori (vetri nel colore del fondo). */
const pullman = (corpo, vetri) => `<svg viewBox="0 0 780 370" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
  <ellipse cx="390" cy="352" rx="350" ry="14" fill="#14202E" opacity=".15"/>
  <rect x="150" y="66" width="440" height="14" rx="7" fill="#14202E"/>
  <rect x="170" y="40" width="400" height="24" rx="12" fill="#14202E"/><rect x="170" y="40" width="44" height="24" rx="12" fill="#fff"/>
  <rect x="190" y="14" width="400" height="24" rx="12" fill="${corpo}"/><rect x="190" y="14" width="44" height="24" rx="12" fill="${vetri}"/>
  <rect x="60" y="86" width="660" height="236" rx="40" fill="${corpo}"/>
  <rect x="96" y="118" width="96" height="92" rx="16" fill="${vetri}"/><rect x="210" y="118" width="96" height="92" rx="16" fill="${vetri}"/>
  <rect x="324" y="118" width="96" height="92" rx="16" fill="${vetri}"/><rect x="438" y="118" width="96" height="92" rx="16" fill="${vetri}"/>
  <path d="M560 118 H664 Q690 118 694 146 L700 210 H560 Z" fill="${vetri}"/>
  <rect x="60" y="234" width="660" height="20" fill="#FCCF02"/><rect x="680" y="262" width="40" height="22" rx="8" fill="#FCCF02"/>
  <circle cx="200" cy="322" r="44" fill="#14202E"/><circle cx="200" cy="322" r="18" fill="#D5DAE1"/>
  <circle cx="590" cy="322" r="44" fill="#14202E"/><circle cx="590" cy="322" r="18" fill="#D5DAE1"/></svg>`;
/* Due calici che brindano (cene e feste, sul blu). */
const CALICI = `<svg viewBox="250 -10 280 300" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
  <g transform="rotate(14 330 300)"><path d="M275 60 C275 150 295 176 330 179 C365 176 385 150 385 60 Z" fill="#fff"/>
    <path d="M279 112 C283 160 300 173 330 175 C360 173 377 160 381 112 Z" fill="#FCCF02"/>
    <rect x="325" y="178" width="10" height="96" fill="#fff"/><ellipse cx="330" cy="276" rx="46" ry="10" fill="#fff"/></g>
  <g transform="rotate(-14 450 300)"><path d="M395 60 C395 150 415 176 450 179 C485 176 505 150 505 60 Z" fill="#fff"/>
    <path d="M399 112 C403 160 420 173 450 175 C480 173 497 160 501 112 Z" fill="#FCCF02"/>
    <rect x="445" y="178" width="10" height="96" fill="#fff"/><ellipse cx="450" cy="276" rx="46" ry="10" fill="#fff"/></g>
  <g fill="#fff"><polygon points="390,0 400,26 426,30 404,44 410,70 390,56 370,70 376,44 354,30 380,26"/>
    <circle cx="320" cy="20" r="8"/><circle cx="462" cy="18" r="8"/><circle cx="292" cy="58" r="6"/><circle cx="490" cy="56" r="6"/></g></svg>`;
/* Due porte da slalom (la gara, sul blu). */
const PALETTI = `<svg viewBox="0 0 780 370" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
  <ellipse cx="390" cy="352" rx="300" ry="14" fill="#14202E" opacity=".15"/>
  <rect x="236" y="40" width="16" height="312" rx="8" fill="#fff"/><path d="M252 52 L392 100 L252 148 Z" fill="#FCCF02"/>
  <rect x="508" y="80" width="16" height="272" rx="8" fill="#fff"/><path d="M524 92 L664 140 L524 188 Z" fill="#fff"/></svg>`;

function disegnoDivano(s, C) {
  if (s.kind === "gita") return C.c === GIALLO ? pullman(BLU, "#fff") : pullman("#fff", C.c);
  return { corso: DIVANO, cena: CALICI, gara: PALETTI }[s.cat] || "";
}

/* Il fondo di C: il colore del post, in alto il nome grande, poi il disegno
 * (scena), la fascia e il riquadro bianco con dentro le iscrizioni. Sul blu
 * il nome e la fascia sono gialli, sul giallo e sugli altri colori blu. */
function manifesto(C, story, nome, scena, fascia, dentro) {
  const giallo = C.c === GIALLO, blu = C.c === BLU;
  return `<div class="cv nuovo sc${story ? " story" : ""}" style="width:1080px;height:${story ? 1920 : 1350}px;background:${C.c};color:${C.ink}">
    ${fiocchi(1080, story ? 1920 : 1350, giallo ? .7 : .38)}${montiC(giallo)}
    <div class="col"${story ? ' data-adatta=".6"' : ""}>
      <div class="testa">${logoNuovo()}</div>
      <div class="nome" style="color:${blu ? GIALLO : C.ink}"><div data-righe="2">${nome}</div></div>
      ${scena === null ? "" : `<div class="scena">${scena}</div>`}
      <div class="nastro${scena === null ? " mese" : ""}" style="background:${blu ? GIALLO : BLU};color:${blu ? BLU : "#fff"}">${escS(fascia)}</div>
      <div class="scheda"${story ? "" : ' data-adatta=".6"'}>${dentro}</div>
    </div></div>`;
}

/**
 * C · Divano: il manifesto. In alto il nome ("Gita a La Thuile"), nella
 * fascia la data, sotto in un riquadro bianco il gancio scritto per il post
 * ("Tutti in pista!", social_events.hook) e i dati; orari, prezzi e scadenze
 * in un riquadrino blu con la scritta gialla.
 */
function postDivano(s) {
  const C = coloreNuovo(s.cat), gita = s.kind === "gita";
  const quota = s.prices.map(([n, v]) => `${escS(n || "Quota")} <b>${escS(v)}</b>`).join(" · ");
  const p = partenze(s);
  // Orario e luogo si capiscono da soli: senza etichetta, come nelle proposte.
  const fatto = ([n, v]) => `${n && !/^(ora|orario|ore|dove|luogo|quando)$/i.test(String(n).trim())
    ? `${escS(n)}${/^iscrizion/i.test(String(n).trim()) ? " " : ": "}` : ""}${evidenzia(v)}`;
  // Come nella proposta: l'orario e i prezzi su una riga sola, le iscrizioni in fondo.
  const fatti = (s.facts || []).filter(([, v]) => String(v || "").trim());
  const ora = fatti.find(([n]) => /^(ora|orario|ore)$/i.test(String(n || "").trim()));
  const iscr = fatti.find(([n]) => /^iscrizion/i.test(String(n || "").trim()));
  const righe = gita ? [
    p.length && `<div class="riga">Partenze: ${p.map(([t, l]) => `${t ? `<b>${escS(t)}</b> ` : ""}${escS(l)}`).join(" · ")}</div>`,
    quota && `<div class="riga">${quota}</div>`,
    s.corso && '<div class="poi">Nello stesso giorno c\'è il corso</div>',
    s.scadenza && `<div class="poi">Iscrizioni entro <b>${escS(s.scadenza)}</b></div>`,
  ] : [
    ...fatti.filter((f) => f !== iscr).map((f) => `<div class="riga">${fatto(f)}${f === ora && quota ? ` · ${quota}` : ""}</div>`),
    !ora && quota && `<div class="riga">${quota}</div>`,
    String(s.sub || "").trim() && `<div class="poi">${escS(String(s.sub).trim())}</div>`,
    iscr && `<div class="poi">${fatto(iscr)}</div>`,
  ];
  const dentro = `<div class="info">${s.hook ? `<div class="gancio">${escS(s.hook)}</div>` : ""}${righe.filter(Boolean).join("")}</div>${iscrizioni(s.contatti)}`;
  return manifesto(C, s.fmt === "story", titoloNuovo(s, "<br>"), disegnoDivano(s, C), s.date || categoria(s.cat).label, dentro);
}

/** Calendario del mese in C: il nome, la fascia "Le gite del mese" e le gite nel riquadro bianco (niente disegno). */
function meseDivano(titolo, righe) {
  const dentro = `<div class="righe">${righeMese(righe, true, `<span class="corso">${sciatore()}corso</span>`)}</div>${iscrizioni()}`;
  return manifesto(coloreNuovo("cal"), false, escS(titolo), null, "Le gite del mese", dentro);
}

/** Copertina Facebook (820×312). */
function disegnaCopertina(titolo, sotto) {
  return `<div class="cv" style="width:820px;height:312px;background:#084C8D">
    <div class="abs" style="left:96px;right:96px;top:28px;bottom:28px;background:#fff;border-radius:22px;overflow:hidden">
      <div class="abs" style="left:0;top:0;bottom:0;width:190px;overflow:hidden">${photo(190, 240)}</div>
      <div class="abs" style="left:190px;top:0;bottom:0;border-left:4px dashed #C7D0DA"></div>
      <img class="logo abs" src="${SOCIAL.logo}" style="right:24px;top:20px;height:70px">
      <div class="abs" style="left:220px;right:24px;bottom:22px">
        <div class="t-dest" style="font-size:54px;color:#084C8D">${escS(titolo)}</div>
        <div style="font-size:17px;color:#5B6472;font-weight:600;margin-top:8px">${escS(sotto)}</div></div></div></div>`;
}

// ---------------------------------------------------------------------------
// Campagne sponsor
//
// Stessa struttura per ogni sponsor, colori e loghi suoi: fondo scuro e
// chiaro, accento (i rombi del logo Santero, per dire). Il blu del club resta
// solo nella firma, il logo del club solo su bianco (brand-guidelines §3).
// Se lo sponsor vende alcolici l'avvertenza di legge sta su ogni formato, e
// il vino resta nel dopo-sci: nessun bicchiere in pista, nessun bambino.
// ---------------------------------------------------------------------------

/** "#432A09" mescolato col bianco (quota 0–1): le creste più chiare del fondo. */
function schiarisci(hex, quota) {
  const n = parseInt(hex.slice(1), 16);
  const c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.round(v + (255 - v) * quota));
  return "#" + c.map((v) => v.toString(16).padStart(2, "0")).join("");
}

/** Contrasto WCAG fra due colori "#rrggbb" (1–21). */
function contrasto(a, b) {
  const lum = (hex) => {
    const n = parseInt(hex.slice(1), 16);
    const [r, g, bl] = [n >> 16, (n >> 8) & 255, n & 255].map((v) => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

/** Colori e loghi di uno sponsor, pronti per i disegni. */
function marchio(sp) {
  return {
    nome: sp.name, livello: sp.level || "Sponsor",
    scuro: sp.color_dark, chiaro: sp.color_light, accento: sp.color_accent,
    crinale: schiarisci(sp.color_dark, .1), crinaleFronte: schiarisci(sp.color_dark, .2),
    logo: sp.logo, logoScuro: sp.logo_dark || null, alcol: !!sp.alcohol,
  };
}

/* Il logo per fondi scuri; se lo sponsor non l'ha dato, quello normale su un
 * riquadro chiaro, così resta leggibile. */
function logoSuScuro(M, h) {
  if (M.logoScuro) return `<img src="${escS(M.logoScuro)}" style="height:${h}px;display:block">`;
  if (!M.logo) return `<span style="font-size:${h * .5}px;font-weight:800">${escS(M.nome)}</span>`;
  return `<span style="display:inline-block;background:${M.chiaro};border-radius:${h * .2}px;padding:${h * .15}px ${h * .25}px"><img src="${escS(M.logo)}" style="height:${h}px;display:block"></span>`;
}
const logoSuChiaro = (M, h) => M.logo
  ? `<img src="${escS(M.logo)}" style="height:${h}px;display:block">`
  : `<span style="font-size:${h * .5}px;font-weight:800">${escS(M.nome)}</span>`;

const avvertenza = (M, px, extra = "") => M.alcol
  ? `<div style="font-size:${px}px;font-weight:500;opacity:.75;${extra}">${escS(SOCIAL.avvertenzaAlcol)}</div>` : "";

const rombo = (col, em) => `<span style="display:inline-block;width:${em}em;height:${em}em;background:${col};transform:rotate(45deg);border-radius:.12em"></span>`;

/* Crinale: neve nell'accento, come i rombi del logo. */
const crinale = (M, w, h, b = 0) => `<svg class="abs" style="left:0;bottom:${b}px" width="${w}" height="${h}" viewBox="0 0 1080 300" preserveAspectRatio="xMidYMax slice">
  <polygon fill="${M.crinale}" points="0,170 200,70 360,150 560,20 760,140 900,60 1080,150 1080,300 0,300"/>
  <polygon fill="${M.crinaleFronte}" points="0,220 260,110 440,200 640,90 860,200 1080,120 1080,300 0,300"/>
  <polygon fill="${M.accento}" points="640,90 585,120 700,120"/>
  <polygon fill="${M.accento}" points="260,110 189,140 320,140"/></svg>`;

/** Titolo su più righe: un a capo nel testo = una riga. Con `accento` l'ultima riga è colorata. */
function righeTitolo(testo, accento) {
  const righe = String(testo || "").split("\n").map(escS);
  if (accento && righe.length > 1) righe[righe.length - 1] = `<span style="color:${accento}">${righe[righe.length - 1]}</span>`;
  return righe.join("<br>");
}

/** Etichetta in alto: "MAIN SPONSOR · STAGIONE 2026/27". */
const occhiello = (M, stagione) => `${escS(M.livello.toUpperCase())} · STAGIONE ${escS(stagione)}`;

/** I formati di una campagna: { chiave: { w, h, nome, breve, html } }. `c` = post di tipo sponsor.
 *  `breve` è il nome sul pulsante che sceglie l'anteprima nella pagina. */
function formatiCampagna(c, sp, stagione) {
  const M = marchio(sp);
  const firma = (k) => `<div style="display:flex;align-items:center;gap:${28 * k}px">
    <img src="${SOCIAL.logo}" style="height:${96 * k}px;display:block">
    <span class="t-dest" style="font-size:${48 * k}px;color:${M.accento}">×</span>
    ${logoSuChiaro(M, 84 * k)}</div>`;
  const cta = c.cta ? `<span style="display:inline-flex;align-items:center;gap:.5em;background:${M.accento};color:${M.scuro};border-radius:999px;font-weight:800;padding:.45em 1.1em;font-size:40px">${escS(c.cta)} ${rombo(M.scuro, .45)}</span>` : "";
  return {
    /* Post collab 4:5: pubblicato insieme da club e brand, esce su entrambi i profili. */
    collab: { w: 1080, h: 1350, nome: "Post collab 4:5", breve: "Collab", html: `<div class="cv" style="width:1080px;height:1350px;background:${M.scuro};color:${M.chiaro}">
      <div class="abs" style="left:80px;top:88px;font-size:34px;font-weight:700;letter-spacing:.14em;color:${M.accento}">${occhiello(M, stagione)}</div>
      <div class="abs t-dest" style="left:80px;right:80px;top:170px;font-size:150px">${righeTitolo(c.title)}</div>
      <div class="abs" style="left:80px;top:500px;right:120px;font-size:40px;font-weight:600;line-height:1.25">${escS(c.subtitle || "")}</div>
      <div class="abs" style="left:80px;top:700px">${cta}</div>
      ${crinale(M, 1080, 420, 170)}
      <div class="abs" style="background:#fff;color:${M.scuro};left:0;right:0;bottom:0;height:190px;display:flex;align-items:center;justify-content:space-between;padding:0 80px">
        ${firma(1)}${avvertenza(M, 22, "max-width:300px;text-align:right")}</div></div>` },

    /* Story: spazio libero per lo sticker link verso l'indirizzo con UTM. */
    story: { w: 1080, h: 1920, nome: "Story con spazio per lo sticker link", breve: "Story", html: `<div class="cv" style="width:1080px;height:1920px;background:${M.scuro};color:${M.chiaro}">
      <div class="abs" style="left:0;right:0;top:320px;display:flex;justify-content:center">${logoSuScuro(M, 200)}</div>
      <div class="abs t-dest" style="left:0;right:0;top:700px;text-align:center;font-size:130px">${righeTitolo(c.story_title || c.title, M.accento)}</div>
      <div class="abs" style="left:120px;right:120px;top:1010px;text-align:center;font-size:42px;font-weight:600;line-height:1.3">${escS(sp.name)} è ${escS(M.livello.toLowerCase())}<br>dello Sci Club Don Bosco ${escS(stagione)}</div>
      <div class="abs" style="left:50%;top:1180px;transform:translateX(-50%);width:560px;height:120px;border:4px dashed ${M.accento};border-radius:999px;display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:700;color:${M.accento}">sticker link qui ↗</div>
      ${crinale(M, 1080, 520)}
      ${avvertenza(M, 26, `position:absolute;left:0;right:0;bottom:${SAFE.bottom + 20}px;text-align:center;color:${M.chiaro}`)}</div>` },

    /* Post 1:1 chiaro, pagina del carosello "Grazie a chi ci sostiene". */
    grazie: { w: 1080, h: 1080, nome: "Post 1:1 · carosello «Grazie a chi ci sostiene»", breve: "Grazie", html: `<div class="cv" style="width:1080px;height:1080px;background:${M.chiaro};color:${M.scuro}">
      <div class="abs" style="left:80px;top:70px;padding:14px 22px;border-radius:28px;background:#fff"><img src="${SOCIAL.logo}" style="height:110px;display:block"></div>
      <div class="abs" style="right:80px;top:120px;font-size:30px;font-weight:700;letter-spacing:.12em;color:#084C8D">STAGIONE ${escS(stagione)}</div>
      <div class="abs t-dest" style="left:80px;top:280px;font-size:112px">Grazie a chi<br>ci sostiene.</div>
      <div class="abs" style="left:80px;right:80px;top:560px;height:300px;border-radius:28px;background:#fff;box-shadow:0 12px 40px rgba(0,0,0,.12);display:flex;align-items:center;justify-content:center">${logoSuChiaro(M, 190)}</div>
      <div class="abs" style="left:80px;right:80px;bottom:80px;display:flex;justify-content:space-between;align-items:center;gap:24px">
        <span style="font-size:34px;font-weight:700;white-space:nowrap">${rombo(M.accento, .55)}<span style="margin-left:16px">${escS(M.livello)}</span></span>
        ${avvertenza(M, 22, "text-align:right")}</div></div>` },

    /* Copertina FB: su mobile la foto profilo copre il basso a sinistra, lì non va testo. */
    cover: { w: 820, h: 312, nome: "Copertina Facebook", breve: "Copertina", html: `<div class="cv" style="width:820px;height:312px;background:${M.scuro};color:${M.chiaro}">
      ${crinale(M, 820, 150)}
      <div class="abs t-dest" style="left:44px;top:48px;font-size:58px">Stagione ${escS(stagione)}</div>
      <div class="abs" style="left:44px;top:120px;font-size:22px;font-weight:600">Gite, corsi e gare sociali · Iscrizioni aperte</div>
      <div class="abs" style="right:44px;top:40px">${logoSuScuro(M, 96)}</div>
      <div class="abs" style="right:44px;top:148px;font-size:15px;font-weight:700;letter-spacing:.14em;color:${M.accento}">${escS(M.livello.toUpperCase())}</div>
      ${avvertenza(M, 12, "position:absolute;right:44px;bottom:14px")}</div>` },
  };
}

// ---------------------------------------------------------------------------
// Testi
// ---------------------------------------------------------------------------

/** "Sci Club" → "sciclub": per hashtag e utm_campaign. */
const semplice = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "");

/** Indirizzo dello sponsor con i parametri UTM, per sapere quanti arrivano da noi. */
function indirizzoUtm(sp, c, mezzo, stagione) {
  if (!sp.url) return "";
  const url = new URL(/^https?:\/\//i.test(sp.url) ? sp.url : `https://${sp.url}`);
  url.searchParams.set("utm_source", "instagram");
  url.searchParams.set("utm_medium", mezzo);
  url.searchParams.set("utm_campaign", `${semplice(sp.name)}-${semplice(stagione)}`);
  url.searchParams.set("utm_content", semplice(c.title).slice(0, 40) || "post");
  return url.toString();
}

/** Il testo da incollare sotto al post, proposto dalla pagina. */
function testoPost(ev, sp, stagione) {
  const tel = contattiDi(ev).map((c) => `${c.name} ${c.phone}${c.hours ? ` (${c.hours})` : ""}`).join(" · ");
  const prezzi = ev.show_price === false ? [] : (ev.prices || []).filter((p) => p && p[1]);
  const quote = prezzi.map(([n, v]) => (n ? `${n} ${v}` : v)).join(" · ");
  const righe = [];
  if (ev.kind === "sponsor" && sp) {
    righe.push(String(ev.title || "").replace(/\n/g, " "));
    if (ev.subtitle) righe.push("", ev.subtitle);
    const link = indirizzoUtm(sp, ev, "post", stagione);
    if (link) righe.push("", `👉 ${link}`);
    if (sp.handle) righe.push(`@${sp.handle.replace(/^@/, "")}`);
    if (sp.alcohol) righe.push("", SOCIAL.avvertenzaAlcol);
    righe.push("", `#sciclubdonbosco #${semplice(sp.name)}`);
    return righe.join("\n");
  }
  if (ev.kind === "gita") {
    righe.push(`🚌 ${dataLunga(ev.event_date) || ""}: gita a ${ev.title}!`);
    if (ev.course) righe.push("Nello stesso giorno c'è anche il corso.");
    if ((ev.stops || []).length) righe.push("", "Partenze: " + ev.stops.map(([t, l]) => `ore ${t} ${l}`).join(", "));
    if (quote) righe.push(`Quota soci: ${quote}`);
    if (ev.deadline) righe.push(`Iscrizioni ${entro(ev.deadline)}`);
  } else {
    righe.push(`${ev.title}${ev.event_date ? ` · ${dataLunga(ev.event_date)}` : ""}`);
    if (ev.subtitle) righe.push(ev.subtitle);
    if (quote) righe.push("", quote);
    for (const [k, v] of ev.facts || []) righe.push(`${k}: ${v}`);
  }
  if (tel) righe.push("", `Info e iscrizioni: ${tel}`);
  righe.push("", `#sciclubdonbosco #sci${ev.kind === "gita" ? ` #${semplice(ev.title)}` : ""}`);
  return righe.join("\n");
}

// Per node (web/test-social.js): le funzioni pure.
if (typeof module !== "undefined") {
  module.exports = { dataLunga, dataCorta, categoriaGita, categoria, impostaColoriGita, impostaContatti, contattiDi, inchiostro, modelloPost,
                     contrasto, schiarisci, indirizzoUtm, testoPost, semplice, mancanti, nomePost, SOCIAL,
                     impostaStile, stileCorrente: () => STILE, disegnaPost, disegnaCalendario, misureCalendario, misurePost,
                     STILI, evidenzia, coloreNuovo, giornoMese };
}
