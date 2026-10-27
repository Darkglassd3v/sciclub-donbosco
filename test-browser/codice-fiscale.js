// Soci (index.html): il codice fiscale si calcola con «Calcola», l'errore è uno solo.
// - Calcola col modulo vuoto: i dati che mancano hanno il bordo rosso e l'avviso li dice.
// - Sesso non scelto: lo si prende dai soci con lo stesso nome; se non si sa, manca.
// - Luogo dove non è nato nessun socio col codice: non si calcola, il luogo è bordato.
// - Codice proposto: è un pulsante, il click lo scrive nel campo (anche sopra uno sbagliato).
// - Codice sbagliato: «Codice fiscale errato, codice proposto: …», senza il motivo.
// - Campo vuoto e dati completi (sesso dal nome): il codice compare da solo.
// In un blocco: gli script della pagina e della prova hanno gli stessi nomi globali.
{
  const PRICE_LIST = [{ category: "TESSERA", name: "TESSERA ORDINARIA - REALE MUTUA NEVE", price: 40, min_role: "utente" }];
  const cf = (surname, nome, birthDate, sex) => computeTaxCode({ cognome: surname, nome, dataNascita: birthDate, sesso: sex, comune: "A479" });
  // Tre soci nati ad ASTI (A479), due che si chiamano MARIO. Calcolati al load:
  // codicefiscale.js arriva dopo questo script.
  let FROM_ASTI = [], MARIO = [];
  FAKE.risposta = (t, r) => {
    if (t === "prices") return PRICE_LIST;
    const eq = (field) => r.filtri.find((f) => f[0] === "eq" && f[1] === field)?.[2];
    if (t === "members" && eq("birth_place") === "ASTI") return FROM_ASTI.map((tax_code) => ({ tax_code }));
    if (t === "members" && eq("first_name") === "MARIO") return MARIO.map((tax_code) => ({ tax_code }));
    return [];
  };

  const wait = (ms) => new Promise((fine) => setTimeout(fine, ms));
  const red = (field) => fieldBorder(field).classList.contains("campo-errore");
  const notice = () => el("avvisoCF");
  const text = () => (notice().hidden ? "" : notice().textContent.replace(/\s+/g, " ").trim());
  const proposed = () => (notice().hidden ? null : notice().querySelector("button"));
  const write = (id, theValue, theEvent = "change") => { el(id).value = theValue; el(id).dispatchEvent(new Event(theEvent, { bubbles: true })); };
  const sex = () => document.querySelector("input[name=sessoCF]");
  const compute = async () => { el("btnCalcolaCF").click(); await wait(300); };

  window.addEventListener("load", () => setTimeout(async () => {
    const r = [];
    const test = (nome, passed, why) => r.push(`${nome}=${passed ? "ok" : `NO(${why})`}`);
    FROM_ASTI = [cf("BIANCHI", "LUCA", "1970-05-05", "M"), cf("VERDI", "ANNA", "1975-03-08", "F"), cf("NERI", "PIA", "1990-12-24", "F")];
    MARIO = [cf("GIALLI", "MARIO", "1960-02-02", "M"), cf("BLU", "MARIO", "1985-07-07", "M")];
    if (!el("btnCalcolaCF")) { document.title = "RISULTATO pulsante=NO(manca #btnCalcolaCF)"; return; }

    await compute();
    const missingOnes = ["f_cognome", "f_nome", "f_data_nascita", "f_luogo_nascita"].filter((id) => !red(el(id)));
    test("mancanoRossi", !missingOnes.length && red(sex()), `non bordati: ${missingOnes.join(", ")}, sesso ${red(sex())}`);
    test("mancanoDetti", /manca/i.test(text()) && /data di nascita/i.test(text()) && /sesso/i.test(text()), `avviso «${text()}»`);

    el("f_cognome").value = "Rossi";
    el("f_nome").value = "Mario";
    el("f_data_nascita").value = "1980-01-01";
    el("f_luogo_nascita").value = "Asti";
    const right = cf("ROSSI", "MARIO", "1980-01-01", "M");
    await compute();
    test("sessoDalNome", proposed()?.textContent.includes(right), `avviso «${text()}»`);
    proposed()?.click();
    test("clickScrive", el("f_codice_fiscale").value === right && notice().hidden, `campo «${el("f_codice_fiscale").value}»`);

    el("f_codice_fiscale").value = "";
    el("f_nome").value = "Andrea";
    await compute();
    test("sessoMancante", red(sex()) && /sesso/i.test(text()) && !proposed(), `sesso ${red(sex())}, avviso «${text()}»`);

    el("f_nome").value = "Mario";
    el("f_luogo_nascita").value = "Parigi";
    await compute();
    test("luogoSconosciuto", red(el("f_luogo_nascita")) && /tessera sanitaria/i.test(text()) && !proposed(),
      `luogo ${red(el("f_luogo_nascita"))}, avviso «${text()}»`);

    el("f_luogo_nascita").value = "Asti";
    const wrong = right.slice(0, 15) + (right[15] === "A" ? "B" : "A");
    write("f_codice_fiscale", wrong);
    await wait(300);
    test("erratoGenerico", text().startsWith("Codice fiscale errato, codice proposto:") && !/dovrebbe|carattere/i.test(text())
      && proposed()?.textContent.includes(right), `avviso «${text()}»`);
    proposed()?.click();
    test("clickSopraSbagliato", el("f_codice_fiscale").value === right, `campo «${el("f_codice_fiscale").value}»`);

    resetForm();
    el("f_cognome").value = "Rossi";
    el("f_nome").value = "Mario";
    el("f_luogo_nascita").value = "Asti";
    write("f_data_nascita", "1980-01-01");
    await wait(300);
    test("daSolo", proposed()?.textContent.includes(right) && text().startsWith("Codice proposto:"), `avviso «${text()}»`);

    document.title = "RISULTATO " + r.join(" ");
  }, 500));
}
