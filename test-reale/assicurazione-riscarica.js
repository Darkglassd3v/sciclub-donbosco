// PAGINA: assicurazione.html
// RUOLO: superadmin
// Assicurazione, sulla copia: «Riscarica» di una lista mandata con più di 1000 soci
// (le righe che Supabase dà a richiesta) li mette tutti nel file.
{
  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  window.addEventListener("load", () => setTimeout(async () => { try {
    let inFile = null;
    excelList = async (t, n, d, members) => { inFile = members.length; };
    const listItems = sentLists.find((l) => l.id === EXPECTED.id);
    if (!listItems) { document.title = "RISULTATO lista=NO(la lista della prova non è fra quelle mandate)"; return; }
    document.querySelector(`#elencoListe tr:nth-child(${sentLists.indexOf(listItems) + 1}) [data-riscarica]`).click();
    for (let i = 0; i < 40 && inFile == null; i++) await wait(250);
    document.title = "RISULTATO tutti=" + (inFile === EXPECTED.soci ? "ok" : `NO(nel file ${inFile} soci su ${EXPECTED.soci})`);
  } catch (e) { document.title = `RISULTATO eccezione=NO(${String(e?.message || e).slice(0, 150)})`; } }, 3000));
}
