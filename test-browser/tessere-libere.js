// Soci (index.html): sotto il numero tessera, in rosso, i numeri liberi.
// - Libero: dal numero delle Impostazioni (settings.card_gaps_from) al più alto
//   dato o scritto, che nessuno ha. Sotto quel numero i posti sono tenuti vuoti
//   apposta (direttivo e famiglia) e non si segnalano.
// - Dati 21-35 e 37: scrivendo 38 manca il 36; scrivendo 45 anche 38-44;
//   scrivendo 36 non manca niente e la riga sparisce.
// - Il socio aperto non occupa il suo numero vecchio: cambiato, quello torna libero.
// - Numeri con lettere non contano (come next_card_number).
// - Impostazione illeggibile: niente riga, invece dei posti del direttivo come liberi.
// - La riga dice «NUMERI TESSERA LIBERI PROPOSTI: …»; senza numeri liberi non si vede
//   proprio (display, non solo l'attributo hidden: .help di Bulma lo batteva).
// In un blocco: gli script della pagina e della prova hanno gli stessi nomi globali.
{
  const PRICE_LIST = [{ category: "TESSERA", name: "TESSERA ORDINARIA - REALE MUTUA NEVE", price: 40, min_role: "utente" }];
  const MEMBER = { id: "M", last_name: "NUMERO", first_name: "NINO", updated_at: "1", enrolled_at: "2026-10-14", paid: 0, total: 40,
    total_manual: false, card_type: "TESSERA ORDINARIA - REALE MUTUA NEVE", card_number: "30" };
  // 1-5 del direttivo, 21-35 (il 30 è di NUMERO NINO) e 37; «A12» non è un numero.
  const numbers = [1, 2, 3, 4, 5, ...Array.from({ length: 15 }, (_, i) => 21 + i), 37];
  const USED = [...numbers.map((n) => ({ id: n === 30 ? "M" : "S" + n, card_number: String(n) })), { id: "SA", card_number: "A12" }];
  let da = "21";
  FAKE.rpc.next_card_number = 38;

  FAKE.risposta = (t, r) => {
    if (t === "prices") return PRICE_LIST;
    if (t === "settings") return [{ key: "card_gaps_from", value: da }];
    if (t === "members" && r.filtri.some((f) => f[0] === "eq" && f[1] === "id")) return [MEMBER];
    if (t === "members" && r.filtri.some((f) => f[0] === "not" && f[1] === "card_number")) return USED;
    return [];
  };

  const wait = (ms) => new Promise((fine) => setTimeout(fine, ms));
  const row = () => el("tessereLibere");
  // Quello che la riga elenca, senza «NUMERI TESSERA LIBERI PROPOSTI:»; vuoto se la riga non si vede.
  const isVisible = () => row() && getComputedStyle(row()).display !== "none";
  const free = () => (isVisible() ? row().textContent.replace(/^[^:]*:\s*/, "").trim() : "");
  const write = (theValue) => {
    el("f_numero_tessera").value = theValue;
    el("f_numero_tessera").dispatchEvent(new Event("input", { bubbles: true }));
  };

  window.addEventListener("load", () => setTimeout(async () => {
    const r = [];
    const test = (nome, real, why) => r.push(`${nome}=${real ? "ok" : `NO(${why})`}`);
    if (!row()) { document.title = "RISULTATO riga=NO(manca #tessereLibere)"; return; }

    test("proposto", el("f_numero_tessera").value === "38" && free() === "36",
      `numero «${el("f_numero_tessera").value}», liberi «${free()}»`);
    test("rosso", getComputedStyle(row()).color === "rgb(179, 38, 30)", `colore ${getComputedStyle(row()).color}`);
    test("testo", row().textContent.startsWith("NUMERI TESSERA LIBERI PROPOSTI: "), `«${row().textContent}»`);
    write("36");
    test("riempito", free() === "", `liberi «${free()}»`);
    write("45");
    test("salto", free() === "36, 38–44", `liberi «${free()}»`);
    write("A5");
    test("lettere", free() === "36", `liberi «${free()}»`);

    await loadMember("M");
    test("socioAperto", el("f_numero_tessera").value === "30" && free() === "36",
      `numero «${el("f_numero_tessera").value}», liberi «${free()}»`);
    write("40");
    test("vecchioLibero", free() === "30, 36, 38–39", `liberi «${free()}»`);

    da = "37";
    resetForm();
    await wait(300);
    write("45");
    test("daImpostazioni", free() === "38–44", `liberi «${free()}»`);

    FAKE.errore = (t) => (t === "settings" ? { message: "relation \"public.settings\" does not exist" } : null);
    resetForm();
    await wait(300);
    test("senzaImpostazione", free() === "", `liberi «${free()}»`);

    document.title = "RISULTATO " + r.join(" ");
  }, 500));
}
