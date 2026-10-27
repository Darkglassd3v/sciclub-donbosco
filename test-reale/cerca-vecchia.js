// PAGINA: ricerca/index.html
// RUOLO: superadmin
// Cerca socio, sulla copia: svuotato il campo mentre la ricerca è in viaggio
// (qui la risposta è rallentata), i risultati vecchi non devono ricomparire.
{
  const realFetch = window.fetch.bind(window);
  window.fetch = (url, ...rest) => (String(url).includes("/rest/v1/members")
    ? new Promise((ok) => setTimeout(ok, 1200)).then(() => realFetch(url, ...rest)) : realFetch(url, ...rest));
  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  window.addEventListener("load", () => setTimeout(async () => { try {
    const q = document.getElementById("q");
    q.value = EXPECTED.cognome;
    q.dispatchEvent(new Event("input", { bubbles: true }));
    await wait(500);
    q.value = "";
    q.dispatchEvent(new Event("input", { bubbles: true }));
    await wait(2500);
    const items = document.querySelectorAll("#lista > *, #risultati > *").length;
    document.title = `RISULTATO campoVuoto=${items ? `NO(${items} risultati della ricerca vecchia)` : "ok"}`;
  } catch (e) { document.title = `RISULTATO eccezione=NO(${String(e?.message || e).slice(0, 150)})`; } }, 2500));
}
