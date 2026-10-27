// Social (social.html): salvataggi.
// - Salva premuto due volte di fila su un post nuovo: un post solo.
// - Rubrica: salvandola si tolgono solo i contatti tolti qui, non quelli che non
//   c'erano quando la pagina l'ha letta (un altro li può aver appena aggiunti).
// - Sponsor con un indirizzo non valido: non si salva, il campo è bordato.
// - Aperto un post senza sponsor dopo uno con lo sponsor, lo sponsor si svuota.
const WRITES = [];
// Un post come lo legge la pagina (vedi post-rubrica.js), senza id: nuovo.
const post = (extra) => ({ kind: "gita", event_date: "2026-12-13", title: "Sestriere", subtitle: null, hook: "Gita a",
  stops: [], prices: [], show_price: true, facts: [], contacts: [], course: false, published_at: null, caption: null,
  card_stop: null, deadline: null, sponsor_id: null, ...extra });
const CONTACTS = [{ id: "C1", name: "Cesare", phone: "333 1234567", hours: null, is_default: true, position: 0 },
                  { id: "C2", name: "Dora", phone: "333 7654321", hours: null, is_default: false, position: 1 }];
const SPONSOR = [{ id: "S1", name: "SANTERO", level: "oro", url: "https://santero.it", handle: null, logo: null, logo_dark: null,
  color_dark: "#0B3D2E", color_light: "#F4E9D0", color_accent: "#E6AC34" }];
FAKE.risposta = (t, r) => {
  const writing = r.filtri.find((f) => ["insert", "update", "upsert", "delete"].includes(f[0]));
  if (writing) { WRITES.push([t, writing[0], r.filtri]); return t === "social_contacts" && writing[0] === "insert" ? [{ id: "N1" }] : { id: "P9", kind: "gita", title: "Prova" }; }
  if (t === "social_contacts") return CONTACTS;
  if (t === "sponsors") return SPONSOR;
  if (t === "social_events") return r.colonne === "photo" ? [{ photo: null }] : [];
  return [];
};
let step = "inizio";
window.addEventListener("load", () => setTimeout(async () => { try {
  const r = [];
  const test = (nome, passed, why) => r.push(`${nome}=${passed ? "ok" : `NO(${why})`}`);
  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));

  step = "apri"; await doOpen(post({}));
  await wait(200);
  const before = WRITES.length;
  step = "salva"; save(); save();
  await wait(500);
  const inserted = WRITES.slice(before).filter(([t, op]) => t === "social_events" && op === "insert").length;
  test("unPostSolo", inserted === 1, `${inserted} post inseriti`);

  const beforeR = WRITES.length;
  step = "rubrica"; saveContacts();
  await wait(500);
  const deletions = WRITES.slice(beforeR).filter(([t, op]) => t === "social_contacts" && op === "delete");
  test("rubricaNonCancellaAltri", deletions.every(([, , f]) => !f.some((x) => x[0] === "not")),
    `cancella con ${JSON.stringify(deletions.map(([, , f]) => f.filter((x) => x[0] !== "delete")))}`);

  step = "sponsor"; el("sScegli").value = "S1";
  el("sScegli").dispatchEvent(new Event("change", { bubbles: true }));
  await wait(200);
  el("sUrl").value = "www.santero it";
  const beforeS = WRITES.length;
  await saveSponsor();
  await wait(300);
  test("urlSponsor", WRITES.length === beforeS && el("sUrl").classList.contains("campo-errore"),
    `salvati ${WRITES.length - beforeS}, bordato ${el("sUrl").classList.contains("campo-errore")}`);

  await doOpen(post({ kind: "sponsor", title: "Campagna", sponsor_id: "S1", hook: null }));
  await wait(200);
  await doOpen(post({ title: "Altra", event_date: "2026-12-20" }));
  await wait(200);
  test("sponsorSvuotato", !el("fSponsor").value, `fSponsor «${el("fSponsor").value}»`);

  // The PNG export library comes from the CDN: with integrity the browser refuses a changed file.
  step = "png"; loadHtmlToImage().catch(() => {});
  const pngScript = document.querySelector('script[src*="html-to-image"]');
  test("pngIntegrity", !!pngScript?.integrity, pngScript ? "no integrity" : "script not found");
  document.title = "RISULTATO " + r.join(" ");
} catch (e) { document.title = `RISULTATO eccezione=NO(${step}: ${String(e?.message || e).slice(0, 120)} ${String(e?.stack || "").split("\n")[1]?.trim().slice(0, 80)})`; } }, 400));
