// PAGINA: index.html
// RUOLO: superadmin
// Soci, sulla copia: la partenza del sabato di un socio spenta in Impostazioni.
// Il socio deve vederla ancora spuntata, e salvarlo (cambia solo il telefono)
// non deve togliergliela.
{
  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  window.addEventListener("load", () => setTimeout(async () => { try {
    const r = [];
    const test = (nome, passed, why) => r.push(`${nome}=${passed ? "ok" : `NO(${why})`}`);
    if (!EXPECTED?.spenta) { document.title = "RISULTATO dati=NO(nessun socio iscritto con la partenza del sabato)"; return; }
    await loadMember(EXPECTED.id);
    await wait(1500);
    const ticked = [...el("check_sabato").querySelectorAll("input:checked")].map((c) => c.value).join(", ");
    test("siVede", ticked === EXPECTED.saturday_departure, `spuntate «${ticked}»`);
    el("f_telefono").value = el("f_telefono").value.trim() + " ";
    await save();
    await wait(800);
    document.querySelector("#finestraDomanda [data-si]")?.click();
    await wait(2500);
    const { data } = await sb.from("members").select("saturday_departure").eq("id", EXPECTED.id).single();
    test("salvata", data?.saturday_departure === EXPECTED.saturday_departure, `dopo il Salva «${data?.saturday_departure}»`);
    document.title = "RISULTATO " + r.join(" ");
  } catch (e) { document.title = `RISULTATO eccezione=NO(${String(e?.message || e).slice(0, 150)})`; } }, 2500));
}
