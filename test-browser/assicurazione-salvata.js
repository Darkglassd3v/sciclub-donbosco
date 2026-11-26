// Assicurazione (assicurazione.html), dalla 3.15.2: la casella «Assicura» si salva nel database
// (set_insurance_choice), così chi apre la pagina dopo trova le stesse scelte.
// - All'apertura la casella segue la scelta salvata (insurance_choice); senza scelta, la regola: accesa
//   tranne per chi non ha versato nulla.
// - Un clic salva la scelta di quel socio; «Tutti» salva quella di tutta la lista con una chiamata sola.
// - Se il salvataggio non riesce, la casella torna com'era e la pagina lo dice.
// In un blocco: gli script della pagina e della prova hanno gli stessi nomi globali.
{
  const member = (id, paid, choice) => ({ id, last_name: id, first_name: "PROVA", birth_date: "1980-01-01",
    tax_code: "RSSMRA80A01F205X", insurance: "BASE", debt: paid >= 35 ? 0 : 35 - paid, household_id: id,
    household_paid: paid, household_total: 35, insurance_choice: choice });
  FAKE.rpc.insurance_members = [
    member("A_SALDATO_SPENTO", 35, false),   // ha saldato, ma qualcuno l'ha spento
    member("B_NULLA_ACCESO", 0, true),       // non ha versato nulla, ma qualcuno l'ha acceso
    member("C_NULLA", 0, null),              // regola: spento
    member("D_SALDATO", 35, null),           // regola: acceso
  ];
  FAKE.rpc.insurance_sent_lists = [];
  FAKE.rpc.set_insurance_choice = 1;
  FAKE.risposta = (t) => (t === "insurances" ? [{ code: "BASE", name: "REALE MUTUA NEVE" }] : []);
  const saved = [];
  let failNext = false;
  FAKE.errore = (t, request) => {
    if (t !== "rpc:set_insurance_choice") return null;
    if (failNext) { failNext = false; return { message: "rete assente" }; }
    saved.push(`${request.parametri.member_ids.join("+")}=${request.parametri.choice}`);
    return null;
  };

  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const box = (id) => document.querySelector(`#elencoDa tr[data-id="${id}"] .assicura`);
  const states = () => ["A_SALDATO_SPENTO", "B_NULLA_ACCESO", "C_NULLA", "D_SALDATO"].map((id) => `${id[0]}${box(id)?.checked ? "+" : "-"}`).join("");

  window.addEventListener("load", () => setTimeout(async () => {
    const r = [];
    const test = (nome, passed, why) => r.push(`${nome}=${passed ? "ok" : `NO(${why})`}`);
    if (!box("D_SALDATO")) { document.title = "RISULTATO caricata=NO(nessuna casella)"; return; }

    test("sceltaSalvata", states() === "A-B+C-D+", `caselle ${states()}`);
    box("C_NULLA").click();
    await wait(200);
    test("salvaUno", saved.join(",") === "C_NULLA=true" && box("C_NULLA")?.checked, `salvate ${saved.join(",")}, caselle ${states()}`);

    saved.length = 0;
    document.querySelector("#testataLista .assicura-tutti").click();   // a metà: le accende tutte
    await wait(200);
    test("salvaTutti", saved.length === 1 && saved[0].endsWith("=true") && saved[0].split("=")[0].split("+").length === 4
      && states() === "A+B+C+D+", `salvate ${saved.join(",")}, caselle ${states()}`);

    saved.length = 0;
    failNext = true;
    box("D_SALDATO").click();
    await wait(200);
    const toast = document.getElementById("statusToast")?.textContent || document.body.textContent;
    test("erroreTorna", box("D_SALDATO")?.checked === true && /rete assente/.test(toast), `caselle ${states()}`);

    document.title = "RISULTATO " + r.join(" ");
  }, 500));
}
