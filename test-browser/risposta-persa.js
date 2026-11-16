// Soci (index.html): il socio nuovo arriva al database ma la risposta si perde (rete caduta).
// Ripremuto Salva, la pagina ritrova il socio che ha appena creato (stesso id, deciso dalla pagina)
// e completa il salvataggio: nessun secondo inserimento, nessun avviso «già presente in archivio»,
// il socio aggiornato col blocco su updated_at e gli abbonamenti scritti sul suo id.
// In un blocco: gli script della pagina e della prova hanno gli stessi nomi globali.
{
  const PRICE_LIST = [
    { category: "TESSERA", name: "TESSERA ORDINARIA - REALE MUTUA NEVE", price: 40, min_role: "utente" },
    { category: "ABBONAMENTO", name: "10 VIAGGI SABATO", price: 100, trips: 10, day: "SABATO", min_role: "utente" },
  ];
  const inserts = [], updates = [], passes = [];
  let lost = true;
  const has = (r, nome, ...args) => r.filtri.some((f) => f[0] === nome && args.every((a, i) => f[i + 1] === a));
  FAKE.risposta = (t, r) => {
    if (t === "prices") return PRICE_LIST;
    if (t === "members" && has(r, "insert")) { inserts.push(r.filtri.find((f) => f[0] === "insert")[1]); return { id: inserts[0].id, updated_at: "2" }; }
    if (t === "members" && has(r, "update")) { updates.push(r.filtri); return [{ updated_at: "3" }]; }
    if (t === "member_passes" && has(r, "upsert")) { passes.push(...r.filtri.find((f) => f[0] === "upsert")[1]); return []; }
    // Il database ha il socio: lo trova chi lo cerca per id e anche il controllo dei doppioni.
    if (t === "members" && inserts.length && (has(r, "eq", "id", inserts[0].id) || has(r, "eq", "name_key"))) {
      return [{ id: inserts[0].id, updated_at: "2", last_name: "PROVA", first_name: "PERSA", birth_date: null, tax_code: null, city: null, card_number: null }];
    }
    return [];
  };
  FAKE.errore = (t, r) => (lost && t === "members" && has(r, "insert") ? { message: "TypeError: Failed to fetch", details: "", hint: "", code: "" } : null);
  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const toast = () => el("statusToast")?.textContent || "";
  const si = async () => { await wait(300); document.querySelector("#finestraDomanda [data-si]")?.click(); await wait(500); };

  window.addEventListener("load", () => setTimeout(async () => { try {
    const r = [];
    const test = (nome, passed, why) => r.push(`${nome}=${passed ? "ok" : `NO(${why})`}`);
    el("f_cognome").value = "Prova"; el("f_nome").value = "Persa"; el("f_telefono").value = "333";
    [...el("f_tipologia_tessera").querySelectorAll("input")][0].click();
    [...el("listinoAbbonamenti").querySelectorAll("button")].find((b) => b.textContent.includes("Aggiungi"))?.click();
    await save(); await si();
    const id = inserts[0]?.id;
    test("idDallaPagina", /^[0-9a-f-]{36}$/.test(id || ""), `id inviato: ${id}`);
    test("primaNonSalvato", passes.length === 0 && el("f_cognome").value === "Prova", `abbonamenti ${passes.length}`);

    lost = false;
    await save(); await si();
    test("unSoloInserimento", inserts.length === 1, `inserimenti ${inserts.length}`);
    test("nienteAvvisoDoppioni", el("avvisoDoppioni").hidden, "è comparso l'avviso «già presente in archivio»");
    test("aggiornatoColBlocco", updates.length === 1 && updates[0].some((f) => f[0] === "eq" && f[1] === "id" && f[2] === id)
      && updates[0].some((f) => f[0] === "eq" && f[1] === "updated_at" && f[2] === "2"), `aggiornamenti ${updates.length}`);
    test("abbonamentiScritti", passes.length === 1 && passes[0].member_id === id, `abbonamenti ${JSON.stringify(passes)}`);
    test("salvato", /socio salvato/.test(toast()), `messaggio «${toast()}»`);

    // Un socio nuovo dopo quello: un altro id, non quello di prima.
    el("f_cognome").value = "Altro"; el("f_nome").value = "Socio"; el("f_telefono").value = "333";
    [...el("f_tipologia_tessera").querySelectorAll("input")][0].click();
    const before = inserts.length;
    FAKE.risposta = ((old) => (t, q) => (t === "members" && has(q, "eq", "name_key") ? [] : old(t, q)))(FAKE.risposta);
    await save(); await si();
    test("idNuovo", inserts.length === before + 1 && inserts[before].id && inserts[before].id !== id, `inserimenti ${inserts.length}, id ${inserts[before]?.id}`);
    document.title = `RISULTATO ${r.join(" ")}`;
  } catch (e) { document.title = `RISULTATO eccezione=NO(${String(e?.message || e).slice(0, 120)})`; } }, 500));
}
