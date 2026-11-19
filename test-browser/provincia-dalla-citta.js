// Soci (index.html): la provincia segue sempre la città, di nascita e di residenza (richiesta del 19/11/2026:
// «se inserisco la città, che la provincia sia vuota o scritta, deve essere sempre popolata e sovrascritta»).
// - Città riscritta uguale (nessun «change» del browser) con la provincia vuota o sbagliata: la provincia si
//   riempie mentre si scrive.
// - Stessa città confermata uscendo dal campo: una provincia sbagliata si sovrascrive (prima restava).
// - Al Salva la provincia si ricava dalla città prima di scrivere: una città arrivata senza eventi (riempimento
//   automatico, campo mai lasciato) non salva più una provincia vuota o sbagliata.
// - Restano: la provincia scritta se ha un comune con quel nome (SAMONE c'è in TO e in TN), quella di una città
//   che non è nell'elenco (scritta male) e il vuoto degli stati esteri.
// In un blocco: gli script della pagina e della prova hanno gli stessi nomi globali.
{
  const PRICE_LIST = [{ category: "TESSERA", name: "TESSERA ORDINARIA - REALE MUTUA NEVE", price: 40, min_role: "utente" }];
  const inserted = [];
  FAKE.risposta = (t, r) => {
    if (t === "prices") return PRICE_LIST;
    if (t === "members" && r.filtri.some((f) => f[0] === "insert")) {
      inserted.push(r.filtri.find((f) => f[0] === "insert")[1]);
      return { id: "NUOVO", updated_at: "2" };
    }
    return [];
  };
  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const typeSame = async (id, value) => {   // entra, cancella e riscrive lo stesso valore: «input» sì, «change» no
    el(id).dispatchEvent(new Event("focus"));
    el(id).value = value;
    el(id).dispatchEvent(new Event("input", { bubbles: true }));
    await wait(400);
  };
  const leave = async (id) => { el(id).dispatchEvent(new Event("change", { bubbles: true })); await wait(400); };
  const yes = async () => { await wait(300); document.querySelector("#finestraDomanda [data-si]")?.click(); await wait(600); };

  window.addEventListener("load", () => setTimeout(async () => {
    const r = [];
    const test = (nome, passed, why) => r.push(`${nome}=${passed ? "ok" : `NO(${why})`}`);
    try {
      await wait(400);
      el("f_provincia").value = "";
      await typeSame("f_citta", "ASTI");
      test("riscrittaVuota", el("f_provincia").value === "AT", `«${el("f_provincia").value}»`);
      el("f_provincia").value = "CN";
      await typeSame("f_citta", "ASTI");
      test("riscrittaSbagliata", el("f_provincia").value === "AT", `«${el("f_provincia").value}»`);
      el("f_provincia").value = "TO";
      el("f_citta").dispatchEvent(new Event("focus"));
      await leave("f_citta");
      test("stessaCittaSovrascrive", el("f_provincia").value === "AT", `«${el("f_provincia").value}»`);

      el("f_provincia_nascita").value = "AL";
      await typeSame("f_luogo_nascita", "CANELLI");
      test("nascitaSovrascrive", el("f_provincia_nascita").value === "AT", `«${el("f_provincia_nascita").value}»`);

      el("f_provincia").value = "TO";
      await typeSame("f_citta", "SAMONE");
      test("omonimoResta", el("f_provincia").value === "TO", `«${el("f_provincia").value}»`);
      el("f_provincia").value = "AT";
      await typeSame("f_citta", "SAMONE");
      test("omonimoCambia", ["TO", "TN"].includes(el("f_provincia").value), `«${el("f_provincia").value}»`);
      el("f_provincia").value = "AT";
      await typeSame("f_citta", "CITTANONESISTE");
      await leave("f_citta");
      test("sconosciutaResta", el("f_provincia").value === "AT", `«${el("f_provincia").value}»`);
      el("f_provincia_nascita").value = "";
      await typeSame("f_luogo_nascita", "FRANCIA");
      await leave("f_luogo_nascita");
      test("esteroVuoto", el("f_provincia_nascita").value === "", `«${el("f_provincia_nascita").value}»`);

      // Al Salva: città scritte senza nessun evento (riempimento automatico, campo mai lasciato).
      el("f_cognome").value = "PROVA"; el("f_nome").value = "PROVINCIA"; el("f_telefono").value = "333";
      el("f_data_nascita").value = "1980-01-01";
      [...el("f_tipologia_tessera").querySelectorAll("input")][0].click();
      el("f_citta").value = "CANELLI"; el("f_provincia").value = "TO";
      el("f_luogo_nascita").value = "ALESSANDRIA"; el("f_provincia_nascita").value = "";
      await save();
      await yes();
      const saved = inserted.at(-1) || {};
      test("salvaResidenza", saved.city === "CANELLI" && saved.province === "AT", `${saved.city} ${saved.province}`);
      test("salvaNascita", saved.birth_place === "ALESSANDRIA" && saved.birth_province === "AL", `${saved.birth_place} ${saved.birth_province}`);
    } catch (e) { r.push(`eccezione=NO(${String(e?.message || e).slice(0, 120)})`); }
    document.title = "RISULTATO " + r.join(" ");
  }, 500));
}
