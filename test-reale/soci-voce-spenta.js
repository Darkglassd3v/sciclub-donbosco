// PAGINA: index.html
// RUOLO: superadmin
// Soci, sulla copia: una tessera tolta dal listino (spenta) a stagione cominciata.
// Il socio che l'ha deve vederla ancora scelta, e salvarlo (qui cambia solo il
// telefono) non deve togliergliela né cambiargli il totale.
{
  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  window.addEventListener("load", () => setTimeout(async () => { try {
    const r = [];
    const test = (nome, real, why) => r.push(`${nome}=${real ? "ok" : `NO(${why})`}`);
    if (!EXPECTED?.spenta) { document.title = "RISULTATO dati=NO(nessun socio iscritto con la tessera nella copia)"; return; }
    await loadMember(EXPECTED.id);
    await wait(1500);
    test("siVede", selectedName("f_tipologia_tessera") === EXPECTED.card_type, `scelta «${selectedName("f_tipologia_tessera")}»`);
    el("f_telefono").value = el("f_telefono").value.trim() + " ";
    await save();
    await wait(800);
    document.querySelector("#finestraDomanda [data-si]")?.click();
    await wait(2500);
    const { data } = await sb.from("members").select("card_type, total, phone").eq("id", EXPECTED.id).single();
    test("salvata", data?.card_type === EXPECTED.card_type, `dopo il Salva «${data?.card_type}»`);
    test("totale", Number(data?.total) === Number(EXPECTED.total), `totale ${data?.total} invece di ${EXPECTED.total}`);
    document.title = "RISULTATO " + r.join(" ");
  } catch (e) { document.title = `RISULTATO eccezione=NO(${String(e?.message || e).slice(0, 150)})`; } }, 2500));
}
