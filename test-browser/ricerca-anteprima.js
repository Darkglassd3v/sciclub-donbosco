// Soci (index.html): l'anteprima dei risultati di ricerca dice di chi si tratta (richiesta del 18/11/2026).
// Solo un socio su cinque ha il codice fiscale: con due omonimi senza codice fiscale non si capiva quale aprire.
// - Sotto il nome: data di nascita («nato/a il …») e residenza, se scritta («indirizzo, COMUNE»).
// - Il codice fiscale solo se c'è: niente «No CF», niente virgole o puntini rimasti vuoti.
// - Un nome o un indirizzo con caratteri HTML si legge come testo.
// - La ricerca del familiare pagante ha la stessa riga.
// In un blocco: gli script della pagina e della prova hanno gli stessi nomi globali.
{
  const SOCI = [
    { id: "A", last_name: "BIANCO", first_name: "MATTEO", birth_date: "2000-02-11", tax_code: null,
      address: "VIA ROMA 3", city: "CASTAGNOLE LANZE", card_number: null },
    { id: "B", last_name: "BIANCO", first_name: "MATTEO", birth_date: "2000-11-13", tax_code: null,
      address: null, city: "MONTEGROSSO D'ASTI", card_number: "12" },
    { id: "C", last_name: "BIANCO", first_name: "<b>MATTIA</b>", birth_date: null, tax_code: "BNCMTT91T18A479X",
      address: null, city: null, card_number: null },
  ];
  FAKE.risposta = (t, r) => (t === "members" && r.filtri.some((f) => f[0] === "or") ? SOCI : []);
  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const text = (node) => node?.textContent.replace(/\s+/g, " ").trim() || "";

  window.addEventListener("load", () => setTimeout(async () => { try {
    const r = [];
    const test = (nome, passed, why) => r.push(`${nome}=${passed ? "ok" : `NO(${why})`}`);
    el("searchInput").value = "bianco";
    await searchMembers();
    await wait(200);
    const rows = [...el("searchResults").querySelectorAll(".result-item")];
    const [a, b, c] = rows.map(text);
    test("omonimiDistinti", /nato\/a il 11\/02\/2000/.test(a) && /VIA ROMA 3, CASTAGNOLE LANZE/.test(a)
      && /nato\/a il 13\/11\/2000/.test(b) && /MONTEGROSSO D'ASTI/.test(b), `«${a}» «${b}»`);
    test("senzaIndirizzo", !/,\s*MONTEGROSSO|null|undefined/.test(b), `«${b}»`);
    test("cfSoloSeCe", /BNCMTT91T18A479X/.test(c) && !/No CF/.test(a + b + c) && !/nato\/a il/.test(c) && !/·\s*$/.test(c), `«${c}»`);
    test("tesseraResta", /N° 12/.test(b), `«${b}»`);
    test("escape", !rows[2]?.querySelector("b") && /<b>MATTIA<\/b>/.test(c), `html «${rows[2]?.innerHTML.slice(0, 120)}»`);

    // Il familiare pagante: stessa riga sotto il nome.
    document.querySelector("#pagaFamiliare")?.click();
    el("f_payerDisplay").value = "bianco";
    await searchPayer();
    await wait(200);
    const payer = [...el("payerResults").querySelectorAll(".result-item")].map(text);
    test("pagante", /nato\/a il 11\/02\/2000/.test(payer[0] || "") && /CASTAGNOLE LANZE/.test(payer[0] || "") && !/No CF/.test(payer.join(" ")),
      `«${payer[0]}»`);
    document.title = "RISULTATO " + r.join(" ");
  } catch (e) { document.title = `RISULTATO eccezione=NO(${String(e?.message || e).slice(0, 120)})`; } }, 500));
}
