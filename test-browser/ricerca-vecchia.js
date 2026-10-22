// Assicurazione (assicurazione.html), Cerca: svuotato il campo mentre una ricerca
// è ancora in viaggio, la sua risposta non deve ridisegnare i risultati.
// In un blocco: gli script della pagina e della prova hanno gli stessi nomi globali.
{
  FINTO.rpc.insurance_members = [];
  FINTO.rpc.insurance_sent_lists = [];
  FINTO.rpc.insurance_search = [{ id: "X1", last_name: "ROSSI", first_name: "MARIO", birth_date: "1980-01-01", tax_code: null, insurance: "BASE" }];
  FINTO.risposta = (t) => (t === "insurances" ? [{ code: "BASE", name: "REALE MUTUA NEVE" }] : []);
  FINTO.ritardo = (t) => (t === "rpc:insurance_search" ? 600 : 20);
  const aspetta = (ms) => new Promise((ok) => setTimeout(ok, ms));
  window.addEventListener("load", () => setTimeout(async () => {
    el("cerca").value = "rossi";
    cerca();
    await aspetta(100);
    el("cerca").value = "";
    await cerca();
    await aspetta(900);
    const righe = el("elencoCerca").children.length;
    document.title = `RISULTATO campoVuoto=${righe ? `NO(${righe} righe della ricerca vecchia)` : "ok"}`;
  }, 500));
}
