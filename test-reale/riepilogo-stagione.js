// PAGINA: riepilogo.html
// RUOLO: superadmin
// Riepilogo, sulla copia: le entrate e le uscite sono quelle della stagione aperta
// (current_season() del database), non «dal 1° settembre in poi».
{
  window.addEventListener("load", () => setTimeout(async () => { try {
    const inside = el("tEntrate")?.textContent.includes(EXPECTED.voce);
    document.title = `RISULTATO soloStagioneAperta=${inside ? "NO(conta l'entrata della stagione dopo)" : "ok"}`;
  } catch (e) { document.title = `RISULTATO eccezione=NO(${String(e?.message || e).slice(0, 150)})`; } }, 4000));
}
