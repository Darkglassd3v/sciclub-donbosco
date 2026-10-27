// Soci (index.html): il totale di un socio già salvato non segue i prezzi nuovi del
// listino (l'utente, 22/10: «il totale pagato ad un dato momento vale sempre anche se
// cambiano i prezzi»). Il socio ha tessera e corso salvati a 230 €, oggi il listino
// li dà a 40 + 210 = 250.
// - Aperto, il totale è 230; salvato senza cambiare le voci (qui il telefono), resta 230.
// - Cambiata una voce, cambia solo la differenza, coi prezzi di oggi: tolto il corso
//   230 - 210 = 20; tessera da 40 a una da 20: 20 - 40 + 20 = 0.
// - Spuntato il totale a mano, il campo parte da 230.
// - Socio nuovo: il totale è quello del listino.
// In un blocco: gli script della pagina e della prova hanno gli stessi nomi globali.
{
  const ORDINARY = "TESSERA ORDINARIA - REALE MUTUA NEVE", SOLO = "SOLO TESSERA - NO ASSICURAZIONE", COURSE = "CORSO SCI ADULTI";
  const PRICE_LIST = [
    { category: "TESSERA", name: ORDINARY, price: 40, insurance: "BASE", min_role: "utente" },
    { category: "TESSERA", name: SOLO, price: 20, min_role: "utente" },
    { category: "CORSO", name: COURSE, price: 210, min_role: "utente" },
  ];
  const MEMBER = { id: "S1", last_name: "ROSSI", first_name: "MARIO", phone: "333", card_type: ORDINARY,
    course_type: COURSE, course_day: "SABATO", total: 230, paid: 0, total_manual: false, updated_at: "1" };
  const updated = [];
  FAKE.risposta = (t, r) => {
    if (t === "prices") return PRICE_LIST;
    const writing = r.filtri.find((f) => f[0] === "update");
    if (t === "members" && writing) { updated.push(writing[1]); return [{ updated_at: "2" }]; }
    const eq = (field) => r.filtri.find((f) => f[0] === "eq" && f[1] === field)?.[2];
    if (t === "members" && eq("id") === "S1") return [MEMBER];
    return [];
  };
  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const choose = (group, nome) => el(group).querySelector(`input[data-nome="${nome}"]`)?.click();

  window.addEventListener("load", () => setTimeout(async () => {
    const r = [];
    const test = (nome, real, why) => r.push(`${nome}=${real ? "ok" : `NO(${why})`}`);

    await loadMember("S1");
    await wait(300);
    test("aperto", individualTotal() === 230, `totale ${individualTotal()}`);
    el("f_totale_a_mano").click();
    test("aManoParteDaSalvato", num(el("f_totale_manuale").value) === 230, `campo ${el("f_totale_manuale").value}`);
    el("f_totale_a_mano").click();
    choose("f_tipologia_corso", "");
    test("toltoCorso", individualTotal() === 20, `totale ${individualTotal()}`);
    choose("f_tipologia_tessera", SOLO);
    test("cambiataTessera", individualTotal() === 0, `totale ${individualTotal()}`);

    await loadMember("S1");
    await wait(300);
    el("f_telefono").value = "3334";
    await save();
    await wait(300);
    document.querySelector("#finestraDomanda [data-si]")?.click();
    await wait(600);
    test("salvatoUguale", updated.length === 1 && updated[0].total === 230, `salvati ${JSON.stringify(updated.map((a) => a.total))}`);

    resetForm();
    choose("f_tipologia_tessera", ORDINARY);
    test("nuovoDalListino", individualTotal() === 40, `totale ${individualTotal()}`);
    document.title = "RISULTATO " + r.join(" ");
  }, 500));
}
