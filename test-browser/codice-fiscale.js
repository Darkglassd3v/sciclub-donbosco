// Soci (index.html): il codice fiscale si calcola con «Calcola», l'errore è uno solo.
// - Calcola col modulo vuoto: i dati che mancano hanno il bordo rosso e l'avviso li dice.
// - Sesso non scelto: lo si prende dai soci con lo stesso nome; se non si sa, manca.
// - Luogo dove non è nato nessun socio col codice: non si calcola, il luogo è bordato.
// - Codice proposto: è un pulsante, il click lo scrive nel campo (anche sopra uno sbagliato).
// - Codice sbagliato: «Codice fiscale errato, codice proposto: …», senza il motivo.
// - Campo vuoto e dati completi (sesso dal nome): il codice compare da solo.
// In un blocco: gli script della pagina e della prova hanno gli stessi nomi globali.
{
  const LISTINO = [{ category: "TESSERA", name: "TESSERA ORDINARIA - REALE MUTUA NEVE", price: 40, min_role: "utente" }];
  const cf = (cognome, nome, dataNascita, sesso) => calcolaCF({ cognome, nome, dataNascita, sesso, comune: "A479" });
  // Tre soci nati ad ASTI (A479), due che si chiamano MARIO. Calcolati al load:
  // codicefiscale.js arriva dopo questo script.
  let DI_ASTI = [], MARIO = [];
  FINTO.risposta = (t, r) => {
    if (t === "prices") return LISTINO;
    const eq = (campo) => r.filtri.find((f) => f[0] === "eq" && f[1] === campo)?.[2];
    if (t === "members" && eq("birth_place") === "ASTI") return DI_ASTI.map((tax_code) => ({ tax_code }));
    if (t === "members" && eq("first_name") === "MARIO") return MARIO.map((tax_code) => ({ tax_code }));
    return [];
  };

  const aspetta = (ms) => new Promise((fine) => setTimeout(fine, ms));
  const rosso = (campo) => bordoDelCampo(campo).classList.contains("campo-errore");
  const avviso = () => el("avvisoCF");
  const testo = () => (avviso().hidden ? "" : avviso().textContent.replace(/\s+/g, " ").trim());
  const proposto = () => (avviso().hidden ? null : avviso().querySelector("button"));
  const scrivi = (id, valore, evento = "change") => { el(id).value = valore; el(id).dispatchEvent(new Event(evento, { bubbles: true })); };
  const sesso = () => document.querySelector("input[name=sessoCF]");
  const calcola = async () => { el("btnCalcolaCF").click(); await aspetta(300); };

  window.addEventListener("load", () => setTimeout(async () => {
    const r = [];
    const prova = (nome, vero, perche) => r.push(`${nome}=${vero ? "ok" : `NO(${perche})`}`);
    DI_ASTI = [cf("BIANCHI", "LUCA", "1970-05-05", "M"), cf("VERDI", "ANNA", "1975-03-08", "F"), cf("NERI", "PIA", "1990-12-24", "F")];
    MARIO = [cf("GIALLI", "MARIO", "1960-02-02", "M"), cf("BLU", "MARIO", "1985-07-07", "M")];
    if (!el("btnCalcolaCF")) { document.title = "RISULTATO pulsante=NO(manca #btnCalcolaCF)"; return; }

    await calcola();
    const mancano = ["f_cognome", "f_nome", "f_data_nascita", "f_luogo_nascita"].filter((id) => !rosso(el(id)));
    prova("mancanoRossi", !mancano.length && rosso(sesso()), `non bordati: ${mancano.join(", ")}, sesso ${rosso(sesso())}`);
    prova("mancanoDetti", /manca/i.test(testo()) && /data di nascita/i.test(testo()) && /sesso/i.test(testo()), `avviso «${testo()}»`);

    el("f_cognome").value = "Rossi";
    el("f_nome").value = "Mario";
    el("f_data_nascita").value = "1980-01-01";
    el("f_luogo_nascita").value = "Asti";
    const giusto = cf("ROSSI", "MARIO", "1980-01-01", "M");
    await calcola();
    prova("sessoDalNome", proposto()?.textContent.includes(giusto), `avviso «${testo()}»`);
    proposto()?.click();
    prova("clickScrive", el("f_codice_fiscale").value === giusto && avviso().hidden, `campo «${el("f_codice_fiscale").value}»`);

    el("f_codice_fiscale").value = "";
    el("f_nome").value = "Andrea";
    await calcola();
    prova("sessoMancante", rosso(sesso()) && /sesso/i.test(testo()) && !proposto(), `sesso ${rosso(sesso())}, avviso «${testo()}»`);

    el("f_nome").value = "Mario";
    el("f_luogo_nascita").value = "Parigi";
    await calcola();
    prova("luogoSconosciuto", rosso(el("f_luogo_nascita")) && /tessera sanitaria/i.test(testo()) && !proposto(),
      `luogo ${rosso(el("f_luogo_nascita"))}, avviso «${testo()}»`);

    el("f_luogo_nascita").value = "Asti";
    const sbagliato = giusto.slice(0, 15) + (giusto[15] === "A" ? "B" : "A");
    scrivi("f_codice_fiscale", sbagliato);
    await aspetta(300);
    prova("erratoGenerico", testo().startsWith("Codice fiscale errato, codice proposto:") && !/dovrebbe|carattere/i.test(testo())
      && proposto()?.textContent.includes(giusto), `avviso «${testo()}»`);
    proposto()?.click();
    prova("clickSopraSbagliato", el("f_codice_fiscale").value === giusto, `campo «${el("f_codice_fiscale").value}»`);

    resetForm();
    el("f_cognome").value = "Rossi";
    el("f_nome").value = "Mario";
    el("f_luogo_nascita").value = "Asti";
    scrivi("f_data_nascita", "1980-01-01");
    await aspetta(300);
    prova("daSolo", proposto()?.textContent.includes(giusto) && testo().startsWith("Codice proposto:"), `avviso «${testo()}»`);

    document.title = "RISULTATO " + r.join(" ");
  }, 500));
}
