// Impostazioni (impostazioni.html): nomi interi e grafica del resto del sito.
// Gira a 1280 px (tabella) e a 500 px (schede del telefono), vedi esegui.sh.
// - Nome della voce, dell'assicurazione e luogo della partenza si leggono tutti,
//   anche su due righe: il campo non nasconde testo né di lato né sotto.
// - Invio non va a capo nel nome; al salvataggio spazi e a capo diventano uno spazio.
// - Un nome con «&amp;» si carica e si salva com'è (prima l'HTML lo cambiava in «&»).
// - Cambiato il nome, la riga si accende come modificata.
// - Le agevolazioni famiglia hanno l'assicurazione: paga il socio quota + persone × assicurazione.
// - Da dove si contano i numeri tessera liberi (settings.card_gaps_from): si carica e si
//   salva; 0 o lettere no.
// - Campi come nel resto del sito (.input, .textarea, .select) e riquadri a striscia;
//   sul telefono la pagina non scorre di lato.
// In un blocco: gli script della pagina e della prova hanno gli stessi nomi globali.
{
  const LUNGO = "CORSO PRESCIISTICA - REALE TOTAL SPORT";
  const CON_AMP = "TESSERA A&amp;B";
  const LUOGO = "ASTI - PIAZZA D'ARMI (CORSO ALFIERI ANGOLO VIA ROMA)";
  const ASS_LUNGA = "REALE TOTAL SPORT CON RIMBORSO SPESE MEDICHE";
  const scritti = [];

  FINTO.risposta = (t, r) => {
    const scrittura = r.filtri.find((f) => f[0] === "update" || f[0] === "insert");
    if (scrittura) { scritti.push([t, scrittura[1]]); return []; }
    if (t === "prices") return [
      { id: 1, category: "PRESCIISTICA", name: LUNGO, price: 75, active: true, min_role: "utente", insurance: "SPORT", insurance_paid: true, position: null },
      { id: 2, category: "TESSERA", name: CON_AMP, price: 20, active: true, min_role: "utente", insurance: "BASE", insurance_paid: true, position: 1 },
      { id: 3, category: "FAMIGLIA", name: "3 PERSONE CON ASSICURAZIONE", price: 50, active: true, min_role: "utente", insurance: "BASE", insurance_paid: true, position: 1, people: 3 },
    ];
    if (t === "insurances") return [{ code: "BASE", name: "REALE MUTUA NEVE", price: 20 }, { code: "SPORT", name: ASS_LUNGA, price: 45 }];
    if (t === "settings") return [{ key: "card_gaps_from", value: "21" }];
    if (t === "departures") return [{ id: 7, day: "SABATO", place: LUOGO, active: true }];
    return [];
  };

  const aspetta = (ms) => new Promise((fine) => setTimeout(fine, ms));
  const riga = (tabella, id) => el(tabella).querySelector(`tr[data-id="${id}"]`);
  // Intero: niente testo nascosto nel campo (1 px di tolleranza per gli arrotondamenti).
  const intero = (c) => c && c.scrollWidth <= c.clientWidth + 1 && c.scrollHeight <= c.clientHeight + 1;
  const misure = (c) => c ? `${c.scrollWidth}/${c.clientWidth} × ${c.scrollHeight}/${c.clientHeight}` : "campo mancante";
  const ultimo = (t) => [...scritti].reverse().find((s) => s[0] === t)?.[1] || {};

  window.addEventListener("load", () => setTimeout(async () => {
    const r = [];
    const prova = (nome, vero, perche) => r.push(`${nome}=${vero ? "ok" : `NO(${perche})`}`);

    const nome = riga("tabellaPrezzi", 1)?.querySelector("[data-nome]");
    prova("nomeIntero", nome?.value === LUNGO && intero(nome), `«${nome?.value}» ${misure(nome)}`);
    const luogo = riga("tabellaPartenze", 7)?.querySelector("[data-luogo]");
    prova("luogoIntero", luogo?.value === LUOGO && intero(luogo), `${misure(luogo)}`);
    const ass = riga("tabellaAssicurazioni", "SPORT")?.querySelector("[data-nome]");
    prova("assicurazioneIntera", ass?.value === ASS_LUNGA && intero(ass), `${misure(ass)}`);

    const invio = new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true });
    nome?.dispatchEvent(invio);
    prova("invioNonVaACapo", invio.defaultPrevented, "Invio va a capo nel nome");

    if (nome) {
      nome.value = "CORSO  PRESCIISTICA\n- REALE   TOTAL SPORT ";
      nome.dispatchEvent(new Event("input", { bubbles: true }));
    }
    prova("modificata", riga("tabellaPrezzi", 1)?.classList.contains("modificata"), "cambiato il nome, la riga non si accende");
    riga("tabellaPrezzi", 1)?.querySelector("[data-salva]").click();
    await aspetta(200);
    prova("salvaUnoSpazio", ultimo("prices").name === LUNGO, `salvato «${ultimo("prices").name}»`);

    const amp = riga("tabellaPrezzi", 2)?.querySelector("[data-nome]");
    prova("ampCaricato", amp?.value === CON_AMP, `nel campo «${amp?.value}»`);
    riga("tabellaPrezzi", 2)?.querySelector("[data-salva]").click();
    await aspetta(200);
    prova("ampSalvato", ultimo("prices").name === CON_AMP, `salvato «${ultimo("prices").name}»`);

    const famiglia = riga("tabellaPrezzi", 3);
    const paga = famiglia?.querySelector("[data-paga]")?.textContent || "";
    prova("famigliaAssicurata", Boolean(famiglia?.querySelector("[data-assicurazione]")) && paga.includes("110"),
      `assicurazione ${Boolean(famiglia?.querySelector("[data-assicurazione]"))}, «${paga}»`);

    const tessereDa = el("tessereDa");
    prova("tessereDaCaricato", tessereDa?.value === "21", `nel campo «${tessereDa?.value}»`);
    if (tessereDa) {
      tessereDa.value = "25";
      el("btnSalvaTessereDa").click();
      await aspetta(200);
    }
    prova("tessereDaSalvato", ultimo("settings").value === "25", `salvato «${ultimo("settings").value}»`);
    const scrittiPrima = scritti.length;
    for (const sbagliato of ["0", "abc"]) {
      if (!tessereDa) break;
      tessereDa.value = sbagliato;
      el("btnSalvaTessereDa").click();
      await aspetta(200);
    }
    prova("tessereDaSbagliato", tessereDa && scritti.length === scrittiPrima, `salvati ${scritti.length - scrittiPrima} valori sbagliati`);

    const nudi = el("contenuto").querySelectorAll(
      "input:not([type=checkbox]):not(.input), textarea:not(.textarea)").length
      + [...el("contenuto").querySelectorAll("select")].filter((s) => !s.parentElement.classList.contains("select")).length;
    prova("campiDelSito", nudi === 0, `${nudi} campi senza lo stile del sito`);
    const strisce = el("contenuto").querySelectorAll("section.riquadro.sezione > h2.striscia").length;
    prova("riquadriAStriscia", strisce === 3, `${strisce} riquadri a striscia`);
    // Né la pagina né le tabelle scorrono di lato: le colonne nascoste non si vedrebbero.
    const larghe = [document.documentElement, ...document.querySelectorAll("#contenuto .tabella-scorrevole")]
      .filter((c) => c.scrollWidth > c.clientWidth + 1).length;
    prova("nienteScorrimento", larghe === 0, `${larghe} scorrono di lato a ${window.innerWidth} px`);

    document.title = "RISULTATO " + r.join(" ");
  }, 500));
}
