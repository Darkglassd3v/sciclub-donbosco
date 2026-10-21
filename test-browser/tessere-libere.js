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
  const LISTINO = [{ category: "TESSERA", name: "TESSERA ORDINARIA - REALE MUTUA NEVE", price: 40, min_role: "utente" }];
  const SOCIO = { id: "M", last_name: "NUMERO", first_name: "NINO", updated_at: "1", enrolled_at: "2026-10-14", paid: 0, total: 40,
    total_manual: false, card_type: "TESSERA ORDINARIA - REALE MUTUA NEVE", card_number: "30" };
  // 1-5 del direttivo, 21-35 (il 30 è di NUMERO NINO) e 37; «A12» non è un numero.
  const numeri = [1, 2, 3, 4, 5, ...Array.from({ length: 15 }, (_, i) => 21 + i), 37];
  const USATI = [...numeri.map((n) => ({ id: n === 30 ? "M" : "S" + n, card_number: String(n) })), { id: "SA", card_number: "A12" }];
  let da = "21";
  FINTO.rpc.next_card_number = 38;

  FINTO.risposta = (t, r) => {
    if (t === "prices") return LISTINO;
    if (t === "settings") return [{ key: "card_gaps_from", value: da }];
    if (t === "members" && r.filtri.some((f) => f[0] === "eq" && f[1] === "id")) return [SOCIO];
    if (t === "members" && r.filtri.some((f) => f[0] === "not" && f[1] === "card_number")) return USATI;
    return [];
  };

  const aspetta = (ms) => new Promise((fine) => setTimeout(fine, ms));
  const riga = () => el("tessereLibere");
  // Quello che la riga elenca, senza «NUMERI TESSERA LIBERI PROPOSTI:»; vuoto se la riga non si vede.
  const siVede = () => riga() && getComputedStyle(riga()).display !== "none";
  const liberi = () => (siVede() ? riga().textContent.replace(/^[^:]*:\s*/, "").trim() : "");
  const scrivi = (valore) => {
    el("f_numero_tessera").value = valore;
    el("f_numero_tessera").dispatchEvent(new Event("input", { bubbles: true }));
  };

  window.addEventListener("load", () => setTimeout(async () => {
    const r = [];
    const prova = (nome, vero, perche) => r.push(`${nome}=${vero ? "ok" : `NO(${perche})`}`);
    if (!riga()) { document.title = "RISULTATO riga=NO(manca #tessereLibere)"; return; }

    prova("proposto", el("f_numero_tessera").value === "38" && liberi() === "36",
      `numero «${el("f_numero_tessera").value}», liberi «${liberi()}»`);
    prova("rosso", getComputedStyle(riga()).color === "rgb(179, 38, 30)", `colore ${getComputedStyle(riga()).color}`);
    prova("testo", riga().textContent.startsWith("NUMERI TESSERA LIBERI PROPOSTI: "), `«${riga().textContent}»`);
    scrivi("36");
    prova("riempito", liberi() === "", `liberi «${liberi()}»`);
    scrivi("45");
    prova("salto", liberi() === "36, 38–44", `liberi «${liberi()}»`);
    scrivi("A5");
    prova("lettere", liberi() === "36", `liberi «${liberi()}»`);

    await caricaSocio("M");
    prova("socioAperto", el("f_numero_tessera").value === "30" && liberi() === "36",
      `numero «${el("f_numero_tessera").value}», liberi «${liberi()}»`);
    scrivi("40");
    prova("vecchioLibero", liberi() === "30, 36, 38–39", `liberi «${liberi()}»`);

    da = "37";
    resetForm();
    await aspetta(300);
    scrivi("45");
    prova("daImpostazioni", liberi() === "38–44", `liberi «${liberi()}»`);

    FINTO.errore = (t) => (t === "settings" ? { message: "relation \"public.settings\" does not exist" } : null);
    resetForm();
    await aspetta(300);
    prova("senzaImpostazione", liberi() === "", `liberi «${liberi()}»`);

    document.title = "RISULTATO " + r.join(" ");
  }, 500));
}
