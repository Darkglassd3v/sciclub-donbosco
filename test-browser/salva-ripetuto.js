// Soci (index.html): socio nuovo inserito, ma l'abbonamento non si salva (errore).
// Ripremuto Salva, il socio si aggiorna col blocco su updated_at come ogni
// altra modifica: senza, cancellerebbe quello che un altro ha scritto intanto.
// In un blocco: gli script della pagina e della prova hanno gli stessi nomi globali.
{
  const LISTINO = [
    { category: "TESSERA", name: "TESSERA ORDINARIA - REALE MUTUA NEVE", price: 40, min_role: "utente" },
    { category: "ABBONAMENTO", name: "10 VIAGGI SABATO", price: 100, trips: 10, day: "SABATO", min_role: "utente" },
  ];
  const aggiornamenti = [];
  let abbonamentiGiu = true;
  FINTO.risposta = (t, r) => {
    if (t === "prices") return LISTINO;
    if (t === "members" && r.filtri.some((f) => f[0] === "insert")) return { id: "NUOVO", updated_at: "2" };
    if (t === "members" && r.filtri.some((f) => f[0] === "update")) { aggiornamenti.push(r.filtri); return [{ updated_at: "3" }]; }
    return [];
  };
  FINTO.errore = (t) => (t === "member_passes" && abbonamentiGiu ? { message: "prova: abbonamenti giù" } : null);
  const aspetta = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const si = async () => { await aspetta(300); document.querySelector("#finestraDomanda [data-si]")?.click(); await aspetta(500); };
  window.addEventListener("load", () => setTimeout(async () => {
    el("f_cognome").value = "Prova"; el("f_nome").value = "Ripetuto"; el("f_telefono").value = "333";
    [...el("f_tipologia_tessera").querySelectorAll("input")][0].click();
    [...el("listinoAbbonamenti").querySelectorAll("button")].find((b) => b.textContent.includes("Aggiungi"))?.click();
    await salva(); await si();
    abbonamentiGiu = false;
    await salva(); await si();
    const blocco = aggiornamenti[0]?.some((f) => f[0] === "eq" && f[1] === "updated_at" && f[2] === "2");
    document.title = `RISULTATO conBlocco=${blocco ? "ok" : `NO(aggiornamenti ${JSON.stringify(aggiornamenti.map((a) => a.filter((f) => f[0] === "eq")))})`}`;
  }, 500));
}
