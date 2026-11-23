// Impostazioni (impostazioni.html), sci club affiliati (dalla 3.12, richiesta del 23/11/2026): l'elenco dei club
// da cui può arrivare un socio, che in Soci si sceglie nel menu «Sci club di provenienza».
// - Il riquadro «Sci club affiliati» mostra i club con nome modificabile, Salva ed Elimina.
// - Aggiungere scrive il nome in maiuscolo, senza spazi in più; senza nome il campo ha il bordo rosso.
// - Rinominare aggiorna il club (lo stesso per tutti i soci che lo hanno).
// - Eliminare chiede due conferme; un club che ha ancora soci (23503) non si elimina e lo dice.
// Gira a 1280 e a 500 px (esegui.sh).
// In un blocco: gli script della pagina e della prova hanno gli stessi nomi globali.
{
  const written = [];
  let inUse = false;
  FAKE.risposta = (t, r) => {
    const writing = r.filtri.find((f) => ["update", "insert", "delete"].includes(f[0]));
    if (writing && t === "affiliated_clubs") { written.push([writing[0], writing[1], r.filtri]); return [{ id: 7 }]; }
    if (writing) return [{ id: 1 }];
    if (t === "affiliated_clubs") return [{ id: 7, name: "SCI CLUB MONCALVO" }];
    if (t === "insurances") return [{ code: "BASE", name: "REALE MUTUA NEVE", price: 20 }];
    return [];
  };
  FAKE.errore = (t, r) => (inUse && t === "affiliated_clubs" && r.filtri.some((f) => f[0] === "delete")
    ? { code: "23503", message: "violates foreign key constraint" } : null);
  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const confirm = async () => { await wait(200); document.querySelector("#finestraDomanda [data-si]")?.click(); await wait(300); };
  const toastText = () => el("statusToast")?.textContent || "";

  window.addEventListener("load", () => setTimeout(async () => {
    const r = [];
    const test = (nome, passed, why) => r.push(`${nome}=${passed ? "ok" : `NO(${why})`}`);
    try {
      await wait(500);
      const table = el("tabellaClub");
      const section = table?.closest("section");
      test("riquadro", Boolean(section) && /Sci club affiliati/.test(section.querySelector("h2")?.textContent || ""),
        section ? section.querySelector("h2")?.textContent.trim() : "manca #tabellaClub");
      const row = table?.querySelector("tr[data-id='7']");
      test("riga", row?.querySelector("[data-nome]")?.value === "SCI CLUB MONCALVO" && Boolean(row.querySelector("[data-salva]"))
        && Boolean(row.querySelector("[data-togli]")), row?.outerHTML.slice(0, 120));

      el("nuovoClubNome").value = "";
      el("btnAggiungiClub").click();
      await wait(200);
      test("senzaNome", el("nuovoClubNome").getAttribute("aria-invalid") === "true" && !written.length, `scritto ${written.length}`);
      el("nuovoClubNome").value = "  sci   club   canelli ";
      el("btnAggiungiClub").click();
      await wait(400);
      const added = written.find(([kind]) => kind === "insert");
      test("aggiunto", added?.[1]?.name === "SCI CLUB CANELLI", JSON.stringify(added?.[1]));

      const first = el("tabellaClub").querySelector("tr[data-id='7']");
      first.querySelector("[data-nome]").value = "Sci Club Moncalvo Asti";
      first.querySelector("[data-nome]").dispatchEvent(new Event("input", { bubbles: true }));
      first.querySelector("[data-salva]").click();
      await wait(300);
      const renamed = written.find(([kind]) => kind === "update");
      test("rinominato", renamed?.[1]?.name === "SCI CLUB MONCALVO ASTI" && renamed[2].some((f) => f[0] === "eq" && f[1] === "id" && String(f[2]) === "7"),
        JSON.stringify(renamed?.[1]));

      inUse = true;
      el("tabellaClub").querySelector("tr[data-id='7'] [data-togli]").click();
      await confirm();
      await confirm();
      await wait(300);
      const tried = written.some(([kind]) => kind === "delete");
      test("usatoNonEliminato", tried && Boolean(el("tabellaClub").querySelector("tr[data-id='7']")) && /ancora soci/.test(toastText()),
        `tentato ${tried}, «${toastText().slice(0, 120)}»`);

      test("telefono", document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
        `${document.documentElement.scrollWidth} > ${document.documentElement.clientWidth}`);
    } catch (e) { r.push(`eccezione=NO(${String(e?.message || e).slice(0, 120)})`); }
    document.title = "RISULTATO " + r.join(" ");
  }, 600));
}
