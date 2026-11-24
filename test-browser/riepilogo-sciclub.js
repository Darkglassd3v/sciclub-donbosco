// Riepilogo (riepilogo.html), incassi per sci club (dalla 3.12.2, richiesta del 24/11/2026: «voglio differenziare gli
// incassi tra Don Bosco e Moncalvo, in alto lascia il riepilogo che c'è ora che include tutto»).
// - In alto tutto come prima: cifre e tabelle di tutti i soci (card_counts, course_counts, …), senza «di cui».
// - Sotto, le tab DON BOSCO (soci senza club) e una per ogni sci club affiliato (proposta dell'utente, stesso giorno);
//   all'apertura la prima. Ogni pannello: soci,
//   totale teorico, incassato e da incassare del gruppo (club_totals) e le stesse tabelle di sopra, Tessere,
//   Presciistica, Abbonamenti gite e Corsi, con voce, N., prezzo e totale solo dei suoi soci (club_counts).
// - Un club senza voci in una tabella: «—», come sopra.
{
  const CLUB = "SCI CLUB MONCALVO";
  FAKE.risposta = (t) => {
    if (t === "season_totals") return [{ total_members: 10, total_due: 500, total_collected: 300, outstanding: 200 }];
    if (t === "card_counts") return [{ name: "ORDINARIA", count: 6, price: 30, total: 180 }, { name: "JUNIOR", count: 3, price: 20, total: 60 }];
    if (t === "course_counts") return [{ name: "CORSO SCI ADULTI", count: 2 }];
    if (t === "pass_counts") return [{ name: "5 VIAGGI SABATO", count: 2 }];
    if (t === "prices") return [{ category: "CORSO", name: "CORSO SCI ADULTI", price: 200, day: null },
      { category: "ABBONAMENTO", name: "5 VIAGGI SABATO", price: 100, day: "SABATO" }];
    if (t === "affiliated_clubs") return [{ id: 1, name: CLUB }];
    if (t === "club_totals") return [
      { club: null, members: 9, total_due: 430, total_collected: 230, outstanding: 200 },
      { club: CLUB, members: 1, total_due: 70, total_collected: 70, outstanding: 0 },
    ];
    if (t === "club_counts") return [
      { club: null, section: "SOCI", name: "", count: 9, price: null, total: null },
      { club: null, section: "TESSERE", name: "ORDINARIA", count: 5, price: 30, total: 150 },
      { club: null, section: "TESSERE", name: "JUNIOR", count: 3, price: 20, total: 60 },
      { club: null, section: "CORSI", name: "CORSO SCI ADULTI", count: 1, price: null, total: null },
      { club: null, section: "ABBONAMENTI", name: "5 VIAGGI SABATO", count: 2, price: null, total: null },
      { club: CLUB, section: "SOCI", name: "", count: 1, price: null, total: null },
      { club: CLUB, section: "TESSERE", name: "ORDINARIA", count: 1, price: 30, total: 30 },
      { club: CLUB, section: "CORSI", name: "CORSO SCI ADULTI", count: 1, price: null, total: null },
    ];
    if (t === "members") return Array.from({ length: 10 }, (_, i) => ({ id: `m${i}` }));
    return [];
  };
  const text = (node) => node?.textContent.replace(/\s+/g, " ").trim() || "";
  // Una riga di tabella come si legge: le celle separate da uno spazio.
  const rowText = (tr) => (tr ? [...tr.cells].map(text).join(" ") : "");
  window.addEventListener("load", () => setTimeout(async () => {
    const r = [];
    const test = (nome, passed, why) => r.push(`${nome}=${passed ? "ok" : `NO(${why})`}`);
    try {
      await new Promise((ok) => setTimeout(ok, 600));
      const row = (tbody, label) => [...(tbody?.querySelectorAll("tr") || [])].find((tr) => text(tr.cells[0]).startsWith(label));
      test("sopraTutto", rowText(row(el("tTess"), "Totale")).startsWith("Totale 9") && !document.querySelector(".di-cui")
        && !el("zonaClub"), rowText(row(el("tTess"), "Totale")));

      const tabs = [...document.querySelectorAll('[role="tablist"] [role="tab"]')];
      test("tab", tabs.map(text).join("|") === `DON BOSCO|${CLUB}` && tabs[0]?.getAttribute("aria-selected") === "true"
        && tabs[1]?.getAttribute("aria-selected") === "false", tabs.map((b) => `${text(b)}:${b.getAttribute("aria-selected")}`).join("|"));
      const groups = [...document.querySelectorAll('[role="tabpanel"][data-gruppo]')];
      test("pannelli", groups.length === 2 && !groups[0].hidden && groups[1].hidden && groups[1].getAttribute("role") === "tabpanel"
        && groups[1].getAttribute("aria-labelledby") === tabs[1]?.id, groups.map((g) => `${g.dataset.gruppo}:${g.hidden}`).join("|"));
      tabs[1]?.click();
      test("cambiaTab", groups[0]?.hidden && !groups[1]?.hidden && tabs[1]?.getAttribute("aria-selected") === "true",
        groups.map((g) => `${g.dataset.gruppo}:${g.hidden}`).join("|"));
      test("gruppi", groups.map((s) => s.dataset.gruppo).join("|") === `DON BOSCO|${CLUB}`, groups.map((s) => s.dataset.gruppo).join("|"));
      const [db, club] = groups;
      const cifre = (s) => [...(s?.querySelectorAll(".kpi-value") || [])].map(text).join("|");
      test("incassiDonBosco", cifre(db) === "9|€ 430,00|€ 230,00|€ 200,00", cifre(db));
      test("incassiClub", cifre(club) === "1|€ 70,00|€ 70,00|€ 0,00", cifre(club));

      const table = (s, kind) => s?.querySelector(`tbody[data-tabella="${kind}"]`);
      test("tessereDonBosco", rowText(row(table(db, "TESSERE"), "ORDINARIA")) === "ORDINARIA 5 € 30,00 € 150,00"
        && rowText(row(table(db, "TESSERE"), "Totale")) === "Totale 8 — € 210,00", text(table(db, "TESSERE")));
      test("tessereClub", rowText(row(table(club, "TESSERE"), "ORDINARIA")) === "ORDINARIA 1 € 30,00 € 30,00"
        && rowText(row(table(club, "TESSERE"), "Totale")) === "Totale 1 — € 30,00", text(table(club, "TESSERE")));
      test("corsiClub", rowText(row(table(club, "CORSI"), "CORSO SCI ADULTI")) === "CORSO SCI ADULTI 1 € 200,00 € 200,00",
        text(table(club, "CORSI")));
      test("abbonamentiDonBosco", rowText(row(table(db, "ABBONAMENTI"), "5 VIAGGI SABATO")).startsWith("5 VIAGGI SABATO")
        && rowText(row(table(db, "ABBONAMENTI"), "5 VIAGGI SABATO")).endsWith("2 € 100,00 € 200,00"), text(table(db, "ABBONAMENTI")));
      test("vuotaClub", text(table(club, "ABBONAMENTI")) === "—" && text(table(club, "PRESCIISTICA")) === "—",
        `${text(table(club, "ABBONAMENTI"))} / ${text(table(club, "PRESCIISTICA"))}`);
    } catch (e) { r.push(`eccezione=NO(${String(e?.message || e).slice(0, 120)})`); }
    document.title = "RISULTATO " + r.join(" ");
  }, 400));
}
