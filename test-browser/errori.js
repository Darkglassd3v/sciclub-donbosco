// Errori sui campi (shared.js, vale per tutto il sito), provati in Soci (index.html).
// - Salva con dei campi obbligatori vuoti: hanno il bordo rosso (.campo-errore), la
//   pagina scorre al primo e il fuoco ci va; il messaggio dice quali sono.
// - Le scelte (radio) obbligatorie: il bordo è sul gruppo.
// - Scritto qualcosa nel campo, il bordo se ne va.
// - Anche gli errori che controlla la pagina (qui: «paga un familiare» senza il nome)
//   bordano il campo e ci portano.
// In un blocco: gli script della pagina e della prova hanno gli stessi nomi globali.
{
  const LISTINO = [{ category: "TESSERA", name: "TESSERA ORDINARIA - REALE MUTUA NEVE", price: 40, min_role: "utente" }];
  FINTO.risposta = (t) => (t === "prices" ? LISTINO : []);

  const aspetta = (ms) => new Promise((fine) => setTimeout(fine, ms));
  const rosso = (id) => el(id).classList.contains("campo-errore");
  // Si vede: tutto dentro la finestra.
  const visibile = (id) => { const r = el(id).getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; };
  const toast = () => el("statusToast")?.textContent || "";

  window.addEventListener("load", () => setTimeout(async () => {
    const r = [];
    const prova = (nome, vero, perche) => r.push(`${nome}=${vero ? "ok" : `NO(${perche})`}`);

    window.scrollTo(0, document.body.scrollHeight);
    await salva();
    await aspetta(300);
    prova("obbligatoriRossi", rosso("f_cognome") && rosso("f_nome") && rosso("f_telefono"),
      `cognome ${rosso("f_cognome")}, nome ${rosso("f_nome")}, telefono ${rosso("f_telefono")}`);
    prova("sceltaRossa", rosso("f_tipologia_tessera"), "il gruppo Tipologia tessera non è bordato");
    prova("scorreAlPrimo", visibile("f_cognome") && document.activeElement === el("f_cognome"),
      `si vede ${visibile("f_cognome")}, fuoco su ${document.activeElement?.id}`);
    prova("diceQuali", /Cognome/.test(toast()) && /Telefono/.test(toast()), `messaggio «${toast()}»`);

    el("f_cognome").value = "Rossi";
    el("f_cognome").dispatchEvent(new Event("input", { bubbles: true }));
    prova("toltoScrivendo", !rosso("f_cognome") && rosso("f_nome") && !el("f_cognome").hasAttribute("aria-invalid")
      && el("f_nome").getAttribute("aria-invalid") === "true", `cognome ${rosso("f_cognome")}, nome ${rosso("f_nome")}`);

    el("f_nome").value = "Mario";
    el("f_telefono").value = "333";
    [...el("f_tipologia_tessera").querySelectorAll("input")][0].click();
    el("pagaFamiliare").click();
    window.scrollTo(0, 0);
    await salva();
    await aspetta(300);
    prova("erroreDellaPagina", rosso("f_payerDisplay") && visibile("f_payerDisplay"),
      `bordato ${rosso("f_payerDisplay")}, si vede ${visibile("f_payerDisplay")}`);

    document.title = "RISULTATO " + r.join(" ");
  }, 500));
}
