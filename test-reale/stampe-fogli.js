// PAGINA: stampe.html
// RUOLO: gite
// Fogli dei soci sui dati veri (19/11/2026): l'anteprima sotto ogni pulsante conta tutti i soci di ogni file,
// con o senza partenza (il 18/11 cinque corsisti su sei non avevano la partenza e non si vedevano nel file):
// corsisti del giorno, abbonati del giorno e jolly come nel database.
{
  const errors = [];
  window.addEventListener("error", (e) => errors.push(e.message));
  window.addEventListener("load", () => setTimeout(async () => { try {
    const r = [];
    const test = (nome, passed, why) => r.push(`${nome}=${passed ? "ok" : `NO(${why})`}`);
    const preview = (day) => document.querySelector(`[data-anteprima="${day}"]`)?.textContent.replace(/\s+/g, " ").trim() || "";
    const expected = (day) => [
      ...(day === "MARTEDI" ? [] : [`Corsisti: ${EXPECTED.corsisti[day] || 0}`]),
      `Abbonamenti 5 gite: ${EXPECTED.abbonati[day] || 0}`, `Jolly: ${EXPECTED.jolly}`].join(" · ");
    for (const day of ["SABATO", "DOMENICA", "MARTEDI"]) test(`anteprima${day}`, preview(day) === expected(day), `«${preview(day)}» contro «${expected(day)}»`);
    test("senzaErrori", !errors.length, errors.join(" / ").slice(0, 160));
    document.title = "RISULTATO " + r.join(" ");
  } catch (e) { document.title = `RISULTATO eccezione=NO(${String(e?.message || e).slice(0, 150)})`; } }, 4000));
}
