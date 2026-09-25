// Disegni dei post social: grafica "C · Skipass" (il post è un biglietto su
// fondo pieno nel colore della categoria) e formati delle campagne sponsor.
//
// La usa web/social.html, la pagina che genera i post; le funzioni pure le
// prova web/test-social.js. I prototipi da cui viene (social/templates.html
// con le tre proposte A, B, C, social/confronto.html, social/export.sh) sono
// nella storia di git, fino alla 2.4. Ogni funzione restituisce l'HTML di un canvas a misura reale (post
// 1080×1080, story 1080×1920, collab 1080×1350, copertina 820×312); lo stile
// che serve è tutto qui, così la pagina che lo usa non deve sapere niente.
// Colori del club da docs/brand-guidelines.md.

const SOCIAL = {
  // Relativo alla pagina che disegna.
  logo: "logo_sciclubdonbosco.png",
  // Contatti per info e iscrizioni, in fondo a ogni post: la tabella
  // social_contacts, che la pagina carica e passa a impostaContatti().
  // [{ name: "Marco", phone: "333 000 0000", hours: "dopo le 18" }, ...]
  contatti: [],
  avvertenzaAlcol: "Bevi responsabilmente. Vietata la vendita ai minori di 18 anni.",
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
    fmt, photo: ev.photo || null, cat: categoriaDi(ev),
    prices: ev.show_price === false ? [] : prezzi,
  };
  if (ev.kind === "gita") {
    const d = giornoDi(ev.deadline);
    return {
      ...base, kind: "gita", dest: ev.title, date: dataLunga(ev.event_date),
      stops: ev.stops || [], corso: !!ev.course,
      deadline: d ? `entro ${GIORNI[d.getDay()]} ${d.getDate()}` : "",
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
  const corso = s.corso ? `<div style="position:relative;z-index:2;width:${d}px;height:${d}px;margin-right:${-8 * k}px;align-self:center;transform:rotate(-12deg)">
      <svg class="abs" style="inset:0" width="${d}" height="${d}" viewBox="-6 -6 212 212"><polygon points="${pts}" fill="${CAT.corso.c}" stroke="#fff" stroke-width="7" stroke-linejoin="round"/></svg>
      <div class="abs" style="inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;gap:${4 * k}px">
        ${skier(62 * k)}<div style="font-size:${36 * k}px;font-weight:800;line-height:1">Corso</div></div></div>` : "";
  return `<div style="display:flex;align-items:stretch">${corso}
    <div style="${box};position:relative;background:${C.c};color:${C.ink};min-width:${190 * k}px">
    <div style="font-size:${34 * k}px;font-weight:700">${escS(day)}</div>
    <div style="font-size:${100 * k}px;font-weight:800;line-height:.95;letter-spacing:-.03em;padding-bottom:${10 * k}px">${escS(big)}</div></div></div>`;
}

/* Etichetta di categoria per ciò che non ha data: stesso riquadro e corpo del bollo. */
const tag = (C, k = 1) => `<div style="background:${C.c};color:${C.ink};border-radius:${28 * k}px;padding:0 ${32 * k}px;height:${196 * k}px;display:flex;align-items:center;font-size:${64 * k}px;font-weight:800;letter-spacing:-.02em;white-space:nowrap">${escS(C.label)}</div>`;

function facts(list, color, lab, size = 30) {
  return list.map(([k, v]) => `<div><div style="font-size:${size * .8}px;font-weight:600;color:${lab}">${escS(k)}</div>
    <div style="font-size:${size}px;font-weight:700;color:${color}">${escS(v)}</div></div>`).join("");
}

/* Testo di ogni post (gita o evento), in tre pezzi posizionati rispetto alla
 * riga dei prezzi, che sta sempre a o.py: il titolo cresce verso l'alto, i
 * dettagli verso il basso. Così il prezzo resta nello stesso punto con prezzo
 * singolo, «da … a …» o adulti/ragazzi. Senza prezzo (show_price spento) i
 * dettagli salgono subito sotto il titolo. o = { x, r, H, py, col, accent, lab, k } */
function content(s, o) {
  const k = o.k, gita = s.kind === "gita", size = 104 * k;
  const prices = s.prices || [], labels = prices.some((p) => p[0]);
  const top = gita
    ? `<div class="t-dest" data-fit style="font-size:${size}px;color:${o.col}">${escS(s.dest)}</div>`
    : `<div class="t-dest" data-fit style="font-size:${88 * k}px;color:${o.col}">${escS(s.title)}</div>
       ${s.sub ? `<div style="font-size:${34 * k}px;font-weight:600;color:${o.lab};margin-top:${10 * k}px">${escS(s.sub)}</div>` : ""}`;
  const row = prices.map(([n, v]) => `<div>
      <div class="t-dest" style="font-size:${size}px;color:${o.accent};white-space:nowrap">${escS(v)}</div>
      ${n ? `<div style="font-size:${40 * k}px;font-weight:700;line-height:1.1;margin-top:${8 * k}px;color:${o.col};white-space:nowrap">${escS(n)}</div>` : ""}</div>`).join("");
  const below = gita
    ? `<div style="font-size:${54 * k}px;font-weight:700;line-height:1.12;letter-spacing:-.02em;color:${o.col}">${(s.stops || []).map(([t, l]) => `ore ${escS(t)} · ${escS(l)}`).join("<br>")}</div>
       ${s.deadline ? `<div style="font-size:${38 * k}px;font-weight:700;color:${o.accent};margin-top:${18 * k}px">Iscrizioni ${escS(s.deadline)}</div>` : ""}`
    : `<div style="display:flex;flex-wrap:wrap;gap:${12 * k}px ${44 * k}px">${facts(s.facts || [], o.col, o.lab, 36 * k)}</div>`;
  // Senza prezzo il titolo scende di mezza riga: il biglietto non resta
  // vuoto in fondo, e i dettagli partono subito sotto.
  const py = prices.length ? o.py : o.py + size * .6;
  const sotto = prices.length ? py + size * .95 + (labels ? 52 : 0) * k + 30 * k : py + 30 * k;
  return `<div class="abs" style="left:${o.x}px;right:${o.r}px;bottom:${o.H - py + 14 * k}px">${top}</div>
    ${prices.length ? `<div class="abs" data-fitrow style="left:${o.x}px;right:${o.r}px;top:${o.py}px;display:flex;gap:${64 * k}px">${row}</div>` : ""}
    <div class="abs" style="left:${o.x}px;right:${o.r}px;top:${sotto}px">${below}</div>`;
}

/* Riduce il corpo dei titoli [data-fit] finché stanno su una riga, e quello
 * dei prezzi [data-fitrow] (tutti insieme, restano uguali) finché la riga sta
 * nel riquadro. Va chiamata dopo che il canvas è nella pagina e i font sono
 * caricati. Restituisce true se qualcosa è rimasto troppo lungo anche al
 * corpo minimo: la pagina lo segnala prima dell'export. */
function fit(radice = document) {
  let sborda = false;
  radice.querySelectorAll("[data-fitrow]").forEach((row) => {
    const vals = [...row.querySelectorAll(".t-dest")];
    let f = parseFloat(vals[0].style.fontSize);
    while (row.scrollWidth > row.clientWidth && f > 40) {
      f -= 2;
      vals.forEach((v) => (v.style.fontSize = f + "px"));
    }
    if (row.scrollWidth > row.clientWidth) sborda = true;
  });
  radice.querySelectorAll("[data-fit]").forEach((el) => {
    el.style.whiteSpace = "nowrap";
    let f = parseFloat(el.style.fontSize);
    while (el.scrollWidth > el.clientWidth && f > 40) el.style.fontSize = (f -= 2) + "px";
    if (el.scrollWidth > el.clientWidth) sborda = true;
  });
  // I telefoni: il corpo scende fino a 20 px, poi sborda (troppi contatti).
  radice.querySelectorAll("[data-fittel]").forEach((el) => {
    let f = parseFloat(el.style.fontSize);
    while (el.scrollWidth > el.clientWidth && f > 20) el.style.fontSize = (f -= 1) + "px";
    if (el.scrollWidth > el.clientWidth) sborda = true;
  });
  return sborda;
}

/** I contatti della pagina (righe di social_contacts, già in ordine). */
function impostaContatti(righe) {
  SOCIAL.contatti = righe.filter((r) => r && r.name && r.phone)
    .map(({ name, phone, hours }) => ({ name, phone, hours: hours || "" }));
}

/* Riga dei telefoni in fondo al biglietto; senza contatti, niente. Gli orari
 * più piccoli e chiari, dopo il numero. data-fittel: fit() la rimpicciolisce
 * se non ci sta. */
function phones(col, k = 1) {
  if (!SOCIAL.contatti.length) return "";
  const ico = `<svg width="${34 * k}" height="${34 * k}" viewBox="0 0 24 24" fill="${col}"><path d="M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25c1.1.37 2.3.57 3.6.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.6a1 1 0 0 1-.25 1z"/></svg>`;
  return `<div data-fittel style="display:flex;align-items:center;gap:${16 * k}px;font-size:${32 * k}px;font-weight:700;color:${col};white-space:nowrap;overflow:hidden">${ico}
    ${SOCIAL.contatti.map((c) => `<span><span style="font-weight:500;opacity:.85">${escS(c.name)}</span> ${escS(c.phone)}${c.hours
      ? ` <span style="font-weight:500;font-size:.8em;opacity:.8">${escS(c.hours)}</span>` : ""}</span>`).join(`<span style="opacity:.5">·</span>`)}</div>`;
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
      <span class="pill" style="background:${C.c};color:${C.ink};font-size:28px;padding:8px 0;width:190px;text-align:center">${escS(C.day)} ${escS(d)}</span>
      <span style="font-size:42px;font-weight:700;color:#14202E">${escS(dest)}</span>
      ${corso ? `<span style="margin-left:auto;background:${CAT.corso.c};color:#fff;border-radius:14px;padding:6px 16px;display:flex;align-items:center;gap:8px;font-size:26px;font-weight:800">${skier(34)}Corso</span>` : ""}</div>`; }).join("");
}

// ---------------------------------------------------------------------------
// C · Skipass
// ---------------------------------------------------------------------------

/** Post o story di una gita o di un evento (modello da modelloPost()). */
function disegnaPost(s) {
  const C = categoria(s.cat), st = s.fmt === "story", W = 1080, H = st ? 1920 : 1080;
  const notch = (y, m) => `<div class="abs" style="left:-${m}px;top:${y - m}px;width:${m * 2}px;height:${m * 2}px;border-radius:50%;background:${C.c}"></div>
    <div class="abs" style="right:-${m}px;top:${y - m}px;width:${m * 2}px;height:${m * 2}px;border-radius:50%;background:${C.c}"></div>
    <div class="abs" style="left:${m + 10}px;right:${m + 10}px;top:${y}px;border-top:4px dashed #C7D0DA"></div>`;
  // Story: biglietto lungo quasi a tutta tela; logo, bollo e telefoni restano
  // fuori dalle fasce di Instagram.
  const m = 60, cw = W - m * 2, k = st ? 1.5 : 1, ph = st ? 640 : 260;
  const cardH = H - m * 2 - (st ? 0 : 60);
  const body = `${photo(cw, ph, s.photo)}
      <div class="abs" style="left:0;top:0;background:#fff;padding:18px 26px;border-bottom-right-radius:28px">
        <img class="logo" src="${SOCIAL.logo}" style="height:100px"></div>
      <div class="abs" style="right:40px;top:36px">${s.date ? badge(s) : tag(C)}</div>
      ${content(s, { x: 56, r: 56, H: cardH, py: st ? 920 : 450, col: "#14202E", accent: C.txt, lab: "#5B6472", k })}
      ${notch(ph, 30)}
      ${st && SOCIAL.contatti.length ? `<div class="abs" style="left:56px;right:56px;top:${H - SAFE.bottom - m - 90}px;border-top:4px dashed #C7D0DA;padding-top:28px">${phones("#14202E", 1.15)}</div>` : ""}`;
  return `<div class="cv" style="width:${W}px;height:${H}px;background:${C.c}">
    <div class="abs" style="left:${m}px;width:${cw}px;top:${m}px;height:${cardH}px;background:#fff;border-radius:40px;overflow:hidden">${body}</div>
    ${st ? "" : `<div class="abs" style="left:${m + 8}px;right:${m}px;bottom:44px">${phones(C.ink)}</div>`}
  </div>`;
}

/** Calendario del mese (post 1:1): righe [categoria, "DD/MM", meta, corso]. */
function disegnaCalendario(titolo, righe) {
  const bg = "#084C8D";
  return `<div class="cv" style="width:1080px;height:1080px;background:${bg}">
    <div class="abs" style="left:60px;width:960px;top:60px;height:960px;background:#fff;border-radius:40px;overflow:hidden">
      <div style="padding:44px 56px">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span class="pill" style="background:#FCCF02;color:#06396A;font-size:28px;padding:10px 26px">Calendario gite</span>
          <img class="logo" src="${SOCIAL.logo}" style="height:110px"></div>
        <div class="t-dest" data-fit style="font-size:88px;color:#084C8D;margin:18px 0 10px">${escS(titolo)}</div>${calRows(righe)}</div></div>
  </div>`;
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

/** I formati di una campagna: { chiave: { w, h, nome, html } }. `c` = post di tipo sponsor. */
function formatiCampagna(c, sp, stagione) {
  const M = marchio(sp);
  const firma = (k) => `<div style="display:flex;align-items:center;gap:${28 * k}px">
    <img src="${SOCIAL.logo}" style="height:${96 * k}px;display:block">
    <span class="t-dest" style="font-size:${48 * k}px;color:${M.accento}">×</span>
    ${logoSuChiaro(M, 84 * k)}</div>`;
  const cta = c.cta ? `<span style="display:inline-flex;align-items:center;gap:.5em;background:${M.accento};color:${M.scuro};border-radius:999px;font-weight:800;padding:.45em 1.1em;font-size:40px">${escS(c.cta)} ${rombo(M.scuro, .45)}</span>` : "";
  return {
    /* Post collab 4:5: pubblicato insieme da club e brand, esce su entrambi i profili. */
    collab: { w: 1080, h: 1350, nome: "Post collab 4:5", html: `<div class="cv" style="width:1080px;height:1350px;background:${M.scuro};color:${M.chiaro}">
      <div class="abs" style="left:80px;top:88px;font-size:34px;font-weight:700;letter-spacing:.14em;color:${M.accento}">${occhiello(M, stagione)}</div>
      <div class="abs t-dest" style="left:80px;right:80px;top:170px;font-size:150px">${righeTitolo(c.title)}</div>
      <div class="abs" style="left:80px;top:500px;right:120px;font-size:40px;font-weight:600;line-height:1.25">${escS(c.subtitle || "")}</div>
      <div class="abs" style="left:80px;top:700px">${cta}</div>
      ${crinale(M, 1080, 420, 170)}
      <div class="abs" style="background:#fff;color:${M.scuro};left:0;right:0;bottom:0;height:190px;display:flex;align-items:center;justify-content:space-between;padding:0 80px">
        ${firma(1)}${avvertenza(M, 22, "max-width:300px;text-align:right")}</div></div>` },

    /* Story: spazio libero per lo sticker link verso l'indirizzo con UTM. */
    story: { w: 1080, h: 1920, nome: "Story con spazio per lo sticker link", html: `<div class="cv" style="width:1080px;height:1920px;background:${M.scuro};color:${M.chiaro}">
      <div class="abs" style="left:0;right:0;top:320px;display:flex;justify-content:center">${logoSuScuro(M, 200)}</div>
      <div class="abs t-dest" style="left:0;right:0;top:700px;text-align:center;font-size:130px">${righeTitolo(c.story_title || c.title, M.accento)}</div>
      <div class="abs" style="left:120px;right:120px;top:1010px;text-align:center;font-size:42px;font-weight:600;line-height:1.3">${escS(sp.name)} è ${escS(M.livello.toLowerCase())}<br>dello Sci Club Don Bosco ${escS(stagione)}</div>
      <div class="abs" style="left:50%;top:1180px;transform:translateX(-50%);width:560px;height:120px;border:4px dashed ${M.accento};border-radius:999px;display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:700;color:${M.accento}">sticker link qui ↗</div>
      ${crinale(M, 1080, 520)}
      ${avvertenza(M, 26, `position:absolute;left:0;right:0;bottom:${SAFE.bottom + 20}px;text-align:center;color:${M.chiaro}`)}</div>` },

    /* Post 1:1 chiaro, pagina del carosello "Grazie a chi ci sostiene". */
    grazie: { w: 1080, h: 1080, nome: "Post 1:1 · carosello «Grazie a chi ci sostiene»", html: `<div class="cv" style="width:1080px;height:1080px;background:${M.chiaro};color:${M.scuro}">
      <div class="abs" style="left:80px;top:70px;padding:14px 22px;border-radius:28px;background:#fff"><img src="${SOCIAL.logo}" style="height:110px;display:block"></div>
      <div class="abs" style="right:80px;top:120px;font-size:30px;font-weight:700;letter-spacing:.12em;color:#084C8D">STAGIONE ${escS(stagione)}</div>
      <div class="abs t-dest" style="left:80px;top:280px;font-size:112px">Grazie a chi<br>ci sostiene.</div>
      <div class="abs" style="left:80px;right:80px;top:560px;height:300px;border-radius:28px;background:#fff;box-shadow:0 12px 40px rgba(0,0,0,.12);display:flex;align-items:center;justify-content:center">${logoSuChiaro(M, 190)}</div>
      <div class="abs" style="left:80px;right:80px;bottom:80px;display:flex;justify-content:space-between;align-items:center;gap:24px">
        <span style="font-size:34px;font-weight:700;white-space:nowrap">${rombo(M.accento, .55)}<span style="margin-left:16px">${escS(M.livello)}</span></span>
        ${avvertenza(M, 22, "text-align:right")}</div></div>` },

    /* Copertina FB: su mobile la foto profilo copre il basso a sinistra, lì non va testo. */
    cover: { w: 820, h: 312, nome: "Copertina Facebook", html: `<div class="cv" style="width:820px;height:312px;background:${M.scuro};color:${M.chiaro}">
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
  const tel = SOCIAL.contatti.map((c) => `${c.name} ${c.phone}${c.hours ? ` (${c.hours})` : ""}`).join(" · ");
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
    const d = giornoDi(ev.deadline);
    if (d) righe.push(`Iscrizioni entro ${GIORNI[d.getDay()]} ${d.getDate()} ${MESI[d.getMonth()]}`);
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
  module.exports = { dataLunga, dataCorta, categoriaGita, categoria, impostaColoriGita, impostaContatti, inchiostro, modelloPost,
                     contrasto, schiarisci, indirizzoUtm, testoPost, semplice, SOCIAL };
}
