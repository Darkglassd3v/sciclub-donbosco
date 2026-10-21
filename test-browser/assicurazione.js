// Assicurazione (assicurazione.html): «Da assicurare» a pagine di 25, per tipo.
// - Sotto ogni gruppo «‹ Indietro · 26–50 di 60 · Avanti ›»; con 25 o meno niente pulsanti.
// - Nel titolo del gruppo quanti sono senza codice fiscale (le righe rosse, sparse fra le pagine).
// - Dopo Salva si resta sulla pagina, e un codice scritto e non salvato su un'altra riga resta;
//   lista accorciata: l'ultima pagina che c'è.
// - Un codice fiscale scritto e non salvato: prima di cambiare pagina lo si chiede.
// - Gli Excel prendono tutti i soci col codice fiscale, non solo la pagina.
// - Un codice fiscale sbagliato dice solo «Codice fiscale errato» (e il proposto), senza il motivo.
// - Cambiata pagina il fuoco resta su Indietro/Avanti (tastiera), anche all'ultima.
// In un blocco: gli script della pagina e della prova hanno gli stessi nomi globali.
{
  const numero = (i) => String(i).padStart(3, "0");
  // 60 Base (senza codice fiscale il 17, il 34 e il 51) e 3 Sport.
  const socio = (lettera, i, tipo) => ({ id: lettera + numero(i), last_name: lettera + numero(i), first_name: "PROVA",
    birth_date: "1980-01-01", tax_code: lettera === "B" && i % 17 === 0 ? null : "XXXXXX80A01F205X", insurance: tipo });
  const base = (n) => Array.from({ length: n }, (_, i) => socio("B", i + 1, "BASE"));
  const SPORT = [1, 2, 3].map((i) => socio("S", i, "SPORT"));
  FINTO.rpc.insurance_members = [...base(60), ...SPORT];
  FINTO.rpc.insurance_sent_lists = [];
  FINTO.rpc.set_tax_code = null;
  FINTO.risposta = (t) => (t === "insurances"
    ? [{ code: "BASE", name: "REALE MUTUA NEVE" }, { code: "SPORT", name: "REALE TOTAL SPORT" }] : []);

  const aspetta = (ms) => new Promise((fine) => setTimeout(fine, ms));
  const righe = (lettera) => [...document.querySelectorAll(`#elencoDa tr[data-id^="${lettera}"]`)];
  const pagine = (kind) => document.querySelector(`#elencoDa tr.pagine[data-kind="${kind}"]`);
  const testo = (kind) => pagine(kind)?.querySelector(".pagine-testo")?.textContent.trim();
  const avanti = (kind) => pagine(kind).querySelector("[data-avanti]");
  const indietro = (kind) => pagine(kind).querySelector("[data-indietro]");
  const domanda = () => document.getElementById("finestraDomanda");

  window.addEventListener("load", () => setTimeout(async () => {
    const r = [];
    const prova = (nome, vero, perche) => r.push(`${nome}=${vero ? "ok" : `NO(${perche})`}`);
    if (!pagine("BASE")) { document.title = `RISULTATO pagine=NO(nessuna riga tr.pagine, ${righe("B").length} righe Base)`; return; }

    const titoloBase = [...document.querySelectorAll("#elencoDa tr.gruppo")].find((t) => t.textContent.includes("REALE MUTUA NEVE"));
    prova("prima", righe("B").length === 25 && testo("BASE") === "1–25 di 60" && indietro("BASE").disabled,
      `${righe("B").length} righe, «${testo("BASE")}», indietro spento ${indietro("BASE").disabled}`);
    prova("pocheSenzaPagine", righe("S").length === 3 && !pagine("SPORT"), `${righe("S").length} Sport, pagine ${Boolean(pagine("SPORT"))}`);
    prova("senzaCF", titoloBase?.textContent.includes("3 senza codice fiscale"), `titolo «${titoloBase?.textContent.trim()}»`);

    const avvisoCF = righe("B")[0]?.querySelector(".avviso-cf");
    const testoCF = avvisoCF && !avvisoCF.hidden ? avvisoCF.textContent.replace(/\s+/g, " ").trim() : "";
    prova("cfGenerico", testoCF.startsWith("Codice fiscale errato") && !/dovrebbe|lettere|carattere/i.test(testoCF), `avviso «${testoCF}»`);

    avanti("BASE").click();
    prova("avanti", righe("B")[0]?.dataset.id === "B026" && righe("B").length === 25 && testo("BASE") === "26–50 di 60",
      `prima ${righe("B")[0]?.dataset.id}, «${testo("BASE")}»`);

    const b026 = righe("B")[0];
    b026.querySelector(".cf").value = "RSSMRA80A01F205X";
    righe("B")[2].querySelector(".cf").value = "ABC";   // B028, scritto e non salvato
    b026.querySelector(".salva-riga").click();
    await aspetta(300);
    prova("salvaResta", testo("BASE") === "26–50 di 60" && righe("B")[0]?.dataset.id === "B026", `«${testo("BASE")}»`);
    const b028 = righe("B")[2]?.querySelector(".cf");
    prova("salvaNonPerde", b028?.value === "ABC", `B028 «${b028?.value}»`);

    righe("B")[1].querySelector(".cf").value = "ABC";
    avanti("BASE").click();
    prova("chiede", Boolean(domanda()) && testo("BASE") === "26–50 di 60", `domanda ${Boolean(domanda())}, «${testo("BASE")}»`);
    domanda()?.querySelector("[data-no]").click();
    prova("annulla", !domanda() && testo("BASE") === "26–50 di 60" && righe("B")[1].querySelector(".cf").value === "ABC",
      `domanda ${Boolean(domanda())}, «${testo("BASE")}»`);
    avanti("BASE").click();
    domanda()?.querySelector("[data-si]").click();
    prova("ultima", righe("B").length === 10 && testo("BASE") === "51–60 di 60" && avanti("BASE").disabled,
      `${righe("B").length} righe, «${testo("BASE")}», avanti spento ${avanti("BASE")?.disabled}`);
    // All'ultima pagina Avanti è spento: il fuoco va su Indietro, non si perde.
    prova("fuoco", document.activeElement === indietro("BASE"), `fuoco su ${document.activeElement?.tagName} ${document.activeElement?.textContent.trim().slice(0, 20)}`);
    indietro("BASE").click();
    prova("indietro", !domanda() && testo("BASE") === "26–50 di 60", `domanda ${Boolean(domanda())}, «${testo("BASE")}»`);
    avanti("BASE").click();

    const scaricati = [];
    excelLista = async (t, n, d, soci) => { scaricati.push(`${t.kind}:${soci.length}`); };
    await scaricaTutte();
    prova("excelTutti", scaricati.join(",") === "BASE:57,SPORT:3", `scaricati ${scaricati.join(",")}`);

    FINTO.rpc.insurance_members = [...base(30), ...SPORT];
    await carica();
    prova("accorciata", testo("BASE") === "26–30 di 30" && righe("B").length === 5, `«${testo("BASE")}», ${righe("B").length} righe`);

    document.title = "RISULTATO " + r.join(" ");
  }, 500));
}
