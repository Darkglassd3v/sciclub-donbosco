// Social (social.html): salvataggi.
// - Salva premuto due volte di fila su un post nuovo: un post solo.
// - Rubrica: salvandola si tolgono solo i contatti tolti qui, non quelli che non
//   c'erano quando la pagina l'ha letta (un altro li può aver appena aggiunti).
// - Sponsor con un indirizzo non valido: non si salva, il campo è bordato.
// - Aperto un post senza sponsor dopo uno con lo sponsor, lo sponsor si svuota.
const SCRITTURE = [];
// Un post come lo legge la pagina (vedi post-rubrica.js), senza id: nuovo.
const post = (extra) => ({ kind: "gita", event_date: "2026-12-13", title: "Sestriere", subtitle: null, hook: "Gita a",
  stops: [], prices: [], show_price: true, facts: [], contacts: [], course: false, published_at: null, caption: null,
  card_stop: null, deadline: null, sponsor_id: null, ...extra });
const CONTATTI = [{ id: "C1", name: "Cesare", phone: "333 1234567", hours: null, is_default: true, position: 0 },
                  { id: "C2", name: "Dora", phone: "333 7654321", hours: null, is_default: false, position: 1 }];
const SPONSOR = [{ id: "S1", name: "SANTERO", level: "oro", url: "https://santero.it", handle: null, logo: null, logo_dark: null,
  color_dark: "#0B3D2E", color_light: "#F4E9D0", color_accent: "#E6AC34" }];
FINTO.risposta = (t, r) => {
  const scrittura = r.filtri.find((f) => ["insert", "update", "upsert", "delete"].includes(f[0]));
  if (scrittura) { SCRITTURE.push([t, scrittura[0], r.filtri]); return t === "social_contacts" && scrittura[0] === "insert" ? [{ id: "N1" }] : { id: "P9", kind: "gita", title: "Prova" }; }
  if (t === "social_contacts") return CONTATTI;
  if (t === "sponsors") return SPONSOR;
  if (t === "social_events") return r.colonne === "photo" ? [{ photo: null }] : [];
  return [];
};
let passo = "inizio";
window.addEventListener("load", () => setTimeout(async () => { try {
  const r = [];
  const prova = (nome, vero, perche) => r.push(`${nome}=${vero ? "ok" : `NO(${perche})`}`);
  const aspetta = (ms) => new Promise((ok) => setTimeout(ok, ms));

  passo = "apri"; await apri(post({}));
  await aspetta(200);
  const prima = SCRITTURE.length;
  passo = "salva"; salva(); salva();
  await aspetta(500);
  const inseriti = SCRITTURE.slice(prima).filter(([t, op]) => t === "social_events" && op === "insert").length;
  prova("unPostSolo", inseriti === 1, `${inseriti} post inseriti`);

  const primaR = SCRITTURE.length;
  passo = "rubrica"; salvaRubrica();
  await aspetta(500);
  const cancellazioni = SCRITTURE.slice(primaR).filter(([t, op]) => t === "social_contacts" && op === "delete");
  prova("rubricaNonCancellaAltri", cancellazioni.every(([, , f]) => !f.some((x) => x[0] === "not")),
    `cancella con ${JSON.stringify(cancellazioni.map(([, , f]) => f.filter((x) => x[0] !== "delete")))}`);

  passo = "sponsor"; el("sScegli").value = "S1";
  el("sScegli").dispatchEvent(new Event("change", { bubbles: true }));
  await aspetta(200);
  el("sUrl").value = "www.santero it";
  const primaS = SCRITTURE.length;
  await salvaSponsor();
  await aspetta(300);
  prova("urlSponsor", SCRITTURE.length === primaS && el("sUrl").classList.contains("campo-errore"),
    `salvati ${SCRITTURE.length - primaS}, bordato ${el("sUrl").classList.contains("campo-errore")}`);

  await apri(post({ kind: "sponsor", title: "Campagna", sponsor_id: "S1", hook: null }));
  await aspetta(200);
  await apri(post({ title: "Altra", event_date: "2026-12-20" }));
  await aspetta(200);
  prova("sponsorSvuotato", !el("fSponsor").value, `fSponsor «${el("fSponsor").value}»`);
  document.title = "RISULTATO " + r.join(" ");
} catch (e) { document.title = `RISULTATO eccezione=NO(${passo}: ${String(e?.message || e).slice(0, 120)} ${String(e?.stack || "").split("\n")[1]?.trim().slice(0, 80)})`; } }, 400));
