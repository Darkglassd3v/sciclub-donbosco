// PAGINA: stagione.html
// RUOLO: superadmin
// LARGHEZZA: 500
// Stagione sul telefono, sulla copia: nessuna tabella scorre di lato (le colonne
// fuori schermo non si vedrebbero: «Da incassare» delle stagioni).
{
  window.addEventListener("load", () => setTimeout(() => {
    const larghe = [...document.querySelectorAll(".tabella-scorrevole")].filter((c) => c.scrollWidth > c.clientWidth + 1);
    document.title = `RISULTATO nienteScorrimento=${larghe.length ? `NO(${larghe.length} tabelle scorrono di lato a ${innerWidth} px)` : "ok"}`;
  }, 4000));
}
