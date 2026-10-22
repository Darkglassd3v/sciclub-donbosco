// Accesso che non si legge (shared.js, requirePermesso), provato su Soci.
// my_access() in errore (rete, database giù): la pagina non resta muta su
// «Caricamento…», dice cosa è successo e di ricaricare; niente promesse rifiutate a vuoto.
{
  const rifiutate = [];
  window.addEventListener("unhandledrejection", (e) => rifiutate.push(String(e.reason?.message || e.reason)));
  FINTO.errore = (t) => (t === "rpc:my_access" ? { message: "database non raggiungibile", code: "PGRST001" } : null);
  window.addEventListener("load", () => setTimeout(() => {
    const t = document.getElementById("statusToast");
    const detto = t && t.style.display !== "none" && t.classList.contains("is-danger") && /ricarica/i.test(t.textContent);
    document.title = "RISULTATO " + [
      `messaggio=${detto ? "ok" : `NO(«${t?.textContent || "nessun messaggio"}»)`}`,
      `senzaRifiutate=${rifiutate.length ? `NO(${rifiutate.join(" / ").slice(0, 80)})` : "ok"}`,
    ].join(" ");
  }, 800));
}
