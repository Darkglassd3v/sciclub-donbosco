// In ogni pagina: se le letture falliscono nessun elenco resta su «Caricamento…» (richiesta del 3/11).
FAKE.errore = () => ({ message: "rete giù" });
window.addEventListener("load", () => setTimeout(() => {
  const stuck = [...document.querySelectorAll("body *")].filter((x) => !x.children.length && x.textContent.trim() === "Caricamento…" && x.id !== "caricamento");
  document.title = `RISULTATO nienteInAttesa=${stuck.length ? `NO(${stuck.map((x) => x.closest("[id]")?.id || x.tagName).join(",")})` : "ok"}`;
}, 1500));
