// PAGINA: ricerca/gite.html
// RUOLO: superadmin
// Gite, sulla copia: l'abbonamento venduto a un socio è ancora in coda (la linea
// non c'è, add_pass non arriva). Cercando di nuovo, il socio non deve ricomparire
// fra i «senza abbonamento»: un secondo click glielo venderebbe due volte.
{
  // La vendita resta in viaggio finché la prova non finisce.
  const realFetch = window.fetch.bind(window);
  window.fetch = (url, ...rest) => (String(url).includes("/rpc/add_pass") ? new Promise(() => {}) : realFetch(url, ...rest));
  if (EXPECTED?.id) {
    localStorage.setItem("sciclub-gite-da-inviare", JSON.stringify([{ id: "prova-coda-1", tipo: "abbonamento", socio: EXPECTED.id,
      chi: `${EXPECTED.cognome} ${EXPECTED.nome}`, cognome: EXPECTED.cognome, nome_socio: EXPECTED.nome, nome: EXPECTED.voce,
      prezzo: 0, pagato: false, trips: 5, day: null }]));
  }
  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  window.addEventListener("load", () => setTimeout(async () => { try {
    if (!EXPECTED?.id) { document.title = "RISULTATO dati=NO(nessun tesserato senza abbonamento nella copia)"; return; }
    const q = document.getElementById("q");
    q.value = EXPECTED.cognome;
    q.dispatchEvent(new Event("input", { bubbles: true }));
    await wait(1500);
    const still = Boolean(document.querySelector(`#senzaAbbonamento [data-assegna="${EXPECTED.id}"]`));
    document.title = `RISULTATO inCoda=${still ? "NO(con l'abbonamento in coda è ancora fra i senza)" : "ok"}`;
  } catch (e) { document.title = `RISULTATO eccezione=NO(${String(e?.message || e).slice(0, 150)})`; } }, 3000));
}
