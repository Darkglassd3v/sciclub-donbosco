// PAGINA: elenco.html
// RUOLO: admin
// Elenco soci sui dati veri (18/11/2026): tanti soci quanti i tesserati della stagione, in ordine di tessera come
// numero, i numeri liberi giusti, nessun errore.
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
    test("primaPagina", document.querySelectorAll("#elencoSoci tr").length === Math.min(50, EXPECTED.soci), "righe della prima pagina");
    test("senzaErrori", !errors.length, errors.join(" / ").slice(0, 160));
    document.title = "RISULTATO " + r.join(" ");
  } catch (e) { document.title = `RISULTATO eccezione=NO(${String(e?.message || e).slice(0, 150)})`; } }, 4000));
}
