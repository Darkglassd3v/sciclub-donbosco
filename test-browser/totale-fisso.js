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
  const ORDINARIA = "TESSERA ORDINARIA - REALE MUTUA NEVE", SOLO = "SOLO TESSERA - NO ASSICURAZIONE", CORSO = "CORSO SCI ADULTI";
  const LISTINO = [
    { category: "TESSERA", name: ORDINARIA, price: 40, insurance: "BASE", min_role: "utente" },
    { category: "TESSERA", name: SOLO, price: 20, min_role: "utente" },
    { category: "CORSO", name: CORSO, price: 210, min_role: "utente" },
  ];
  const SOCIO = { id: "S1", last_name: "ROSSI", first_name: "MARIO", phone: "333", card_type: ORDINARIA,
    course_type: CORSO, course_day: "SABATO", total: 230, paid: 0, total_manual: false, updated_at: "1" };
  const aggiornati = [];
  FINTO.risposta = (t, r) => {
    if (t === "prices") return LISTINO;
    const scrittura = r.filtri.find((f) => f[0] === "update");
    if (t === "members" && scrittura) { aggiornati.push(scrittura[1]); return [{ updated_at: "2" }]; }
    const eq = (campo) => r.filtri.find((f) => f[0] === "eq" && f[1] === campo)?.[2];
    if (t === "members" && eq("id") === "S1") return [SOCIO];
    return [];
  };
  const aspetta = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const scegli = (gruppo, nome) => el(gruppo).querySelector(`input[data-nome="${nome}"]`)?.click();

  window.addEventListener("load", () => setTimeout(async () => {
    const r = [];
    const prova = (nome, vero, perche) => r.push(`${nome}=${vero ? "ok" : `NO(${perche})`}`);

    await caricaSocio("S1");
    await aspetta(300);
    prova("aperto", totaleIndividuale() === 230, `totale ${totaleIndividuale()}`);
    el("f_totale_a_mano").click();
    prova("aManoParteDaSalvato", num(el("f_totale_manuale").value) === 230, `campo ${el("f_totale_manuale").value}`);
    el("f_totale_a_mano").click();
    scegli("f_tipologia_corso", "");
    prova("toltoCorso", totaleIndividuale() === 20, `totale ${totaleIndividuale()}`);
    scegli("f_tipologia_tessera", SOLO);
    prova("cambiataTessera", totaleIndividuale() === 0, `totale ${totaleIndividuale()}`);

    await caricaSocio("S1");
    await aspetta(300);
    el("f_telefono").value = "3334";
    await salva();
    await aspetta(300);
    document.querySelector("#finestraDomanda [data-si]")?.click();
    await aspetta(600);
    prova("salvatoUguale", aggiornati.length === 1 && aggiornati[0].total === 230, `salvati ${JSON.stringify(aggiornati.map((a) => a.total))}`);

    resetForm();
    scegli("f_tipologia_tessera", ORDINARIA);
    prova("nuovoDalListino", totaleIndividuale() === 40, `totale ${totaleIndividuale()}`);
    document.title = "RISULTATO " + r.join(" ");
  }, 500));
}
