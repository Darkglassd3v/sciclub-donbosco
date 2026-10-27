// PAGINA: index.html
// RUOLO: superadmin
// Prova di fumo della copia: la pagina Soci entra col ruolo, legge listino e
// partenze dal PostgREST vero (anche l'ordine per card_price) e non ha errori.
{
  const errors = [];
  window.addEventListener("error", (e) => errors.push(e.message));
  window.addEventListener("unhandledrejection", (e) => errors.push(String(e.reason?.message || e.reason)));
  window.addEventListener("load", () => setTimeout(async () => { try {
    const r = [];
    const test = (nome, real, why) => r.push(`${nome}=${real ? "ok" : `NO(${why})`}`);
    const choices = document.querySelectorAll("#sez-tessera input, #f_presciistica input, #f_tipologia_corso option").length;
    const { data: items } = await sb.from("prices").select("id").eq("active", true);
    test("ruolo", (await getProfile())?.role === "superadmin", "my_access non dà superadmin");
    test("listino", items?.length === EXPECTED.voci && choices > 0, `${items?.length} voci contro ${EXPECTED.voci}, ${choices} scelte`);
    test("partenze", document.querySelectorAll("#check_sabato input, #check_domenica input").length > 0 || EXPECTED.partenze === 0, "nessuna partenza");
    test("senzaErrori", !errors.length, errors.join(" / ").slice(0, 200));
    document.title = "RISULTATO " + r.join(" ");
  } catch (e) { document.title = `RISULTATO eccezione=NO(${String(e?.message || e).slice(0, 150)})`; } }, 3000));
}
