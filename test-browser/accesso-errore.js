// Accesso che non si legge (shared.js, requirePermesso), provato su Soci.
// my_access() in errore (rete, database giù): la pagina non resta muta su
// «Caricamento…», dice cosa è successo e di ricaricare; niente promesse rifiutate a vuoto.
{
  const rejected = [];
  window.addEventListener("unhandledrejection", (e) => rejected.push(String(e.reason?.message || e.reason)));
  FAKE.errore = (t) => (t === "rpc:my_access" ? { message: "database non raggiungibile", code: "PGRST001" } : null);
  window.addEventListener("load", () => setTimeout(() => {
    const t = document.getElementById("statusToast");
    const said = t && t.style.display !== "none" && t.classList.contains("is-danger") && /ricarica/i.test(t.textContent);
    document.title = "RISULTATO " + [
      `messaggio=${said ? "ok" : `NO(«${t?.textContent || "nessun messaggio"}»)`}`,
      `senzaRifiutate=${rejected.length ? `NO(${rejected.join(" / ").slice(0, 80)})` : "ok"}`,
    ].join(" ");
  }, 800));
}
