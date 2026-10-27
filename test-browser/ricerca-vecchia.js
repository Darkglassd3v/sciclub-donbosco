// Assicurazione (assicurazione.html), Cerca: svuotato il campo mentre una ricerca
// è ancora in viaggio, la sua risposta non deve ridisegnare i risultati.
// In un blocco: gli script della pagina e della prova hanno gli stessi nomi globali.
{
  FAKE.rpc.insurance_members = [];
  FAKE.rpc.insurance_sent_lists = [];
  FAKE.rpc.insurance_search = [{ id: "X1", last_name: "ROSSI", first_name: "MARIO", birth_date: "1980-01-01", tax_code: null, insurance: "BASE" }];
  FAKE.risposta = (t) => (t === "insurances" ? [{ code: "BASE", name: "REALE MUTUA NEVE" }] : []);
  FAKE.ritardo = (t) => (t === "rpc:insurance_search" ? 600 : 20);
  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  window.addEventListener("load", () => setTimeout(async () => {
    el("cerca").value = "rossi";
    search();
    await wait(100);
    el("cerca").value = "";
    await search();
    await wait(900);
    const rows = el("elencoCerca").children.length;
    document.title = `RISULTATO campoVuoto=${rows ? `NO(${rows} righe della ricerca vecchia)` : "ok"}`;
  }, 500));
}
