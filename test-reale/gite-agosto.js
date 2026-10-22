// PAGINA: ricerca/gite.html
// RUOLO: superadmin
// Gite, sulla copia: un tesserato iscritto ad agosto per la stagione aperta
// compare fra quelli «senza abbonamento»; fra le «Gite fatte» solo quelle della
// stagione aperta (current_season() del database, non «dal 1° settembre»).
{
  const aspetta = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const $ = (s) => document.querySelector(s);
  window.addEventListener("load", () => setTimeout(async () => { try {
    const r = [];
    const prova = (nome, vero, perche) => r.push(`${nome}=${vero ? "ok" : `NO(${perche})`}`);
    if (!ATTESO?.idSenza || !ATTESO?.idPass) { document.title = "RISULTATO dati=NO(mancano i soci di prova nella copia)"; return; }
    $("#q").value = ATTESO.cognome;
    $("#q").dispatchEvent(new Event("input", { bubbles: true }));
    await aspetta(1500);
    prova("senzaAbbonamento", Boolean($(`#senzaAbbonamento [data-assegna="${ATTESO.idSenza}"]`)), "il tesserato iscritto ad agosto non c'è");
    $("#q").value = "";
    $("#q").dispatchEvent(new Event("input", { bubbles: true }));
    await aspetta(800);
    $(`[data-registro="${ATTESO.idPass}"]`)?.click();
    await aspetta(1500);
    const gite = document.querySelectorAll(`#zona_${CSS.escape(ATTESO.idPass)} [data-annulla]`).length;
    prova("giteDellaStagione", gite === ATTESO.gite, `${gite} gite invece di ${ATTESO.gite}`);
    document.title = "RISULTATO " + r.join(" ");
  } catch (e) { document.title = `RISULTATO eccezione=NO(${String(e?.message || e).slice(0, 150)})`; } }, 3000));
}
