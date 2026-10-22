// PAGINA: index.html
// RUOLO: superadmin
// Soci, sulla copia: un corso tolto dal listino (spento) a stagione cominciata.
// Il socio che lo fa deve vederlo ancora scelto, e salvarlo (cambia solo il
// telefono) non deve toglierglielo né cambiargli il totale.
{
  const aspetta = (ms) => new Promise((ok) => setTimeout(ok, ms));
  window.addEventListener("load", () => setTimeout(async () => { try {
    const r = [];
    const prova = (nome, vero, perche) => r.push(`${nome}=${vero ? "ok" : `NO(${perche})`}`);
    if (!ATTESO?.spento) { document.title = "RISULTATO dati=NO(nessun socio iscritto con un corso nella copia)"; return; }
    await caricaSocio(ATTESO.id);
    await aspetta(1500);
    prova("siVede", nomeSelezionato("f_tipologia_corso") === ATTESO.course_type, `scelto «${nomeSelezionato("f_tipologia_corso")}»`);
    el("f_telefono").value = el("f_telefono").value.trim() + " ";
    await salva();
    await aspetta(800);
    document.querySelector("#finestraDomanda [data-si]")?.click();
    await aspetta(2500);
    const { data } = await sb.from("members").select("course_type, total").eq("id", ATTESO.id).single();
    prova("salvato", data?.course_type === ATTESO.course_type, `dopo il Salva «${data?.course_type}»`);
    prova("totale", Number(data?.total) === Number(ATTESO.total), `totale ${data?.total} invece di ${ATTESO.total}`);
    document.title = "RISULTATO " + r.join(" ");
  } catch (e) { document.title = `RISULTATO eccezione=NO(${String(e?.message || e).slice(0, 150)})`; } }, 2500));
}
