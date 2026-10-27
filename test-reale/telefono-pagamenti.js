// PAGINA: admin.html
// RUOLO: tesoriere
// LARGHEZZA: 500
// Pagamenti sul telefono, sulla copia: la tabella del nucleo non scorre di lato
// (la colonna «Da pagare» finiva fuori schermo).
{
  // Due volte, a 2 s di distanza: conta solo uno sforamento che resta (non quello di un ridisegno a metà).
  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  window.addEventListener("load", () => setTimeout(async () => {
    const outside = () => [...document.querySelectorAll(".tabella-scorrevole, table")].filter((c) => c.scrollWidth > c.clientWidth + 1
      || c.getBoundingClientRect().right > innerWidth + 1);
    const wideOnes = outside().length ? (await wait(2000), outside()) : [];
    const come = wideOnes.slice(0, 3).map((c) => `${c.tagName} ${c.scrollWidth}/${c.clientWidth} a ${Math.round(c.getBoundingClientRect().right)}`).join(", ");
    document.title = `RISULTATO nienteScorrimento=${wideOnes.length ? `NO(${wideOnes.length} tabelle oltre lo schermo a ${innerWidth} px: ${come})` : "ok"}`;
  }, 6000));
}
