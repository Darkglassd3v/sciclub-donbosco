// PAGINA: index.html
// RUOLO: superadmin
// Soci, sulla copia: un corso tolto dal listino (spento) a stagione cominciata.
// Il socio che lo fa deve vederlo ancora scelto, e salvarlo (cambia solo il
// telefono) non deve toglierglielo né cambiargli il totale.
{
  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  window.addEventListener("load", () => setTimeout(async () => { try {
    const r = [];
    const test = (nome, real, why) => r.push(`${nome}=${real ? "ok" : `NO(${why})`}`);
    if (!EXPECTED?.spento) { document.title = "RISULTATO dati=NO(nessun socio iscritto con un corso nella copia)"; return; }
    await loadMember(EXPECTED.id);
    await wait(1500);
    test("siVede", selectedName("f_tipologia_corso") === EXPECTED.course_type, `scelto «${selectedName("f_tipologia_corso")}»`);
    el("f_telefono").value = el("f_telefono").value.trim() + " ";
    await save();
    await wait(800);
    document.querySelector("#finestraDomanda [data-si]")?.click();
    await wait(2500);
    const { data } = await sb.from("members").select("course_type, total").eq("id", EXPECTED.id).single();
    test("salvato", data?.course_type === EXPECTED.course_type, `dopo il Salva «${data?.course_type}»`);
    test("totale", Number(data?.total) === Number(EXPECTED.total), `totale ${data?.total} invece di ${EXPECTED.total}`);
    document.title = "RISULTATO " + r.join(" ");
  } catch (e) { document.title = `RISULTATO eccezione=NO(${String(e?.message || e).slice(0, 150)})`; } }, 2500));
}
