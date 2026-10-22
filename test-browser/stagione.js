// Stagione (stagione.html): l'esito della chiusura.
// - Chiusa con 0 posizioni il database non avanza: non si dice «chiusa».
// - Chiusa davvero: si rileggono anche i riquadri in alto (admin_summary).
// - Il messaggio d'errore del database si scrive come testo, non come HTML.
// In un blocco: gli script della pagina e della prova hanno gli stessi nomi globali.
{
  let letture = 0, esito = [{ archived: 0, season_closed: null }], errore = null;
  FINTO.risposta = (t) => {
    if (t === "admin_summary") { letture++; return [{ card_holders: 3, courses_income: 0, total_collected: 0 }]; }
    if (t === "rpc:close_season") return esito;
    return [];
  };
  FINTO.errore = (t) => (t === "rpc:close_season" ? errore : null);
  const aspetta = (ms) => new Promise((ok) => setTimeout(ok, ms));
  window.addEventListener("load", () => setTimeout(async () => { try {
    const r = [];
    const prova = (nome, vero, perche) => r.push(`${nome}=${vero ? "ok" : `NO(${perche})`}`);
    const testo = () => el("esito").textContent.replace(/\s+/g, " ").trim();

    await chiudi();
    prova("zeroNonChiusa", !/chiusa\./i.test(testo()) && /nessun dato da archiviare/i.test(testo()), `«${testo().slice(0, 90)}»`);

    esito = [{ archived: 12, season_closed: "2026-09-01T00:00:00+00:00" }];
    const prima = letture;
    await chiudi();
    await aspetta(200);
    prova("riquadriRiletti", letture > prima, `admin_summary letto ${letture - prima} volte dopo la chiusura`);

    errore = { message: "<b>grassetto</b>", code: "P0001" };
    await chiudi();
    prova("erroreComeTesto", !el("esito").querySelector(".notification b") && testo().includes("<b>grassetto</b>"),
      `«${el("esito").innerHTML.slice(0, 120)}»`);
    document.title = "RISULTATO " + r.join(" ");
  } catch (e) { document.title = `RISULTATO eccezione=NO(${String(e?.message || e).slice(0, 150)})`; } }, 600));
}
