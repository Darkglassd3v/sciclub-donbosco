// Riepilogo (riepilogo.html): in Tessere la riga dei tesserati veri, contati dalla regola del database
// (card_holder: tessera, presciistica o agevolazione famiglia), senza toccare le tabelle coi prezzi.
// Presciistica subito dopo Tessere (richiesta del 29/10).
const ASKED = [];
FAKE.risposta = (t, r) => {
  ASKED.push([t, r.colonne, r.filtri]);
  if (t === "season_totals") return [{ total_members: 28, total_due: 0, total_collected: 0, outstanding: 0 }];
  if (t === "card_counts") return [{ name: "ORDINARIA", count: 15, price: 30, total: 450 }, { name: "JUNIOR", count: 5, price: 20, total: 100 }];
  if (t === "members") return Array.from({ length: 26 }, (_, i) => ({ id: `m${i}` }));
  return [];
};
window.addEventListener("load", () => setTimeout(async () => { try {
  await new Promise((ok) => setTimeout(ok, 500));
  const line = el("totTesserati");
  const text = line ? line.textContent.replace(/\s+/g, " ").trim() : "";
  const holders = ASKED.find(([t, , f]) => t === "members" && f.some((x) => x[0] === "is" && x[1] === "card_holder" && x[2] === true));
  const tess = el("tTess").closest("section"), presc = el("tPresc").closest("section");
  document.title = "RISULTATO"
    + ` tesserati=${text === "Tesserati in tutto: 26 — 20 con la tessera, 6 coperti da presciistica o agevolazione famiglia" ? "ok" : `NO(«${text}»)`}`
    + ` regolaDatabase=${holders && holders[2].some((x) => x[0] === "not" && x[1] === "enrolled_at") ? "ok" : "NO(tesserati non letti con card_holder)"}`
    + ` presciDopoTessere=${tess.nextElementSibling === presc ? "ok" : "NO(Presciistica non è dopo Tessere)"}`;
} catch (e) { document.title = `RISULTATO eccezione=NO(${String(e?.message || e).slice(0, 120)})`; } }, 400));
