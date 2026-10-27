// Soci (index.html): una scheda che non si carica tutta (qui gli abbonamenti in
// errore) non deve lasciare il modulo a metà, con l'id del socio nuovo e gli
// abbonamenti del socio di prima: Salva o «Togli» toccherebbero l'altro.
// In un blocco: gli script della pagina e della prova hanno gli stessi nomi globali.
{
  const PRICE_LIST = [{ category: "TESSERA", name: "TESSERA ORDINARIA - REALE MUTUA NEVE", price: 40, min_role: "utente" }];
  const member = (id) => ({ id, last_name: "SOCIO", first_name: id, updated_at: "1", enrolled_at: "2026-10-14", paid: 0, total: 40,
    total_manual: false, card_type: "TESSERA ORDINARIA - REALE MUTUA NEVE" });
  const eq = (r, field) => r.filtri.find((f) => f[0] === "eq" && f[1] === field)?.[2];
  FAKE.risposta = (t, r) => {
    if (t === "prices") return PRICE_LIST;
    if (t === "members" && eq(r, "id")) return [member(eq(r, "id"))];
    if (t === "pass_status" && eq(r, "member_id") === "M1") return [{ pass_id: "A1", member_id: "M1", pass_type: "10 VIAGGI", price: 100, trips_used: 0, trips_total: 10 }];
    return [];
  };
  FAKE.errore = (t, r) => (t === "pass_status" && eq(r, "member_id") === "M2" ? { message: "prova: abbonamenti illeggibili" } : null);
  window.addEventListener("load", () => setTimeout(async () => {
    await loadMember("M1");
    const first = savedPasses.length;
    await loadMember("M2");
    const aMeta = el("f_id").value === "M2" || savedPasses.some((a) => a.member_id === "M1");
    document.title = `RISULTATO ` + [
      `primoCaricato=${first === 1 ? "ok" : `NO(${first} abbonamenti di M1)`}`,
      `nienteAMeta=${aMeta ? `NO(id «${el("f_id").value}», abbonamenti di M1 ${savedPasses.length})` : "ok"}`,
    ].join(" ");
  }, 500));
}
