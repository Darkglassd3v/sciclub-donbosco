// PAGINA: assicurazione.html
// RUOLO: assicurazione
// Riepilogo della pagina Assicurazione sui dati veri (18/11/2026): le quattro cifre uguali a quelle contate nel
// database, i conti che tornano (tesserati = assicurati + da assicurare + senza assicurazione) e «Da assicurare»
// uguale all'elenco della pagina.
{
  const errors = [];
  window.addEventListener("error", (e) => errors.push(e.message));
  window.addEventListener("load", () => setTimeout(async () => { try {
    const r = [];
    const test = (nome, passed, why) => r.push(`${nome}=${passed ? "ok" : `NO(${why})`}`);
    const value = (label) => [...document.querySelectorAll(".cifre .kpi")]
      .find((b) => b.querySelector(".kpi-label")?.textContent.trim() === label)?.querySelector(".kpi-value")?.textContent.trim();
    const shown = ["Soci tesserati", "Assicurati", "Da assicurare", "Senza assicurazione"].map(value).join("|");
    const expected = [EXPECTED.tesserati, EXPECTED.assicurati, EXPECTED.da_assicurare, EXPECTED.senza].join("|");
    test("cifre", shown === expected, `${shown} contro ${expected}`);
    test("contiTornano", EXPECTED.tesserati === EXPECTED.assicurati + EXPECTED.da_assicurare + EXPECTED.senza, expected);
    test("comeElenco", String(toInsure.length) === value("Da assicurare"), `${toInsure.length} nell'elenco`);
    test("senzaErrori", !errors.length, errors.join(" / ").slice(0, 160));
    document.title = "RISULTATO " + r.join(" ");
  } catch (e) { document.title = `RISULTATO eccezione=NO(${String(e?.message || e).slice(0, 150)})`; } }, 4000));
}
