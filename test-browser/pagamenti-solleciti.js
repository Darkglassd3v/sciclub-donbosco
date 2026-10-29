// Pagamenti (admin.html): sotto ogni nucleo che deve ancora pagare, «Sollecito WhatsApp» apre WhatsApp
// col messaggio già scritto per il cellulare di chi paga (richiesta del 29/10). Il messaggio dice per chi
// (tutti i nomi del nucleo, scritti normali e non in maiuscolo) e quanto resta da versare.
// - Cellulare senza prefisso (3…): wa.me/39…; con +41 o 0041: quel prefisso.
// - Fisso, numero illeggibile o telefono vuoto: niente pulsante, la scritta lo dice.
// - Nucleo saldato o a credito: niente sollecito.
// In un blocco: gli script della pagina e della prova hanno gli stessi nomi globali.
{
  const household = (id, surname, balance) => ({ head_id: id, last_name: surname, first_name: "ANNA", enrolled_at: "2026-10-01",
    household_balance: balance, household_total: 200, household_paid: 0, dependents_count: 0 });
  const member = (id, surname, first, phone, payer = null) => ({ id, last_name: surname, first_name: first, phone, payer_id: payer, total: 0, paid: 0 });
  FAKE.risposta = (t, r) => {
    if (t === "households") return [household("A", "D'ALESSANDRO", 120), household("B", "BETA", 50), household("C", "GAMMA", 30),
      household("D", "DELTA", 0), household("E", "EPSILON", -20), household("F", "ZETA", 10)];
    if (t === "members" && r.filtri.some((f) => f[0] === "in" && f[1] === "payer_id")) return [member("A1", "D'ALESSANDRO", "LUCA MARIA", null, "A")];
    if (t === "members") return [member("A", "D'ALESSANDRO", "ANNA", "333 1234567"), member("B", "BETA", "ANNA", "0041791234567"),
      member("C", "GAMMA", "ANNA", "0141 123456"), member("D", "DELTA", "ANNA", "3331111111"), member("E", "EPSILON", "ANNA", "3332222222"),
      member("F", "ZETA", "ANNA", "")];
    return [];
  };
  window.addEventListener("load", () => setTimeout(() => { try {
    const r = [];
    const test = (nome, passed, why) => r.push(`${nome}=${passed ? "ok" : `NO(${why})`}`);
    const card = (surname) => [...document.querySelectorAll(".unit-card")].find((c) => c.querySelector(".unit-title")?.textContent.startsWith(surname));
    const link = (surname) => card(surname)?.querySelector("a[href^='https://wa.me/']");
    const a = link("D'ALESSANDRO");
    const [number, query = ""] = (a?.getAttribute("href") || "").replace("https://wa.me/", "").split("?text=");
    const text = decodeURIComponent(query);
    test("cellulare", number === "393331234567", a ? number : "nessun pulsante");
    test("messaggio", /Sci Club Don Bosco/.test(text) && text.includes("Anna D'Alessandro") && text.includes("Luca Maria D'Alessandro")
      && text.includes("€ 120,00"), text.slice(0, 120) || "vuoto");
    test("nuovaScheda", a?.target === "_blank" && /noopener/.test(a?.rel || ""), `${a?.target} ${a?.rel}`);
    test("prefissoEstero", link("BETA")?.getAttribute("href").startsWith("https://wa.me/41791234567?"), link("BETA")?.getAttribute("href") || "nessun pulsante");
    test("fisso", !link("GAMMA") && /cellulare/i.test(card("GAMMA")?.querySelector(".barra-saldo")?.textContent || ""),
      link("GAMMA") ? "pulsante anche col fisso" : "scritta mancante");
    test("senzaTelefono", !link("ZETA") && /cellulare/i.test(card("ZETA")?.querySelector(".barra-saldo")?.textContent || ""), "pulsante o scritta");
    test("saldatoCredito", !link("DELTA") && !link("EPSILON"), "sollecito a chi non deve niente");
    document.title = "RISULTATO " + r.join(" ");
  } catch (e) { document.title = `RISULTATO eccezione=NO(${String(e?.message || e).slice(0, 120)})`; } }, 800));
}
