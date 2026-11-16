// PAGINA: index.html
// RUOLO: social
// Soci col database vero e la rete che cade (serata del 25/11, due PC su hotspot), con l'account di chi
// iscrive soltanto: ruolo Social col solo permesso «soci» (rete-caduta.sql).
// - Rete assente: Salva non scrive niente, il messaggio è in italiano e la scheda resta compilata.
// - Risposta persa: l'inserimento arriva al database ma la pagina non riceve la risposta. Ripremuto
//   Salva, il socio è uno solo, con l'abbonamento scelto, e la pagina dice «socio salvato».
{
  const errors = [];
  window.addEventListener("error", (e) => errors.push(e.message));
  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const toast = () => document.getElementById("statusToast")?.textContent || "";
  const si = async () => { await wait(600); document.querySelector("#finestraDomanda [data-si]")?.click(); await wait(2500); };
  // off: la richiesta non parte; persa: parte e arriva, ma la risposta non torna alla pagina.
  let net = "ok";
  const realFetch = window.fetch;
  window.fetch = async (input, init) => {
    const writing = init?.method === "POST" && String(input?.url || input).includes("/rest/v1/members");
    if (writing && net === "off") throw new TypeError("Failed to fetch");
    if (writing && net === "persa") { await realFetch(input, init); throw new TypeError("Failed to fetch"); }
    return realFetch(input, init);
  };
  window.addEventListener("load", () => setTimeout(async () => { try {
    const r = [];
    const test = (nome, passed, why) => r.push(`${nome}=${passed ? "ok" : `NO(${why})`}`);
    const surname = "PROVARETE" + Date.now().toString(36).toUpperCase().replace(/[0-9]/g, "X");
    const mine = async () => (await sb.from("members").select("id, card_type, member_passes(id)").eq("last_name", surname)).data || [];
    test("soloSoci", (await getProfile())?.permissions?.join() === "soci", `permessi ${(await getProfile())?.permissions}`);

    el("f_cognome").value = surname; el("f_nome").value = "CADUTA"; el("f_telefono").value = "333";
    el("f_data_nascita").value = "1980-01-01";
    const card = [...el("f_tipologia_tessera").querySelectorAll("input")].find((i) => i.value === EXPECTED.tessera || i.closest("label")?.textContent.includes(EXPECTED.tessera))
      || [...el("f_tipologia_tessera").querySelectorAll("input")][0];
    card.click();
    const add = [...el("listinoAbbonamenti").querySelectorAll("button")].find((b) => b.textContent.includes("Aggiungi"));
    add?.click();

    net = "off";
    await save(); await si();
    test("assenteItaliano", /Connessione assente/.test(toast()) && !/fetch/i.test(toast()), `«${toast().slice(0, 90)}»`);
    test("assenteNienteScritto", (await mine()).length === 0 && el("f_cognome").value === surname, `soci ${(await mine()).length}`);
    document.querySelector("#statusToast button")?.click();

    net = "persa";
    await save(); await si();
    const afterLost = await mine();
    test("persaArrivata", afterLost.length === 1 && /Connessione assente/.test(toast()), `soci ${afterLost.length}, «${toast().slice(0, 60)}»`);
    test("persaSenzaAbbonamento", !add || afterLost[0]?.member_passes.length === 0, "l'abbonamento c'era già");
    document.querySelector("#statusToast button")?.click();

    net = "ok";
    await save(); await si();
    const end = await mine();
    test("unSoloSocio", end.length === 1 && end[0].id === afterLost[0]?.id, `soci ${end.length}`);
    test("abbonamentoScritto", !add || end[0]?.member_passes.length === 1, `abbonamenti ${end[0]?.member_passes.length}`);
    test("salvato", /socio salvato/.test(toast()) && el("avvisoDoppioni").hidden, `«${toast().slice(0, 90)}»`);
    test("senzaErrori", !errors.length, errors.join(" / ").slice(0, 160));
    document.title = "RISULTATO " + r.join(" ");
  } catch (e) { document.title = `RISULTATO eccezione=NO(${String(e?.message || e).slice(0, 150)})`; } }, 3000));
}
