// PAGINA: index.html
// RUOLO: superadmin
// Prova di fumo della copia: la pagina Soci entra col ruolo, legge listino e
// partenze dal PostgREST vero (anche l'ordine per card_price) e non ha errori.
{
  const errori = [];
  window.addEventListener("error", (e) => errori.push(e.message));
  window.addEventListener("unhandledrejection", (e) => errori.push(String(e.reason?.message || e.reason)));
  window.addEventListener("load", () => setTimeout(async () => { try {
    const r = [];
    const prova = (nome, vero, perche) => r.push(`${nome}=${vero ? "ok" : `NO(${perche})`}`);
    const scelte = document.querySelectorAll("#sez-tessera input, #f_presciistica input, #f_tipologia_corso option").length;
    const { data: voci } = await sb.from("prices").select("id").eq("active", true);
    prova("ruolo", (await getProfile())?.role === "superadmin", "my_access non dà superadmin");
    prova("listino", voci?.length === ATTESO.voci && scelte > 0, `${voci?.length} voci contro ${ATTESO.voci}, ${scelte} scelte`);
    prova("partenze", document.querySelectorAll("#check_sabato input, #check_domenica input").length > 0 || ATTESO.partenze === 0, "nessuna partenza");
    prova("senzaErrori", !errori.length, errori.join(" / ").slice(0, 200));
    document.title = "RISULTATO " + r.join(" ");
  } catch (e) { document.title = `RISULTATO eccezione=NO(${String(e?.message || e).slice(0, 150)})`; } }, 3000));
}
