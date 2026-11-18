// PAGINA: elenco.html
// RUOLO: admin
// Elenco soci sui dati veri (18/11/2026): tanti soci quanti i tesserati della stagione, in ordine di tessera come
// numero, i numeri liberi giusti, i familiari a carico contati come nel database, ogni capofamiglia non tesserato
// letto col suo nome, la prima pagina mai oltre 50 persone e nessun errore.
{
  const errors = [];
  window.addEventListener("error", (e) => errors.push(e.message));
  window.addEventListener("load", () => setTimeout(async () => { try {
    const r = [];
    const test = (nome, passed, why) => r.push(`${nome}=${passed ? "ok" : `NO(${why})`}`);
    test("quanti", members.length === EXPECTED.soci, `${members.length} contro ${EXPECTED.soci}`);
    const numbers = members.map((s) => parseInt(s.card_number, 10)).filter((n) => !Number.isNaN(n));
    test("ordine", numbers.every((n, i) => i === 0 || numbers[i - 1] <= n), numbers.slice(0, 10).join(","));
    const free = el("tessereLibere").textContent;
    test("liberi", EXPECTED.liberi === null ? /Nessun numero/.test(free) : free.includes(EXPECTED.liberi), `«${free.slice(0, 120)}» atteso ${EXPECTED.liberi}`);
    test("familiari", el("numFamiliari").textContent === String(EXPECTED.familiari), `${el("numFamiliari").textContent} contro ${EXPECTED.familiari}`);
    const outside = households.filter((h) => !h.headListed);
    test("capiFuori", outside.length === EXPECTED.capiFuori && outside.every((h) => h.headName), `${outside.length} contro ${EXPECTED.capiFuori}`);
    test("tuttiUnaVolta", households.reduce((n, h) => n + h.people.length, 0) === members.length, "un socio in due nuclei o in nessuno");
    const firstPage = document.querySelectorAll("#elencoSoci tr[data-socio]").length;
    test("primaPagina", firstPage > 0 && firstPage <= 50 && (EXPECTED.soci > 50 || firstPage === EXPECTED.soci), `${firstPage} persone nella prima pagina`);
    test("senzaErrori", !errors.length, errors.join(" / ").slice(0, 160));
    document.title = "RISULTATO " + r.join(" ");
  } catch (e) { document.title = `RISULTATO eccezione=NO(${String(e?.message || e).slice(0, 150)})`; } }, 4000));
}
