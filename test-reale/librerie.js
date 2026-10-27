// PAGINA: index.html
// RUOLO: superadmin
// jsPDF (scheda del socio) si carica col controllo integrity: l'impronta deve
// essere quella del file vero, se no il browser lo rifiuta e il PDF non si fa.
{
  window.addEventListener("load", () => setTimeout(async () => { try {
    await loadPdf();
    document.title = `RISULTATO jspdf=${window.jspdf?.jsPDF ? "ok" : "NO(jsPDF non caricato)"}`;
  } catch (e) { document.title = `RISULTATO jspdf=NO(${String(e?.message || e).slice(0, 150)})`; } }, 2500));
}
