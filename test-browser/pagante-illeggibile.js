// Soci (index.html): il pagante di un socio non si legge (errore). Non si deve
// vedere il suo id come nome nel campo «La paga un familiare»: la scheda non è
// caricata tutta, e si dice di riaprirla (come per abbonamenti e familiari).
// In un blocco: gli script della pagina e della prova hanno gli stessi nomi globali.
{
  const LISTINO = [{ category: "TESSERA", name: "TESSERA ORDINARIA - REALE MUTUA NEVE", price: 40, min_role: "utente" }];
  const eq = (r, campo) => r.filtri.find((f) => f[0] === "eq" && f[1] === campo)?.[2];
  FINTO.risposta = (t, r) => {
    if (t === "prices") return LISTINO;
    if (t === "members" && eq(r, "id") === "M") return [{ id: "M", last_name: "FIGLIO", first_name: "UNO", updated_at: "1", enrolled_at: "2026-10-14",
      paid: 0, total: 0, total_manual: false, payer_id: "P-ID-SEGRETO" }];
    return [];
  };
  FINTO.errore = (t, r) => (t === "members" && eq(r, "id") === "P-ID-SEGRETO" ? { message: "prova: pagante illeggibile" } : null);
  window.addEventListener("load", () => setTimeout(async () => {
    await caricaSocio("M");
    const campo = el("f_payerDisplay").value;
    const t = el("statusToast");
    const detto = t && t.style.display !== "none" && /riaprirla|riprova/i.test(t.textContent);
    document.title = "RISULTATO " + [
      `niente id=${campo.includes("P-ID-SEGRETO") ? `NO(nel campo «${campo}»)` : "ok"}`,
      `detto=${detto ? "ok" : `NO(«${t?.textContent || "nessun messaggio"}»)`}`,
    ].join(" ").replace("niente id", "nienteId");
  }, 500));
}
