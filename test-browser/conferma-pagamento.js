// Soci (index.html): la finestra di conferma del salvataggio riporta il pagamento come la barra
// in fondo alla pagina, con gli stessi importi e gli stessi colori, per capire subito se il
// socio ha saldato.
// - Acconto minore del totale: «Residuo» in giallo, con la cifra della barra.
// - Acconto uguale al totale: «Saldato» in verde.
// - Acconto maggiore del totale: «A credito» in azzurro.
// In un blocco: gli script della pagina e della prova hanno gli stessi nomi globali.
{
  const PRICE_LIST = [
    { category: "TESSERA", name: "TESSERA ORDINARIA - REALE MUTUA NEVE", price: 40, min_role: "utente" },
  ];
  FAKE.risposta = (t) => (t === "prices" ? PRICE_LIST : []);
  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const band = () => document.querySelector("#finestraDomanda .pagamento-conferma");
  const part = (key) => band()?.querySelector(`[data-voce="${key}"]`);
  const text = (node) => node?.textContent.replace(/\s+/g, " ").trim() || "";
  const close = () => document.querySelector("#finestraDomanda [data-no]")?.click();

  window.addEventListener("load", () => setTimeout(async () => {
    const r = [];
    const test = (nome, passed, why) => r.push(`${nome}=${passed ? "ok" : `NO(${why})`}`);
    el("f_cognome").value = "Prova"; el("f_nome").value = "Pagamento"; el("f_telefono").value = "333";
    el("f_numero_tessera").value = "47";
    [...el("f_tipologia_tessera").querySelectorAll("input")][0].click();
    await wait(300);
    const total = el("v_totale").textContent.trim();

    const check = async (nome, deposit, label) => {
      el("f_acconto").value = deposit;
      el("f_acconto").dispatchEvent(new Event("input"));
      await save(); await wait(300);
      const residual = part("residuo");
      test(nome, Boolean(band())
        && text(part("totale")).includes(total)
        && text(part("acconto")).includes(fmt(deposit))
        && text(residual).startsWith(label)
        && text(residual).includes(el("v_saldo").textContent.trim())
        && residual.querySelector(".val-amount")?.style.color === el("v_saldo").style.color,
        `fascia «${text(band())}», colore ${residual?.querySelector(".val-amount")?.style.color} contro ${el("v_saldo").style.color}`);
      close();
    };
    await check("residuo", 10, "Residuo");
    await check("saldato", num(total.replace(/[^\d,]/g, "").replace(",", ".")), "Saldato");
    await check("credito", 100, "A credito");

    document.title = "RISULTATO " + r.join(" ");
  }, 500));
}
