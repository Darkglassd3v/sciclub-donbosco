// Utenti (utenti.html): dare il ruolo superadmin chiede conferma, come togliere
// un account: il superadmin può tutto, anche togliere gli altri. Gli altri
// ruoli si cambiano col solo «Conferma».
// In un blocco: gli script della pagina e della prova hanno gli stessi nomi globali.
{
  const written = [];
  FAKE.rpc.accounts_without_role = [];
  FAKE.risposta = (t, r) => {
    const writing = r.filtri.find((f) => f[0] === "update");
    if (t === "profiles" && writing) { written.push(writing[1]); return [{ user_id: "U1" }]; }
    if (t === "profiles") return [{ user_id: "U1", email: "uno@prova.it", role: "admin" }, { user_id: "U2", email: "due@prova.it", role: "admin" }];
    return [];
  };
  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const question = () => document.getElementById("finestraDomanda");
  const cambia = (id, roleKey) => {
    const row = document.querySelector(`tr[data-id="${id}"]`);
    const select = row.querySelector("[data-ruolo]");
    select.value = roleKey;
    select.dispatchEvent(new Event("change", { bubbles: true }));
    row.querySelector("[data-conferma]").click();
  };
  window.addEventListener("load", () => setTimeout(async () => {
    const r = [];
    const test = (nome, real, why) => r.push(`${nome}=${real ? "ok" : `NO(${why})`}`);
    if (!document.querySelector('tr[data-id="U1"]')) { document.title = "RISULTATO righe=NO(nessuna riga utente)"; return; }
    cambia("U1", "superadmin");
    await wait(200);
    test("chiede", Boolean(question()) && !written.length, `domanda ${Boolean(question())}, scritti ${written.length}`);
    question()?.querySelector("[data-si]")?.click();
    await wait(300);
    test("dopoIlSi", written.length === 1 && written[0].role === "superadmin", `scritti ${JSON.stringify(written)}`);
    cambia("U2", "tesoriere");
    await wait(300);
    test("altriSubito", written.length === 2 && !question(), `scritti ${written.length}, domanda ${Boolean(question())}`);
    document.title = "RISULTATO " + r.join(" ");
  }, 600));
}
