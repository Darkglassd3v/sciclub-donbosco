// Se l'elenco dei post non si riesce a leggere, la pagina lo dice: non resta su «Caricamento…» né dice «Nessun post».
FAKE.errore = (t) => (t === "social_events" ? { message: "rete giù" } : null);
FAKE.risposta = () => [];
window.addEventListener("load", () => setTimeout(() => {
  const text = el("elencoPost").textContent.trim();
  const fine = /non disponibile/.test(text) && !/Caricamento|Nessun/.test(text);
  document.title = `RISULTATO elencoNonDisponibile=${fine ? "ok" : `NO(${text})`}`;
}, 800));
