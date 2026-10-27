// Pagamenti (admin.html): cercando una famiglia, i riquadri in alto seguono la
// ricerca come «Nuclei»: da incassare e familiari a carico di quelle mostrate.
// In un blocco: gli script della pagina e della prova hanno gli stessi nomi globali.
{
  const household = (id, surname, balance) => ({ head_id: id, last_name: surname, first_name: "CAPO", enrolled_at: "2026-10-01",
    household_balance: balance, household_total: balance, household_paid: 0, dependents_count: 0 });
  const member = (id, surname, payer) => ({ id, last_name: surname, first_name: "FIGLIO", payer_id: payer, total: 0, paid: 0 });
  FAKE.risposta = (t, r) => {
    if (t === "households") return [household("A", "ALFA", 100), household("B", "BETA", 50)];
    if (t === "members" && r.filtri.some((f) => f[0] === "in" && f[1] === "payer_id")) return [member("A1", "ALFA", "A"), member("B1", "BETA", "B"), member("B2", "BETA", "B")];
    if (t === "members") return [member("A", "ALFA", null), member("B", "BETA", null)];
    return [];
  };
  window.addEventListener("load", () => setTimeout(() => {
    el("cercaNucleo").value = "alfa";
    el("cercaNucleo").dispatchEvent(new Event("input", { bubbles: true }));
    const totalAmount = el("totalInsoluti").textContent.trim(), familyMembers = el("numFamiliari").textContent.trim();
    document.title = "RISULTATO " + [
      `totaleCercato=${totalAmount.includes("100,00") ? "ok" : `NO(«${totalAmount}»)`}`,
      `familiariCercati=${familyMembers === "1 di 3" ? "ok" : `NO(«${familyMembers}»)`}`,
    ].join(" ");
  }, 800));
}
