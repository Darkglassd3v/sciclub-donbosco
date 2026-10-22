// PAGINA: index.html
// RUOLO: superadmin
// Soci, sulla copia: una tessera tolta dal listino (spenta) a stagione cominciata.
// Il socio che l'ha deve vederla ancora scelta, e salvarlo (qui cambia solo il
// telefono) non deve togliergliela né cambiargli il totale.
{
  const aspetta = (ms) => new Promise((ok) => setTimeout(ok, ms));
  window.addEventListener("load", () => setTimeout(async () => { try {
    const r = [];
    const prova = (nome, vero, perche) => r.push(`${nome}=${vero ? "ok" : `NO(${perche})`}`);
    if (!ATTESO?.spenta) { document.title = "RISULTATO dati=NO(nessun socio iscritto con la tessera nella copia)"; return; }
    await caricaSocio(ATTESO.id);
    await aspetta(1500);
    prova("siVede", nomeSelezionato("f_tipologia_tessera") === ATTESO.card_type, `scelta «${nomeSelezionato("f_tipologia_tessera")}»`);
    el("f_telefono").value = el("f_telefono").value.trim() + " ";
    await salva();
    await aspetta(800);
    document.querySelector("#finestraDomanda [data-si]")?.click();
    await aspetta(2500);
    const { data } = await sb.from("members").select("card_type, total, phone").eq("id", ATTESO.id).single();
    prova("salvata", data?.card_type === ATTESO.card_type, `dopo il Salva «${data?.card_type}»`);
    prova("totale", Number(data?.total) === Number(ATTESO.total), `totale ${data?.total} invece di ${ATTESO.total}`);
    document.title = "RISULTATO " + r.join(" ");
  } catch (e) { document.title = `RISULTATO eccezione=NO(${String(e?.message || e).slice(0, 150)})`; } }, 2500));
}
