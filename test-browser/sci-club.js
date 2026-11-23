// Soci (index.html), sci club affiliati (richiesta del 23/11/2026: lo Sci Club Moncalvo si è unito al nostro, ma
// i soci li tesseriamo noi e incassiamo noi, quindi il bilancio non cambia):
// - nella sezione Tessera il menu «Sci club di provenienza», con «Nessuno» e i club scritti in Impostazioni;
// - salvando, il club scelto va nella scheda (members.club_id), «Nessuno» la lascia vuota;
// - aprendo una scheda il menu mostra il club del socio;
// - il riepilogo prima del salvataggio lo dice;
// - un club aggiunto in Impostazioni dopo l'apertura della pagina non è nel menu: aprendo un suo socio il menu lo
//   mostra lo stesso (nome letto con la scheda), e salvando il club resta.
// In un blocco: gli script della pagina e della prova hanno gli stessi nomi globali.
{
  const PRICE_LIST = [{ category: "TESSERA", name: "TESSERA ORDINARIA - REALE MUTUA NEVE", price: 40, min_role: "utente" }];
  const written = [];
  FAKE.risposta = (t, r) => {
    if (t === "prices") return PRICE_LIST;
    if (t === "affiliated_clubs") return [{ id: 7, name: "SCI CLUB MONCALVO" }];
    if (t === "members" && r.filtri.some((f) => f[0] === "insert" || f[0] === "update")) {
      written.push(r.filtri.find((f) => f[0] === "insert" || f[0] === "update")[1]);
      return { id: "NUOVO", updated_at: "2" };
    }
    if (t === "members" && r.filtri.some((f) => f[0] === "eq" && f[1] === "id" && f[2] === "M1")) return [{
      id: "M1", last_name: "ROSSI", first_name: "ANNA", phone: "333", birth_date: "1980-01-01", card_type: PRICE_LIST[0].name,
      card_number: "12", club_id: 7, club: { name: "SCI CLUB MONCALVO" }, total: 40, paid: 0, updated_at: "1" }];
    if (t === "members" && r.filtri.some((f) => f[0] === "eq" && f[1] === "id" && f[2] === "M2")) return [{
      id: "M2", last_name: "VERDI", first_name: "PIA", phone: "333", birth_date: "1981-01-01", card_type: PRICE_LIST[0].name,
      card_number: "13", club_id: 9, club: { name: "SCI CLUB CANELLI" }, total: 40, paid: 0, updated_at: "1" }];
    return [];
  };
  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const yes = async () => { await wait(300); document.querySelector("#finestraDomanda [data-si]")?.click(); await wait(600); };
  const summaryText = () => document.querySelector("#finestraDomanda")?.textContent.replace(/\s+/g, " ") || "";

  window.addEventListener("load", () => setTimeout(async () => {
    const r = [];
    const test = (nome, passed, why) => r.push(`${nome}=${passed ? "ok" : `NO(${why})`}`);
    try {
      await wait(400);
      const menu = el("f_club");
      test("menu", menu?.tagName === "SELECT" && menu.closest("#sez-tessera, section")?.textContent.includes("Tipologia tessera")
        && el("f_club").labels?.[0]?.textContent.trim() === "Sci club di provenienza",
        menu ? `${menu.tagName} in «${menu.closest("section")?.querySelector("h2")?.textContent.trim().slice(0, 30)}»` : "manca #f_club");
      const options = menu ? [...menu.options].map((o) => `${o.value}:${o.textContent.trim()}`).join("|") : "";
      test("scelte", options === ":Nessuno|7:SCI CLUB MONCALVO", options);

      el("f_cognome").value = "BIANCHI"; el("f_nome").value = "LUCA"; el("f_telefono").value = "333";
      el("f_data_nascita").value = "1990-02-02";
      [...el("f_tipologia_tessera").querySelectorAll("input")][0].click();
      menu.value = "7";
      menu.dispatchEvent(new Event("change", { bubbles: true }));
      const saving = save();
      await wait(300);
      test("riepilogo", summaryText().includes("Sci club di provenienza") && summaryText().includes("SCI CLUB MONCALVO"),
        summaryText().slice(0, 160));
      await yes();
      await saving;
      test("salvato", written.at(-1)?.club_id === 7, JSON.stringify(written.at(-1)?.club_id));

      resetForm();
      test("vuotoDopo", el("f_club").value === "", `«${el("f_club").value}»`);
      await loadMember("M1");
      await wait(300);
      test("aperto", el("f_club").value === "7", `«${el("f_club").value}»`);
      el("f_club").value = "";
      const again = save();
      await yes();
      await again;
      test("nessuno", written.at(-1) && written.at(-1).club_id === null, JSON.stringify(written.at(-1)?.club_id));

      resetForm();
      await loadMember("M2");
      await wait(300);
      test("clubNuovo", el("f_club").value === "9" && el("f_club").selectedOptions[0]?.textContent === "SCI CLUB CANELLI",
        `«${el("f_club").value}» ${[...el("f_club").options].map((o) => o.textContent).join("|")}`);
      const kept = save();
      await yes();
      await kept;
      test("clubNuovoResta", written.at(-1)?.club_id === 9, JSON.stringify(written.at(-1)?.club_id));
    } catch (e) { r.push(`eccezione=NO(${String(e?.message || e).slice(0, 120)})`); }
    document.title = "RISULTATO " + r.join(" ");
  }, 500));
}
