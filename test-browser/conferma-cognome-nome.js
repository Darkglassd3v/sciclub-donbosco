// Soci (index.html), finestra di conferma del salvataggio (26/11/2026): la riga del nome diceva «Nome e cognome» ma
// mostrava COGNOME NOME. L'etichetta ora è «Cognome e nome», come nell'Elenco soci, e il valore resta nell'ordine
// di sempre: cognome, poi nome.
// In un blocco: gli script della pagina e della prova hanno gli stessi nomi globali.
{
  const PRICE_LIST = [{ category: "TESSERA", name: "TESSERA ORDINARIA - REALE MUTUA NEVE", price: 40, min_role: "utente" }];
  FAKE.risposta = (t) => (t === "prices" ? PRICE_LIST : []);
  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  window.addEventListener("load", () => setTimeout(async () => {
    const r = [];
    const test = (nome, passed, why) => r.push(`${nome}=${passed ? "ok" : `NO(${why})`}`);
    try {
      el("f_cognome").value = "Rossi"; el("f_nome").value = "Mario";
      [...el("f_tipologia_tessera").querySelectorAll("input")][0].click();
      await wait(300);
      await save(); await wait(300);
      const rows = [...document.querySelectorAll("#finestraDomanda tr")]
        .map((tr) => [tr.querySelector("th")?.textContent.trim(), tr.querySelector("td")?.textContent.trim()]);
      const name = rows.find(([label]) => /nome/i.test(label || ""));
      test("cognomeENome", name?.[0] === "Cognome e nome" && name?.[1] === "ROSSI MARIO", JSON.stringify(name));
      document.querySelector("#finestraDomanda [data-no]")?.click();
    } catch (e) { r.push(`eccezione=NO(${String(e?.message || e).slice(0, 120)})`); }
    document.title = "RISULTATO " + r.join(" ");
  }, 500));
}
