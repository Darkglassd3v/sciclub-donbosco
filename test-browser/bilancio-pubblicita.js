// Bilancio (bilancio.html): voce Pubblicità, movimenti per voce e rimborso unico a una persona (27/11/2026).
// - Fra le voci c'è «Pubblicità».
// - «Mostra la voce» tiene solo i movimenti di quella voce, col loro totale.
// - Nel riquadro delle spese anticipate ogni persona ha «Registra un rimborso»: importo, data e modo si salvano in
//   ledger_refunds, e il database copre le spese dalla più vecchia. Il credito che avanza è scritto accanto al nome,
//   anche per chi non ha più niente da riavere.
// In un blocco: gli script della pagina e della prova hanno gli stessi nomi globali.
{
  const SEASON = "2026-09-01T00:00:00+00:00";
  const entry = (id, category, amount, extra = {}) => ({ id, season: SEASON, entry_date: "2026-11-1" + id.slice(1), kind: "USCITA",
    category, description: null, quantity: 1, unit_price: amount, amount, social_event_id: null, advanced_by: null,
    advanced_by_id: null, refunded_on: null, created_at: "2026-11-10T10:00:00Z", ...extra });
  const ENTRIES = [
    entry("E1", "Pubblicità", 10, { advanced_by: "COSSETTA FEDERICO", advanced_by_id: "PF" }),
    entry("E2", "Pullman", 50),
    entry("E3", "Pubblicità", 20, { advanced_by: "COSSETTA FEDERICO", advanced_by_id: "PF" }),
  ];
  const BALANCE = [
    { person_id: "PF", person: "COSSETTA FEDERICO", owed: 30, credit: 2.13 },
    { person_id: "PV", person: "VERDI LUCA", owed: 0, credit: 5 },
  ];
  const writes = [];
  FAKE.rpc.ledger_social_events = [];
  FAKE.risposta = (t, r) => {
    const writing = r.filtri.find((f) => ["insert", "update", "delete"].includes(f[0]));
    if (writing) { writes.push([t, ...writing]); return [{ id: "NUOVO" }]; }
    if (t === "season_balance") return [{ season: SEASON, bank_current: 1000, members_collected: 0, other_income: 0,
      total_collected: 0, expenses: 80, bank_opening: 0, bank_opening_set: true }];
    if (t === "ledger_entries") return ENTRIES;
    if (t === "ledger_refund_balance") return BALANCE;
    if (t === "ledger_people") return [{ id: "PF", last_name: "COSSETTA", first_name: "FEDERICO" }, { id: "PV", last_name: "VERDI", first_name: "LUCA" }];
    return [];
  };
  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const text = (node) => node?.textContent.replace(/\s+/g, " ").trim() || "";
  const shownRows = () => [...document.querySelectorAll("#elencoMovimenti td[data-id]")].map((td) => td.dataset.id);
  window.addEventListener("load", () => setTimeout(async () => { try {
    const r = [];
    const test = (nome, passed, why) => r.push(`${nome}=${passed ? "ok" : `NO(${why})`}`);

    const voci = [...el("mVoce").options].map((o) => o.value);
    test("vocePubblicita", voci.includes("Pubblicità"), voci.join(","));

    const filter = el("filtroVoce");
    const options = filter ? [...filter.options].map((o) => o.value) : [];
    test("filtroVoci", options[0] === "" && options.includes("Pubblicità") && options.includes("Pullman"), options.join(","));
    if (filter) {
      filter.value = "Pubblicità";
      filter.dispatchEvent(new Event("change", { bubbles: true }));
      await wait(100);
    }
    const total = text(document.querySelector("#elencoMovimenti .riga-totale"));
    test("soloLaVoce", shownRows().join(",") === "E1,E3", shownRows().join(","));
    test("totaleDellaVoce", /Pubblicità/.test(total) && /30,00/.test(total), total);
    if (filter) {
      filter.value = "";
      filter.dispatchEvent(new Event("change", { bubbles: true }));
      await wait(100);
    }
    test("tutteLeVoci", shownRows().length === 3, shownRows().join(","));

    const persons = text(el("kDaRimborsarePersone"));
    test("credito", /COSSETTA FEDERICO/.test(persons) && /credito[^0-9]*2,13/i.test(persons), persons);
    test("soloCredito", /VERDI LUCA/.test(persons) && /credito[^0-9]*5,00/i.test(persons), persons);
    test("riquadroVisibile", !el("kpiDaRimborsare").hidden, "riquadro nascosto");

    const button = document.querySelector('#kDaRimborsarePersone button[data-rimborso="PF"]');
    test("pulsanteRimborso", /Registra un rimborso/.test(text(button)), text(button) || "manca");
    button?.click();
    await wait(100);
    test("finestra", el("dlgRimborso")?.open === true, "finestra chiusa");
    if (el("dlgRimborso")?.open) {
      el("rImporto").value = "200";
      el("rModo").value = "CONTANTI";
      el("rSalva").click();
      await wait(600);
    }
    const saved = writes.find((w) => w[0] === "ledger_refunds" && w[1] === "insert");
    const row = saved && saved[2];
    test("salvaRimborso", row && row.person_id === "PF" && Number(row.amount) === 200 && row.method === "CONTANTI"
      && /^\d{4}-\d{2}-\d{2}$/.test(row.refund_date || ""), JSON.stringify(writes));
    document.title = "RISULTATO " + r.join(" ");
  } catch (e) { document.title = `RISULTATO eccezione=NO(${String(e?.message || e).slice(0, 120)})`; } }, 500));
}
