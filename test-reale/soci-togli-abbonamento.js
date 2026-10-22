// PAGINA: index.html
// RUOLO: superadmin
// Soci, sulla copia: si toglie un abbonamento senza gite, ma prima del Salva sul
// pullman se ne segna una. Il Salva non deve lasciare il socio a metà: totale
// abbassato e abbonamento ancora lì. Deve dirlo, e non cambiare niente.
{
  const aspetta = (ms) => new Promise((ok) => setTimeout(ok, ms));
  window.addEventListener("load", () => setTimeout(async () => { try {
    const r = [];
    const prova = (nome, vero, perche) => r.push(`${nome}=${vero ? "ok" : `NO(${perche})`}`);
    if (!ATTESO?.pass) { document.title = "RISULTATO dati=NO(nessun socio per l'abbonamento di prova)"; return; }
    await caricaSocio(ATTESO.id);
    await aspetta(1500);
    const togli = [...document.querySelectorAll("#elencoAbbonamenti button")].find((b) => b.textContent === "Rimuovi");
    if (!togli) { document.title = "RISULTATO togli=NO(nessun pulsante Rimuovi)"; return; }
    togli.click();
    const { error: gita } = await sb.rpc("use_trip", { member_id: ATTESO.id, client_id: crypto.randomUUID() });
    prova("gitaSegnata", !gita, gita?.message);
    await salva();
    await aspetta(800);
    document.querySelector("#finestraDomanda [data-si]")?.click();
    await aspetta(3000);
    const { data: socio } = await sb.from("members").select("total").eq("id", ATTESO.id).single();
    const { data: abb } = await sb.from("member_passes").select("id").eq("id", ATTESO.pass);
    prova("abbonamentoResta", abb?.length === 1, "abbonamento tolto nonostante la gita");
    prova("totaleIntatto", Number(socio?.total) === Number(ATTESO.total), `totale ${socio?.total} invece di ${ATTESO.total}`);
    prova("detto", /gite|gita/i.test(el("statusToast")?.textContent || ""), `«${(el("statusToast")?.textContent || "").slice(0, 80)}»`);
    document.title = "RISULTATO " + r.join(" ");
  } catch (e) { document.title = `RISULTATO eccezione=NO(${String(e?.message || e).slice(0, 150)})`; } }, 2500));
}
