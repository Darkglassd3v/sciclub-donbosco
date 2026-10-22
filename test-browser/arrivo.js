// Pagina di arrivo e «Vedi come» (shared.js), provati su Soci (index.html).
// - Un ruolo con solo Pagamenti o solo Bilancio arriva alla sua pagina, non al
//   login «senza ruolo».
// - chiudiVediCome(): il superadmin che guarda come un altro ruolo torna sé
//   stesso (set_view_as null) prima di uscire; chi non è in «Vedi come» no.
// In un blocco: gli script della pagina e della prova hanno gli stessi nomi globali.
{
  const chiamate = [];
  FINTO.risposta = (t, r) => { if (t === "rpc:set_view_as") chiamate.push(r.parametri); return []; };
  window.addEventListener("load", () => setTimeout(async () => {
    const r = [];
    const prova = (nome, vero, perche) => r.push(`${nome}=${vero ? "ok" : `NO(${perche})`}`);
    prova("pagamenti", paginaDiArrivo({ permissions: ["pagamenti"] }) === "admin.html", `arriva a ${paginaDiArrivo({ permissions: ["pagamenti"] })}`);
    prova("bilancio", paginaDiArrivo({ permissions: ["bilancio", "storico"] }) === "bilancio.html", `arriva a ${paginaDiArrivo({ permissions: ["bilancio", "storico"] })}`);
    if (typeof chiudiVediCome !== "function") { document.title = "RISULTATO " + r.concat("vediCome=NO(manca chiudiVediCome)").join(" "); return; }
    await chiudiVediCome({ role: "tesoriere", real_role: "superadmin" });
    prova("vediComeChiuso", chiamate.length === 1 && chiamate[0]?.role === null, `chiamate ${JSON.stringify(chiamate)}`);
    await chiudiVediCome({ role: "superadmin", real_role: "superadmin" });
    await chiudiVediCome({ role: "tesoriere", real_role: "tesoriere" });
    prova("soloSeServe", chiamate.length === 1, `chiamate ${chiamate.length}`);
    document.title = "RISULTATO " + r.join(" ");
  }, 500));
}
