// Bilancio (bilancio.html): la rubrica delle persone da rimborsare (dalla 3.5).
// - «Anticipata da» è una scelta: «Pagata dal club», le persone della rubrica (ledger_people) in ordine
//   alfabetico e, in fondo, «Aggiungi una persona…».
// - «Aggiungi una persona…» apre una finestra con cognome e nome. La stessa persona con le parole in un
//   altro ordine non entra due volte: si sceglie quella che c'è. Una persona nuova si salva in maiuscolo
//   e resta scelta. «Annulla» torna alla scelta di prima.
// - Il riquadro delle spese da rimborsare dice quanto spetta a ciascuno.
// - Il movimento salva la persona (advanced_by_id); il testo lo scrive il database.
// In un blocco: gli script della pagina e della prova hanno gli stessi nomi globali.
{
  const PEOPLE = [
    { id: "PV", last_name: "VERDI", first_name: "LUCA" },
    { id: "PC", last_name: "COSSETTA", first_name: "FEDERICO" },
  ];
  const entry = (id, price, who, whoId, refunded) => ({ id, season: "2026-09-01T00:00:00+00:00", entry_date: "2026-11-10",
    kind: "USCITA", category: "Altro", description: id, quantity: 1, unit_price: price, amount: price, social_event_id: null,
    advanced_by: who, advanced_by_id: whoId, refunded_on: refunded, created_at: "2026-11-10T10:00:00Z" });
  const ENTRIES = [
    entry("E1", 30, "COSSETTA FEDERICO", "PC", null),
    entry("E2", 20.5, "COSSETTA FEDERICO", "PC", null),
    entry("E3", 10, "VERDI LUCA", "PV", null),
    entry("E4", 99, "VERDI LUCA", "PV", "2026-11-12"),
  ];
  const writes = [];
  FAKE.rpc.ledger_social_events = [];
  FAKE.risposta = (t, r) => {
    if (t === "season_balance") return [{ season: "2026-09-01T00:00:00+00:00", bank_current: 1000, members_collected: 0,
      other_income: 0, total_collected: 0, expenses: 159.5, bank_opening: 0, bank_opening_set: true }];
    const writing = r.filtri.find((f) => ["insert", "update"].includes(f[0]));
    if (writing) {
      writes.push([t, writing[0], writing[1]]);
      if (t === "ledger_people") { const p = { id: "PN", ...writing[1] }; PEOPLE.push(p); return [p]; }
      return [{ id: "NUOVO" }];
    }
    if (t === "ledger_people") return PEOPLE;
    if (t === "ledger_entries") return ENTRIES;
    return [];
  };

  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const text = (node) => node?.textContent.replace(/\s+/g, " ").trim() || "";
  const choose = (value) => { el("mAnticipata").value = value; el("mAnticipata").dispatchEvent(new Event("change")); };

  window.addEventListener("load", () => setTimeout(async () => { try {
    const r = [];
    const test = (nome, passed, why) => r.push(`${nome}=${passed ? "ok" : `NO(${why})`}`);
    await wait(400);
    document.querySelector("input[name=mTipo][value=USCITA]").click();

    const options = [...(el("mAnticipata")?.options || [])].map((o) => `${o.value}:${o.textContent.trim()}`);
    test("elenco", el("mAnticipata")?.tagName === "SELECT"
      && options.join("|") === ":Pagata dal club|PC:COSSETTA FEDERICO|PV:VERDI LUCA|__nuova:Aggiungi una persona…", `opzioni ${options.join(" | ")}`);

    const owed = text(el("kpiDaRimborsare"));
    test("totalePerPersona", /60,50/.test(owed) && /COSSETTA FEDERICO\s*50,50/.test(owed) && /VERDI LUCA\s*10,00/.test(owed) && !/99,00/.test(owed),
      `riquadro «${owed}»`);

    // La stessa persona con le parole al contrario: niente persona nuova, si sceglie quella che c'è.
    choose("__nuova");
    await wait(200);
    test("finestra", el("dlgPersona")?.open === true, "la finestra non si apre");
    el("pCognome").value = "federico"; el("pNome").value = "Cossetta";
    el("pSalva").click();
    await wait(400);
    test("doppione", !writes.some((w) => w[0] === "ledger_people") && el("mAnticipata").value === "PC" && !el("dlgPersona").open,
      `scritture ${JSON.stringify(writes)}, scelta ${el("mAnticipata").value}`);

    // Annulla: torna alla scelta di prima.
    choose("__nuova");
    await wait(200);
    el("pAnnulla").click();
    await wait(200);
    test("annulla", el("mAnticipata").value === "PC" && !el("dlgPersona").open, `scelta ${el("mAnticipata").value}`);

    // Cognome o nome vuoti: non si salva.
    choose("__nuova");
    await wait(200);
    el("pCognome").value = "Bianchi"; el("pNome").value = " ";
    el("pSalva").click();
    await wait(300);
    test("vuoto", el("dlgPersona").open && !writes.some((w) => w[0] === "ledger_people"), "salvata una persona senza nome");

    // Una persona nuova: in maiuscolo, poi resta scelta.
    el("pNome").value = "Anna";
    el("pSalva").click();
    await wait(500);
    const added = writes.find((w) => w[0] === "ledger_people")?.[2];
    test("nuova", added?.last_name === "BIANCHI" && added?.first_name === "ANNA" && el("mAnticipata").value === "PN" && !el("dlgPersona").open,
      `inserita ${JSON.stringify(added)}, scelta ${el("mAnticipata").value}`);

    // Il movimento salva la persona, non il testo.
    el("mVoce").value = "Altro"; el("mPrezzo").value = "12"; el("mDescrizione").value = "Prova";
    el("formMovimento").requestSubmit();
    await wait(600);
    const insert = writes.find((w) => w[0] === "ledger_entries" && w[1] === "insert")?.[2];
    test("salvaPersona", insert?.advanced_by_id === "PN" && insert?.advanced_by == null, JSON.stringify(insert));
    document.title = "RISULTATO " + r.join(" ");
  } catch (e) { document.title = `RISULTATO eccezione=NO(${String(e?.message || e).slice(0, 120)})`; } }, 500));
}
