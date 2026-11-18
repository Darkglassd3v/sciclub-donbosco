// PAGINA: bilancio.html
// RUOLO: superadmin
// LARGHEZZA: 500
// Bilancio sul telefono, sulla copia: nessuna tabella scorre di lato (le colonne
// fuori schermo non si vedrebbero: importo ed Elimina dei movimenti).
{
  // Due volte, a 2 s di distanza: conta solo uno sforamento che resta (non quello di un ridisegno a metà).
  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  window.addEventListener("load", () => setTimeout(async () => {
    const outside = () => [...document.querySelectorAll(".tabella-scorrevole")].filter((c) => c.scrollWidth > c.clientWidth + 1);
    const wideOnes = outside().length ? (await wait(2000), outside()) : [];
    // Cosa sporge: le celle più a destra del bordo della tabella, per sapere da dove partire.
    const protruding = wideOnes.flatMap((c) => {
      const table = c.querySelector("table");
      const widest = [...c.querySelectorAll("td *, td")].sort((x, y) => y.getBoundingClientRect().right - x.getBoundingClientRect().right)[0];
      return [`riquadro ${c.clientWidth} px, tabella ${table?.offsetWidth} px (${table && getComputedStyle(table).display})`,
        widest && `${widest.tagName.toLowerCase()}.${String(widest.className).split(" ")[0]} fino a ${Math.round(widest.getBoundingClientRect().right - c.getBoundingClientRect().left)} px`];
    });
    document.title = `RISULTATO nienteScorrimento=${wideOnes.length ? `NO(${wideOnes.length} tabelle scorrono di lato a ${innerWidth} px: ${protruding.join(" / ")})` : "ok"}`;
  }, 6000));
}
