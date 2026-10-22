// PAGINA: ricerca/index.html
// RUOLO: superadmin
// Cerca socio, sulla copia: svuotato il campo mentre la ricerca è in viaggio
// (qui la risposta è rallentata), i risultati vecchi non devono ricomparire.
{
  const fetchVero = window.fetch.bind(window);
  window.fetch = (url, ...resto) => (String(url).includes("/rest/v1/members")
    ? new Promise((ok) => setTimeout(ok, 1200)).then(() => fetchVero(url, ...resto)) : fetchVero(url, ...resto));
  const aspetta = (ms) => new Promise((ok) => setTimeout(ok, ms));
  window.addEventListener("load", () => setTimeout(async () => { try {
    const q = document.getElementById("q");
    q.value = ATTESO.cognome;
    q.dispatchEvent(new Event("input", { bubbles: true }));
    await aspetta(500);
    q.value = "";
    q.dispatchEvent(new Event("input", { bubbles: true }));
    await aspetta(2500);
    const voci = document.querySelectorAll("#lista > *, #risultati > *").length;
    document.title = `RISULTATO campoVuoto=${voci ? `NO(${voci} risultati della ricerca vecchia)` : "ok"}`;
  } catch (e) { document.title = `RISULTATO eccezione=NO(${String(e?.message || e).slice(0, 150)})`; } }, 2500));
}
