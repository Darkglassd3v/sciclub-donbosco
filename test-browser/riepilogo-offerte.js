// Riepilogo (riepilogo.html), soci offerti (dalla 3.12.4, segnalazione del 24/11/2026): un socio con la tessera
// offerta (dallo sci club o dal direttivo) si registra col suo tipo di tessera vero, per l'assicurazione, e col totale
// scritto a mano a 0 €. Le viste contano la voce a prezzo di listino, quindi nelle tabelle risultavano incassati 65 € e
// 20 € mai chiesti. Per scelta dell'utente («i totali del db non si toccano, solo la visualizzazione») viste e totali
// restano come sono: è la pagina a spostare ogni voce del socio offerto in una riga «… (offerta)» a 0 €, nelle tabelle
// di tutti e in quelle del suo gruppo. Il numero di voci non cambia; le cifre in alto (totali dei soci) neppure.
{
  const CLUB = "SCI CLUB MONCALVO";
  const NEVE = "TESSERA ORDINARIA - REALE MUTUA NEVE", SPORT = "TESSERA ORDINARIA - REALE TOTAL SPORT";
  const SOLO = "SOLO TESSERA - NO ASSICURAZIONE", PRESCI = "PRESCIISTICA ADULTI";
  const now = new Date();
  const season = `${now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1}-09-01T00:00:00+00:00`;
  const oldSeason = `${Number(season.slice(0, 4)) - 1}-09-01T00:00:00+00:00`;
  const ASKED = [];
  const offered = [
    // Moncalvo: tessera Total Sport con corso e abbonamento di quest'anno (più uno della stagione scorsa, che non conta).
    { card_type: SPORT, family_discount: null, preski_type: null, preski_card: null, preski_course_price: null,
      course_type: "CORSO SCI ADULTI", club: { name: CLUB },
      member_passes: [{ pass_type: "5 VIAGGI SABATO", season }, { pass_type: "5 VIAGGI SABATO", season: oldSeason }] },
    { card_type: SOLO, family_discount: null, preski_type: null, preski_card: null, preski_course_price: null,
      course_type: null, club: { name: CLUB }, member_passes: [] },
    // Don Bosco: presciistica con la tessera compresa (preski_card), a 50 € la parte della presciistica.
    { card_type: null, family_discount: null, preski_type: PRESCI, preski_card: NEVE, preski_course_price: 50,
      course_type: null, club: null, member_passes: [] },
  ];
  FAKE.risposta = (t, r) => {
    ASKED.push([t, r.filtri]);
    if (t === "season_totals") return [{ total_members: 8, total_due: 500, total_collected: 300, outstanding: 200 }];
    if (t === "card_counts") return [{ name: NEVE, count: 3, price: 40, total: 120 }, { name: SPORT, count: 1, price: 65, total: 65 },
      { name: SOLO, count: 1, price: 20, total: 20 }];
    if (t === "preski_counts") return [{ name: PRESCI, count: 2, price: 50, total: 100 }];
    if (t === "course_counts") return [{ name: "CORSO SCI ADULTI", count: 2 }];
    if (t === "pass_counts") return [{ name: "5 VIAGGI SABATO", count: 2 }];
    if (t === "prices") return [{ category: "CORSO", name: "CORSO SCI ADULTI", price: 200, day: null },
      { category: "ABBONAMENTO", name: "5 VIAGGI SABATO", price: 100, day: "SABATO" },
      { category: "PRESCIISTICA", name: PRESCI, price: 90, day: null, course_only: false }];
    if (t === "affiliated_clubs") return [{ name: CLUB }];
    if (t === "club_totals") return [
      { club: null, members: 5, total_due: 420, total_collected: 220, outstanding: 200 },
      { club: CLUB, members: 3, total_due: 80, total_collected: 80, outstanding: 0 },
    ];
    if (t === "club_counts") return [
      { club: null, section: "SOCI", name: "", count: 5, price: null, total: null },
      { club: null, section: "TESSERE", name: NEVE, count: 2, price: 40, total: 80 },
      { club: null, section: "PRESCIISTICA", name: PRESCI, count: 2, price: 50, total: 100 },
      { club: null, section: "CORSI", name: "CORSO SCI ADULTI", count: 1, price: null, total: null },
      { club: null, section: "ABBONAMENTI", name: "5 VIAGGI SABATO", count: 1, price: null, total: null },
      { club: CLUB, section: "SOCI", name: "", count: 3, price: null, total: null },
      { club: CLUB, section: "TESSERE", name: NEVE, count: 1, price: 40, total: 40 },
      { club: CLUB, section: "TESSERE", name: SPORT, count: 1, price: 65, total: 65 },
      { club: CLUB, section: "TESSERE", name: SOLO, count: 1, price: 20, total: 20 },
      { club: CLUB, section: "CORSI", name: "CORSO SCI ADULTI", count: 1, price: null, total: null },
      { club: CLUB, section: "ABBONAMENTI", name: "5 VIAGGI SABATO", count: 1, price: null, total: null },
    ];
    if (t === "members" && r.filtri.some((f) => f[0] === "eq" && f[1] === "total_manual")) return offered;
    if (t === "members") return Array.from({ length: 8 }, (_, i) => ({ id: `m${i}` }));
    return [];
  };
  const text = (node) => node?.textContent.replace(/\s+/g, " ").trim() || "";
  const rows = (id) => [...el(id).querySelectorAll("tr")].map((tr) => [...tr.cells].map(text).join(" "));
  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const same = (got, want) => JSON.stringify([...got].sort()) === JSON.stringify([...want].sort());
  window.addEventListener("load", () => setTimeout(async () => {
    const r = [];
    const test = (nome, passed, why) => r.push(`${nome}=${passed ? "ok" : `NO(${why})`}`);
    try {
      await wait(600);
      const query = ASKED.find(([t, f]) => t === "members" && f.some((x) => x[0] === "eq" && x[1] === "total_manual"));
      test("letti", Boolean(query) && query[1].some((x) => x[0] === "eq" && x[1] === "total" && Number(x[2]) === 0)
        && query[1].some((x) => x[0] === "eq" && x[1] === "total_manual" && x[2] === true),
        JSON.stringify(query?.[1] || "nessuna lettura dei soci offerti"));

      test("tessereTutti", same(rows("tTess"), [`${NEVE} 2 € 40,00 € 80,00`, `${NEVE} (offerta) 1 € 0,00 € 0,00`,
        `${SPORT} (offerta) 1 € 0,00 € 0,00`, `${SOLO} (offerta) 1 € 0,00 € 0,00`, "Totale 5 — € 80,00"]), rows("tTess").join(" | "));
      test("presciTutti", same(rows("tPresc"), [`${PRESCI} 1 € 50,00 € 50,00`, `${PRESCI} (offerta) 1 € 0,00 € 0,00`,
        "Totale 2 — € 50,00"]), rows("tPresc").join(" | "));
      test("corsiTutti", same(rows("tCorsi"), ["CORSO SCI ADULTI 1 € 200,00 € 200,00", "CORSO SCI ADULTI (offerta) 1 € 0,00 € 0,00",
        "Totale 2 — € 200,00"]), rows("tCorsi").join(" | "));
      test("abbTutti", rows("tAbb").length === 3 && rows("tAbb").some((t) => /^5 VIAGGI SABATO \(offerta\).* 1 € 0,00 € 0,00$/.test(t))
        && rows("tAbb").some((t) => /^5 VIAGGI SABATO\b(?!.*offerta).* 1 € 100,00 € 100,00$/.test(t))
        && rows("tAbb").includes("Totale 2 — € 100,00"), rows("tAbb").join(" | "));
      test("cifreFerme", text(el("kTeor")) === "€ 500,00" && text(el("kInc")) === "€ 300,00", `${text(el("kTeor"))} ${text(el("kInc"))}`);

      const buttons = [...document.querySelectorAll('#tabGruppi [role="tab"]')];
      buttons.find((b) => text(b) === CLUB)?.click();
      await wait(100);
      test("tessereClub", same(rows("tTess"), [`${NEVE} 1 € 40,00 € 40,00`, `${SPORT} (offerta) 1 € 0,00 € 0,00`,
        `${SOLO} (offerta) 1 € 0,00 € 0,00`, "Totale 3 — € 40,00"]), rows("tTess").join(" | "));
      test("corsiClub", same(rows("tCorsi"), ["CORSO SCI ADULTI (offerta) 1 € 0,00 € 0,00", "Totale 1 — € 0,00"]), rows("tCorsi").join(" | "));

      buttons.find((b) => text(b) === "DON BOSCO")?.click();
      await wait(100);
      test("tessereDonBosco", same(rows("tTess"), [`${NEVE} 1 € 40,00 € 40,00`, `${NEVE} (offerta) 1 € 0,00 € 0,00`,
        "Totale 2 — € 40,00"]), rows("tTess").join(" | "));
      test("corsiDonBosco", same(rows("tCorsi"), ["CORSO SCI ADULTI 1 € 200,00 € 200,00", "Totale 1 — € 200,00"]), rows("tCorsi").join(" | "));
    } catch (e) { r.push(`eccezione=NO(${String(e?.message || e).slice(0, 120)})`); }
    document.title = "RISULTATO " + r.join(" ");
  }, 400));
}
