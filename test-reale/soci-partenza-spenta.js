// PAGINA: index.html
// RUOLO: superadmin
// Soci, sulla copia: la partenza del sabato di un socio spenta in Impostazioni.
// Il socio deve vederla ancora spuntata, e salvarlo (cambia solo il telefono)
// non deve togliergliela.
{
  const aspetta = (ms) => new Promise((ok) => setTimeout(ok, ms));
  window.addEventListener("load", () => setTimeout(async () => { try {
    const r = [];
    const prova = (nome, vero, perche) => r.push(`${nome}=${vero ? "ok" : `NO(${perche})`}`);
    if (!ATTESO?.spenta) { document.title = "RISULTATO dati=NO(nessun socio iscritto con la partenza del sabato)"; return; }
    await caricaSocio(ATTESO.id);
    await aspetta(1500);
    const spuntate = [...el("check_sabato").querySelectorAll("input:checked")].map((c) => c.value).join(", ");
    prova("siVede", spuntate === ATTESO.saturday_departure, `spuntate «${spuntate}»`);
    el("f_telefono").value = el("f_telefono").value.trim() + " ";
    await salva();
    await aspetta(800);
    document.querySelector("#finestraDomanda [data-si]")?.click();
    await aspetta(2500);
    const { data } = await sb.from("members").select("saturday_departure").eq("id", ATTESO.id).single();
    prova("salvata", data?.saturday_departure === ATTESO.saturday_departure, `dopo il Salva «${data?.saturday_departure}»`);
    document.title = "RISULTATO " + r.join(" ");
  } catch (e) { document.title = `RISULTATO eccezione=NO(${String(e?.message || e).slice(0, 150)})`; } }, 2500));
}
