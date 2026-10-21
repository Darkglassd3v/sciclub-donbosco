// Soci (index.html): la presciistica comprende tessera, quota e assicurazione.
// - Due voci nel listino: «CORSO PRESCIISTICA» 90 (70 + Base 20) e «CORSO
//   PRESCIISTICA - REALE TOTAL SPORT» 120 (75 + Sport 45). Il finto dà già
//   card_price in `price`, come la select di caricaPrezzi().
// - Con la presciistica la tessera non si somma (la comprende), e sotto la
//   tessera lo dice una nota; tolta la presciistica la tessera conta di nuovo.
// - Niente scelta dell'assicurazione a parte e niente `insurance` nel
//   salvataggio: l'assicurazione la dice la voce della presciistica.
// In un blocco: gli script della pagina e della prova hanno gli stessi nomi globali.
{
  const LISTINO = [
    { category: "TESSERA", name: "TESSERA ORDINARIA - REALE MUTUA NEVE", price: 40, min_role: "utente" },
    { category: "TESSERA", name: "SOLO TESSERA - NO ASSICURAZIONE", price: 20, min_role: "utente" },
    { category: "PRESCIISTICA", name: "CORSO PRESCIISTICA", price: 90, insurance: "BASE", min_role: "utente" },
    { category: "PRESCIISTICA", name: "CORSO PRESCIISTICA - REALE TOTAL SPORT", price: 120, insurance: "SPORT", min_role: "utente" },
  ];
  const SOCIO = { id: "M", last_name: "PRESCI", first_name: "PIA", updated_at: "1", enrolled_at: "2026-10-14", paid: 0, total: 120,
    total_manual: false, card_type: "TESSERA ORDINARIA - REALE MUTUA NEVE", preski_type: "CORSO PRESCIISTICA - REALE TOTAL SPORT" };
  const salvati = [];

  FINTO.risposta = (t, r) => {
    const scrittura = r.filtri.find((f) => f[0] === "insert" || f[0] === "update");
    if (t === "members" && scrittura) { salvati.push(scrittura[1]); return [{ id: "NUOVO", updated_at: "2" }]; }
    if (t === "prices") return LISTINO;
    if (t === "members" && r.filtri.some((f) => f[0] === "eq" && f[1] === "id")) return [SOCIO];
    return [];
  };

  const scegli = (gruppo, voce) =>
    [...el(gruppo).querySelectorAll("input")].find((r) => r.dataset.nome === voce || r.value === voce).click();
  const compila = () => { el("f_cognome").value = "Presci"; el("f_nome").value = "Pia"; el("f_telefono").value = "333"; };
  const ultimo = () => salvati[salvati.length - 1] || {};
  const nota = () => el("notaPresciistica");

  window.addEventListener("load", () => setTimeout(async () => {
    const r = [];
    const prova = (nome, vero, perche) => r.push(`${nome}=${vero ? "ok" : `NO(${perche})`}`);

    prova("senzaScelta", !el("f_assicurazione"), "c'è ancora la scelta dell'assicurazione a parte");
    if (!nota()) { document.title = "RISULTATO " + r.concat("nota=NO(manca #notaPresciistica)").join(" "); return; }

    scegli("f_tipologia_tessera", "TESSERA ORDINARIA - REALE MUTUA NEVE");
    prova("soloTessera", totaleIndividuale() === 40 && nota().hidden, `totale ${totaleIndividuale()}, nota nascosta ${nota().hidden}`);

    scegli("f_presciistica", "CORSO PRESCIISTICA");
    prova("presciBase", totaleIndividuale() === 90 && !nota().hidden, `totale ${totaleIndividuale()}, nota nascosta ${nota().hidden}`);
    compila();
    await scrivi();
    prova("salvaBase", !("insurance" in ultimo()) && ultimo().preski_type === "CORSO PRESCIISTICA" && ultimo().total === 90,
      `insurance ${"insurance" in ultimo()}, preski_type ${ultimo().preski_type}, totale ${ultimo().total}`);

    scegli("f_tipologia_tessera", "TESSERA ORDINARIA - REALE MUTUA NEVE");
    scegli("f_presciistica", "CORSO PRESCIISTICA - REALE TOTAL SPORT");
    prova("presciSport", totaleIndividuale() === 120, `totale ${totaleIndividuale()}`);
    compila();
    await scrivi();
    prova("salvaSport", !("insurance" in ultimo()) && ultimo().preski_type === "CORSO PRESCIISTICA - REALE TOTAL SPORT" && ultimo().total === 120,
      `insurance ${"insurance" in ultimo()}, preski_type ${ultimo().preski_type}, totale ${ultimo().total}`);

    scegli("f_tipologia_tessera", "SOLO TESSERA - NO ASSICURAZIONE");
    scegli("f_presciistica", "CORSO PRESCIISTICA");
    prova("tesseraSenza", totaleIndividuale() === 90, `totale ${totaleIndividuale()}`);

    scegli("f_tipologia_tessera", "TESSERA ORDINARIA - REALE MUTUA NEVE");
    scegli("f_presciistica", "CORSO PRESCIISTICA - REALE TOTAL SPORT");
    scegli("f_presciistica", "");
    prova("tolta", totaleIndividuale() === 40 && nota().hidden, `totale ${totaleIndividuale()}, nota nascosta ${nota().hidden}`);

    await caricaSocio("M");
    prova("riaperto", totaleIndividuale() === 120 && !nota().hidden, `totale ${totaleIndividuale()}, nota nascosta ${nota().hidden}`);

    document.title = "RISULTATO " + r.join(" ");
  }, 500));
}
