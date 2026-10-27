// Stagione (stagione.html): l'esito della chiusura.
// - Chiusa con 0 posizioni il database non avanza: non si dice «chiusa».
// - Chiusa davvero: si rileggono anche i riquadri in alto (admin_summary).
// - Il messaggio d'errore del database si scrive come testo, non come HTML.
// In un blocco: gli script della pagina e della prova hanno gli stessi nomi globali.
{
  let reads = 0, outcome = [{ archived: 0, season_closed: null }], err = null;
  FAKE.risposta = (t) => {
    if (t === "admin_summary") { reads++; return [{ card_holders: 3, courses_income: 0, total_collected: 0 }]; }
    if (t === "rpc:close_season") return outcome;
    return [];
  };
  FAKE.errore = (t) => (t === "rpc:close_season" ? err : null);
  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  window.addEventListener("load", () => setTimeout(async () => { try {
    const r = [];
    const test = (nome, real, why) => r.push(`${nome}=${real ? "ok" : `NO(${why})`}`);
    const text = () => el("esito").textContent.replace(/\s+/g, " ").trim();

    await doClose();
    test("zeroNonChiusa", !/chiusa\./i.test(text()) && /nessun dato da archiviare/i.test(text()), `«${text().slice(0, 90)}»`);

    outcome = [{ archived: 12, season_closed: "2026-09-01T00:00:00+00:00" }];
    const before = reads;
    await doClose();
    await wait(200);
    test("riquadriRiletti", reads > before, `admin_summary letto ${reads - before} volte dopo la chiusura`);

    err = { message: "<b>grassetto</b>", code: "P0001" };
    await doClose();
    test("erroreComeTesto", !el("esito").querySelector(".notification b") && text().includes("<b>grassetto</b>"),
      `«${el("esito").innerHTML.slice(0, 120)}»`);
    document.title = "RISULTATO " + r.join(" ");
  } catch (e) { document.title = `RISULTATO eccezione=NO(${String(e?.message || e).slice(0, 150)})`; } }, 600));
}
