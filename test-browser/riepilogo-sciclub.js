// Riepilogo (riepilogo.html), sci club affiliati (dalla 3.12, richiesta del 23/11/2026): quanti soci arrivano da
// ogni club e chi sono, e in ogni tabella quante voci sono loro («di cui SCI CLUB MONCALVO: 2»), totale compreso.
// I conteggi vengono dalla vista club_counts (stesse regole di card_counts, course_counts, …), i nomi dai soci
// tesserati con il club.
{
  const CLUB = "SCI CLUB MONCALVO";
  FAKE.risposta = (t, r) => {
    if (t === "season_totals") return [{ total_members: 10, total_due: 0, total_collected: 0, outstanding: 0 }];
    if (t === "card_counts") return [{ name: "ORDINARIA", count: 6, price: 30, total: 180 }, { name: "JUNIOR", count: 4, price: 20, total: 80 }];
    if (t === "course_counts") return [{ name: "CORSO SCI ADULTI", count: 2 }];
    if (t === "club_counts") return [
      { club: CLUB, section: "SOCI", name: "", count: 3 },
      { club: CLUB, section: "TESSERE", name: "ORDINARIA", count: 2 },
      { club: CLUB, section: "TESSERE", name: "JUNIOR", count: 1 },
      { club: CLUB, section: "CORSI", name: "CORSO SCI ADULTI", count: 1 },
    ];
    if (t === "members" && r.filtri.some((f) => f[0] === "not" && f[1] === "club_id")) return [
      { id: "a", last_name: "VERDI", first_name: "LUCA", card_number: "40", club: { name: CLUB } },
      { id: "b", last_name: "BIANCHI", first_name: "ANNA", card_number: "12", club: { name: CLUB } },
      { id: "c", last_name: "NERI", first_name: "PIA", card_number: null, club: { name: CLUB } },
    ];
    if (t === "members") return Array.from({ length: 10 }, (_, i) => ({ id: `m${i}` }));
    return [];
  };
  const text = (node) => node?.textContent.replace(/\s+/g, " ").trim() || "";
  window.addEventListener("load", () => setTimeout(async () => {
    const r = [];
    const test = (nome, passed, why) => r.push(`${nome}=${passed ? "ok" : `NO(${why})`}`);
    try {
      await new Promise((ok) => setTimeout(ok, 600));
      const zone = el("zonaClub");
      test("riquadro", zone && !zone.hidden && /Sci club affiliati/.test(text(zone.querySelector("h2"))), zone ? text(zone).slice(0, 80) : "manca #zonaClub");
      test("conteggio", text(zone).includes(`${CLUB}: 3 tesserati`), text(zone).slice(0, 160));
      const names = [...(zone?.querySelectorAll("li") || [])].map(text);
      test("nomi", names.join("|") === "BIANCHI ANNA (tessera 12)|VERDI LUCA (tessera 40)|NERI PIA", names.join("|"));
      const row = (id, label) => [...el(id).querySelectorAll("tr")].find((tr) => text(tr.cells[0]).startsWith(label));
      test("diCuiTessera", text(row("tTess", "ORDINARIA")).includes(`di cui ${CLUB}: 2`), text(row("tTess", "ORDINARIA")));
      test("diCuiTotale", text(row("tTess", "Totale")).includes(`di cui ${CLUB}: 3`), text(row("tTess", "Totale")));
      test("diCuiCorso", text(row("tCorsi", "CORSO SCI ADULTI")).includes(`di cui ${CLUB}: 1`), text(row("tCorsi", "CORSO SCI ADULTI")));
      test("abbonamentiSenza", !text(el("tAbb")).includes("di cui"), text(el("tAbb")));
    } catch (e) { r.push(`eccezione=NO(${String(e?.message || e).slice(0, 120)})`); }
    document.title = "RISULTATO " + r.join(" ");
  }, 400));
}
