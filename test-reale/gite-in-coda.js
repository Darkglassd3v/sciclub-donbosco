// PAGINA: ricerca/gite.html
// RUOLO: superadmin
// Gite, sulla copia: l'abbonamento venduto a un socio è ancora in coda (la linea
// non c'è, add_pass non arriva). Cercando di nuovo, il socio non deve ricomparire
// fra i «senza abbonamento»: un secondo click glielo venderebbe due volte.
{
  // La vendita resta in viaggio finché la prova non finisce.
  const fetchVero = window.fetch.bind(window);
  window.fetch = (url, ...resto) => (String(url).includes("/rpc/add_pass") ? new Promise(() => {}) : fetchVero(url, ...resto));
  if (ATTESO?.id) {
    localStorage.setItem("sciclub-gite-da-inviare", JSON.stringify([{ id: "prova-coda-1", tipo: "abbonamento", socio: ATTESO.id,
      chi: `${ATTESO.cognome} ${ATTESO.nome}`, cognome: ATTESO.cognome, nome_socio: ATTESO.nome, nome: ATTESO.voce,
      prezzo: 0, pagato: false, trips: 5, day: null }]));
  }
  const aspetta = (ms) => new Promise((ok) => setTimeout(ok, ms));
  window.addEventListener("load", () => setTimeout(async () => { try {
    if (!ATTESO?.id) { document.title = "RISULTATO dati=NO(nessun tesserato senza abbonamento nella copia)"; return; }
    const q = document.getElementById("q");
    q.value = ATTESO.cognome;
    q.dispatchEvent(new Event("input", { bubbles: true }));
    await aspetta(1500);
    const ancora = Boolean(document.querySelector(`#senzaAbbonamento [data-assegna="${ATTESO.id}"]`));
    document.title = `RISULTATO inCoda=${ancora ? "NO(con l'abbonamento in coda è ancora fra i senza)" : "ok"}`;
  } catch (e) { document.title = `RISULTATO eccezione=NO(${String(e?.message || e).slice(0, 150)})`; } }, 3000));
}
