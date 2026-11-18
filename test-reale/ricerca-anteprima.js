// PAGINA: index.html
// RUOLO: admin
// Ricerca soci sui dati veri (18/11/2026): i risultati di «bianco matt» mostrano sotto il nome la data di nascita e
// il comune, così gli omonimi si distinguono anche senza codice fiscale; nessun «No CF» e nessun errore.
{
  const errors = [];
  window.addEventListener("error", (e) => errors.push(e.message));
  window.addEventListener("load", () => setTimeout(async () => { try {
    const r = [];
    const test = (nome, passed, why) => r.push(`${nome}=${passed ? "ok" : `NO(${why})`}`);
    el("searchInput").value = "bianco matt";
    await searchMembers();
    const rows = [...el("searchResults").querySelectorAll(".result-item")].map((x) => x.textContent.replace(/\s+/g, " ").trim());
    const hints = rows.map((t) => /nato\/a il \d{2}\/\d{2}\/\d{4}/.test(t));
    test("risultati", rows.length === EXPECTED.trovati, `${rows.length} contro ${EXPECTED.trovati}`);
    test("dataDiNascita", hints.filter(Boolean).length === EXPECTED.conData, `con la data ${hints.filter(Boolean).length} contro ${EXPECTED.conData}`);
    test("omonimiDiversi", new Set(rows).size === rows.length, "due righe uguali");
    test("senzaNoCF", !rows.some((t) => /No CF|null|undefined/.test(t)), rows.join(" | ").slice(0, 160));
    test("senzaErrori", !errors.length, errors.join(" / ").slice(0, 160));
    document.title = "RISULTATO " + r.join(" ");
  } catch (e) { document.title = `RISULTATO eccezione=NO(${String(e?.message || e).slice(0, 150)})`; } }, 3000));
}
