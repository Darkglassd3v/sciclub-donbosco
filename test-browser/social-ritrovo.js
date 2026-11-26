// Social (social.html), dalla 3.15.5: l'ora del ritrovo nelle gite.
// - Nella gita, sotto le partenze, il campo «Ritrovo»: si riempie dal post aperto e si salva in meeting_time.
// - L'elenco dei post legge anche meeting_time (senza, riaprendo un post il ritrovo sparirebbe).
// - Negli eventi il campo non si vede e non si salva.
const WRITES = [];
let listColumns = "";
const post = (extra) => ({ kind: "gita", event_date: "2026-12-01", title: "Valtournenche", subtitle: null, hook: "Gita a",
  stops: [["6:45", "Asti, Piazza d'Armi"]], prices: [], show_price: true, facts: [], contacts: [], course: false,
  published_at: null, caption: null, card_stop: "Asti, Piazza d'Armi", deadline: null, sponsor_id: null, ...extra });
FAKE.risposta = (t, r) => {
  const writing = r.filtri.find((f) => ["insert", "update", "upsert"].includes(f[0]));
  if (writing) { WRITES.push([t, writing[0], writing[1]]); return { id: "P9", kind: "gita", title: "Prova" }; }
  if (t === "social_events" && r.colonne !== "photo") listColumns = r.colonne || listColumns;
  if (t === "social_events") return r.colonne === "photo" ? [{ photo: null }] : [];
  return [];
};
let step = "inizio";
window.addEventListener("load", () => setTimeout(async () => { try {
  const r = [];
  const test = (nome, passed, why) => r.push(`${nome}=${passed ? "ok" : `NO(${why})`}`);
  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const shown = (node) => Boolean(node) && node.getClientRects().length > 0;

  test("elencoLegge", /(^|,)meeting_time(,|$)/.test(listColumns), `colonne «${listColumns.slice(0, 80)}…»`);

  step = "apri"; await doOpen(post({ id: "P1", meeting_time: "6:30" }));
  await wait(200);
  const field = document.getElementById("fRitrovo");
  test("campo", shown(field) && field.value === "6:30", `campo ${Boolean(field)}, visibile ${shown(field)}, valore «${field?.value}»`);

  step = "salva";
  if (field) { field.value = "6:20"; field.dispatchEvent(new Event("input", { bubbles: true })); }
  const before = WRITES.length;
  save();
  await wait(500);
  const saved = WRITES.slice(before).find(([t]) => t === "social_events")?.[2];
  test("salvato", saved?.meeting_time === "6:20", `scritto ${JSON.stringify(saved && { meeting_time: saved.meeting_time })}`);

  step = "evento"; await doOpen(post({ id: "P2", kind: "evento", title: "Cena", stops: [], card_stop: null, meeting_time: null }));
  await wait(200);
  test("eventoSenza", !shown(document.getElementById("fRitrovo")) && daForm().meeting_time === null,
    `visibile ${shown(document.getElementById("fRitrovo"))}, valore ${JSON.stringify(daForm().meeting_time)}`);
  document.title = "RISULTATO " + r.join(" ");
} catch (e) { document.title = `RISULTATO eccezione=NO(${step}: ${String(e?.message || e).slice(0, 120)})`; } }, 400));
