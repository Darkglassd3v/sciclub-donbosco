// Soci (index.html), ricerca (dalla 3.12.1, analisi del database del 24/11/2026): la ricerca parte a ogni tasto e
// chiedeva tutte le colonne di ogni socio trovato (select *). Ora chiede solo quelle che i risultati mostrano: id,
// cognome, nome, numero tessera e la riga sotto il nome (data di nascita, indirizzo, città, codice fiscale). Vale per
// la ricerca in cima alla pagina e per quella del familiare che paga (la stessa searchDatabase()).
{
  const REQ = [];
  FAKE.risposta = (t, r) => {
    REQ.push([t, r.colonne, r.filtri]);
    if (t === "members" && r.filtri.some((f) => f[0] === "or")) return [
      { id: "M1", last_name: "ROSSI", first_name: "ANNA", card_number: "12", birth_date: "1980-01-01", address: "VIA ROMA 1",
        city: "ASTI", tax_code: "RSSNNA80A41A479X" }];
    return [];
  };
  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const WANTED = "id,last_name,first_name,card_number,birth_date,address,city,tax_code";
  window.addEventListener("load", () => setTimeout(async () => {
    const r = [];
    const test = (nome, passed, why) => r.push(`${nome}=${passed ? "ok" : `NO(${why})`}`);
    try {
      await wait(300);
      el("searchInput").value = "rossi";
      await searchMembers();
      const asked = REQ.filter(([t, , f]) => t === "members" && f.some((x) => x[0] === "or")).map(([, c]) => c);
      test("colonne", asked.length > 0 && asked.every((c) => c === WANTED), asked.join(" / ") || "nessuna ricerca");
      const shown = el("searchResults").textContent.replace(/\s+/g, " ");
      test("risultato", /ROSSI ANNA/.test(shown) && /N° 12/.test(shown) && /01\/01\/1980/.test(shown) && /VIA ROMA 1, ASTI/.test(shown)
        && /RSSNNA80A41A479X/.test(shown), shown.slice(0, 140));
    } catch (e) { r.push(`eccezione=NO(${String(e?.message || e).slice(0, 120)})`); }
    document.title = "RISULTATO " + r.join(" ");
  }, 400));
}
