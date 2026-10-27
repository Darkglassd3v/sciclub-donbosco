// Soci (index.html): la presciistica comprende tessera, quota e assicurazione.
// - Due voci nel listino: «CORSO PRESCIISTICA» 90 (70 + Base 20) e «CORSO
//   PRESCIISTICA - REALE TOTAL SPORT» 120 (75 + Sport 45). Il finto dà già
//   card_price in `price`, come la select di loadPrices().
// - Con la presciistica la tessera non si somma (la comprende), e sotto la
//   tessera lo dice una nota; tolta la presciistica la tessera conta di nuovo.
// - Con la presciistica con l'assicurazione la tessera non si sceglie: la comprende. Le
//   scelte della tessera si spengono e si svuotano, l'asterisco di «Tipologia tessera»
//   sparisce; un socio che le ha tutte e due le tiene (spente) quando lo si riapre.
// - Niente scelta dell'assicurazione a parte e niente `insurance` nel
//   salvataggio: l'assicurazione la dice la voce della presciistica.
// In un blocco: gli script della pagina e della prova hanno gli stessi nomi globali.
{
  const PRICE_LIST = [
    { category: "TESSERA", name: "TESSERA ORDINARIA - REALE MUTUA NEVE", price: 40, min_role: "utente" },
    { category: "TESSERA", name: "SOLO TESSERA - NO ASSICURAZIONE", price: 20, min_role: "utente" },
    { category: "PRESCIISTICA", name: "CORSO PRESCIISTICA", price: 90, insurance: "BASE", min_role: "utente" },
    { category: "PRESCIISTICA", name: "CORSO PRESCIISTICA - REALE TOTAL SPORT", price: 120, insurance: "SPORT", min_role: "utente" },
  ];
  const MEMBER = { id: "M", last_name: "PRESCI", first_name: "PIA", updated_at: "1", enrolled_at: "2026-10-14", paid: 0, total: 120,
    total_manual: false, card_type: "TESSERA ORDINARIA - REALE MUTUA NEVE", preski_type: "CORSO PRESCIISTICA - REALE TOTAL SPORT" };
  const saved = [];

  FAKE.risposta = (t, r) => {
    const writing = r.filtri.find((f) => f[0] === "insert" || f[0] === "update");
    if (t === "members" && writing) { saved.push(writing[1]); return [{ id: "NUOVO", updated_at: "2" }]; }
    if (t === "prices") return PRICE_LIST;
    if (t === "members" && r.filtri.some((f) => f[0] === "eq" && f[1] === "id")) return [MEMBER];
    return [];
  };

  const choose = (group, item) =>
    [...el(group).querySelectorAll("input")].find((r) => r.dataset.nome === item || r.value === item).click();
  const fill = () => { el("f_cognome").value = "Presci"; el("f_nome").value = "Pia"; el("f_telefono").value = "333"; };
  const last = () => saved[saved.length - 1] || {};
  const note = () => el("notaPresciistica");
  // Nascosta davvero (display), non solo con l'attributo: .help di Bulma lo batteva.
  const hiddenNote = () => getComputedStyle(note()).display === "none";
  const cards = () => [...el("f_tipologia_tessera").querySelectorAll("input")];
  const asterisk = () => getComputedStyle(el("f_tipologia_tessera").querySelector("legend .obbligo") || el("f_tipologia_tessera")).display !== "none"
    && el("f_tipologia_tessera").querySelector("legend").textContent.includes("*");

  window.addEventListener("load", () => setTimeout(async () => {
    const r = [];
    const test = (nome, passed, why) => r.push(`${nome}=${passed ? "ok" : `NO(${why})`}`);

    test("senzaScelta", !el("f_assicurazione"), "c'è ancora la scelta dell'assicurazione a parte");
    if (!note()) { document.title = "RISULTATO " + r.concat("nota=NO(manca #notaPresciistica)").join(" "); return; }

    choose("f_tipologia_tessera", "TESSERA ORDINARIA - REALE MUTUA NEVE");
    test("soloTessera", individualTotal() === 40 && hiddenNote(), `totale ${individualTotal()}, nota nascosta ${hiddenNote()}`);

    choose("f_presciistica", "CORSO PRESCIISTICA");
    test("presciBase", individualTotal() === 90 && !hiddenNote(), `totale ${individualTotal()}, nota nascosta ${hiddenNote()}`);
    test("tesseraSpenta", cards().every((t) => t.disabled && !t.checked) && !asterisk(),
      `spente ${cards().every((t) => t.disabled)}, scelta ${cards().some((t) => t.checked)}, asterisco ${asterisk()}`);
    fill();
    await write();
    test("salvaBase", !("insurance" in last()) && last().preski_type === "CORSO PRESCIISTICA" && last().total === 90,
      `insurance ${"insurance" in last()}, preski_type ${last().preski_type}, totale ${last().total}`);

    choose("f_tipologia_tessera", "TESSERA ORDINARIA - REALE MUTUA NEVE");
    choose("f_presciistica", "CORSO PRESCIISTICA - REALE TOTAL SPORT");
    test("presciSport", individualTotal() === 120, `totale ${individualTotal()}`);
    fill();
    await write();
    test("salvaSport", !("insurance" in last()) && last().preski_type === "CORSO PRESCIISTICA - REALE TOTAL SPORT" && last().total === 120,
      `insurance ${"insurance" in last()}, preski_type ${last().preski_type}, totale ${last().total}`);

    choose("f_tipologia_tessera", "SOLO TESSERA - NO ASSICURAZIONE");
    choose("f_presciistica", "CORSO PRESCIISTICA");
    test("tesseraSenza", individualTotal() === 90, `totale ${individualTotal()}`);

    choose("f_presciistica", "CORSO PRESCIISTICA - REALE TOTAL SPORT");
    choose("f_presciistica", "");
    test("tolta", cards().every((t) => !t.disabled) && asterisk() && hiddenNote(),
      `accese ${cards().every((t) => !t.disabled)}, asterisco ${asterisk()}, nota nascosta ${hiddenNote()}`);
    choose("f_tipologia_tessera", "TESSERA ORDINARIA - REALE MUTUA NEVE");
    test("tessera", individualTotal() === 40, `totale ${individualTotal()}`);

    await loadMember("M");
    test("riaperto", individualTotal() === 120 && !hiddenNote() && selectedName("f_tipologia_tessera") === MEMBER.card_type,
      `totale ${individualTotal()}, nota nascosta ${hiddenNote()}, tessera ${selectedName("f_tipologia_tessera")}`);

    document.title = "RISULTATO " + r.join(" ");
  }, 500));
}
