// PAGINA: stagione.html
// RUOLO: superadmin
// LARGHEZZA: 500
// Stagione sul telefono, sulla copia: nessuna tabella scorre di lato (le colonne
// fuori schermo non si vedrebbero: «Da incassare» delle stagioni).
{
  // Due volte, a 2 s di distanza: conta solo uno sforamento che resta (non quello di un ridisegno a metà).
  const aspetta = (ms) => new Promise((ok) => setTimeout(ok, ms));
  window.addEventListener("load", () => setTimeout(async () => {
    const fuori = () => [...document.querySelectorAll(".tabella-scorrevole")].filter((c) => c.scrollWidth > c.clientWidth + 1);
    const larghe = fuori().length ? (await aspetta(2000), fuori()) : [];
    document.title = `RISULTATO nienteScorrimento=${larghe.length ? `NO(${larghe.length} tabelle scorrono di lato a ${innerWidth} px)` : "ok"}`;
  }, 6000));
}
