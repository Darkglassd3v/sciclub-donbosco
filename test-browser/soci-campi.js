// Soci (index.html): campi che lasciavano salvare valori sbagliati.
// - Totale a mano spuntato e campo vuoto: non si salva 0, il campo è bordato.
// - Acconto negativo: non si salva, il campo è bordato.
// - Tolto il pagante (capofamiglia con l'agevolazione), la tessera torna obbligatoria.
// In un blocco: gli script della pagina e della prova hanno gli stessi nomi globali.
{
  const LISTINO = [
    { category: "TESSERA", name: "TESSERA ORDINARIA - REALE MUTUA NEVE", price: 40, insurance: "BASE", min_role: "utente" },
    { category: "FAMIGLIA", name: "3 PERSONE CON ASSICURAZIONE", price: 110, insurance: "BASE", people: 3, min_role: "utente" },
  ];
  const CAPO = { id: "CAPO", last_name: "ROSSI", first_name: "MARIO", family_discount: "3 PERSONE CON ASSICURAZIONE", card_type: null };
  FINTO.risposta = (t, r) => {
    if (t === "prices") return LISTINO;
    const eq = (campo) => r.filtri.find((f) => f[0] === "eq" && f[1] === campo)?.[2];
    if (t === "members" && eq("id") === "CAPO") return [CAPO];
    return [];
  };
  const aspetta = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const rosso = (id) => el(id).classList.contains("campo-errore");
  const domanda = () => document.getElementById("finestraDomanda");
  const tesseraObbligatoria = () => [...el("f_tipologia_tessera").querySelectorAll("input")].some((x) => x.required);

  window.addEventListener("load", () => setTimeout(async () => {
    const r = [];
    const prova = (nome, vero, perche) => r.push(`${nome}=${vero ? "ok" : `NO(${perche})`}`);
    el("f_cognome").value = "Prova"; el("f_nome").value = "Uno"; el("f_telefono").value = "333";
    [...el("f_tipologia_tessera").querySelectorAll("input")][0].click();

    el("f_totale_a_mano").click();
    el("f_totale_manuale").value = "";
    await salva();
    await aspetta(300);
    prova("totaleVuoto", rosso("f_totale_manuale") && !domanda(), `bordato ${rosso("f_totale_manuale")}, domanda ${Boolean(domanda())}`);
    el("f_totale_a_mano").click();

    el("f_acconto").value = "-10";
    await salva();
    await aspetta(300);
    prova("accontoNegativo", rosso("f_acconto") && !domanda(), `bordato ${rosso("f_acconto")}, domanda ${Boolean(domanda())}`);
    el("f_acconto").value = "0";

    resetForm();
    await scegliPagante("CAPO", "ROSSI MARIO");
    await aspetta(300);
    const coperto = !tesseraObbligatoria();
    rimuoviPagante();
    prova("toltoPagante", coperto && tesseraObbligatoria(), `coperto ${coperto}, poi obbligatoria ${tesseraObbligatoria()}`);

    document.title = "RISULTATO " + r.join(" ");
  }, 500));
}
