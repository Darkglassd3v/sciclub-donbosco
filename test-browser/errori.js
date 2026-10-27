// Errori sui campi (shared.js, vale per tutto il sito), provati in Soci (index.html).
// - Salva con dei campi obbligatori vuoti: hanno il bordo rosso (.campo-errore), la
//   pagina scorre al primo e il fuoco ci va; il messaggio dice quali sono.
// - Le scelte (radio) obbligatorie: il bordo è sul gruppo.
// - Scritto qualcosa nel campo, il bordo se ne va.
// - Anche gli errori che controlla la pagina (qui: «paga un familiare» senza il nome)
//   bordano il campo e ci portano.
// In un blocco: gli script della pagina e della prova hanno gli stessi nomi globali.
{
  const PRICE_LIST = [{ category: "TESSERA", name: "TESSERA ORDINARIA - REALE MUTUA NEVE", price: 40, min_role: "utente" }];
  FAKE.risposta = (t) => (t === "prices" ? PRICE_LIST : []);

  const wait = (ms) => new Promise((fine) => setTimeout(fine, ms));
  const red = (id) => el(id).classList.contains("campo-errore");
  // Si vede: tutto dentro la finestra.
  const visible = (id) => { const r = el(id).getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; };
  const toast = () => el("statusToast")?.textContent || "";

  window.addEventListener("load", () => setTimeout(async () => {
    const r = [];
    const test = (nome, passed, why) => r.push(`${nome}=${passed ? "ok" : `NO(${why})`}`);

    window.scrollTo(0, document.body.scrollHeight);
    await save();
    await wait(300);
    test("obbligatoriRossi", red("f_cognome") && red("f_nome") && red("f_telefono"),
      `cognome ${red("f_cognome")}, nome ${red("f_nome")}, telefono ${red("f_telefono")}`);
    test("sceltaRossa", red("f_tipologia_tessera"), "il gruppo Tipologia tessera non è bordato");
    test("scorreAlPrimo", visible("f_cognome") && document.activeElement === el("f_cognome"),
      `si vede ${visible("f_cognome")}, fuoco su ${document.activeElement?.id}`);
    test("diceQuali", /Cognome/.test(toast()) && /Telefono/.test(toast()), `messaggio «${toast()}»`);

    el("f_cognome").value = "Rossi";
    el("f_cognome").dispatchEvent(new Event("input", { bubbles: true }));
    test("toltoScrivendo", !red("f_cognome") && red("f_nome") && !el("f_cognome").hasAttribute("aria-invalid")
      && el("f_nome").getAttribute("aria-invalid") === "true", `cognome ${red("f_cognome")}, nome ${red("f_nome")}`);

    el("f_nome").value = "Mario";
    el("f_telefono").value = "333";
    [...el("f_tipologia_tessera").querySelectorAll("input")][0].click();
    el("pagaFamiliare").click();
    window.scrollTo(0, 0);
    await save();
    await wait(300);
    test("erroreDellaPagina", red("f_payerDisplay") && visible("f_payerDisplay"),
      `bordato ${red("f_payerDisplay")}, si vede ${visible("f_payerDisplay")}`);

    document.title = "RISULTATO " + r.join(" ");
  }, 500));
}
