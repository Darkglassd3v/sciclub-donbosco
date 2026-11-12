// Social (social.html): le spese delle inserzioni si registrano su ogni post, non solo sulle
// campagne degli sponsor (richiesta del 12/11: es. il post della presciistica sponsorizzato).
// - Aperto un evento, con il permesso bilancio, il riquadro delle spese c'è e somma i movimenti.
// - Su un post che non è una campagna non c'è il «rimborso dallo sponsor»: solo la spesa.
// - La spesa registrata va in Bilancio collegata al post (social_event_id).
const SPENT = [];
FAKE.risposta = (t, r) => {
  const writing = r.filtri.find((f) => ["insert", "update", "upsert", "delete"].includes(f[0]));
  if (writing) { SPENT.push([t, writing[0], writing[1]]); return [{ id: "L1" }]; }
  if (t === "social_events") return r.colonne === "photo" ? [{ photo: null }] : [{ id: "E1", kind: "evento", event_date: "2026-10-16",
    title: "Presciistica", sponsor_id: null, subtitle: null, stops: [], prices: [], facts: [], contacts: [], published_at: null }];
  if (t === "ledger_entries") return r.filtri.some((f) => f[0] === "eq" && f[1] === "social_event_id" && f[2] === "E1")
    ? [{ kind: "USCITA", amount: 20 }] : [];
  return [];
};
window.addEventListener("load", () => setTimeout(async () => { try {
  const r = [];
  const test = (nome, passed, why) => r.push(`${nome}=${passed ? "ok" : `NO(${why})`}`);
  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const visible = (x) => !!x && !x.closest("[hidden]") && x.getClientRects().length > 0;
  await doOpen(posts[0]);
  await wait(500);
  test("speseSuEvento", visible(el("speseCampagna")), "riquadro spese nascosto su un evento");
  const totals = el("totaleSpese").textContent.replace(/\s+/g, " ");
  test("totaleEvento", totals.includes("Speso € 20,00") && !totals.includes("Rimborsato"), totals.slice(0, 80));
  const refund = [...el("spTipo").options].find((o) => o.value === "ENTRATA");
  test("senzaRimborsoSponsor", !refund || refund.hidden || refund.disabled, "il rimborso dallo sponsor si può scegliere su un evento");
  el("btnRegistraSpesa").click();
  await wait(100);
  el("spImporto").value = "15";
  el("spSalva").click();
  await wait(100);
  document.querySelector("dialog.finestra-domanda[open] [data-si]")?.click();
  await wait(400);
  const row = SPENT.find(([t, op]) => t === "ledger_entries" && op === "insert")?.[2];
  test("spesaCollegata", row?.kind === "USCITA" && row?.social_event_id === "E1" && row?.unit_price === 15 && /Presciistica/.test(row?.description || ""),
    JSON.stringify(row || null).slice(0, 120));
  document.title = "RISULTATO " + r.join(" ");
} catch (e) { document.title = `RISULTATO eccezione=NO(${String(e?.message || e).slice(0, 120)})`; } }, 400));
