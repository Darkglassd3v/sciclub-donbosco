// Soci (index.html): la finestra di conferma del salvataggio mostra anche il numero di tessera.
// - Tessera scelta e numero scritto: la riga «Numero tessera» riporta il numero.
// - Tessera scelta ma numero vuoto: la riga dice «non scritto» in rosso, così si nota.
// In un blocco: gli script della pagina e della prova hanno gli stessi nomi globali.
{
  const PRICE_LIST = [
    { category: "TESSERA", name: "TESSERA ORDINARIA - REALE MUTUA NEVE", price: 40, min_role: "utente", insurance: "BASE" },
  ];
  FAKE.risposta = (t) => (t === "prices" ? PRICE_LIST : []);
  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const row = () => [...document.querySelectorAll("#finestraDomanda tr")].find((tr) => tr.textContent.includes("Numero tessera"));
  const cell = () => row()?.querySelector("td");
  const close = () => document.querySelector("#finestraDomanda [data-no]")?.click();

  window.addEventListener("load", () => setTimeout(async () => {
    const r = [];
    const test = (nome, passed, why) => r.push(`${nome}=${passed ? "ok" : `NO(${why})`}`);
    el("f_cognome").value = "Prova"; el("f_nome").value = "Tessera"; el("f_telefono").value = "333";
    [...el("f_tipologia_tessera").querySelectorAll("input")][0].click();
    await wait(300);

    el("f_numero_tessera").value = "45";
    await save(); await wait(300);
    test("numero", cell()?.textContent.trim() === "45", `finestra ${Boolean(document.getElementById("finestraDomanda"))}, riga «${row()?.textContent.replace(/\s+/g, " ").trim()}»`);
    close();

    el("f_numero_tessera").value = "";
    await save(); await wait(300);
    test("numeroMancante", cell()?.textContent.trim() === "non scritto" && cell()?.classList.contains("manca"),
      `finestra ${Boolean(document.getElementById("finestraDomanda"))}, riga «${row()?.textContent.replace(/\s+/g, " ").trim()}»`);
    close();

    document.title = "RISULTATO " + r.join(" ");
  }, 500));
}
