// Pagamenti (admin.html): cercando una famiglia, i riquadri in alto seguono la
// ricerca come «Nuclei»: da incassare e familiari a carico di quelle mostrate.
// In un blocco: gli script della pagina e della prova hanno gli stessi nomi globali.
{
  const nucleo = (id, cognome, saldo) => ({ head_id: id, last_name: cognome, first_name: "CAPO", enrolled_at: "2026-10-01",
    household_balance: saldo, household_total: saldo, household_paid: 0, dependents_count: 0 });
  const socio = (id, cognome, pagante) => ({ id, last_name: cognome, first_name: "FIGLIO", payer_id: pagante, total: 0, paid: 0 });
  FINTO.risposta = (t, r) => {
    if (t === "households") return [nucleo("A", "ALFA", 100), nucleo("B", "BETA", 50)];
    if (t === "members" && r.filtri.some((f) => f[0] === "in" && f[1] === "payer_id")) return [socio("A1", "ALFA", "A"), socio("B1", "BETA", "B"), socio("B2", "BETA", "B")];
    if (t === "members") return [socio("A", "ALFA", null), socio("B", "BETA", null)];
    return [];
  };
  window.addEventListener("load", () => setTimeout(() => {
    el("cercaNucleo").value = "alfa";
    el("cercaNucleo").dispatchEvent(new Event("input", { bubbles: true }));
    const totale = el("totalInsoluti").textContent.trim(), familiari = el("numFamiliari").textContent.trim();
    document.title = "RISULTATO " + [
      `totaleCercato=${totale.includes("100,00") ? "ok" : `NO(«${totale}»)`}`,
      `familiariCercati=${familiari === "1 di 3" ? "ok" : `NO(«${familiari}»)`}`,
    ].join(" ");
  }, 800));
}
