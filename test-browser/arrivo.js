// Pagina di arrivo e «Vedi come» (shared.js), provati su Soci (index.html).
// - Un ruolo con solo Pagamenti o solo Bilancio arriva alla sua pagina, non al
//   login «senza ruolo».
// - chiudiVediCome(): il superadmin che guarda come un altro ruolo torna sé
//   stesso (set_view_as null) prima di uscire; chi non è in «Vedi come» no.
// In un blocco: gli script della pagina e della prova hanno gli stessi nomi globali.
{
  const calls = [];
  FAKE.risposta = (t, r) => { if (t === "rpc:set_view_as") calls.push(r.parametri); return []; };
  window.addEventListener("load", () => setTimeout(async () => {
    const r = [];
    const test = (nome, real, why) => r.push(`${nome}=${real ? "ok" : `NO(${why})`}`);
    test("pagamenti", landingPage({ permissions: ["pagamenti"] }) === "admin.html", `arriva a ${landingPage({ permissions: ["pagamenti"] })}`);
    test("bilancio", landingPage({ permissions: ["bilancio", "storico"] }) === "bilancio.html", `arriva a ${landingPage({ permissions: ["bilancio", "storico"] })}`);
    if (typeof closeViewAs !== "function") { document.title = "RISULTATO " + r.concat("vediCome=NO(manca chiudiVediCome)").join(" "); return; }
    await closeViewAs({ role: "tesoriere", real_role: "superadmin" });
    test("vediComeChiuso", calls.length === 1 && calls[0]?.role === null, `chiamate ${JSON.stringify(calls)}`);
    await closeViewAs({ role: "superadmin", real_role: "superadmin" });
    await closeViewAs({ role: "tesoriere", real_role: "tesoriere" });
    test("soloSeServe", calls.length === 1, `chiamate ${calls.length}`);
    document.title = "RISULTATO " + r.join(" ");
  }, 500));
}
