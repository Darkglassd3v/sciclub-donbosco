// PAGINA: index.html
// RUOLO: superadmin
// Soci, sulla copia: si toglie un abbonamento senza gite, ma prima del Salva sul
// pullman se ne segna una. Il Salva non deve lasciare il socio a metà: totale
// abbassato e abbonamento ancora lì. Deve dirlo, e non cambiare niente.
{
  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  window.addEventListener("load", () => setTimeout(async () => { try {
    const r = [];
    const test = (nome, real, why) => r.push(`${nome}=${real ? "ok" : `NO(${why})`}`);
    if (!EXPECTED?.pass) { document.title = "RISULTATO dati=NO(nessun socio per l'abbonamento di prova)"; return; }
    await loadMember(EXPECTED.id);
    await wait(1500);
    const removeOne = [...document.querySelectorAll("#elencoAbbonamenti button")].find((b) => b.textContent === "Rimuovi");
    if (!removeOne) { document.title = "RISULTATO togli=NO(nessun pulsante Rimuovi)"; return; }
    removeOne.click();
    const { error: trip } = await sb.rpc("use_trip", { member_id: EXPECTED.id, client_id: crypto.randomUUID() });
    test("gitaSegnata", !trip, trip?.message);
    await save();
    await wait(800);
    document.querySelector("#finestraDomanda [data-si]")?.click();
    await wait(3000);
    const { data: member } = await sb.from("members").select("total").eq("id", EXPECTED.id).single();
    const { data: passItem } = await sb.from("member_passes").select("id").eq("id", EXPECTED.pass);
    test("abbonamentoResta", passItem?.length === 1, "abbonamento tolto nonostante la gita");
    test("totaleIntatto", Number(member?.total) === Number(EXPECTED.total), `totale ${member?.total} invece di ${EXPECTED.total}`);
    test("detto", /gite|gita/i.test(el("statusToast")?.textContent || ""), `«${(el("statusToast")?.textContent || "").slice(0, 80)}»`);
    document.title = "RISULTATO " + r.join(" ");
  } catch (e) { document.title = `RISULTATO eccezione=NO(${String(e?.message || e).slice(0, 150)})`; } }, 2500));
}
