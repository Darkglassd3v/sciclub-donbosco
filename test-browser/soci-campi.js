// Soci (index.html): campi che lasciavano salvare valori sbagliati.
// - Totale a mano spuntato e campo vuoto: non si salva 0, il campo è bordato.
// - Acconto negativo: non si salva, il campo è bordato.
// - Tolto il pagante (capofamiglia con l'agevolazione), la tessera torna obbligatoria.
// In un blocco: gli script della pagina e della prova hanno gli stessi nomi globali.
{
  const PRICE_LIST = [
    { category: "TESSERA", name: "TESSERA ORDINARIA - REALE MUTUA NEVE", price: 40, insurance: "BASE", min_role: "utente" },
    { category: "FAMIGLIA", name: "3 PERSONE CON ASSICURAZIONE", price: 110, insurance: "BASE", people: 3, min_role: "utente" },
  ];
  const HEAD = { id: "CAPO", last_name: "ROSSI", first_name: "MARIO", family_discount: "3 PERSONE CON ASSICURAZIONE", card_type: null };
  FAKE.risposta = (t, r) => {
    if (t === "prices") return PRICE_LIST;
    const eq = (field) => r.filtri.find((f) => f[0] === "eq" && f[1] === field)?.[2];
    if (t === "members" && eq("id") === "CAPO") return [HEAD];
    return [];
  };
  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const red = (id) => el(id).classList.contains("campo-errore");
  const question = () => document.getElementById("finestraDomanda");
  const requiredCard = () => [...el("f_tipologia_tessera").querySelectorAll("input")].some((x) => x.required);

  window.addEventListener("load", () => setTimeout(async () => {
    const r = [];
    const test = (nome, passed, why) => r.push(`${nome}=${passed ? "ok" : `NO(${why})`}`);
    el("f_cognome").value = "Prova"; el("f_nome").value = "Uno"; el("f_telefono").value = "333";
    [...el("f_tipologia_tessera").querySelectorAll("input")][0].click();

    el("f_totale_a_mano").click();
    el("f_totale_manuale").value = "";
    await save();
    await wait(300);
    test("totaleVuoto", red("f_totale_manuale") && !question(), `bordato ${red("f_totale_manuale")}, domanda ${Boolean(question())}`);
    el("f_totale_a_mano").click();

    el("f_acconto").value = "-10";
    await save();
    await wait(300);
    test("accontoNegativo", red("f_acconto") && !question(), `bordato ${red("f_acconto")}, domanda ${Boolean(question())}`);
    el("f_acconto").value = "0";

    resetForm();
    await choosePayer("CAPO", "ROSSI MARIO");
    await wait(300);
    const covered = !requiredCard();
    removePayer();
    test("toltoPagante", covered && requiredCard(), `coperto ${covered}, poi obbligatoria ${requiredCard()}`);

    document.title = "RISULTATO " + r.join(" ");
  }, 500));
}
