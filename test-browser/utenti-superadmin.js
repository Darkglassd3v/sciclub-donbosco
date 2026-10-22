// Utenti (utenti.html): dare il ruolo superadmin chiede conferma, come togliere
// un account: il superadmin può tutto, anche togliere gli altri. Gli altri
// ruoli si cambiano col solo «Conferma».
// In un blocco: gli script della pagina e della prova hanno gli stessi nomi globali.
{
  const scritti = [];
  FINTO.rpc.accounts_without_role = [];
  FINTO.risposta = (t, r) => {
    const scrittura = r.filtri.find((f) => f[0] === "update");
    if (t === "profiles" && scrittura) { scritti.push(scrittura[1]); return [{ user_id: "U1" }]; }
    if (t === "profiles") return [{ user_id: "U1", email: "uno@prova.it", role: "admin" }, { user_id: "U2", email: "due@prova.it", role: "admin" }];
    return [];
  };
  const aspetta = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const domanda = () => document.getElementById("finestraDomanda");
  const cambia = (id, ruolo) => {
    const riga = document.querySelector(`tr[data-id="${id}"]`);
    const select = riga.querySelector("[data-ruolo]");
    select.value = ruolo;
    select.dispatchEvent(new Event("change", { bubbles: true }));
    riga.querySelector("[data-conferma]").click();
  };
  window.addEventListener("load", () => setTimeout(async () => {
    const r = [];
    const prova = (nome, vero, perche) => r.push(`${nome}=${vero ? "ok" : `NO(${perche})`}`);
    if (!document.querySelector('tr[data-id="U1"]')) { document.title = "RISULTATO righe=NO(nessuna riga utente)"; return; }
    cambia("U1", "superadmin");
    await aspetta(200);
    prova("chiede", Boolean(domanda()) && !scritti.length, `domanda ${Boolean(domanda())}, scritti ${scritti.length}`);
    domanda()?.querySelector("[data-si]")?.click();
    await aspetta(300);
    prova("dopoIlSi", scritti.length === 1 && scritti[0].role === "superadmin", `scritti ${JSON.stringify(scritti)}`);
    cambia("U2", "tesoriere");
    await aspetta(300);
    prova("altriSubito", scritti.length === 2 && !domanda(), `scritti ${scritti.length}, domanda ${Boolean(domanda())}`);
    document.title = "RISULTATO " + r.join(" ");
  }, 600));
}
