// Soci (index.html): l'acconto è in euro interi o con i 50 centesimi.
// - 12,30 non si salva: il campo ha il bordo rosso e la pagina ci porta.
// - 12,50 va bene: si arriva alla domanda «Salvare questo socio nuovo?».
// In un blocco: gli script della pagina e della prova hanno gli stessi nomi globali.
{
  const LISTINO = [{ category: "TESSERA", name: "TESSERA ORDINARIA - REALE MUTUA NEVE", price: 40, min_role: "utente" }];
  FINTO.risposta = (t) => (t === "prices" ? LISTINO : []);

  const aspetta = (ms) => new Promise((fine) => setTimeout(fine, ms));
  const rosso = () => el("f_acconto").classList.contains("campo-errore");
  const domanda = () => document.getElementById("finestraDomanda");

  window.addEventListener("load", () => setTimeout(async () => {
    const r = [];
    const prova = (nome, vero, perche) => r.push(`${nome}=${vero ? "ok" : `NO(${perche})`}`);
    el("f_cognome").value = "Rossi";
    el("f_nome").value = "Mario";
    el("f_telefono").value = "333";
    [...el("f_tipologia_tessera").querySelectorAll("input")][0].click();

    el("f_acconto").value = "12.3";
    await salva();
    await aspetta(300);
    prova("centesimiNo", rosso() && !domanda() && document.activeElement === el("f_acconto"),
      `bordato ${rosso()}, domanda ${Boolean(domanda())}, fuoco su ${document.activeElement?.id}`);

    domanda()?.querySelector("[data-no]")?.click();
    el("f_acconto").value = "12.5";
    el("f_acconto").dispatchEvent(new Event("input", { bubbles: true }));
    await salva();
    await aspetta(300);
    prova("cinquantaSi", !rosso() && Boolean(domanda()), `bordato ${rosso()}, domanda ${Boolean(domanda())}`);

    document.title = "RISULTATO " + r.join(" ");
  }, 500));
}
