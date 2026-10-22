// PAGINA: admin.html
// RUOLO: tesoriere
// Pagamenti, sulla copia: chi si è iscritto ad agosto per la stagione aperta (il
// database la decide da season_history, non dal 1° settembre) deve comparire.
{
  window.addEventListener("load", () => setTimeout(async () => { try {
    if (!ATTESO?.id) { document.title = "RISULTATO dati=NO(nessun nucleo con un saldo nella copia)"; return; }
    // Fra i nuclei caricati (ultimi[0]), non nel testo: un omonimo lo darebbe per presente.
    const presente = ultimi[0].some((n) => n.head_id === ATTESO.id);
    document.title = `RISULTATO iscrittoAdAgosto=${presente ? "ok" : "NO(il nucleo iscritto ad agosto non c'è)"}`;
  } catch (e) { document.title = `RISULTATO eccezione=NO(${String(e?.message || e).slice(0, 150)})`; } }, 4000));
}
