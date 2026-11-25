// Soci (index.html), richiesta del 25/11/2026 per le iscrizioni della serata:
// - Il telefono non è più obbligatorio: senza telefono il socio si salva (niente asterisco, niente «required») e il
//   telefono vuoto va nel database come null, come l'email.
// - Nella finestra di conferma del salvataggio, in cima, il numero di tessera e subito sotto il tipo di tessera che
//   si sta registrando: la tessera scelta, oppure da cosa è coperto (presciistica che la comprende, agevolazione).
// In un blocco: gli script della pagina e della prova hanno gli stessi nomi globali.
{
  const ORDINARIA = "TESSERA ORDINARIA - REALE MUTUA NEVE";
  const PRICE_LIST = [
    { category: "TESSERA", name: ORDINARIA, price: 20, min_role: "utente", insurance: "BASE" },
    { category: "PRESCIISTICA", name: "CORSO PRESCIISTICA", price: 70, course_only: false, min_role: "utente" },
  ];
  const INSURANCES = [{ code: "BASE", name: "REALE MUTUA NEVE", price: 20 }];
  const WRITES = [];
  FAKE.risposta = (t, r) => {
    const insert = r.filtri.find((f) => f[0] === "insert");
    if (t === "members" && insert) { WRITES.push(insert[1]); return [{ id: "nuovo", ...insert[1] }]; }
    return t === "prices" ? PRICE_LIST : t === "insurances" ? INSURANCES : [];
  };
  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const rows = () => [...document.querySelectorAll("#finestraDomanda tr")]
    .map((tr) => [tr.querySelector("th")?.textContent.trim(), tr.querySelector("td")?.textContent.trim()]);
  const close = () => document.querySelector("#finestraDomanda [data-no]")?.click();

  window.addEventListener("load", () => setTimeout(async () => {
    const r = [];
    const test = (nome, passed, why) => r.push(`${nome}=${passed ? "ok" : `NO(${why})`}`);
    try {
      const phone = el("f_telefono"), label = document.querySelector('label[for="f_telefono"]');
      test("telefonoFacoltativo", !phone.required && !label.textContent.includes("*"), `required ${phone.required}, etichetta «${label.textContent}»`);

      el("f_cognome").value = "Prova"; el("f_nome").value = "Senza Telefono"; phone.value = "";
      [...el("f_tipologia_tessera").querySelectorAll("input")].find((x) => x.dataset.nome === ORDINARIA)?.click();
      el("f_numero_tessera").value = "45";
      await wait(300);
      await save(); await wait(300);
      const first = rows();
      test("inCima", first[0]?.[0] === "Numero tessera" && first[0]?.[1] === "45"
        && first[1]?.[0] === "Tipo di tessera" && first[1]?.[1] === ORDINARIA, JSON.stringify(first.slice(0, 3)));

      close();

      // La presciistica comprende la tessera: il tipo dice da dove viene.
      [...el("f_presciistica").querySelectorAll("input")].find((x) => x.dataset.nome === "CORSO PRESCIISTICA")?.click();
      el("f_numero_tessera").value = "46";
      await wait(300);
      await save(); await wait(300);
      const preski = rows();
      test("presciistica", preski[0]?.[1] === "46" && preski[1]?.[0] === "Tipo di tessera"
        && preski[1]?.[1] === "Compresa nella presciistica (CORSO PRESCIISTICA)", JSON.stringify(preski.slice(0, 3)));

      // «Salva» nella finestra: il socio senza telefono si scrive, col telefono null.
      document.querySelector("#finestraDomanda [data-si]")?.click();
      await wait(800);
      test("salvatoSenzaTelefono", WRITES.length === 1 && WRITES[0].phone === null, JSON.stringify(WRITES.map((w) => w.phone)));
    } catch (e) { r.push(`eccezione=NO(${String(e?.message || e).slice(0, 120)})`); }
    document.title = "RISULTATO " + r.join(" ");
  }, 500));
}
