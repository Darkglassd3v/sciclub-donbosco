// Assicurazione (assicurazione.html), dalla 3.15.2: nella lista dei da assicurare il codice fiscale si legge
// soltanto e a destra c'è una casella grande che dice se il socio entra nella lista.
// - Nessun campo né «Salva» nella lista: il codice si vede come testo, con l'avviso se non torna.
// - Ultima colonna «Assicura»: casella grande con «Assicura: sì» o «Assicura: no»; spenta, la riga è grigia.
// - Senza codice fiscale niente casella: «Senza codice fiscale» e il pulsante «Correggi il codice fiscale».
// - «Correggi il codice fiscale» cerca il socio in «Correzione del codice fiscale», dove il codice si scrive e si
//   salva; salvato, nella lista il socio ha il codice e la casella.
// In un blocco: gli script della pagina e della prova hanno gli stessi nomi globali.
{
  const member = (id, taxCode) => ({ id, last_name: id, first_name: "PROVA", birth_date: "1980-01-01",
    tax_code: taxCode, insurance: "BASE" });
  FAKE.rpc.insurance_members = [member("B001", "RSSMRA80A01F205X"), member("B002", null), member("B003", "RSSMRA80A01F205X")];
  FAKE.rpc.insurance_sent_lists = [];
  FAKE.rpc.insurance_search = [{ ...member("B002", null), list_number: null }];
  FAKE.rpc.set_tax_code = null;
  FAKE.risposta = (t) => (t === "insurances" ? [{ code: "BASE", name: "REALE MUTUA NEVE" }] : []);

  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const clean = (node) => node?.textContent.replace(/\s+/g, " ").trim() || "";
  const row = (id) => document.querySelector(`#elencoDa tr[data-id="${id}"]`);
  const box = (id) => row(id)?.querySelector("td:last-child input.assicura");

  window.addEventListener("load", () => setTimeout(async () => {
    const r = [];
    const test = (nome, passed, why) => r.push(`${nome}=${passed ? "ok" : `NO(${why})`}`);
    if (!row("B001")) { document.title = "RISULTATO caricata=NO(nessuna riga)"; return; }

    test("solaLettura", !document.querySelector("#elencoDa input.cf") && !document.querySelector("#elencoDa .salva-riga")
      && clean(row("B001").querySelector(".cf-testo")) === "RSSMRA80A01F205X",
      `campi ${document.querySelectorAll("#elencoDa input.cf").length}, salva ${document.querySelectorAll("#elencoDa .salva-riga").length}, testo «${clean(row("B001").querySelector(".cf-testo"))}»`);
    const headers = [...el("elencoDa").closest("table").querySelectorAll("thead th")].map(clean);
    const size = box("B001")?.getBoundingClientRect().width || 0;
    test("casellaGrande", headers.at(-1) === "Assicura" && size >= 28 && box("B001")?.checked
      && clean(box("B001").closest("label")) === "Assicura: sì",
      `intestazioni ${headers.join("|")}, casella ${size}px, etichetta «${clean(box("B001")?.closest("label"))}»`);
    box("B001")?.click();
    await wait(100);
    test("spenta", box("B001")?.checked === false && clean(box("B001")?.closest("label")) === "Assicura: no"
      && row("B001").classList.contains("non-selezionata"), `etichetta «${clean(box("B001")?.closest("label"))}», classi «${row("B001").className}»`);
    box("B001")?.click();
    await wait(100);

    const fix = row("B002")?.querySelector(".correggi-cf");
    test("senzaCF", !box("B002") && clean(row("B002")).includes("Senza codice fiscale") && Boolean(fix),
      `casella ${Boolean(box("B002"))}, riga «${clean(row("B002")).slice(0, 120)}»`);
    fix?.click();
    await wait(300);
    const found = document.querySelector('#elencoCerca tr[data-id="B002"] input.cf');
    test("correggi", el("cerca").value.includes("B002") && Boolean(found) && document.activeElement === found,
      `cerca «${el("cerca").value}», trovato ${Boolean(found)}, fuoco ${document.activeElement?.className}`);
    if (found) {
      found.value = "RSSMRA80A01F205X";
      found.closest("tr").querySelector(".salva-riga").click();
      await wait(300);
    }
    test("salvatoInLista", clean(row("B002")?.querySelector(".cf-testo")) === "RSSMRA80A01F205X" && box("B002")?.checked === true,
      `testo «${clean(row("B002")?.querySelector(".cf-testo"))}», casella ${box("B002")?.checked}`);

    document.title = "RISULTATO " + r.join(" ");
  }, 500));
}
