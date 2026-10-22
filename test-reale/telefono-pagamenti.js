// PAGINA: admin.html
// RUOLO: tesoriere
// LARGHEZZA: 500
// Pagamenti sul telefono, sulla copia: la tabella del nucleo non scorre di lato
// (la colonna «Da pagare» finiva fuori schermo).
{
  window.addEventListener("load", () => setTimeout(() => {
    const larghe = [...document.querySelectorAll(".tabella-scorrevole, table")].filter((c) => c.scrollWidth > c.clientWidth + 1
      || c.getBoundingClientRect().right > innerWidth + 1);
    const come = larghe.slice(0, 3).map((c) => `${c.tagName} ${c.scrollWidth}/${c.clientWidth} a ${Math.round(c.getBoundingClientRect().right)}`).join(", ");
    document.title = `RISULTATO nienteScorrimento=${larghe.length ? `NO(${larghe.length} tabelle oltre lo schermo a ${innerWidth} px: ${come})` : "ok"}`;
  }, 4000));
}
