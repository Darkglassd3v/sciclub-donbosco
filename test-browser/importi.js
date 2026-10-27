// Soci (index.html): l'acconto è in euro interi o con i 50 centesimi.
// - 12,30 non si salva: il campo ha il bordo rosso e la pagina ci porta.
// - 12,50 va bene: si arriva alla domanda «Salvare questo socio nuovo?».
// In un blocco: gli script della pagina e della prova hanno gli stessi nomi globali.
{
  const PRICE_LIST = [{ category: "TESSERA", name: "TESSERA ORDINARIA - REALE MUTUA NEVE", price: 40, min_role: "utente" }];
  FAKE.risposta = (t) => (t === "prices" ? PRICE_LIST : []);

  const wait = (ms) => new Promise((fine) => setTimeout(fine, ms));
  const red = () => el("f_acconto").classList.contains("campo-errore");
  const question = () => document.getElementById("finestraDomanda");

  window.addEventListener("load", () => setTimeout(async () => {
    const r = [];
    const test = (nome, real, why) => r.push(`${nome}=${real ? "ok" : `NO(${why})`}`);
    el("f_cognome").value = "Rossi";
    el("f_nome").value = "Mario";
    el("f_telefono").value = "333";
    [...el("f_tipologia_tessera").querySelectorAll("input")][0].click();

    el("f_acconto").value = "12.3";
    await save();
    await wait(300);
    test("centesimiNo", red() && !question() && document.activeElement === el("f_acconto"),
      `bordato ${red()}, domanda ${Boolean(question())}, fuoco su ${document.activeElement?.id}`);

    question()?.querySelector("[data-no]")?.click();
    el("f_acconto").value = "12.5";
    el("f_acconto").dispatchEvent(new Event("input", { bubbles: true }));
    await save();
    await wait(300);
    test("cinquantaSi", !red() && Boolean(question()), `bordato ${red()}, domanda ${Boolean(question())}`);

    document.title = "RISULTATO " + r.join(" ");
  }, 500));
}
