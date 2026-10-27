// Impostazioni (impostazioni.html): nomi interi e grafica del resto del sito.
// Gira a 1280 px (tabella) e a 500 px (schede del telefono), vedi esegui.sh.
// - Nome della voce, dell'assicurazione e luogo della partenza si leggono tutti,
//   anche su due righe: il campo non nasconde testo né di lato né sotto.
// - Invio non va a capo nel nome; al salvataggio spazi e a capo diventano uno spazio.
// - Un nome con «&amp;» si carica e si salva com'è (prima l'HTML lo cambiava in «&»).
// - Cambiato il nome, la riga si accende come modificata.
// - Le agevolazioni famiglia hanno l'assicurazione: paga il socio quota + persone × assicurazione.
// - Colonna «In Soci»: il prezzo che compare nella pagina Soci (quota più assicurazione, se
//   non è a carico del club), grande e in grassetto, per ogni voce; segue subito quota e
//   «a carico del club». Il campo del prezzo si chiama «Quota €». «Chi la assegna» non c'è
//   più (nessuno usa il sito da utente) e min_role non si salva.
// - Da dove si contano i numeri tessera liberi (settings.card_gaps_from): si carica e si
//   salva; 0 o lettere no.
// - Prezzi in euro interi o con i 50 centesimi: 12,50 si salva, 12,30 no (bordo rosso).
// - Un salvataggio che il database non scrive (riga negata dalla RLS o sparita):
//   errore, e la riga resta gialla; non «aggiornata».
// - Nome della voce vuoto: non si salva, bordo rosso.
// - Con una riga modificata e non salvata non si aggiunge una voce (rileggere il
//   listino la perderebbe): si borda il suo Salva.
// - Luogo della partenza con la virgola: non si salva (in Soci le partenze di un
//   socio si separano con la virgola, e il luogo si spezzerebbe in due).
// - Voce nuova senza nome: il nome ha il bordo rosso e si vede (regola di shared.js).
// - Campi come nel resto del sito (.input, .textarea, .select) e riquadri a striscia;
//   sul telefono la pagina non scorre di lato.
// In un blocco: gli script della pagina e della prova hanno gli stessi nomi globali.
{
  const LONG = "CORSO PRESCIISTICA - REALE TOTAL SPORT";
  const CON_AMP = "TESSERA A&amp;B";
  const PLACE = "ASTI - PIAZZA D'ARMI (CORSO ALFIERI ANGOLO VIA ROMA)";
  const LONG_INSURANCE = "REALE TOTAL SPORT CON RIMBORSO SPESE MEDICHE";
  const written = [];
  let denied = false;   // il database non scrive (RLS o riga sparita): niente righe indietro

  FAKE.risposta = (t, r) => {
    const writing = r.filtri.find((f) => f[0] === "update" || f[0] === "insert");
    if (writing) { written.push([t, writing[1]]); return denied ? [] : [{ id: 1 }]; }
    if (t === "prices") return [
      { id: 1, category: "PRESCIISTICA", name: LONG, price: 75, active: true, min_role: "utente", insurance: "SPORT", insurance_paid: true, position: null },
      { id: 2, category: "TESSERA", name: CON_AMP, price: 20, active: true, min_role: "utente", insurance: "BASE", insurance_paid: true, position: 1 },
      { id: 3, category: "FAMIGLIA", name: "3 PERSONE CON ASSICURAZIONE", price: 50, active: true, min_role: "utente", insurance: "BASE", insurance_paid: true, position: 1, people: 3 },
      { id: 4, category: "CORSO", name: "CORSO SCI ADULTI", price: 210, active: true, min_role: "utente", insurance: null, insurance_paid: true, position: 1 },
    ];
    if (t === "insurances") return [{ code: "BASE", name: "REALE MUTUA NEVE", price: 20 }, { code: "SPORT", name: LONG_INSURANCE, price: 45 }];
    if (t === "settings") return [{ key: "card_gaps_from", value: "21" }];
    if (t === "departures") return [{ id: 7, day: "SABATO", place: PLACE, active: true }];
    return [];
  };

  const wait = (ms) => new Promise((fine) => setTimeout(fine, ms));
  const row = (table, id) => el(table).querySelector(`tr[data-id="${id}"]`);
  // Intero: niente testo nascosto nel campo (1 px di tolleranza per gli arrotondamenti).
  const whole = (c) => c && c.scrollWidth <= c.clientWidth + 1 && c.scrollHeight <= c.clientHeight + 1;
  const sizes = (c) => c ? `${c.scrollWidth}/${c.clientWidth} × ${c.scrollHeight}/${c.clientHeight}` : "campo mancante";
  const last = (t) => [...written].reverse().find((s) => s[0] === t)?.[1] || {};

  window.addEventListener("load", () => setTimeout(async () => {
    const r = [];
    const test = (nome, passed, why) => r.push(`${nome}=${passed ? "ok" : `NO(${why})`}`);

    const nome = row("tabellaPrezzi", 1)?.querySelector("[data-nome]");
    test("nomeIntero", nome?.value === LONG && whole(nome), `«${nome?.value}» ${sizes(nome)}`);
    const placeName = row("tabellaPartenze", 7)?.querySelector("[data-luogo]");
    test("luogoIntero", placeName?.value === PLACE && whole(placeName), `${sizes(placeName)}`);
    const ass = row("tabellaAssicurazioni", "SPORT")?.querySelector("[data-nome]");
    test("assicurazioneIntera", ass?.value === LONG_INSURANCE && whole(ass), `${sizes(ass)}`);

    const submission = new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true });
    nome?.dispatchEvent(submission);
    test("invioNonVaACapo", submission.defaultPrevented, "Invio va a capo nel nome");

    if (nome) {
      nome.value = "CORSO  PRESCIISTICA\n- REALE   TOTAL SPORT ";
      nome.dispatchEvent(new Event("input", { bubbles: true }));
    }
    test("modificata", row("tabellaPrezzi", 1)?.classList.contains("modificata"), "cambiato il nome, la riga non si accende");
    row("tabellaPrezzi", 1)?.querySelector("[data-salva]").click();
    await wait(200);
    test("salvaUnoSpazio", last("prices").name === LONG, `salvato «${last("prices").name}»`);

    const amp = row("tabellaPrezzi", 2)?.querySelector("[data-nome]");
    test("ampCaricato", amp?.value === CON_AMP, `nel campo «${amp?.value}»`);
    row("tabellaPrezzi", 2)?.querySelector("[data-salva]").click();
    await wait(200);
    test("ampSalvato", last("prices").name === CON_AMP, `salvato «${last("prices").name}»`);
    test("nienteMinRole", !("min_role" in last("prices")), `salvato min_role «${last("prices").min_role}»`);

    const headings = [...document.querySelectorAll("table.tabella-costi th")].map((th) => th.textContent.trim());
    test("senzaChiAssegna", !headings.includes("Chi la assegna") && !el("tabellaPrezzi").querySelector("[data-min-role]")
      && !el("nuovoMinRole"), `colonne ${headings.join(" | ")}`);
    test("quotaEInSoci", headings.includes("Quota €") && headings.includes("In Soci"), `colonne ${headings.join(" | ")}`);
    const inMembers = (id) => row("tabellaPrezzi", id)?.querySelector('td[data-etichetta="In Soci"] [data-paga]');
    const text = (id) => inMembers(id)?.textContent.trim() || "";
    test("inSociTessera", text(2) === "€ 40,00", `«${text(2)}»`);
    test("inSociCorso", text(4) === "€ 210,00", `«${text(4)}»`);
    const stile = inMembers(2) && getComputedStyle(inMembers(2));
    test("inSociGrande", stile && parseFloat(stile.fontSize) >= 19 && Number(stile.fontWeight) >= 700,
      `${stile?.fontSize} ${stile?.fontWeight}`);
    const club = row("tabellaPrezzi", 2)?.querySelector("[data-pagata-club]");
    const quota = row("tabellaPrezzi", 2)?.querySelector("[data-prezzo]");
    if (club && quota) {
      club.click();
      const conClub = text(2);
      club.click();
      quota.value = "25";
      quota.dispatchEvent(new Event("input", { bubbles: true }));
      const conQuota = text(2);
      quota.value = "20";
      quota.dispatchEvent(new Event("input", { bubbles: true }));
      test("inSociSegue", conClub === "€ 20,00" && conQuota === "€ 45,00", `club «${conClub}», quota 25 «${conQuota}»`);
    } else test("inSociSegue", false, "riga della tessera mancante");

    const family = row("tabellaPrezzi", 3);
    const pays = family?.querySelector("[data-paga]")?.textContent || "";
    test("famigliaAssicurata", Boolean(family?.querySelector("[data-assicurazione]")) && pays.includes("110"),
      `assicurazione ${Boolean(family?.querySelector("[data-assicurazione]"))}, «${pays}»`);

    const cardsFrom = el("tessereDa");
    test("tessereDaCaricato", cardsFrom?.value === "21", `nel campo «${cardsFrom?.value}»`);
    if (cardsFrom) {
      cardsFrom.value = "25";
      el("btnSalvaTessereDa").click();
      await wait(200);
    }
    test("tessereDaSalvato", last("settings").value === "25", `salvato «${last("settings").value}»`);
    const writtenBefore = written.length;
    for (const wrong of ["0", "abc"]) {
      if (!cardsFrom) break;
      cardsFrom.value = wrong;
      el("btnSalvaTessereDa").click();
      await wait(200);
    }
    test("tessereDaSbagliato", cardsFrom && written.length === writtenBefore, `salvati ${written.length - writtenBefore} valori sbagliati`);

    const cardPrice = row("tabellaPrezzi", 2)?.querySelector("[data-prezzo]");
    cardPrice.value = "12.5";
    row("tabellaPrezzi", 2).querySelector("[data-salva]").click();
    await wait(200);
    test("cinquantaCent", last("prices").price === 12.5, `salvato ${last("prices").price}`);
    const writtenPrice = written.length;
    cardPrice.value = "12.3";
    row("tabellaPrezzi", 2).querySelector("[data-salva]").click();
    await wait(200);
    test("centesimiNo", written.length === writtenPrice && cardPrice.classList.contains("campo-errore"),
      `salvati ${written.length - writtenPrice}, bordato ${cardPrice.classList.contains("campo-errore")}`);

    const toast = () => el("statusToast")?.textContent || "";
    const r2 = row("tabellaPrezzi", 2);
    r2.querySelector("[data-prezzo]").value = "30";
    r2.querySelector("[data-prezzo]").dispatchEvent(new Event("input", { bubbles: true }));
    denied = true;
    r2.querySelector("[data-salva]").click();
    await wait(200);
    denied = false;
    test("nonScritta", /non salvat/i.test(toast()) && r2.classList.contains("modificata"),
      `«${toast().slice(0, 60)}», gialla ${r2.classList.contains("modificata")}`);

    const nomeR2 = r2.querySelector("[data-nome]");
    const nameFirst = written.length;
    nomeR2.value = "";
    nomeR2.dispatchEvent(new Event("input", { bubbles: true }));
    r2.querySelector("[data-salva]").click();
    await wait(200);
    test("nomeVuoto", written.length === nameFirst && nomeR2.classList.contains("campo-errore"),
      `salvati ${written.length - nameFirst}, bordato ${nomeR2.classList.contains("campo-errore")}`);
    nomeR2.value = CON_AMP;
    nomeR2.dispatchEvent(new Event("input", { bubbles: true }));

    el("nuovoNome").value = "VOCE NUOVA";
    el("nuovoPrezzo").value = "10";
    const newFirst = written.length;
    el("btnAggiungiPrezzo").click();
    await wait(300);
    test("nonPerdeModifiche", written.length === newFirst && row("tabellaPrezzi", 2)?.classList.contains("modificata"),
      `inseriti ${written.length - newFirst}, riga gialla ${row("tabellaPrezzi", 2)?.classList.contains("modificata")}`);
    // Di nuovo com'è salvata (12,50 da cinquantaCent): la riga si spegne.
    r2.querySelector("[data-prezzo]").value = "12.5";
    r2.querySelector("[data-prezzo]").dispatchEvent(new Event("input", { bubbles: true }));
    el("nuovoNome").value = "";
    el("nuovoPrezzo").value = "";

    const placeR = row("tabellaPartenze", 7)?.querySelector("[data-luogo]");
    const placeFirst = written.length;
    placeR.value = "ASTI, PIAZZA D'ARMI";
    placeR.dispatchEvent(new Event("input", { bubbles: true }));
    row("tabellaPartenze", 7).querySelector("[data-salva]").click();
    await wait(200);
    test("luogoSenzaVirgola", written.length === placeFirst && placeR.classList.contains("campo-errore"),
      `salvati ${written.length - placeFirst}, bordato ${placeR.classList.contains("campo-errore")}`);
    placeR.value = PLACE;
    placeR.dispatchEvent(new Event("input", { bubbles: true }));

    window.scrollTo(0, 0);
    el("btnAggiungiPrezzo").click();
    await wait(300);
    const newItem = el("nuovoNome").getBoundingClientRect();
    test("nomeMancanteRosso", el("nuovoNome").classList.contains("campo-errore") && newItem.top >= 0 && newItem.bottom <= innerHeight,
      `bordato ${el("nuovoNome").classList.contains("campo-errore")}, in alto a ${Math.round(newItem.top)} px`);

    const bare = el("contenuto").querySelectorAll(
      "input:not([type=checkbox]):not(.input), textarea:not(.textarea)").length
      + [...el("contenuto").querySelectorAll("select")].filter((s) => !s.parentElement.classList.contains("select")).length;
    test("campiDelSito", bare === 0, `${bare} campi senza lo stile del sito`);
    const stripes = el("contenuto").querySelectorAll("section.riquadro.sezione > h2.striscia").length;
    test("riquadriAStriscia", stripes === 3, `${stripes} riquadri a striscia`);
    // Né la pagina né le tabelle scorrono di lato: le colonne nascoste non si vedrebbero.
    const wideOnes = [document.documentElement, ...document.querySelectorAll("#contenuto .tabella-scorrevole")]
      .filter((c) => c.scrollWidth > c.clientWidth + 1).length;
    test("nienteScorrimento", wideOnes === 0, `${wideOnes} scorrono di lato a ${window.innerWidth} px`);

    document.title = "RISULTATO " + r.join(" ");
  }, 500));
}
