// PAGINA: index.html
// RUOLO: superadmin
// Soci, sulla copia: le voci del listino nell'ordine della colonna Ordine di
// Impostazioni (prices.position), non in quello di prima.
{
  window.addEventListener("load", () => setTimeout(() => { try {
    const names = [...el("f_tipologia_tessera").querySelectorAll("input[type=radio]")].map((r) => r.dataset.nome);
    const expected = EXPECTED.tessere || [];
    const ok = expected.length > 0 && JSON.stringify(names) === JSON.stringify(expected);
    document.title = "RISULTATO tessere=" + (ok ? "ok" : `NO(in pagina ${names.join(" | ")})`);
  } catch (e) { document.title = `RISULTATO eccezione=NO(${String(e?.message || e).slice(0, 150)})`; } }, 4000));
}
