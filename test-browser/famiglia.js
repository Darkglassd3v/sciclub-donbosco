// Soci (index.html): chi è già coperto non sceglie la tessera.
// - La presciistica con l'assicurazione comprende la tessera: con lei la tessera
//   non è obbligatoria, e la presciistica «solo corso» (senza assicurazione) non si vede.
// - O la tessera o l'agevolazione famiglia: scelta l'una, l'altra si svuota.
//   L'agevolazione costa quota + persone × assicurazione (il finto dà già card_price).
// - Il capofamiglia con l'agevolazione vede quante persone ci sono nel nucleo;
//   la sua presciistica è solo il corso (50).
// - Un familiare a carico di un capofamiglia con l'agevolazione è coperto: tessera
//   non obbligatoria; se il nucleo è già pieno, senza tessera non si salva.
// - L'agevolazione la sceglie solo il capofamiglia.
// In un blocco: gli script della pagina e della prova hanno gli stessi nomi globali.
{
  const PRICE_LIST = [
    { category: "TESSERA", name: "TESSERA ORDINARIA - REALE MUTUA NEVE", price: 40, insurance: "BASE", people: null, min_role: "utente" },
    { category: "TESSERA", name: "SOLO TESSERA - NO ASSICURAZIONE", price: 20, insurance: null, people: null, min_role: "utente" },
    { category: "FAMIGLIA", name: "3 PERSONE CON ASSICURAZIONE", price: 110, insurance: "BASE", people: 3, min_role: "utente" },
    { category: "FAMIGLIA", name: "3 PERSONE SENZA ASSICURAZIONE", price: 50, insurance: null, people: 3, min_role: "utente" },
    { category: "PRESCIISTICA", name: "CORSO PRESCIISTICA", price: 90, insurance: "BASE", people: null, min_role: "utente" },
    { category: "PRESCIISTICA", name: "CORSO PRESCIISTICA - REALE TOTAL SPORT", price: 120, insurance: "SPORT", people: null, min_role: "utente" },
    { category: "PRESCIISTICA", name: "CORSO PRESCIISTICA - FAMIGLIA", price: 50, insurance: null, people: null, min_role: "utente" },
  ];
  const member = (id, surname, nome, extra = {}) => ({ id, last_name: surname, first_name: nome, updated_at: "1",
    enrolled_at: "2026-10-14", paid: 0, total: 0, total_manual: false, card_type: null, family_discount: null, payer_id: null, ...extra });
  const MEMBERS = {
    CAPO: member("CAPO", "ROSSI", "MARIO", { family_discount: "3 PERSONE CON ASSICURAZIONE", total: 110 }),
    CAPO2: member("CAPO2", "VERDI", "LUCA", { family_discount: "3 PERSONE CON ASSICURAZIONE", total: 110 }),
  };
  const NUCLEI = {
    CAPO: [member("F1", "ROSSI", "ANNA", { payer_id: "CAPO" })],
    CAPO2: [member("F2", "VERDI", "ELIO", { payer_id: "CAPO2" }), member("F3", "VERDI", "IDA", { payer_id: "CAPO2" })],
  };
  const saved = [];
  const messages = [];

  FAKE.risposta = (t, r) => {
    const writing = r.filtri.find((f) => f[0] === "insert" || f[0] === "update");
    if (t === "members" && writing) { saved.push(writing[1]); return [{ id: "NUOVO", updated_at: "2" }]; }
    if (t === "prices") return PRICE_LIST;
    const eq = (field) => r.filtri.find((f) => f[0] === "eq" && f[1] === field)?.[2];
    if (t === "members" && eq("payer_id")) return NUCLEI[eq("payer_id")] || [];
    if (t === "members" && eq("id")) return MEMBERS[eq("id")] ? [MEMBERS[eq("id")]] : [];
    return [];
  };

  const choose = (group, item) =>
    [...el(group).querySelectorAll("input")].find((r) => r.dataset.nome === item || r.value === item).click();
  const fill = () => { el("f_cognome").value = "Prova"; el("f_nome").value = "Uno"; el("f_telefono").value = "333"; };
  const cards = () => [...el("f_tipologia_tessera").querySelectorAll("input")];
  const requiredCard = () => cards().some((r) => r.required);
  // Quello che si vede (display), non solo l'attributo hidden: le classi di Bulma lo battevano.
  const visible = (item) => getComputedStyle(el("f_presciistica").querySelector(`input[data-nome="${item}"]`).closest("label")).display !== "none";
  const note = () => el("notaFamiglia");
  const visibleNote = () => getComputedStyle(note()).display !== "none";
  const last = () => saved[saved.length - 1] || {};

  window.addEventListener("load", () => setTimeout(async () => {
    const r = [];
    const test = (nome, real, why) => r.push(`${nome}=${real ? "ok" : `NO(${why})`}`);
    if (!note() || typeof choosePayer !== "function") {
      document.title = `RISULTATO base=NO(manca #notaFamiglia o scegliPagante())`;
      return;
    }
    showToast = (text) => messages.push(text);

    // 1. Presciistica con l'assicurazione, senza tessera.
    choose("f_presciistica", "CORSO PRESCIISTICA");
    test("presciSenzaTessera", !requiredCard() && individualTotal() === 90 && !visible("CORSO PRESCIISTICA - FAMIGLIA"),
      `tessera obbligatoria ${requiredCard()}, totale ${individualTotal()}, solo corso visibile ${visible("CORSO PRESCIISTICA - FAMIGLIA")}`);
    choose("f_presciistica", "");
    test("senzaNienteObbligatoria", requiredCard(), "senza presciistica né agevolazione la tessera non è obbligatoria");

    // 2. O la tessera o l'agevolazione.
    choose("f_tipologia_tessera", "TESSERA ORDINARIA - REALE MUTUA NEVE");
    choose("f_agevolazioni_famiglia", "3 PERSONE CON ASSICURAZIONE");
    test("agevolazioneTogliTessera", !cards().some((x) => x.checked) && !requiredCard() && individualTotal() === 110,
      `tessera scelta ${cards().some((x) => x.checked)}, totale ${individualTotal()}`);
    test("capoNucleo", visibleNote() && note().textContent.includes("1 persona") && note().textContent.includes("ne prevede 3"),
      `nota «${note().textContent.trim()}»`);
    test("capoSoloCorso", visible("CORSO PRESCIISTICA - FAMIGLIA") && !visible("CORSO PRESCIISTICA"),
      `solo corso ${visible("CORSO PRESCIISTICA - FAMIGLIA")}, con assicurazione ${visible("CORSO PRESCIISTICA")}`);
    choose("f_presciistica", "CORSO PRESCIISTICA - FAMIGLIA");
    test("capoTotale", individualTotal() === 160, `totale ${individualTotal()}`);
    fill();
    await write();
    test("capoSalva", last().card_type === null && last().family_discount === "3 PERSONE CON ASSICURAZIONE" && last().total === 160,
      `tessera ${last().card_type}, agevolazione ${last().family_discount}, totale ${last().total}`);
    choose("f_presciistica", "");
    choose("f_tipologia_tessera", "TESSERA ORDINARIA - REALE MUTUA NEVE");
    test("tesseraTogliAgevolazione", !selectedName("f_agevolazioni_famiglia") && individualTotal() === 40,
      `agevolazione ${selectedName("f_agevolazioni_famiglia")}, totale ${individualTotal()}`);

    // 3. Capofamiglia aperto: nel nucleo lui e un familiare.
    await loadMember("CAPO");
    test("capoAperto", visibleNote() && note().textContent.includes("2 persone"), `nota «${note().textContent.trim()}»`);

    // 4. Familiare a carico di ROSSI (nucleo: ROSSI e ANNA, c'è posto).
    resetForm();
    await choosePayer("CAPO", "ROSSI MARIO");
    test("figlioCoperto", !requiredCard() && visibleNote() && note().textContent.includes("ROSSI MARIO") && individualTotal() === 0,
      `tessera obbligatoria ${requiredCard()}, nota «${note().textContent.trim()}», totale ${individualTotal()}`);
    choose("f_presciistica", "CORSO PRESCIISTICA - FAMIGLIA");
    test("figlioSoloCorso", individualTotal() === 50 && !visible("CORSO PRESCIISTICA"), `totale ${individualTotal()}`);
    choose("f_agevolazioni_famiglia", "3 PERSONE SENZA ASSICURAZIONE");
    fill();
    messages.length = 0;
    const before = saved.length;
    await save();
    test("agevolazioneSoloCapo", saved.length === before && messages.some((m) => m.includes("capofamiglia")),
      `salvato ${saved.length > before}, messaggi ${messages.join(" / ")}`);

    // 5. Familiare a carico di VERDI: nel nucleo già in 3, senza tessera non si salva.
    resetForm();
    await choosePayer("CAPO2", "VERDI LUCA");
    fill();
    messages.length = 0;
    const before2 = saved.length;
    await save();
    test("nucleoPieno", requiredCard() && saved.length === before2 && messages.some((m) => m.includes("nucleo")),
      `tessera obbligatoria ${requiredCard()}, salvato ${saved.length > before2}, messaggi ${messages.join(" / ")}`);

    document.title = "RISULTATO " + r.join(" ");
  }, 500));
}
