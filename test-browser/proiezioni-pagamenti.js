// Pagamenti (admin.html), colonne lette (dalla 3.12.1, analisi del database del 24/11/2026): familiari e capofamiglia
// si leggevano con select *, tutte le colonne di ogni socio. Ora solo quelle che la pagina usa (nomi, tessera,
// importi, voci della stagione, recapiti per i solleciti), e la pagina mostra lo stesso il nucleo.
// In un blocco: gli script della pagina e della prova hanno gli stessi nomi globali.
{
  const REQ = [];
  const household = { head_id: "A", last_name: "ALFA", first_name: "CAPO", enrolled_at: "2026-10-01",
    household_balance: 60, household_total: 100, household_paid: 40, dependents_count: 1 };
  const member = (id, firstName, payer, card) => ({ id, last_name: "ALFA", first_name: firstName, payer_id: payer,
    card_number: card, total: 50, paid: 20, balance: 30, enrolled_at: "2026-10-01" });
  FAKE.risposta = (t, r) => {
    REQ.push([t, r.colonne, r.filtri]);
    if (t === "households") return [household];
    if (t === "members" && r.filtri.some((f) => f[0] === "in" && f[1] === "payer_id")) return [member("A1", "FIGLIO", "A", null)];
    if (t === "members") return [member("A", "CAPO", null, "33")];
    return [];
  };
  const WANTED = "id,enrolled_at,last_name,first_name,phone,email,card_type,family_discount,pass_type,course_type,"
    + "preski_type,total,total_manual,paid,balance,card_number,payer_id";
  window.addEventListener("load", () => setTimeout(() => {
    const asked = REQ.filter(([t]) => t === "members").map(([, c]) => c);
    const shown = document.querySelector('tr[data-socio="A1"]')?.textContent.replace(/\s+/g, " ") || "";
    document.title = "RISULTATO " + [
      `colonne=${asked.length === 2 && asked.every((c) => c === WANTED) ? "ok" : `NO(${asked.join(" / ")})`}`,
      `nucleo=${/FIGLIO/.test(shown) ? "ok" : `NO(«${shown.slice(0, 80)}»)`}`,
    ].join(" ");
  }, 1200));
}
