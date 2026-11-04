// Soci (index.html): la presciistica comprende la tessera, l'assicurazione è una scelta a parte.
// - Una voce nel listino: «CORSO PRESCIISTICA» 70. Scelta lei, compare la scelta
//   dell'assicurazione con la Base (20) già selezionata: si può togliere (70) o passare
//   alla Total Sport (45, in tutto 115).
// - Esclusiva con la tessera: le scelte della tessera si spengono e si svuotano,
//   l'asterisco di «Tipologia tessera» sparisce, tolta la presciistica tornano.
// - Riaprendo un socio resta quello che ha: chi l'ha tolta non si ritrova la Base.
// In un blocco: gli script della pagina e della prova hanno gli stessi nomi globali.
{
  const PRICE_LIST = [
    { category: "TESSERA", name: "TESSERA ORDINARIA - REALE MUTUA NEVE", price: 40, min_role: "utente" },
    { category: "TESSERA", name: "SOLO TESSERA - NO ASSICURAZIONE", price: 20, min_role: "utente" },
    { category: "PRESCIISTICA", name: "CORSO PRESCIISTICA", price: 70, course_only: false, min_role: "utente" },
    { category: "PRESCIISTICA", name: "CORSO PRESCIISTICA - FAMIGLIA", price: 50, course_only: true, min_role: "utente" },
  ];
  const INSURANCES = [{ code: "BASE", name: "REALE MUTUA NEVE", price: 20 }, { code: "SPORT", name: "REALE TOTAL SPORT", price: 45 }];
  const member = (id, extra) => ({ id, last_name: "PRESCI", first_name: "PIA", updated_at: "1", enrolled_at: "2026-10-14", paid: 0,
    total_manual: false, card_type: null, preski_type: "CORSO PRESCIISTICA", ...extra });
  const MEMBERS = {
    SPORT: member("SPORT", { total: 115, preski_insurance: "SPORT" }),
    SENZA: member("SENZA", { total: 70, preski_insurance: null }),
  };
  const saved = [];

  FAKE.risposta = (t, r) => {
    const writing = r.filtri.find((f) => f[0] === "insert" || f[0] === "update");
    if (t === "members" && writing) { saved.push(writing[1]); return [{ id: "NUOVO", updated_at: "2" }]; }
    if (t === "prices") return PRICE_LIST;
    if (t === "insurances") return INSURANCES;
    const id = r.filtri.find((f) => f[0] === "eq" && f[1] === "id")?.[2];
    if (t === "members" && MEMBERS[id]) return [MEMBERS[id]];
    return [];
  };

  const BOX = "f_assicurazione_presciistica";
  const choose = (group, item) =>
    [...el(group).querySelectorAll("input")].find((r) => r.dataset.nome === item || r.value === item).click();
  const fill = () => { el("f_cognome").value = "Presci"; el("f_nome").value = "Pia"; el("f_telefono").value = "333"; };
  const last = () => saved[saved.length - 1] || {};
  const note = () => el("notaPresciistica");
  // Nascosta davvero (display), non solo con l'attributo: .help di Bulma lo batteva.
  const hiddenNote = () => getComputedStyle(note()).display === "none";
  const boxShown = () => getComputedStyle(el(BOX)).display !== "none";
  const cards = () => [...el("f_tipologia_tessera").querySelectorAll("input")];
  const asterisk = () => getComputedStyle(el("f_tipologia_tessera").querySelector("legend .obbligo") || el("f_tipologia_tessera")).display !== "none"
    && el("f_tipologia_tessera").querySelector("legend").textContent.includes("*");

  window.addEventListener("load", () => setTimeout(async () => {
    const r = [];
    const test = (nome, passed, why) => r.push(`${nome}=${passed ? "ok" : `NO(${why})`}`);

    if (!el(BOX)) { document.title = `RISULTATO scelta=NO(manca #${BOX})`; return; }
    test("nascostaSenzaPresci", !boxShown(), "la scelta dell'assicurazione si vede senza presciistica");

    choose("f_tipologia_tessera", "TESSERA ORDINARIA - REALE MUTUA NEVE");
    test("soloTessera", individualTotal() === 40 && hiddenNote(), `totale ${individualTotal()}, nota nascosta ${hiddenNote()}`);

    choose("f_presciistica", "CORSO PRESCIISTICA");
    test("baseGiaScelta", individualTotal() === 90 && selectedName(BOX) === "BASE" && boxShown() && !hiddenNote(),
      `totale ${individualTotal()}, assicurazione ${selectedName(BOX)}, scelta visibile ${boxShown()}, nota nascosta ${hiddenNote()}`);
    test("tesseraSpenta", cards().every((t) => t.disabled && !t.checked) && !asterisk(),
      `spente ${cards().every((t) => t.disabled)}, scelta ${cards().some((t) => t.checked)}, asterisco ${asterisk()}`);
    fill();
    await write();
    test("salvaBase", last().preski_type === "CORSO PRESCIISTICA" && last().preski_insurance === "BASE" && last().total === 90 && last().card_type === null,
      `voce ${last().preski_type}, assicurazione ${last().preski_insurance}, totale ${last().total}, tessera ${last().card_type}`);

    // Dopo il salvataggio il modulo riparte vuoto.
    choose("f_presciistica", "CORSO PRESCIISTICA");
    choose(BOX, "SPORT");
    test("sport", individualTotal() === 115, `totale ${individualTotal()}`);
    fill();
    await write();
    test("salvaSport", last().preski_insurance === "SPORT" && last().total === 115,
      `assicurazione ${last().preski_insurance}, totale ${last().total}`);

    choose("f_presciistica", "CORSO PRESCIISTICA");
    choose(BOX, "");
    test("tolta", individualTotal() === 70 && !selectedName(BOX) && boxShown(), `totale ${individualTotal()}, assicurazione ${selectedName(BOX)}`);
    test("tesseraSpentaAncheSenza", cards().every((t) => t.disabled), "senza assicurazione la tessera si può scegliere: 70 la comprendono già");
    fill();
    await write();
    test("salvaSenza", last().preski_type === "CORSO PRESCIISTICA" && last().preski_insurance === null && last().total === 70,
      `voce ${last().preski_type}, assicurazione ${last().preski_insurance}, totale ${last().total}`);

    choose("f_presciistica", "");
    test("toltaPresci", cards().every((t) => !t.disabled) && asterisk() && hiddenNote() && !boxShown(),
      `accese ${cards().every((t) => !t.disabled)}, asterisco ${asterisk()}, nota nascosta ${hiddenNote()}, scelta visibile ${boxShown()}`);

    resetForm();
    choose("f_presciistica", "CORSO PRESCIISTICA");
    test("nuovoBase", individualTotal() === 90 && selectedName(BOX) === "BASE", `totale ${individualTotal()}, assicurazione ${selectedName(BOX)}`);
    resetForm();
    test("svuotata", !boxShown() && !selectedName(BOX) && individualTotal() === 0, `visibile ${boxShown()}, assicurazione ${selectedName(BOX)}, totale ${individualTotal()}`);

    await loadMember("SPORT");
    test("riapertoSport", individualTotal() === 115 && selectedName(BOX) === "SPORT" && boxShown(),
      `totale ${individualTotal()}, assicurazione ${selectedName(BOX)}`);
    await loadMember("SENZA");
    test("riapertoSenza", individualTotal() === 70 && !selectedName(BOX) && boxShown(),
      `totale ${individualTotal()}, assicurazione ${selectedName(BOX)}: chi l'ha tolta non deve ritrovarsi la Base`);

    document.title = "RISULTATO " + r.join(" ");
  }, 500));
}
