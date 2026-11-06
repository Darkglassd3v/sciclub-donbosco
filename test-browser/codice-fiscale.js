// Soci (index.html): il codice fiscale lo calcola e lo controlla la libreria codice-fiscale-js
// (CodiceFiscale), non più un codice nostro (richiesta del 6/11).
// - Calcola col modulo vuoto: i dati che mancano, sesso compreso, hanno il bordo rosso e l'avviso li dice.
// - Il sesso si sceglie: non si ricava più dal nome.
// - Comune che la libreria non conosce: non si calcola, il luogo è bordato, l'avviso rimanda alla tessera sanitaria.
// - Codice proposto: è un pulsante, il click lo scrive nel campo (anche sopra uno sbagliato).
// - Codice non valido: «Codice fiscale errato, codice proposto: …».
// - Codice valido ma con una data diversa dalla scheda (caso del 6/11: la data della scheda era
//   sbagliata e la pagina proponeva un codice sbagliato): nessun codice proposto, l'avviso dice la
//   data scritta nel codice; con la scheda giusta, nessun avviso. Il comune soppresso (Lu, oggi Lu e
//   Cuccaro Monferrato) non conta: il comune si confronta solo se la libreria lo trova.
// - Codice valido di un'altra persona (cognome e nome diversi): nessun codice proposto.
// - Campo vuoto e dati completi: il codice compare da solo.
// Dati inventati: il repository è pubblico.
// In un blocco: gli script della pagina e della prova hanno gli stessi nomi globali.
{
  const PRICE_LIST = [{ category: "TESSERA", name: "TESSERA ORDINARIA - REALE MUTUA NEVE", price: 40, min_role: "utente" }];
  FAKE.risposta = (t) => (t === "prices" ? PRICE_LIST : []);

  const wait = (ms) => new Promise((fine) => setTimeout(fine, ms));
  const red = (field) => fieldBorder(field).classList.contains("campo-errore");
  const notice = () => el("avvisoCF");
  const text = () => (notice().hidden ? "" : notice().textContent.replace(/\s+/g, " ").trim());
  const proposed = () => (notice().hidden ? null : notice().querySelector("button"));
  const write = (id, theValue, theEvent = "change") => { el(id).value = theValue; el(id).dispatchEvent(new Event(theEvent, { bubbles: true })); };
  const sex = () => document.querySelector("input[name=sessoCF]");
  const chooseSex = (value) => document.querySelector(`input[name=sessoCF][value=${value}]`).click();
  const compute = async () => { el("btnCalcolaCF").click(); await wait(300); };
  const fill = (surname, nome, birthDate, place, province) => {
    el("f_cognome").value = surname; el("f_nome").value = nome; el("f_data_nascita").value = birthDate;
    el("f_luogo_nascita").value = place; el("f_provincia_nascita").value = province;
  };

  window.addEventListener("load", () => setTimeout(async () => {
    const r = [];
    const test = (nome, passed, why) => r.push(`${nome}=${passed ? "ok" : `NO(${why})`}`);
    if (typeof CodiceFiscale !== "function") { document.title = "RISULTATO libreria=NO(CodiceFiscale non caricata)"; return; }
    const code = (surname, nome, gender, day, month, year, birthplace, birthplaceProvincia) =>
      CodiceFiscale.compute({ name: nome, surname, gender, day, month, year, birthplace, birthplaceProvincia });
    const right = code("ROSSI", "MARIO", "M", 1, 1, 1980, "ASTI", "AT");

    await compute();
    const missingOnes = ["f_cognome", "f_nome", "f_data_nascita", "f_luogo_nascita"].filter((id) => !red(el(id)));
    test("mancanoRossi", !missingOnes.length && red(sex()), `non bordati: ${missingOnes.join(", ")}, sesso ${red(sex())}`);
    test("mancanoDetti", /manca/i.test(text()) && /data di nascita/i.test(text()) && /sesso/i.test(text()), `avviso «${text()}»`);

    fill("Rossi", "Mario", "1980-01-01", "Asti", "AT");
    await compute();
    test("sessoNonDalNome", red(sex()) && /sesso/i.test(text()) && !proposed(), `sesso ${red(sex())}, avviso «${text()}»`);

    chooseSex("M");
    await compute();
    test("calcola", proposed()?.textContent.includes(right), `avviso «${text()}», atteso ${right}`);
    proposed()?.click();
    test("clickScrive", el("f_codice_fiscale").value === right && notice().hidden, `campo «${el("f_codice_fiscale").value}»`);

    el("f_codice_fiscale").value = "";
    el("f_luogo_nascita").value = "Paese che non esiste";
    await compute();
    test("luogoSconosciuto", red(el("f_luogo_nascita")) && /tessera sanitaria/i.test(text()) && !proposed(),
      `luogo ${red(el("f_luogo_nascita"))}, avviso «${text()}»`);

    el("f_luogo_nascita").value = "Asti";
    const wrong = right.slice(0, 15) + (right[15] === "A" ? "B" : "A");
    write("f_codice_fiscale", wrong);
    await wait(300);
    test("errato", text().startsWith("Codice fiscale errato, codice proposto:") && proposed()?.textContent.includes(right), `avviso «${text()}»`);
    proposed()?.click();
    test("clickSopraSbagliato", el("f_codice_fiscale").value === right, `campo «${el("f_codice_fiscale").value}»`);

    // Codice giusto (nato il 20/01/1957 a Lu, comune soppresso), data della scheda sbagliata.
    resetForm();
    fill("VERDI", "GIAN LUCA", "1957-09-20", "LU MONFERRATO", "AL");
    write("f_codice_fiscale", code("VERDI", "GIAN LUCA", "M", 20, 1, 1957, "LU", "AL"));
    await wait(300);
    test("validoDataDiversa", !notice().hidden && text().includes("20/01/1957") && !proposed(), `avviso «${text()}»`);
    write("f_data_nascita", "1957-01-20");
    await wait(300);
    test("validoCoerente", notice().hidden, `avviso «${text()}»`);

    resetForm();
    fill("BIANCHI", "LUCA", "1980-01-01", "ASTI", "AT");
    write("f_codice_fiscale", right);
    await wait(300);
    test("altraPersona", !notice().hidden && /cognome|nome/i.test(text()) && !proposed(), `avviso «${text()}»`);

    resetForm();
    fill("Rossi", "Mario", "", "Asti", "AT");
    chooseSex("M");
    write("f_data_nascita", "1980-01-01");
    await wait(300);
    test("daSolo", proposed()?.textContent.includes(right) && text().startsWith("Codice proposto:"), `avviso «${text()}»`);

    document.title = "RISULTATO " + r.join(" ");
  }, 500));
}
