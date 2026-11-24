// Riepilogo (riepilogo.html), tabelle per sci club (dalla 3.12.3, richiesta del 24/11/2026: «io voglio le stesse
// tabelle di prima selezionabili per sci club tramite pulsanti grandi in alto, messi sotto il riepilogo stagione»).
// - Le cifre della stagione in alto restano di tutti i soci; subito sotto, pulsanti grandi TUTTI, DON BOSCO (soci
//   senza club) e uno per ogni sci club affiliato; all'apertura TUTTI, cioè il Riepilogo di sempre.
// - Scelto un gruppo, le stesse tabelle Tessere, Presciistica, Abbonamenti gite e Corsi mostrano solo i suoi soci
//   (club_counts), con sopra soci, totale teorico, incassato e da incassare del gruppo (club_totals).
// - Niente Entrate extra né Uscite (stesso giorno: «quello lo vedi dal Bilancio»): il Riepilogo è delle quote dei
//   soci, e i movimenti non si leggono più.
// - Tolti il riquadro «Incassi per sci club» in fondo (3.12.2) e «Elenchi e stagioni chiuse»: le stagioni chiuse si
//   aprono dalla pagina Stagione, l'Elenco soci dal menu.
{
  const CLUB = "SCI CLUB MONCALVO";
  const ASKED = [];
  FAKE.risposta = (t) => {
    ASKED.push(t);
    if (t === "season_totals") return [{ total_members: 10, total_due: 500, total_collected: 300, outstanding: 200 }];
    if (t === "card_counts") return [{ name: "ORDINARIA", count: 6, price: 30, total: 180 }, { name: "JUNIOR", count: 3, price: 20, total: 60 }];
    if (t === "course_counts") return [{ name: "CORSO SCI ADULTI", count: 2 }];
    if (t === "pass_counts") return [{ name: "5 VIAGGI SABATO", count: 2 }];
    if (t === "prices") return [{ category: "CORSO", name: "CORSO SCI ADULTI", price: 200, day: null },
      { category: "ABBONAMENTO", name: "5 VIAGGI SABATO", price: 100, day: "SABATO" }];
    if (t === "affiliated_clubs") return [{ name: CLUB }];
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
  const rowText = (tr) => (tr ? [...tr.cells].map(text).join(" ") : "");
  const row = (id, label) => [...el(id).querySelectorAll("tr")].find((tr) => text(tr.cells[0]).startsWith(label));
  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  window.addEventListener("load", () => setTimeout(async () => {
    const r = [];
    const test = (nome, passed, why) => r.push(`${nome}=${passed ? "ok" : `NO(${why})`}`);
    try {
      await wait(600);
      const bar = document.querySelector('[role="tablist"]');
      const buttons = [...(bar?.querySelectorAll('[role="tab"]') || [])];
      test("pulsanti", buttons.map(text).join("|") === `TUTTI|DON BOSCO|${CLUB}`
        && buttons[0].getAttribute("aria-selected") === "true", buttons.map((b) => `${text(b)}:${b.getAttribute("aria-selected")}`).join("|"));
      test("sottoLeCifre", Boolean(bar) && document.querySelector(".cifre")?.nextElementSibling?.contains(bar), bar?.parentElement?.className);
      test("grandi", buttons.length > 0 && buttons.every((b) => b.getBoundingClientRect().height >= 44),
        buttons.map((b) => Math.round(b.getBoundingClientRect().height)).join(","));
      test("tolti", !el("zonaGruppi") && !el("zonaComandi"), `${Boolean(el("zonaGruppi"))} ${Boolean(el("zonaComandi"))}`);
      test("tutti", rowText(row("tTess", "Totale")) === "Totale 9 — € 240,00" && el("cifreGruppo")?.hidden === true, rowText(row("tTess", "Totale")));

      buttons[1]?.click();
      await wait(100);
      const cifre = [...(el("cifreGruppo")?.querySelectorAll(".kpi-value") || [])].map(text).join("|");
      test("donBosco", rowText(row("tTess", "ORDINARIA")) === "ORDINARIA 5 € 30,00 € 150,00" && rowText(row("tTess", "Totale")) === "Totale 8 — € 210,00"
        && el("cifreGruppo")?.hidden === false && cifre === "9|€ 430,00|€ 230,00|€ 200,00", `${rowText(row("tTess", "Totale"))} / ${cifre}`);
      test("senzaEntrateUscite", !el("tEntrate") && !el("tUscite") && !ASKED.includes("ledger_entries"),
        `${Boolean(el("tEntrate"))} ${Boolean(el("tUscite"))} ${ASKED.includes("ledger_entries")}`);

      buttons[2]?.click();
      await wait(100);
      test("club", rowText(row("tTess", "ORDINARIA")) === "ORDINARIA 1 € 30,00 € 30,00" && rowText(row("tTess", "Totale")) === "Totale 1 — € 30,00"
        && rowText(row("tCorsi", "CORSO SCI ADULTI")) === "CORSO SCI ADULTI 1 € 200,00 € 200,00" && text(el("tAbb")) === "—"
        && buttons[2]?.getAttribute("aria-selected") === "true", `${rowText(row("tTess", "Totale"))} / ${text(el("tAbb"))}`);

      buttons[0]?.click();
      await wait(100);
      test("tornaTutti", rowText(row("tTess", "Totale")) === "Totale 9 — € 240,00" && el("cifreGruppo")?.hidden === true, rowText(row("tTess", "Totale")));
    } catch (e) { r.push(`eccezione=NO(${String(e?.message || e).slice(0, 120)})`); }
    document.title = "RISULTATO " + r.join(" ");
  }, 400));
}
