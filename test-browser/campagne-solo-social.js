// Social (social.html): chi ha il permesso social ma non bilancio apre una campagna salvata.
// Le spese non si vedono e la pagina non le chiede nemmeno al database.
FAKE.rpc.my_access = [{ ...FAKE.rpc.my_access[0], role: "social", real_role: "social", permissions: ["social"] }];
const ASKED = [];
FAKE.risposta = (t, r) => {
  ASKED.push(t);
  if (t === "social_events") return r.colonne === "photo" ? [{ photo: null }] : [{ id: "P1", kind: "sponsor", event_date: "2026-12-01",
    title: "Brindisi", sponsor_id: "S1", subtitle: null, stops: [], prices: [], facts: [], contacts: [], published_at: null }];
  if (t === "sponsors") return [{ id: "S1", name: "AUTO", level: "Sponsor", url: null, color_dark: "#14202E", color_light: "#FFFFFF", color_accent: "#1C69D4" }];
  return [];
};
window.addEventListener("load", () => setTimeout(async () => { try {
  await doOpen(posts[0]);
  await new Promise((ok) => setTimeout(ok, 500));
  const hidden = !el("speseCampagna") || !!el("speseCampagna").closest("[hidden]");
  document.title = `RISULTATO speseNascoste=${hidden ? "ok" : "NO(riquadro spese visibile)"}`
    + ` nienteBilancio=${ASKED.includes("ledger_entries") ? "NO(chiesti i movimenti)" : "ok"}`
    + ` campagnaAperta=${location.hash === "#campagne" ? "ok" : `NO(${location.hash})`}`;
} catch (e) { document.title = `RISULTATO eccezione=NO(${String(e?.message || e).slice(0, 120)})`; } }, 400));
