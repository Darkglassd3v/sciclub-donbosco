// Soci (index.html): con la presciistica si sceglie l'assicurazione.
// - Senza presciistica la scelta non c'è; con la presciistica compare con
//   quella della tessera già scelta, e se la tessera non ne ha, con la Base.
// - La Total Sport somma al totale la differenza (45 − 20 = 25 €), e la
//   Base senza tessera assicurata il suo prezzo intero.
// - Si salva solo un'assicurazione diversa da quella della tessera; togliendo
//   la presciistica torna vuota. Un socio salvato si riapre con la sua.
// - Cambiando tessera la scelta riparte da quella della tessera nuova: la
//   Base rimasta da prima declasserebbe chi ha appena preso la tessera Sport.
// In un blocco: gli script della pagina e della prova hanno gli stessi nomi globali.
{
  const LISTINO = [
    { category: "TESSERA", name: "TESSERA ORDINARIA - REALE MUTUA NEVE", price: 40, insurance: "BASE", insurance_paid: true, min_role: "utente" },
    { category: "TESSERA", name: "TESSERA ORDINARIA - REALE TOTAL SPORT", price: 65, insurance: "SPORT", insurance_paid: true, min_role: "utente" },
    { category: "TESSERA", name: "SOLO TESSERA - NO ASSICURAZIONE", price: 20, insurance: null, insurance_paid: true, min_role: "utente" },
    { category: "PRESCIISTICA", name: "CORSO PRESCIISTICA", price: 90, insurance: null, insurance_paid: true, min_role: "utente" },
  ];
  const ASSICURAZIONI_PROVA = [{ code: "BASE", name: "REALE MUTUA NEVE", price: 20 }, { code: "SPORT", name: "REALE TOTAL SPORT", price: 45 }];
  const SOCIO = { id: "M", last_name: "PRESCI", first_name: "PIA", updated_at: "1", enrolled_at: "2026-10-14", paid: 0, total: 155,
    total_manual: false, card_type: "TESSERA ORDINARIA - REALE MUTUA NEVE", preski_type: "CORSO PRESCIISTICA", insurance: "SPORT" };
  const salvati = [];

  FINTO.risposta = (t, r) => {
    const scrittura = r.filtri.find((f) => f[0] === "insert" || f[0] === "update");
    if (t === "members" && scrittura) { salvati.push(scrittura[1]); return [{ id: "NUOVO", updated_at: "2" }]; }
    if (t === "prices") return LISTINO;
    if (t === "insurances") return ASSICURAZIONI_PROVA;
    if (t === "members" && r.filtri.some((f) => f[0] === "eq" && f[1] === "id")) return [SOCIO];
    return [];
  };

  const scegli = (gruppo, voce) =>
    [...el(gruppo).querySelectorAll("input")].find((r) => r.dataset.nome === voce || r.value === voce).click();
  const compila = () => { el("f_cognome").value = "Presci"; el("f_nome").value = "Pia"; el("f_telefono").value = "333"; };
  const assicurazione = () => el("f_assicurazione").querySelector("input:checked")?.value;
  const ultimo = () => (salvati.length ? salvati[salvati.length - 1].insurance : "niente salvato");

  window.addEventListener("load", () => setTimeout(async () => {
    if (!el("f_assicurazione")) { document.title = "RISULTATO scelta=NO(nella pagina non c'è la scelta dell'assicurazione)"; return; }
    const r = [];
    const prova = (nome, vero, perche) => r.push(`${nome}=${vero ? "ok" : `NO(${perche})`}`);
    const box = el("f_assicurazione");

    scegli("f_tipologia_tessera", "TESSERA ORDINARIA - REALE MUTUA NEVE");
    prova("senzaPresciistica", box.hidden, "la scelta si vede senza presciistica");
    scegli("f_presciistica", "CORSO PRESCIISTICA");
    prova("compare", !box.hidden && assicurazione() === "BASE" && totaleIndividuale() === 130,
      `nascosta ${box.hidden}, scelta ${assicurazione()}, totale ${totaleIndividuale()}`);
    compila();
    await scrivi();
    prova("baseNonSiSalva", ultimo() === null, `salvata ${ultimo()}`);

    scegli("f_tipologia_tessera", "TESSERA ORDINARIA - REALE MUTUA NEVE");
    scegli("f_presciistica", "CORSO PRESCIISTICA");
    scegli("f_assicurazione", "SPORT");
    prova("sportCosta", totaleIndividuale() === 155, `totale ${totaleIndividuale()}`);
    compila();
    await scrivi();
    prova("sportSiSalva", ultimo() === "SPORT", `salvata ${ultimo()}`);

    scegli("f_tipologia_tessera", "SOLO TESSERA - NO ASSICURAZIONE");
    scegli("f_presciistica", "CORSO PRESCIISTICA");
    prova("tesseraSenza", !box.hidden && assicurazione() === "BASE" && totaleIndividuale() === 130,
      `scelta ${assicurazione()}, totale ${totaleIndividuale()}`);
    compila();
    await scrivi();
    prova("tesseraSenzaSiSalva", ultimo() === "BASE", `salvata ${ultimo()}`);

    scegli("f_tipologia_tessera", "TESSERA ORDINARIA - REALE MUTUA NEVE");
    scegli("f_presciistica", "CORSO PRESCIISTICA");
    scegli("f_assicurazione", "SPORT");
    scegli("f_presciistica", "");
    prova("tolta", box.hidden && totaleIndividuale() === 40, `nascosta ${box.hidden}, totale ${totaleIndividuale()}`);
    compila();
    await scrivi();
    prova("toltaSiSvuota", ultimo() === null, `salvata ${ultimo()}`);

    scegli("f_tipologia_tessera", "TESSERA ORDINARIA - REALE MUTUA NEVE");
    scegli("f_presciistica", "CORSO PRESCIISTICA");
    scegli("f_tipologia_tessera", "TESSERA ORDINARIA - REALE TOTAL SPORT");
    prova("cambioTessera", assicurazione() === "SPORT" && totaleIndividuale() === 155,
      `scelta ${assicurazione()}, totale ${totaleIndividuale()}`);
    compila();
    await scrivi();
    prova("cambioTesseraNonSiSalva", ultimo() === null, `salvata ${ultimo()}`);

    await caricaSocio("M");
    prova("riaperto", !box.hidden && assicurazione() === "SPORT" && totaleIndividuale() === 155,
      `scelta ${assicurazione()}, totale ${totaleIndividuale()}`);

    document.title = "RISULTATO " + r.join(" ");
  }, 500));
}
