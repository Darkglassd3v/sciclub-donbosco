// PAGINA: admin.html
// RUOLO: tesoriere
// Pagamenti, sulla copia: con lo Storico aperto sul nucleo A si incassa il nucleo
// B. B deve risultare saldato subito, non restare «Incassa €…» (il ridisegno
// salta per non chiudere lo Storico aperto).
{
  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  window.addEventListener("load", () => setTimeout(async () => { try {
    if (!EXPECTED?.a || !EXPECTED?.b) { document.title = "RISULTATO dati=NO(servono due nuclei da incassare nella copia)"; return; }
    document.querySelector(`[data-storico="${EXPECTED.a}"]`)?.click();
    await wait(1500);
    const isOpen = Boolean(document.querySelector(".riga-aperta"));
    const balanceB = lastOnes[0].find((n) => n.head_id === EXPECTED.b)?.household_balance;
    await settle(EXPECTED.b, balanceB);
    await wait(1500);
    const still = Boolean(document.querySelector(`#barra_${CSS.escape(EXPECTED.b)} [data-chiedi]`));
    document.title = `RISULTATO storicoAperto=${isOpen ? "ok" : "NO(lo Storico non si è aperto)"} saldatoSubito=${still ? "NO(dopo l'incasso dice ancora «Incassa»)" : "ok"}`;
  } catch (e) { document.title = `RISULTATO eccezione=NO(${String(e?.message || e).slice(0, 150)})`; } }, 4000));
}
