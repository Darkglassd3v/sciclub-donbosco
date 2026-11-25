// Soci (index.html), «Senza assicurazione» nel nucleo (dalla 3.13, 25/11/2026: un capofamiglia con «4 PERSONE CON
// ASSICURAZIONE» che non va assicurato):
// - La casella si vede solo per chi è coperto da un'agevolazione famiglia con l'assicurazione, sua o del capofamiglia;
//   con una tessera o con l'agevolazione senza assicurazione no, e allora si salva sempre false.
// - Sul capofamiglia spuntata toglie dal totale il prezzo dell'assicurazione dell'agevolazione (Base, 20 €).
// - Su un familiare a carico il totale lo paga il capofamiglia: la nota dice di quanto abbassare il suo totale.
// - La finestra di conferma lo dice sotto il tipo di tessera; il salvataggio scrive no_insurance.
// In un blocco: gli script della pagina e della prova hanno gli stessi nomi globali.
{
  const CON = "4 PERSONE CON ASSICURAZIONE", SENZA = "4 PERSONE SENZA ASSICURAZIONE";
  const PRICE_LIST = [
    { category: "TESSERA", name: "TESSERA ORDINARIA - REALE MUTUA NEVE", price: 40, min_role: "utente", insurance: "BASE" },
    { category: "FAMIGLIA", name: CON, price: 145, min_role: "utente", insurance: "BASE", people: 4 },
    { category: "FAMIGLIA", name: SENZA, price: 65, min_role: "utente", insurance: null, people: 4 },
  ];
  const INSURANCES = [{ code: "BASE", name: "REALE NEVE", price: 20 }];
  const WRITES = [];
  FAKE.risposta = (t, r) => {
    const insert = r.filtri.find((f) => f[0] === "insert");
    if (t === "members" && insert) { WRITES.push(insert[1]); return [{ id: "nuovo", ...insert[1] }]; }
    return t === "prices" ? PRICE_LIST : t === "insurances" ? INSURANCES : [];
  };
  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const pick = (id, name) => [...el(id).querySelectorAll("input")].find((x) => x.dataset.nome === name)?.click();
  const box = () => el("f_senza_assicurazione");
  const visible = () => Boolean(box()) && !box().closest("[hidden]") && box().offsetParent !== null;
  const rows = () => [...document.querySelectorAll("#finestraDomanda tr")]
    .map((tr) => [tr.querySelector("th")?.textContent.trim(), tr.querySelector("td")?.textContent.trim()]);

  window.addEventListener("load", () => setTimeout(async () => {
    const r = [];
    const test = (nome, passed, why) => r.push(`${nome}=${passed ? "ok" : `NO(${why})`}`);
    try {
      await wait(300);
      test("nascostaSenzaAgevolazione", !visible(), "casella visibile senza agevolazione");
      pick("f_tipologia_tessera", "TESSERA ORDINARIA - REALE MUTUA NEVE"); await wait(100);
      test("nascostaConTessera", !visible(), "casella visibile con la tessera");
      pick("f_agevolazioni_famiglia", SENZA); await wait(100);
      test("nascostaSenzaAssicurazione", !visible(), "casella visibile con l'agevolazione senza assicurazione");

      pick("f_agevolazioni_famiglia", CON); await wait(100);
      test("visibileConAssicurazione", visible() && !box().checked && individualTotal() === 145,
        `visibile ${visible()}, spuntata ${box()?.checked}, totale ${individualTotal()}`);
      box().click(); await wait(100);
      test("menoAssicurazione", individualTotal() === 125, `totale ${individualTotal()}`);

      el("f_cognome").value = "Ramello"; el("f_nome").value = "Prova"; el("f_numero_tessera").value = "119";
      await save(); await wait(300);
      const shown = rows();
      test("conferma", shown[1]?.[0] === "Tipo di tessera" && shown[2]?.[0] === "Assicurazione"
        && shown[2]?.[1] === "Nessuna (senza assicurazione)", JSON.stringify(shown.slice(0, 4)));
      document.querySelector("#finestraDomanda [data-si]")?.click();
      await wait(800);
      test("salvato", WRITES.length === 1 && WRITES[0].no_insurance === true && Number(WRITES[0].total) === 125,
        JSON.stringify(WRITES.map((w) => [w.no_insurance, w.total])));

      // Familiare a carico di un capofamiglia con l'agevolazione: la nota dice quanto togliere al suo totale.
      selectByName("f_agevolazioni_famiglia", null);
      el("pagaFamiliare").checked = true;
      householdHead = { nome: "ROSSI MARIO", agevolazione: CON, coperti: 1 };
      recompute(); await wait(100);
      if (!box().checked) box().click();
      recompute(); await wait(100);
      const note = el("notaSenzaAssicurazione")?.textContent.replace(/\s+/g, " ") || "";
      test("familiare", visible() && /ROSSI MARIO/.test(note) && /€ 20,00/.test(note), `visibile ${visible()}, nota «${note}»`);
    } catch (e) { r.push(`eccezione=NO(${String(e?.message || e).slice(0, 120)})`); }
    document.title = "RISULTATO " + r.join(" ");
  }, 500));
}
