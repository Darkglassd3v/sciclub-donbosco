// PAGINA: ricerca/gite.html
// RUOLO: superadmin
// Gite, sulla copia: svuotato il campo mentre la ricerca dei «senza abbonamento»
// è in viaggio (risposta rallentata), i risultati vecchi non devono ricomparire.
{
  const realFetch = window.fetch.bind(window);
  window.fetch = (url, ...rest) => (String(url).includes("/rest/v1/members")
    ? new Promise((ok) => setTimeout(ok, 1200)).then(() => realFetch(url, ...rest)) : realFetch(url, ...rest));
  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  window.addEventListener("load", () => setTimeout(async () => { try {
    if (!EXPECTED?.cognome) { document.title = "RISULTATO dati=NO(nessun tesserato senza abbonamento)"; return; }
    const q = document.getElementById("q");
    q.value = EXPECTED.cognome;
    q.dispatchEvent(new Event("input", { bubbles: true }));
    await wait(600);
    q.value = "";
    q.dispatchEvent(new Event("input", { bubbles: true }));
    await wait(2500);
    const items = document.querySelectorAll("#senzaAbbonamento > *").length;
    document.title = `RISULTATO campoVuoto=${items ? `NO(${items} risultati della ricerca vecchia)` : "ok"}`;
  } catch (e) { document.title = `RISULTATO eccezione=NO(${String(e?.message || e).slice(0, 150)})`; } }, 3000));
}
