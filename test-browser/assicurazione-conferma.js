// Assicurazione (assicurazione.html): la conferma arriva da sola dopo lo scarico (12/11/2026).
// - La decorrenza proposta è domani: la copertura parte sempre dal giorno dopo l'invio.
// - «Scarica i file Excel» apre subito la stessa finestra di «Segna come assicurati»: non
//   bisogna ricordarsi di premere il secondo pulsante.
// - La finestra elenca, uno per punto, quanti soci di ciascun tipo verranno assicurati, con il
//   numero della lista, e la data di decorrenza.
// - Il «Sì» registra l'invio con le liste, i soci e la decorrenza dei file scaricati.
// - Annulla chiude la finestra senza registrare niente: «Segna come assicurati» resta acceso e
//   riapre la stessa finestra.
// In un blocco: gli script della pagina e della prova hanno gli stessi nomi globali.
{
  const member = (id, typeName) => ({ id, last_name: id, first_name: "PROVA", birth_date: "1980-01-01",
    tax_code: "RSSMRA80A01F205X", insurance: typeName, debt: 0 });
  FAKE.rpc.insurance_members = [member("B1", "BASE"), member("B2", "BASE"), member("S1", "SPORT")];
  FAKE.rpc.insurance_sent_lists = [{ kind: "SPORT", number: 4, starts_on: "2026-10-01", members: 3 }];
  FAKE.rpc.insurance_send_all = 3;
  FAKE.risposta = (t) => (t === "insurances" ? [{ code: "BASE", name: "REALE NEVE" }, { code: "SPORT", name: "REALE SPORT" }] : []);
  const sent = [];
  FAKE.errore = (t, request) => {
    if (t === "rpc:insurance_send_all") sent.push(request.parametri);
    return null;
  };

  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const clean = (node) => node?.textContent.replace(/\s+/g, " ").trim() || "";
  const dialog = () => document.querySelector("dialog#finestraDomanda[open]");
  const points = () => [...(dialog()?.querySelectorAll("ul li") || [])].map(clean);
  const tomorrow = () => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toLocaleDateString("sv-SE"); };
  const italian = (iso) => iso.split("-").reverse().join("/");

  window.addEventListener("load", () => setTimeout(async () => {
    const r = [];
    const test = (nome, passed, why) => r.push(`${nome}=${passed ? "ok" : `NO(${why})`}`);
    excelList = async () => {};

    test("decorrenzaDomani", el("decorrenza").value === tomorrow(), `decorrenza «${el("decorrenza").value}», attesa ${tomorrow()}`);

    el("btnScarica").click();
    await wait(300);
    test("finestraDopoScarico", !!dialog(), "nessuna finestra di conferma dopo lo scarico");
    const expected = ["REALE NEVE n. 1: 2 soci", "REALE SPORT n. 5: 1 socio", `Decorrenza: ${italian(tomorrow())}`];
    test("elencoPuntato", points().join(" | ") === expected.join(" | "), `punti «${points().join(" | ")}»`);
    test("domandaSenzaElenco", !/n\. 1 \(/.test(clean(dialog()?.querySelector(".domanda"))),
      `domanda «${clean(dialog()?.querySelector(".domanda"))}»`);

    dialog()?.querySelector("[data-no]")?.click();
    await wait(100);
    test("annulla", !dialog() && !sent.length && !el("btnSegna").disabled,
      `finestra ${!!dialog()}, invii ${sent.length}, segna spento ${el("btnSegna").disabled}`);

    el("btnSegna").click();
    await wait(100);
    test("stessaFinestra", points().join(" | ") === expected.join(" | "), `punti «${points().join(" | ")}»`);
    dialog()?.querySelector("[data-si]")?.click();
    await wait(300);
    const p = sent[0] || {};
    test("invio", sent.length === 1 && p.kinds?.join() === "BASE,SPORT" && p.list_numbers?.join() === "1,5"
      && p.member_ids?.join() === "B1,B2,S1" && p.starts_on === tomorrow(), JSON.stringify(p).slice(0, 160));

    document.title = "RISULTATO " + r.join(" ");
  }, 500));
}
