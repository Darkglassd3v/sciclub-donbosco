// Disegni dei post social: la grafica K · Piani (postK(), dalla 2.8 l'unica
// per gite ed eventi, post 4:5 e story), il calendario del mese, la copertina
// Facebook e i formati delle campagne sponsor.
//
// La usa web/social.html, la pagina che genera i post; le funzioni pure le
// prova web/test-social.js. Le grafiche di prima (Ritocco, Montagna e le
// proposte Biglietto, Calendario e Divano) e i prototipi (social/templates.html,
// social/confronto.html, social/export.sh) sono nella storia di git. Ogni
// funzione restituisce l'HTML di un canvas a misura reale (post e calendario
// 1080×1350 (misurePost()), story 1080×1920, collab 1080×1350, copertina
// 820×312); lo stile che serve è tutto qui, così la pagina che lo usa non deve
// sapere niente.
// Colori del club da docs/brand-guidelines.md.

const SOCIAL = {
  // Relativo alla pagina che disegna.
  logo: "logo-ufficiale-trasparente-lettere-blu.svg",
  // Il logo ufficiale nel cerchio bianco con l'anello giallo: quello dei post nuovi (logoNuovo()).
  logoTondo: "logo-ufficiale-tondo.svg",
  // Rubrica dei contatti per info e iscrizioni: la tabella social_contacts,
  // che la pagina carica e passa a impostaContatti(). Ogni post sceglie i suoi
  // (ev.contacts, id in ordine): contattiDi().
  // [{ id, name: "Marco", phone: "333 000 0000", hours: "dopo le 18" }, ...]
  contatti: [],
  avvertenzaAlcol: "Bevi responsabilmente. Vietata la vendita ai minori di 18 anni.",
  // In fondo ai post, sopra i telefoni scelti.
  iscrizioni: "Iscrizioni in negozio o via mail",
  iscrizioniTel: "Iscrizioni in negozio, via mail o al telefono",
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

/* "*fino al 13 gennaio*": fra due asterischi quello che chi pubblica ha
 * evidenziato (pulsante Evidenzia del sottotesto; evidenzia(), nella K). Nel
 * testo del post gli asterischi si tolgono. */
const senzaSegni = (s) => String(s ?? "").replace(/\*([^*\n]+)\*/g, "$1");

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

/** "giovedì 14 gennaio": la scadenza scritta per esteso, nella K. */
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

/** Il colore di una gita viene dal giorno: "g2" se il martedì è un giorno di gita. */
function categoriaGita(iso) {
  const d = giornoDi(iso);
  return d && COLORI_GITA[d.getDay()] ? `g${d.getDay()}` : "gita";
}

/* Scritta sul colore: bianca o blu scuro, quella che si legge meglio (sul
 * giallo il blu scuro, come nel resto del gestionale). */
const inchiostro = (c) => (contrasto(c, "#FFFFFF") >= contrasto(c, "#06396A") ? "#FFFFFF" : "#06396A");

/* Il colore scurito quanto basta per leggersi su bianco (4.5:1): il `txt`
 * delle categorie, perché il giallo su bianco non si leggerebbe. */
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

/** La parte della foto che si vede (photo_x, photo_y: 0–100, da sinistra e dall'alto), per object-position:
 *  vuote = "50% 45%", come prima che si potesse spostare. Solo numeri: finisce in uno style. */
function posFoto(ev) {
  const n = (v, d) => (v === null || v === undefined || v === "" || !Number.isFinite(Number(v)) ? d : Math.min(100, Math.max(0, Math.round(Number(v)))));
  return `${n(ev.photo_x, 50)}% ${n(ev.photo_y, 45)}%`;
}

/** Quanto è ingrandita la foto (photo_zoom, 100–300 %): vuoto = 1, la foto copre il riquadro e basta. */
function zoomFoto(ev) {
  const v = ev.photo_zoom;
  return v === null || v === undefined || v === "" || !Number.isFinite(Number(v)) ? 1 : Math.min(300, Math.max(100, Math.round(Number(v)))) / 100;
}

/** Dalla riga di social_events al modello dei disegni, nel formato chiesto. */
function modelloPost(ev, fmt) {
  const prezzi = (ev.prices || []).filter((p) => p && p[1]);
  const base = {
    fmt, photo: ev.photo || null, pos: posFoto(ev), zoom: zoomFoto(ev), cat: categoriaDi(ev), iso: ev.event_date || null,
    hook: String(ev.hook || "").trim(),
    prices: ev.show_price === false ? [] : prezzi, contatti: contattiDi(ev),
  };
  if (ev.kind === "gita") {
    return {
      ...base, kind: "gita", dest: ev.title, date: dataLunga(ev.event_date),
      stops: ev.stops || [], cardStop: ev.card_stop || null, corso: !!ev.course, nota: String(ev.subtitle || "").trim(), deadline: entro(ev.deadline), scadenza: giornoMese(ev.deadline),
    };
  }
  return {
    ...base, kind: "evento", title: ev.title, sub: ev.subtitle || "",
    date: dataLunga(ev.event_date), facts: fattiEvento(ev),
  };
}

/* Le informazioni di un evento come le disegna la K. Ora, luogo e scadenza
 * hanno un campo loro nel form (prima l'ora finiva nei prezzi): diventano le
 * informazioni "Orario", "Dove" e "Iscrizioni", che la K sa dove mettere
 * (l'ora nella tessera, il luogo col segnaposto, le iscrizioni in fondo). */
function fattiEvento(ev) {
  const ora = String(ev.event_time || "").trim().replace(/^ore\s*/i, ""), dove = String(ev.place || "").trim();
  // Un'informazione scritta a mano con lo stesso nome di un campo pieno (i post di prima) non si ripete.
  const resto = (ev.facts || []).filter(([n]) => {
    const t = String(n || "").trim();
    return !(ora && ORARIO.test(t)) && !(dove && /^dove$/i.test(t)) && !(ev.deadline && ISCRIZIONI.test(t));
  });
  // "ore" solo davanti a un orario: "dalle 18 alle 20" resta com'è.
  return [ora && ["Orario", /^\d/.test(ora) ? `ore ${ora}` : ora], dove && ["Dove", dove], ...resto,
    ev.deadline && ["Iscrizioni", `entro ${giornoMese(ev.deadline)}`]].filter(Boolean);
}

// ---------------------------------------------------------------------------
// Pezzi comuni
// ---------------------------------------------------------------------------

/* Sciatore: segno del corso, nella coccarda (stellaCorso()). */
const skier = (px) => `<svg width="${px}" height="${px}" viewBox="0 0 24 24" fill="#fff"><circle cx="16" cy="4" r="2.2"/><path d="M4 21.5l17-5.2-.5-1.4-4 1.2-1.9-4.8 2.6-2.2-2.7-3.4-5.4 2.6.8 1.6 3.6-1.7 1.1 1.4-3.4 2.9 2.2 5.5-9.6 2.9z"/></svg>`;

/* La coccarda verde del corso, una stella con lo sciatore, larga 210·k: il
 * contenuto (la stella e la scritta), il contenitore lo mette stellaNuova(). */
function stellaCorso(k = 1) {
  const d = 210 * k, pts = Array.from({ length: 28 }, (_, i) => {
    const a = Math.PI * i / 14, r = i % 2 ? 84 : 100;
    return `${100 + r * Math.sin(a)},${100 - r * Math.cos(a)}`;
  }).join(" ");
  return `
      <svg class="abs" style="inset:0" width="${d}" height="${d}" viewBox="-6 -6 212 212"><polygon points="${pts}" fill="${CAT.corso.c}" stroke="#fff" stroke-width="7" stroke-linejoin="round"/></svg>
      <div class="abs" style="inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;gap:${4 * k}px">
        ${skier(62 * k)}<div style="font-size:${36 * k}px;font-weight:800;line-height:1">Corso</div></div>`;
}

const icoTel = (px, col) => `<svg width="${px}" height="${px}" viewBox="0 0 24 24" fill="${col}" style="vertical-align:-.12em"><path d="M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25c1.1.37 2.3.57 3.6.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.6a1 1 0 0 1-.25 1z"/></svg>`;

/* Adatta il testo alla tela. Va chiamata dopo che il canvas è nella pagina e
 * i font sono caricati; restituisce true se qualcosa resta troppo lungo anche
 * al corpo minimo, e la pagina lo segnala prima dell'export.
 * - [data-fit] (le righe della tessera): su una riga, il corpo scende fino a
 *   40 px.
 * - [data-righe] (il titolo e la meta della gita): va a capo fino a quelle
 *   righe; oltre, o con una parola più larga della riga, scende (--t) fino a
 *   48 px. Con data-due (la meta) prima stringe su una riga fino a quel corpo,
 *   poi va a capo.
 * - [data-adatta] (la colonna del testo): se il contenuto non ci sta,
 *   scende tutto insieme (--s) fino al 92%, che non si nota e lascia tutto al
 *   suo posto. Se non basta, si torna al 100% e si prende lo spazio che resta
 *   vuoto ([data-cede]: la seconda riga riservata al titolo quando ne usa
 *   una); poi scende tutto insieme fino alla scala scritta nell'attributo, e
 *   i testi piccoli si fermano al corpo minimo (--min).
 *   Così "il testo parte sempre dallo stesso punto" vale per i post che ci
 *   stanno, e un post pieno non rimpicciolisce il testo per tenere vuoto lo
 *   spazio in alto. */
function fit(radice = document) {
  let sborda = false;
  radice.querySelectorAll("[data-fit]").forEach((el) => {
    el.style.whiteSpace = "nowrap";
    let f = parseFloat(el.style.fontSize);
    while (el.scrollWidth > el.clientWidth && f > 40) el.style.fontSize = (f -= 2) + "px";
    if (el.scrollWidth > el.clientWidth) sborda = true;
  });
  radice.querySelectorAll("[data-righe]").forEach((el) => {
    const righe = Number(el.dataset.righe);
    let t = parseFloat(getComputedStyle(el).getPropertyValue("--t"));
    // La meta della gita che va a capo da sola prima stringe su una riga fino al corpo di due righe (data-due):
    // solo se neanche lì ci sta va a capo, a quel corpo, prima di stringere oltre.
    const aCapo = () => el.offsetHeight > parseFloat(getComputedStyle(el).lineHeight) * 1.5;
    if (el.dataset.due) while (aCapo() && t > Number(el.dataset.due)) el.style.setProperty("--t", (t = Math.max(t - 2, Number(el.dataset.due))) + "px");
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
    const scala = (v) => el.style.setProperty("--s", s = v);
    while (pieno() && s > Math.max(min, .92)) scala(Math.round((s - .02) * 100) / 100);
    if (pieno()) {
      scala(1);
      for (const c of el.closest(".cv").querySelectorAll("[data-cede]")) {
        if (!pieno()) break;
        c.style.minHeight = "0"; c.style.height = "auto";
      }
    }
    while (pieno() && s > min) el.style.setProperty("--s", s = Math.round((s - .02) * 100) / 100);
    if (pieno()) sborda = true;
  });
  return sborda;
}

/**
 * Cosa manca a un post per essere pronto da pubblicare, a parole ("la
 * meta"): vuoto = pronto. La usano l'elenco (Pronto / Da completare) e la
 * testata del post aperto, così dicono la stessa cosa. Salvare si può lo
 * stesso: salva() blocca solo meta, giorno della gita e sponsor.
 */
/** Come chiamare un post nell'elenco e nei nomi dei file: la meta della gita su una riga; per gli altri la prima riga
 *  del titolo, o del sottotesto se non ha titolo. */
function nomePost(ev) {
  if (ev.kind === "gita") return unaRiga(ev.title);
  return (String(ev.title || "").trim() || String(ev.subtitle || "").trim()).split("\n")[0].trim();
}

/** La meta della gita come la scrive chi pubblica, al massimo in due righe: righe vuote e spazi via, dalla terza in poi
 *  sulla seconda. */
function righeMeta(testo) {
  const righe = String(testo || "").split(/\r?\n/).map((r) => r.trim().replace(/\s+/g, " ")).filter(Boolean);
  return righe.length > 2 ? [righe[0], righe.slice(1).join(" ")] : righe;
}
/** La meta su una riga sola: calendario del mese, testo del post, nome nell'elenco. */
const unaRiga = (testo) => righeMeta(testo).join(" ");

function mancanti(ev) {
  const manca = [];
  // Un post può essere solo un titolo o solo un sottotesto; la gita ha sempre la meta.
  if (ev.kind === "gita" ? !String(ev.title || "").trim() : !nomePost(ev)) {
    manca.push(ev.kind === "gita" ? "la meta" : "il titolo o il sottotesto");
  }
  if (ev.kind === "gita") {
    if (!ev.event_date) manca.push("il giorno");
    if (!(ev.stops || []).some(([t, l]) => t || l)) manca.push("le partenze");
    // Quota e scadenza sono facoltative (l'utente, 16/10): senza, il post è pronto lo stesso.
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

/* Foto; senza, un paesaggio disegnato (quello della copertina Facebook). */
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

// ---------------------------------------------------------------------------
// K · Piani
//
// Rifatta uguale dalla proposta di grafica/proposte-post-social/ (tavola,
// sorgenti e regole fisse nel README): post 4:5 (1080×1350) e story. Un solo
// blu e un solo giallo, quelli del logo; il titolo occupa sempre due righe,
// così il testo parte sempre dallo stesso punto e un testo lungo scende più in
// basso; orari, prezzi e scadenze in evidenza; in fondo le iscrizioni, grandi.
// I corpi stanno nel CSS qui sotto, moltiplicati per --s: fit() la abbassa
// quando il testo non ci sta, e i testi piccoli si fermano a --min (34 px nel
// post, 44 nella story, come nelle proposte).
// ---------------------------------------------------------------------------

const BLU = "#084C8D", GIALLO = "#FCCF02";

(function stileNuovi() {
  if (typeof document === "undefined" || document.getElementById("stile-social-nuovi")) return;
  // z(): corpo che scende con --s ma non sotto il minimo; q(): misura che scende e basta.
  const z = (n) => `max(var(--min), calc(${n}px * var(--s)))`, q = (n) => `calc(${n}px * var(--s))`;
  const stile = document.createElement("style");
  stile.id = "stile-social-nuovi";
  stile.textContent = `
    /* L'interlinea delle proposte: quella di Bulma (1.5) arriverebbe dalla pagina e allungherebbe le righe. */
    .cv.nuovo { --s: 1; --min: 34px; line-height: normal; }
    .cv.nuovo.story { --min: 44px; }
    .cv.nuovo b { font-weight: 800; }
    /* Il logo tondo porta il suo cerchio bianco: il riquadro non ha più fondo né margine. */
    .cv.nuovo .logo-box { background: none; padding: 0; border-radius: 50%; box-shadow: 0 6px 18px rgba(0,0,0,.25); }
    .cv.nuovo .logo-box img { display: block; height: 240px; }
    .cv.nuovo .col { position: absolute; inset: 0; display: flex; flex-direction: column; overflow: hidden; }
    .cv.nuovo [data-righe] { font-size: calc(var(--t) * var(--s)); }
    /* I telefoni su una riga sola, larga quanto il riquadro (nella story a 44 px due contatti ci stanno
     * solo così), a capo solo fra un contatto e l'altro: uno sotto l'altro confondevano. */
    .cv.nuovo .isc { flex-wrap: wrap; row-gap: 6px; }
    .cv.nuovo .isc .tel { flex-basis: 100%; display: flex; flex-wrap: wrap; align-items: center; column-gap: .75em; font-size: ${z(36)}; font-weight: 500; }
    .cv.nuovo .isc .tel span { white-space: nowrap; }
    .cv.nuovo .isc .tel b { font-weight: 800; }

    /* Gita con il corso: la coccarda verde in alto a destra, accanto al logo, fuori dal flusso. */
    .cv.nuovo .stella { position: absolute; z-index: 3; right: 44px; top: 30px; transform: rotate(-12deg); }
    /* Nella story più grande (la scritta "Corso" a 45 px) e più in alto, per non toccare il titolo. */
    .cv.nuovo.story .stella { top: 196px; }
    /* K · Piani (grafica/proposte-post-social/sorgenti/k.css): la foto a tutta pagina col velo
     * sotto il testo, i piani a 45°, la tessera gialla del "quando". Le misure sono quelle della
     * tavola: --fine è dove comincia il testo, --su e --giu le fasce coperte della story. Niente
     * pseudo-elementi (html-to-image non li rende sicuri): nel giallo la foto in grigi e il giallo
     * in multiply sono due livelli veri. Senza foto: fondo blu notte, angolo giallo pieno, niente finestra. */
    /* --velo: il fondo sotto il testo tende al blu scuro del club (prima nero: la foto usciva cupa). */
    .cv.sk { --notte: 20,32,46; --velo: 6,57,106; --fine: 620px; --angolo: 560px; --cuneo: 600px; --su: 0px; --giu: 0px; background: #14202E; color: #fff; }
    /* Story (16/10/2026): la tessera finisce a 716 px invece di 806 ma è più piena e il
     * testo parte più su, più grande. Logo e coccarda stanno dove sono nel post (15/10); l'angolo
     * (800, prima 660) tiene dentro il logo, che sta 250 px più in basso che nel post. */
    /* In fondo 300 px per la risposta di Instagram (prima 340; la zona consigliata è 270): con
     * due telefoni la story di una gita perdeva la riga della scadenza. */
    .cv.sk.story { --fine: 726px; --angolo: 800px; --cuneo: 680px; --su: 250px; --giu: 300px; }
    .cv.sk.giallo { --notte: 18,18,18; }
    .sk .foto { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: var(--pos, 50% 45%); }
    .sk .piano { position: absolute; inset: 0; }
    .sk .scuro { background: linear-gradient(180deg, rgba(var(--velo),0) 0, rgba(var(--velo),0) calc(var(--fine) - 200px),
      rgba(var(--velo),.72) calc(var(--fine) + 10px), rgba(var(--velo),.82) 100%); }
    .sk .angolo { background: rgba(8,76,141,.74); clip-path: polygon(0 0, var(--angolo) 0, 0 var(--angolo)); }
    .sk .cuneo { background: rgba(var(--notte),.86); clip-path: polygon(calc(100% - var(--cuneo)) 0, 100% 0, 100% var(--cuneo)); }
    /* Nella finestra la foto in bianco e nero tinta di blu: tre livelli (foto, blu in "color", velo blu),
     * così la foto si ingrandisce (--zoom) senza ingrandire il taglio. */
    .sk .finestra { isolation: isolate; clip-path: polygon(100% calc(var(--fine) + 170px), 890px calc(var(--fine) + 360px), 100% calc(var(--fine) + 550px)); }
    .sk .finestra.fondo { clip-path: polygon(100% calc(100% - 400px), 680px 100%, 100% 100%); }
    .sk .ombra { background: rgba(var(--notte),.4); clip-path: polygon(0 calc(100% - var(--giu) - 350px), calc(var(--giu) + 350px) 100%, 0 100%); }
    .sk.giallo .angolo, .sk.giallo .finestra { background: none; opacity: .7; }
    .sk .grigi, .sk .tinta, .sk .foto-blu, .sk .colore-blu, .sk .velo-blu { position: absolute; inset: 0; }
    /* La foto ingrandita (photo_zoom) attorno al punto scelto (photo_x, photo_y), uguale in ogni livello. */
    .sk .foto, .sk .grigi, .sk .foto-blu { transform: scale(var(--zoom, 1)); transform-origin: var(--pos, 50% 45%); }
    .sk .grigi { background: var(--immagine) var(--pos, 50% 45%) / cover; filter: grayscale(1) brightness(1.4) contrast(1.2); }
    .sk .foto-blu { background: var(--immagine) var(--pos, 50% 45%) / cover; }
    .sk .colore-blu { background: #084C8D; mix-blend-mode: color; }
    .sk .velo-blu { background: rgba(8,76,141,.5); }
    .sk .tinta { background: #FCCF02; mix-blend-mode: multiply; }
    .sk.senza-foto.giallo .angolo { background: #FCCF02; opacity: 1; }
    .cv.sk .logo-box { position: absolute; left: 60px; top: calc(var(--su) + 40px); }
    /* Il filo blu stacca l'anello giallo dalla foto (attrezzi gialli, angolo giallo dei corsi). */
    .cv.sk .logo-box img { height: 224px; border-radius: 50%; box-shadow: 0 0 0 6px #084C8D, 0 6px 22px rgba(0,0,0,.45); }
    .cv.sk.story .logo-box img { height: 226px; }
    /* La coccarda del corso appesa all'angolo basso della tessera, lontana dal logo: due tondi vicini si confondevano.
     * Post e story uguali (l'utente, 15/10): logo in alto a sinistra, coccarda che entra di 30 px nella tessera
     * e scende 20 px sotto (nella story ×1,25, come la coccarda). */
    .cv.sk .stella { left: auto; right: 374px; top: calc(var(--su) + 366px); }
    .cv.sk.story .stella { right: 406px; top: calc(var(--su) + 229px); }
    /* La tessera del "quando", appesa al bordo alto: giorno, numero, mese e l'ora nella fascia blu. */
    .sk .tessera { position: absolute; right: 60px; top: 0; width: 344px; height: calc(var(--su) + 556px); background: #FCCF02; color: #084C8D;
      clip-path: polygon(96px 0, 100% 0, 100% 100%, 0 100%, 0 96px); display: flex; flex-direction: column; justify-content: flex-end; }
    .sk .tessera span, .sk .tessera b, .sk .tessera em { display: block; padding: 0 34px; }
    .sk .tessera span { font-weight: 700; line-height: 1; letter-spacing: -.01em; }
    .sk .tessera b { font-size: 210px; font-weight: 800; line-height: .8; letter-spacing: -.05em; margin: 20px 0 16px -6px; }
    .sk .tessera b + span { font-weight: 800; letter-spacing: -.02em; }
    .sk .tessera b + span:last-child { margin-bottom: 34px; }
    .sk .tessera em { font-style: normal; font-weight: 800; line-height: 1; letter-spacing: -.015em; background: #084C8D; color: #fff; padding: 20px 34px 22px; margin-top: 28px; }
    .sk.story .tessera { width: 384px; height: calc(var(--su) + 466px); }
    .sk.story .tessera b { font-size: 236px; margin: 12px 0 8px -6px; }
    .sk.story .tessera b + span:last-child { margin-bottom: 26px; }
    .sk.story .tessera em { margin-top: 18px; padding: 16px 34px 18px; }
    /* Il testo sulla foto scurita, da --fine: gancio, titolo sempre alto due righe, i dati; in fondo le iscrizioni. */
    .cv.sk .col { inset: auto; left: 60px; right: 60px; top: calc(var(--fine) + 28px); bottom: calc(var(--giu) + 44px); overflow: visible; text-shadow: 0 2px 14px rgba(var(--notte),.6); }
    .sk .testo { flex: 1 1 auto; min-height: 0; overflow: hidden; }
    .sk .gancio { font-size: ${z(54)}; font-weight: 800; font-style: italic; color: #FCCF02; letter-spacing: -.01em; line-height: 1; }
    .sk .tit { margin-top: ${q(12)}; min-height: ${q(213)}; max-width: 640px; }
    .sk .tit > [data-righe] { font-weight: 800; line-height: .92; letter-spacing: -.035em; }
    .sk .tit.meta { max-width: 860px; }
    /* La meta non scende con --s come il resto: lo fa solo se non ci sta in due righe. */
    .sk .tit.meta [data-righe] { font-size: var(--t); line-height: .9; }
    /* Le righe dei dati vanno a capo prima della finestra (punta a 890 px). */
    .sk .fatti { margin-top: ${q(24)}; display: flex; flex-direction: column; gap: ${q(4)}; max-width: 800px; }
    /* pre-line: gli a capo scritti nel sottotesto restano. */
    .sk .fatti p { font-size: ${z(50)}; font-weight: 500; line-height: 1.16; white-space: pre-line; }
    .sk.story .gancio { font-size: ${z(66)}; }
    .sk.story .tit { min-height: ${q(258)}; }
    .sk.story .fatti { margin-top: ${q(30)}; gap: ${q(12)}; }
    .sk.story .fatti p { font-size: ${z(56)}; }
    .sk.story .isc > div { font-size: ${z(44)}; }
    .sk.story .isc > div > b { font-size: ${z(54)}; }
    /* Il luogo dell'evento: una riga sua, grande, col segnaposto (era una riga come le altre). */
    .sk .fatti p.dove { display: flex; gap: .28em; align-items: center; font-size: ${z(56)}; font-weight: 800; line-height: 1.05; }
    .sk.story .fatti p.dove { font-size: ${z(64)}; }
    .sk .fatti p.dove svg { flex: none; width: 1em; height: 1em; fill: #FCCF02; }
    .sk .fatti p.nota { color: #FCCF02; font-weight: 800; }
    /* Le partenze della gita: un riquadro blu per fermata, l'ora in giallo (in una riga sola erano confuse). */
    /* Non «box»: nella pagina c'è Bulma, che dà a .box colore grigio scuro e margini (il luogo usciva blu su blu). */
    .sk .partenze { display: flex; flex-wrap: wrap; gap: ${q(16)}; margin: ${q(4)} 0 ${q(6)}; }
    .sk .partenze .etichetta { flex-basis: 100%; font-size: ${z(44)}; font-weight: 700; color: #FCCF02; margin-bottom: -4px; }
    .sk .partenze .fermata { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; padding: 14px 22px 16px; color: #fff;
      border-radius: 18px; background: #084C8D; text-shadow: none; box-shadow: 0 4px 14px rgba(0,0,0,.35); }
    .sk .partenze .fermata b { font-size: ${z(64)}; font-weight: 800; line-height: 1; background: #FCCF02; color: #084C8D; padding: 2px 12px; border-radius: 10px; }
    .sk .partenze .fermata span { font-size: ${z(46)}; font-weight: 700; line-height: 1.05; }
    /* Nel post lo spazio è poco: riquadri bassi, ora e fermata affiancate, l'etichetta in fila con loro. */
    .sk:not(.story) .partenze { align-items: center; }
    .sk:not(.story) .partenze .etichetta { flex-basis: auto; margin: 0 4px 0 0; color: #fff; font-size: ${z(46)}; font-weight: 500; }
    .sk:not(.story) .partenze .fermata { flex-direction: row; align-items: center; gap: 12px; padding: 8px 18px 8px 10px; border-radius: 14px; }
    .sk:not(.story) .partenze .fermata b { font-size: ${z(46)}; padding: 0 10px; }
    .sk:not(.story) .partenze .fermata span { font-size: ${z(44)}; }
    /* I telefoni: numero e icona in giallo, senza riquadri (costerebbero righe). */
    .sk .isc .tel > svg { color: #FCCF02; }
    .sk .isc .tel b { color: #FCCF02; }
    .sk .fatti b, .sk .righe .giorno, .sk .righe .corso { text-shadow: none; }
    .sk .fatti b { font-weight: 800; line-height: 1.1; background: #FCCF02; color: #084C8D; padding: 0 .2em; border-radius: 10px; white-space: nowrap;
      -webkit-box-decoration-break: clone; box-decoration-break: clone; }
    .sk .isc { flex: none; display: flex; column-gap: 20px; align-items: center; margin-top: ${q(14)}; }
    .sk .isc > svg { flex: none; width: 56px; height: 56px; fill: currentColor; }
    .sk .isc > div { font-size: ${z(42)}; font-weight: 600; line-height: 1.2; }
    .sk .isc > div > b { display: block; font-size: ${z(46)}; font-weight: 800; letter-spacing: -.01em; }
    /* Il calendario: una riga per gita, il giorno nel colore della gita, il corso contornato. */
    .sk .righe { margin-top: ${q(24)}; display: flex; flex-direction: column; gap: ${q(8)}; }
    .sk .righe > div { display: flex; align-items: center; gap: 22px; }
    .sk .righe .giorno { flex: none; width: ${q(196)}; text-align: center; border-radius: 12px; font-size: ${q(42)}; font-weight: 800; line-height: 1.3; }
    .sk .righe .meta { font-size: ${q(48)}; font-weight: 700; letter-spacing: -.01em; min-width: 0; }
    .sk .righe .corso { font-size: ${q(36)}; font-weight: 700; line-height: 1; color: #FCCF02; border: 3px solid #FCCF02; border-radius: 999px; padding: 6px 16px; }`;
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

/* Quello che chi pubblica ha evidenziato ("*fino al 13 gennaio*") finisce in
 * <b>, che la K mette nei riquadrini gialli, senza gli asterischi.
 * Con `auto` (le informazioni) anche orari, prezzi e date ("ore 20:00",
 * "€ 30", "mercoledì 7 aprile", "14/01"); nel sottotesto no, decide chi
 * scrive. Il prezzo viene prima dell'orario: "12.50 €" è un prezzo. */
const EVIDENZA = new RegExp(`€\\s?\\d+(?:[.,]\\d{1,2})?|\\d+(?:[.,]\\d{1,2})?\\s?€|(?:ore\\s)?\\d{1,2}[:.]\\d{2}`
  + `|(?:(?:${GIORNI.join("|")})\\s)?\\d{1,2}\\s(?:${MESI.join("|")})|\\d{1,2}\\/\\d{1,2}`, "gi");
const evidenzia = (testo, auto = true) => String(testo ?? "").split(/(\*[^*\n]+\*)/).map((pezzo, i) => (i % 2
  ? `<b>${escS(pezzo.slice(1, -1))}</b>` : auto ? escS(pezzo).replace(EVIDENZA, "<b>$&</b>") : escS(pezzo))).join("");

/* Il titolo di un evento (la gita ha per titolo la meta, in postK()); un post
 * di solo sottotesto prende il nome del tipo ("Servizi"), così la grafica
 * resta quella e il sottotesto sta al suo posto. */
const titoloNuovo = (s) => escS(String(s.title || "").trim() || categoria(s.cat).label);

/* Le informazioni che hanno un posto loro: l'orario (nella tessera della K) e
 * le iscrizioni (in fondo ai dati). */
const ORARIO = /^(ora|orario|ore)$/i, ISCRIZIONI = /^iscrizion/i;
const fattoDi = (fatti, re) => fatti.find(([n]) => re.test(String(n || "").trim()));

const partenze = (s) => (s.stops || []).filter(([t, l]) => t || l)
  .map(([t, l]) => [String(t || "").replace(/^ore\s*/i, ""), l || ""]);

const icoMail = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm1 2.4V17h16V7.4l-8 5.3-8-5.3zM5.8 7 12 11.1 18.2 7H5.8z"/></svg>';

/** In fondo a ogni post: come ci si iscrive (in negozio, via mail) e i telefoni scelti per il post, su una riga. */
function iscrizioni(contatti = []) {
  const tel = contatti.length ? `<span class="tel">${icoTel("1em", "currentColor")}${contatti.map((c) =>
    `<span>${escS(c.name)} <b>${escS(c.phone)}</b>${c.hours ? ` ${escS(c.hours)}` : ""}</span>`).join("")}</span>` : "";
  return `<div class="isc">${icoMail}<div>${escS(contatti.length ? SOCIAL.iscrizioniTel : SOCIAL.iscrizioni)}<b>${escS(SOCIAL.mail)}</b></div>${tel}</div>`;
}

const icoPin = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>';

const logoNuovo = () => `<div class="logo-box"><img src="${SOCIAL.logoTondo}" alt=""></div>`;

/** La coccarda del corso, appesa alla tessera; nella story più grande. */
const stellaNuova = (story) => `<div class="stella" style="width:${210 * (story ? 1.25 : 1)}px;height:${210 * (story ? 1.25 : 1)}px">${stellaCorso(story ? 1.25 : 1)}</div>`;

/** Le gite del mese, una riga ciascuna: il giorno nel colore della gita, la meta, il corso (`corso`, l'HTML). */
function righeMese(righe, breve, corso) {
  return righe.map(([k, d, dest, c]) => {
    const C = categoria(k), giorno = `${C.day} ${breve ? Number(String(d).slice(0, 2)) : d}`.trim();
    return `<div><span class="giorno" style="background:${C.c};color:${scrittaSu(C.c)}">${escS(giorno)}</span>
      <span class="meta">${escS(unaRiga(dest))}</span>${c ? corso : ""}</div>`;
  }).join("");
}

// --- K · Piani -----------------------------------------------------------------

/* Il fondo della K: la foto (o il blu notte), il velo, i piani, logo, tessera e
 * la colonna del testo; nel giallo l'angolo e la finestra hanno la foto in grigi
 * col giallo sopra. `fine`: dove comincia il testo, se non quello della tavola. */
function fondoK({ giallo, story, foto, pos, zoom, fine }, tessera, testo, isc, corso) {
  const livelli = giallo && foto ? '<div class="grigi"></div><div class="tinta"></div>' : "";
  const finestra = giallo ? livelli : '<div class="foto-blu"></div><div class="colore-blu"></div><div class="velo-blu"></div>';
  // Nell'url() del CSS si codifica tutto tranne i caratteri di un data URL: virgolette, barre rovesce,
  // \f e \r chiuderebbero la stringa e il resto diventerebbe CSS (security review del 16/10).
  const url = foto && escS(String(foto).replace(/[^A-Za-z0-9+/=:;,.%_-]/g, encodeURIComponent));
  return `<div class="cv nuovo sk${story ? " story" : ""}${giallo ? " giallo" : ""}${foto ? "" : " senza-foto"}" style="width:1080px;height:${story ? 1920 : 1350}px${foto ? `;--immagine:url(&quot;${url}&quot;);--pos:${pos || "50% 45%"};--zoom:${zoom || 1}` : ""}${fine ? `;--fine:${fine}px` : ""}">
    ${foto ? `<img class="foto" src="${escS(foto)}" alt="">` : ""}
    <div class="piano scuro"></div><div class="piano angolo">${livelli}</div><div class="piano cuneo"></div>
    ${foto ? `<div class="piano finestra">${finestra}</div>${story ? `<div class="piano finestra fondo">${finestra}</div>` : ""}` : ""}
    <div class="piano ombra"></div>
    ${logoNuovo()}${tessera}
    <div class="col">${testo}${isc}</div>${corso ? stellaNuova(story) : ""}</div>`;
}

/** La tessera del "quando": giorno, numero, mese e l'ora (nella gita la partenza scelta, card_stop, o la prima). Senza data, niente tessera. */
function tesseraK(s) {
  const d = giornoDi(s.iso);
  if (!d) return "";
  const p = partenze(s), scelta = p.find(([, l]) => s.cardStop && l === s.cardStop) || p[0];
  const ora = s.kind === "gita" ? (scelta && scelta[0] ? `ore ${scelta[0]}` : "") : ((fattoDi(s.facts || [], ORARIO) || [])[1] || "");
  const story = s.fmt === "story";
  return `<div class="tessera"><span data-fit style="font-size:${story ? 62 : 54}px">${GIORNI[d.getDay()]}</span><b>${d.getDate()}</b>
    <span data-fit style="font-size:${story ? 78 : 66}px">${MESI[d.getMonth()]}</span>${ora ? `<em data-fit style="font-size:58px">${escS(ora)}</em>` : ""}</div>`;
}

/**
 * K · Piani: la foto a tutta pagina, il gancio giallo, il titolo bianco (nelle
 * gite «Gita a» piccolo e la meta grande, su due righe al massimo) e i dati con orari,
 * prezzi e scadenze nei riquadrini gialli. Corsi e gite di domenica in giallo e
 * nero, il resto in blu e nero (coloreNuovo).
 */
function postK(s) {
  const C = coloreNuovo(s.cat), gita = s.kind === "gita", story = s.fmt === "story";
  const quota = s.prices.map(([n, v]) => `${escS(n || "Quota")} <b>${escS(v)}</b>`).join(" · ");
  const p = partenze(s);
  const fatti = (s.facts || []).filter(([, v]) => String(v || "").trim());
  const ora = fattoDi(fatti, ORARIO), dove = fattoDi(fatti, /^dove$/i), iscr = fattoDi(fatti, ISCRIZIONI);
  const fatto = ([n, v]) => `${n && !/^(dove|luogo|quando)$/i.test(String(n).trim()) ? `${escS(n)}: ` : ""}${evidenzia(v)}`;
  const entro = (v) => `Iscrizioni entro <b>${escS(String(v).replace(/^entro\s+/i, ""))}</b>`;
  // Le righe sono testo dentro un <p>, o { html } già pronto (partenze, luogo).
  const righe = gita ? [
    // La nota facoltativa sotto la meta, in giallo ("Prova gratuita con i maestri").
    s.nota && { html: `<p class="nota">${escS(senzaSegni(s.nota))}</p>` },
    p.length && { html: `<div class="partenze"><div class="etichetta">Partenze${story ? "" : ":"}</div>${p.map(([t, l]) =>
      `<div class="fermata">${t ? `<b>${escS(t)}</b>` : ""}${l ? `<span>${escS(l)}</span>` : ""}</div>`).join("")}</div>` },
    quota,
    s.scadenza && entro(s.scadenza),
  ] : [
    String(s.sub || "").trim() && evidenzia(String(s.sub).trim(), false),
    dove && { html: `<p class="dove">${icoPin}<span>${evidenzia(dove[1])}</span></p>` },
    // L'orario sta nella tessera; senza data (niente tessera) resta fra i dati.
    !s.iso && ora && fatto(ora),
    ...fatti.filter((f) => f !== ora && f !== dove && f !== iscr).map(fatto),
    quota,
    iscr && entro(iscr[1]),
  ];
  const dest = String(s.dest || "").trim();
  // La meta va a capo dove l'ha scritto chi pubblica, o da sola se è più larga della riga; due righe al massimo,
  // poi scende (fit(), data-righe). Prima stava sempre su una riga e una meta lunga diventava piccola.
  // Su due righe scende a 104 (124 nella story, data-due): più grande della meta lunga stretta su una riga
  // (~90), ma lascia spazio a partenze, quota e scadenza (a 116/140 la story di una gita scendeva al 66%).
  const meta = (testo) => {
    const righe = righeMeta(testo), due = story ? 124 : 104;
    return `<div data-righe="2" data-due="${due}" style="--t:${righe.length > 1 ? due : story ? 168 : 150}px">${righe.map(escS).join("<br>")}</div>`;
  };
  // data-cede: se il testo non ci sta, la seconda riga tenuta per il titolo si libera prima di stringere tutto.
  // Nella gita il titolo è solo la meta: «Gita a» lo dice il gancio (l'utente: la riga in più era inutile).
  const tit = gita
    ? `<div class="tit meta" data-cede>${meta(dest)}</div>`
    : `<div class="tit" data-cede><div data-righe="2" style="--t:${story ? 140 : 116}px">${titoloNuovo(s)}</div></div>`;
  // Il gancio c'è sempre, anche vuoto: così titolo e dati partono sempre dallo stesso punto. Nella gita, se è
  // vuoto, dice «Gita a» (non se la meta dice già "Gita…").
  const gancio = escS(s.hook) || (gita && !/^gita\b/i.test(dest) ? "Gita a" : "&nbsp;");
  const testo = `<div class="testo" data-adatta=".6"><div class="gancio">${gancio}</div>${tit}
    <div class="fatti">${righe.filter(Boolean).map((r) => r.html || `<p>${r}</p>`).join("")}</div></div>`;
  return fondoK({ giallo: C.c === GIALLO, story, foto: s.photo, pos: s.pos, zoom: s.zoom }, tesseraK(s), testo, iscrizioni(s.contatti), gita && s.corso);
}

/** Calendario del mese in K: la tessera con il mese e quante gite, il titolo, una riga per gita (senza foto). */
function meseK(titolo, righe, mese) {
  const m = Number(String(mese || "").split("-")[1]);
  const tessera = `<div class="tessera">${m ? `<span data-fit style="font-size:54px">${MESI[m - 1]}</span>` : ""}<b>${righe.length}</b>
    <span data-fit style="font-size:66px">${righe.length === 1 ? "gita" : "gite"}</span></div>`;
  const testo = `<div class="testo" data-adatta=".6"><div class="gancio">Le gite del mese</div>
    <div class="tit"><div data-righe="2" style="--t:116px">${escS(titolo)}</div></div>
    <div class="righe">${righeMese(righe, true, '<span class="corso">corso</span>')}</div></div>`;
  return fondoK({ giallo: false, story: false, foto: null, fine: 470 }, tessera, testo, iscrizioni(), false);
}

/** Post o story di una gita o di un evento (modello da modelloPost()): sempre la K. */
function disegnaPost(s) { return postK(s); }

/** Calendario del mese: righe [categoria, "DD/MM", meta, corso]; `mese` "2027-01" per la tessera. */
function disegnaCalendario(titolo, righe, mese = "") { return meseK(titolo, righe, mese); }

/** Misure del post (non della story) e del calendario del mese: 4:5. */
const misurePost = () => ({ w: 1080, h: 1350 });

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
    righe.push(`🚌 ${dataLunga(ev.event_date) || ""}: gita a ${unaRiga(ev.title)}!`);
    if (ev.subtitle) righe.push(senzaSegni(ev.subtitle));
    if (ev.course) righe.push("Nello stesso giorno c'è anche il corso.");
    if ((ev.stops || []).length) righe.push("", "Partenze: " + ev.stops.map(([t, l]) => `ore ${t} ${l}`).join(", "));
    if (quote) righe.push(`Quota soci: ${quote}`);
    if (ev.deadline) righe.push(`Iscrizioni ${entro(ev.deadline)}`);
  } else {
    righe.push(`${ev.title}${ev.event_date ? ` · ${dataLunga(ev.event_date)}` : ""}`);
    if (ev.subtitle) righe.push(senzaSegni(ev.subtitle));
    if (quote) righe.push("", quote);
    for (const [k, v] of fattiEvento(ev)) righe.push(`${k}: ${senzaSegni(v)}`);
  }
  if (tel) righe.push("", `Info e iscrizioni: ${tel}`);
  righe.push("", `#sciclubdonbosco #sci${ev.kind === "gita" ? ` #${semplice(ev.title)}` : ""}`);
  return righe.join("\n");
}

// Per node (web/test-social.js): le funzioni pure.
if (typeof module !== "undefined") {
  module.exports = { dataLunga, dataCorta, categoriaGita, categoria, impostaColoriGita, impostaContatti, contattiDi, inchiostro, modelloPost,
                     contrasto, schiarisci, indirizzoUtm, testoPost, semplice, mancanti, nomePost, SOCIAL,
                     disegnaPost, disegnaCalendario, misurePost, evidenzia, coloreNuovo, giornoMese, posFoto, zoomFoto,
                     formatiCampagna, disegnaCopertina, photo };
}
