// PAGINA: riepilogo.html
// RUOLO: superadmin
// LARGHEZZA: 500
// Riepilogo sul telefono, sulla copia: nessuna tabella scorre di lato (le
// colonne fuori schermo, come «Totale», non si vedrebbero); una voce gratuita
// ha il prezzo € 0,00, non «—» che sembra un dato mancante.
{
  window.addEventListener("load", () => setTimeout(() => { try {
    const r = [];
    const prova = (nome, vero, perche) => r.push(`${nome}=${vero ? "ok" : `NO(${perche})`}`);
    const larghe = [...document.querySelectorAll(".tabella-scorrevole")].filter((c) => c.scrollWidth > c.clientWidth + 1);
    prova("nienteScorrimento", !larghe.length, `${larghe.length} tabelle scorrono di lato a ${innerWidth} px`);
    if (ATTESO?.gratis) {
      const riga = [...el("tTess").querySelectorAll("tr")].find((tr) => tr.cells[0]?.textContent.includes(ATTESO.gratis));
      prova("gratisZero", riga?.cells[2]?.textContent.includes("0,00"), `prezzo «${riga?.cells[2]?.textContent.trim()}»`);
    }
    document.title = "RISULTATO " + r.join(" ");
  } catch (e) { document.title = `RISULTATO eccezione=NO(${String(e?.message || e).slice(0, 150)})`; } }, 4000));
}
