// PAGINA: admin.html
// RUOLO: tesoriere
// Pagamenti, sulla copia: con lo Storico aperto sul nucleo A si incassa il nucleo
// B. B deve risultare saldato subito, non restare «Incassa €…» (il ridisegno
// salta per non chiudere lo Storico aperto).
{
  const aspetta = (ms) => new Promise((ok) => setTimeout(ok, ms));
  window.addEventListener("load", () => setTimeout(async () => { try {
    if (!ATTESO?.a || !ATTESO?.b) { document.title = "RISULTATO dati=NO(servono due nuclei da incassare nella copia)"; return; }
    document.querySelector(`[data-storico="${ATTESO.a}"]`)?.click();
    await aspetta(1500);
    const aperto = Boolean(document.querySelector(".riga-aperta"));
    const saldoB = ultimi[0].find((n) => n.head_id === ATTESO.b)?.household_balance;
    await salda(ATTESO.b, saldoB);
    await aspetta(1500);
    const ancora = Boolean(document.querySelector(`#barra_${CSS.escape(ATTESO.b)} [data-chiedi]`));
    document.title = `RISULTATO storicoAperto=${aperto ? "ok" : "NO(lo Storico non si è aperto)"} saldatoSubito=${ancora ? "NO(dopo l'incasso dice ancora «Incassa»)" : "ok"}`;
  } catch (e) { document.title = `RISULTATO eccezione=NO(${String(e?.message || e).slice(0, 150)})`; } }, 4000));
}
