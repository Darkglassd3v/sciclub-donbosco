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
  const LISTINO = [
    { category: "TESSERA", name: "TESSERA ORDINARIA - REALE MUTUA NEVE", price: 40, insurance: "BASE", people: null, min_role: "utente" },
    { category: "TESSERA", name: "SOLO TESSERA - NO ASSICURAZIONE", price: 20, insurance: null, people: null, min_role: "utente" },
    { category: "FAMIGLIA", name: "3 PERSONE CON ASSICURAZIONE", price: 110, insurance: "BASE", people: 3, min_role: "utente" },
    { category: "FAMIGLIA", name: "3 PERSONE SENZA ASSICURAZIONE", price: 50, insurance: null, people: 3, min_role: "utente" },
    { category: "PRESCIISTICA", name: "CORSO PRESCIISTICA", price: 90, insurance: "BASE", people: null, min_role: "utente" },
    { category: "PRESCIISTICA", name: "CORSO PRESCIISTICA - REALE TOTAL SPORT", price: 120, insurance: "SPORT", people: null, min_role: "utente" },
    { category: "PRESCIISTICA", name: "CORSO PRESCIISTICA - FAMIGLIA", price: 50, insurance: null, people: null, min_role: "utente" },
  ];
  const socio = (id, cognome, nome, extra = {}) => ({ id, last_name: cognome, first_name: nome, updated_at: "1",
    enrolled_at: "2026-10-14", paid: 0, total: 0, total_manual: false, card_type: null, family_discount: null, payer_id: null, ...extra });
  const SOCI = {
    CAPO: socio("CAPO", "ROSSI", "MARIO", { family_discount: "3 PERSONE CON ASSICURAZIONE", total: 110 }),
    CAPO2: socio("CAPO2", "VERDI", "LUCA", { family_discount: "3 PERSONE CON ASSICURAZIONE", total: 110 }),
  };
  const NUCLEI = {
    CAPO: [socio("F1", "ROSSI", "ANNA", { payer_id: "CAPO" })],
    CAPO2: [socio("F2", "VERDI", "ELIO", { payer_id: "CAPO2" }), socio("F3", "VERDI", "IDA", { payer_id: "CAPO2" })],
  };
  const salvati = [];
  const messaggi = [];

  FINTO.risposta = (t, r) => {
    const scrittura = r.filtri.find((f) => f[0] === "insert" || f[0] === "update");
    if (t === "members" && scrittura) { salvati.push(scrittura[1]); return [{ id: "NUOVO", updated_at: "2" }]; }
    if (t === "prices") return LISTINO;
    const eq = (campo) => r.filtri.find((f) => f[0] === "eq" && f[1] === campo)?.[2];
    if (t === "members" && eq("payer_id")) return NUCLEI[eq("payer_id")] || [];
    if (t === "members" && eq("id")) return SOCI[eq("id")] ? [SOCI[eq("id")]] : [];
    return [];
  };

  const scegli = (gruppo, voce) =>
    [...el(gruppo).querySelectorAll("input")].find((r) => r.dataset.nome === voce || r.value === voce).click();
  const compila = () => { el("f_cognome").value = "Prova"; el("f_nome").value = "Uno"; el("f_telefono").value = "333"; };
  const tessere = () => [...el("f_tipologia_tessera").querySelectorAll("input")];
  const tesseraObbligatoria = () => tessere().some((r) => r.required);
  // Quello che si vede (display), non solo l'attributo hidden: le classi di Bulma lo battevano.
  const visibile = (voce) => getComputedStyle(el("f_presciistica").querySelector(`input[data-nome="${voce}"]`).closest("label")).display !== "none";
  const nota = () => el("notaFamiglia");
  const notaVisibile = () => getComputedStyle(nota()).display !== "none";
  const ultimo = () => salvati[salvati.length - 1] || {};

  window.addEventListener("load", () => setTimeout(async () => {
    const r = [];
    const prova = (nome, vero, perche) => r.push(`${nome}=${vero ? "ok" : `NO(${perche})`}`);
    if (!nota() || typeof scegliPagante !== "function") {
      document.title = `RISULTATO base=NO(manca #notaFamiglia o scegliPagante())`;
      return;
    }
    showToast = (testo) => messaggi.push(testo);

    // 1. Presciistica con l'assicurazione, senza tessera.
    scegli("f_presciistica", "CORSO PRESCIISTICA");
    prova("presciSenzaTessera", !tesseraObbligatoria() && totaleIndividuale() === 90 && !visibile("CORSO PRESCIISTICA - FAMIGLIA"),
      `tessera obbligatoria ${tesseraObbligatoria()}, totale ${totaleIndividuale()}, solo corso visibile ${visibile("CORSO PRESCIISTICA - FAMIGLIA")}`);
    scegli("f_presciistica", "");
    prova("senzaNienteObbligatoria", tesseraObbligatoria(), "senza presciistica né agevolazione la tessera non è obbligatoria");

    // 2. O la tessera o l'agevolazione.
    scegli("f_tipologia_tessera", "TESSERA ORDINARIA - REALE MUTUA NEVE");
    scegli("f_agevolazioni_famiglia", "3 PERSONE CON ASSICURAZIONE");
    prova("agevolazioneTogliTessera", !tessere().some((x) => x.checked) && !tesseraObbligatoria() && totaleIndividuale() === 110,
      `tessera scelta ${tessere().some((x) => x.checked)}, totale ${totaleIndividuale()}`);
    prova("capoNucleo", notaVisibile() && nota().textContent.includes("1 persona") && nota().textContent.includes("per 3"),
      `nota «${nota().textContent.trim()}»`);
    prova("capoSoloCorso", visibile("CORSO PRESCIISTICA - FAMIGLIA") && !visibile("CORSO PRESCIISTICA"),
      `solo corso ${visibile("CORSO PRESCIISTICA - FAMIGLIA")}, con assicurazione ${visibile("CORSO PRESCIISTICA")}`);
    scegli("f_presciistica", "CORSO PRESCIISTICA - FAMIGLIA");
    prova("capoTotale", totaleIndividuale() === 160, `totale ${totaleIndividuale()}`);
    compila();
    await scrivi();
    prova("capoSalva", ultimo().card_type === null && ultimo().family_discount === "3 PERSONE CON ASSICURAZIONE" && ultimo().total === 160,
      `tessera ${ultimo().card_type}, agevolazione ${ultimo().family_discount}, totale ${ultimo().total}`);
    scegli("f_presciistica", "");
    scegli("f_tipologia_tessera", "TESSERA ORDINARIA - REALE MUTUA NEVE");
    prova("tesseraTogliAgevolazione", !nomeSelezionato("f_agevolazioni_famiglia") && totaleIndividuale() === 40,
      `agevolazione ${nomeSelezionato("f_agevolazioni_famiglia")}, totale ${totaleIndividuale()}`);

    // 3. Capofamiglia aperto: nel nucleo lui e un familiare.
    await caricaSocio("CAPO");
    prova("capoAperto", notaVisibile() && nota().textContent.includes("2 persone"), `nota «${nota().textContent.trim()}»`);

    // 4. Familiare a carico di ROSSI (nucleo: ROSSI e ANNA, c'è posto).
    resetForm();
    await scegliPagante("CAPO", "ROSSI MARIO");
    prova("figlioCoperto", !tesseraObbligatoria() && notaVisibile() && nota().textContent.includes("ROSSI MARIO") && totaleIndividuale() === 0,
      `tessera obbligatoria ${tesseraObbligatoria()}, nota «${nota().textContent.trim()}», totale ${totaleIndividuale()}`);
    scegli("f_presciistica", "CORSO PRESCIISTICA - FAMIGLIA");
    prova("figlioSoloCorso", totaleIndividuale() === 50 && !visibile("CORSO PRESCIISTICA"), `totale ${totaleIndividuale()}`);
    scegli("f_agevolazioni_famiglia", "3 PERSONE SENZA ASSICURAZIONE");
    compila();
    messaggi.length = 0;
    const prima = salvati.length;
    await salva();
    prova("agevolazioneSoloCapo", salvati.length === prima && messaggi.some((m) => m.includes("capofamiglia")),
      `salvato ${salvati.length > prima}, messaggi ${messaggi.join(" / ")}`);

    // 5. Familiare a carico di VERDI: nel nucleo già in 3, senza tessera non si salva.
    resetForm();
    await scegliPagante("CAPO2", "VERDI LUCA");
    compila();
    messaggi.length = 0;
    const prima2 = salvati.length;
    await salva();
    prova("nucleoPieno", tesseraObbligatoria() && salvati.length === prima2 && messaggi.some((m) => m.includes("nucleo")),
      `tessera obbligatoria ${tesseraObbligatoria()}, salvato ${salvati.length > prima2}, messaggi ${messaggi.join(" / ")}`);

    document.title = "RISULTATO " + r.join(" ");
  }, 500));
}
