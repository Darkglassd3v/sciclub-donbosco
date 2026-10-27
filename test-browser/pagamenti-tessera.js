// Pagamenti (admin.html): ogni socio mostra il suo numero tessera, accanto al nome (richiesta
// del 27/10/2026: quando chi ha dato un acconto torna a pagare, la ricevuta porta il numero
// tessera). Senza numero la riga lo dice, invece di non mostrare niente.
// - conNumero: nella riga del capofamiglia «Tessera n° 33», visibile;
// - senzaNumero: nella riga del familiare senza tessera «Senza numero tessera».
// In un blocco: gli script della pagina e della prova hanno gli stessi nomi globali.
{
  const household = { head_id: "A", last_name: "ALFA", first_name: "CAPO", enrolled_at: "2026-10-01",
    household_balance: 60, household_total: 100, household_paid: 40, dependents_count: 1 };
  const member = (id, firstName, payer, card) => ({ id, last_name: "ALFA", first_name: firstName, payer_id: payer,
    card_number: card, total: 50, paid: 20, balance: 30 });
  FAKE.risposta = (t, r) => {
    if (t === "households") return [household];
    if (t === "members" && r.filtri.some((f) => f[0] === "in" && f[1] === "payer_id")) return [member("A1", "FIGLIO", "A", null)];
    if (t === "members") return [member("A", "CAPO", null, "33")];
    return [];
  };
  window.addEventListener("load", () => setTimeout(() => {
    const row = (id) => document.querySelector(`tr[data-socio="${id}"]`);
    const shown = (x) => !!x && x.getClientRects().length > 0;
    const card = (id) => { const t = row(id)?.querySelector(".numero-tessera"); return shown(t) ? t.textContent.trim() : "niente"; };
    document.title = "RISULTATO " + [
      `conNumero=${card("A") === "Tessera n° 33" ? "ok" : `NO(«${card("A")}»)`}`,
      `senzaNumero=${card("A1") === "Senza numero tessera" ? "ok" : `NO(«${card("A1")}»)`}`,
    ].join(" ");
  }, 1200));
}
