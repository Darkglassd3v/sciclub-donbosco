// Soci (index.html): socio nuovo inserito, ma l'abbonamento non si salva (errore).
// Ripremuto Salva, il socio si aggiorna col blocco su updated_at come ogni
// altra modifica: senza, cancellerebbe quello che un altro ha scritto intanto.
// In un blocco: gli script della pagina e della prova hanno gli stessi nomi globali.
{
  const PRICE_LIST = [
    { category: "TESSERA", name: "TESSERA ORDINARIA - REALE MUTUA NEVE", price: 40, min_role: "utente" },
    { category: "ABBONAMENTO", name: "10 VIAGGI SABATO", price: 100, trips: 10, day: "SABATO", min_role: "utente" },
  ];
  const updates = [];
  let passesDown = true;
  FAKE.risposta = (t, r) => {
    if (t === "prices") return PRICE_LIST;
    if (t === "members" && r.filtri.some((f) => f[0] === "insert")) return { id: "NUOVO", updated_at: "2" };
    if (t === "members" && r.filtri.some((f) => f[0] === "update")) { updates.push(r.filtri); return [{ updated_at: "3" }]; }
    return [];
  };
  FAKE.errore = (t) => (t === "member_passes" && passesDown ? { message: "prova: abbonamenti giù" } : null);
  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const si = async () => { await wait(300); document.querySelector("#finestraDomanda [data-si]")?.click(); await wait(500); };
  window.addEventListener("load", () => setTimeout(async () => {
    el("f_cognome").value = "Prova"; el("f_nome").value = "Ripetuto"; el("f_telefono").value = "333";
    [...el("f_tipologia_tessera").querySelectorAll("input")][0].click();
    [...el("listinoAbbonamenti").querySelectorAll("button")].find((b) => b.textContent.includes("Aggiungi"))?.click();
    await save(); await si();
    passesDown = false;
    await save(); await si();
    const block = updates[0]?.some((f) => f[0] === "eq" && f[1] === "updated_at" && f[2] === "2");
    document.title = `RISULTATO conBlocco=${block ? "ok" : `NO(aggiornamenti ${JSON.stringify(updates.map((a) => a.filter((f) => f[0] === "eq")))})`}`;
  }, 500));
}
