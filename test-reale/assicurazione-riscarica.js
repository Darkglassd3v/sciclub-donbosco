// PAGINA: assicurazione.html
// RUOLO: superadmin
// Assicurazione, sulla copia: «Riscarica» di una lista mandata con più di 1000 soci
// (le righe che Supabase dà a richiesta) li mette tutti nel file.
{
  const aspetta = (ms) => new Promise((ok) => setTimeout(ok, ms));
  window.addEventListener("load", () => setTimeout(async () => { try {
    let nelFile = null;
    excelLista = async (t, n, d, soci) => { nelFile = soci.length; };
    const lista = listeMandate.find((l) => l.id === ATTESO.id);
    if (!lista) { document.title = "RISULTATO lista=NO(la lista della prova non è fra quelle mandate)"; return; }
    document.querySelector(`#elencoListe tr:nth-child(${listeMandate.indexOf(lista) + 1}) [data-riscarica]`).click();
    for (let i = 0; i < 40 && nelFile == null; i++) await aspetta(250);
    document.title = "RISULTATO tutti=" + (nelFile === ATTESO.soci ? "ok" : `NO(nel file ${nelFile} soci su ${ATTESO.soci})`);
  } catch (e) { document.title = `RISULTATO eccezione=NO(${String(e?.message || e).slice(0, 150)})`; } }, 3000));
}
