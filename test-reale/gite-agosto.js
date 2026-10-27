// PAGINA: ricerca/gite.html
// RUOLO: superadmin
// Gite, sulla copia: un tesserato iscritto ad agosto per la stagione aperta
// compare fra quelli «senza abbonamento»; fra le «Gite fatte» solo quelle della
// stagione aperta (current_season() del database, non «dal 1° settembre»).
{
  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const $ = (s) => document.querySelector(s);
  window.addEventListener("load", () => setTimeout(async () => { try {
    const r = [];
    const test = (nome, passed, why) => r.push(`${nome}=${passed ? "ok" : `NO(${why})`}`);
    if (!EXPECTED?.idSenza || !EXPECTED?.idPass) { document.title = "RISULTATO dati=NO(mancano i soci di prova nella copia)"; return; }
    $("#q").value = EXPECTED.cognome;
    $("#q").dispatchEvent(new Event("input", { bubbles: true }));
    await wait(1500);
    test("senzaAbbonamento", Boolean($(`#senzaAbbonamento [data-assegna="${EXPECTED.idSenza}"]`)), "il tesserato iscritto ad agosto non c'è");
    $("#q").value = "";
    $("#q").dispatchEvent(new Event("input", { bubbles: true }));
    await wait(800);
    $(`[data-registro="${EXPECTED.idPass}"]`)?.click();
    await wait(1500);
    const tripList = document.querySelectorAll(`#zona_${CSS.escape(EXPECTED.idPass)} [data-annulla]`).length;
    test("giteDellaStagione", tripList === EXPECTED.gite, `${tripList} gite invece di ${EXPECTED.gite}`);
    document.title = "RISULTATO " + r.join(" ");
  } catch (e) { document.title = `RISULTATO eccezione=NO(${String(e?.message || e).slice(0, 150)})`; } }, 3000));
}
