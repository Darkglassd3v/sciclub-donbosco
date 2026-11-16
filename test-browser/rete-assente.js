// Rete assente o lenta (shared.js, vale per tutto il sito), provata in Soci (index.html).
// - Una richiesta che non risponde non resta appesa: dopo il tempo massimo si interrompe da sola.
// - L'errore del browser («Failed to fetch», «signal timed out») diventa un messaggio in italiano.
// - Salva senza rete: il messaggio è in italiano e la scheda resta compilata, pronta per riprovare.
// In un blocco: gli script della pagina e della prova hanno gli stessi nomi globali.
{
  const PRICE_LIST = [{ category: "TESSERA", name: "TESSERA ORDINARIA - REALE MUTUA NEVE", price: 40, min_role: "utente" }];
  let netDown = false;
  FAKE.risposta = (t) => (t === "prices" ? PRICE_LIST : []);
  // supabase-js non lancia: restituisce l'errore del browser così.
  FAKE.errore = (t, r) => (netDown && t === "members" && r.filtri.some((f) => f[0] === "insert")
    ? { message: "TypeError: Failed to fetch", details: "", hint: "", code: "" } : null);
  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const toast = () => el("statusToast")?.textContent || "";
  const si = async () => { await wait(300); document.querySelector("#finestraDomanda [data-si]")?.click(); await wait(500); };

  window.addEventListener("load", () => setTimeout(async () => { try {
    const r = [];
    const test = (nome, passed, why) => r.push(`${nome}=${passed ? "ok" : `NO(${why})`}`);

    // Una richiesta che non risponde mai: si ferma solo quando il segnale la interrompe.
    const realFetch = window.fetch;
    window.fetch = (input, init) => new Promise((_, ko) =>
      init?.signal?.addEventListener("abort", () => ko(init.signal.reason)));
    let outcome = "ancora appesa";
    try { requestTimeoutMs = 300; } catch (e) { /* manca ancora il tempo massimo */ }
    fetchWithWaiting("https://x/rest/v1/members", { method: "GET" }).then(() => (outcome = "risposta"), (e) => (outcome = e));
    await wait(1500);
    window.fetch = realFetch;
    test("tempoMassimo", outcome?.name === "TimeoutError", `esito: ${outcome?.name || outcome}`);
    const italian = (e) => /connessione/i.test(errorMessage(e)) && !/fetch|timed|abort/i.test(errorMessage(e));
    test("messaggioTempo", italian(outcome), `«${errorMessage(outcome)}»`);
    for (const m of ["TypeError: Failed to fetch", "TypeError: NetworkError when attempting to fetch resource.", "TypeError: Load failed"]) {
      test(`messaggio${m.split(" ")[1]}`, italian({ message: m }), `«${errorMessage({ message: m })}»`);
    }
    test("altriErrori", errorMessage({ message: "numero tessera già usato" }) === "numero tessera già usato", "un errore del database è stato cambiato");
    // Un errore del database che parla di transazioni interrotte o di tempi non è un errore di rete.
    for (const m of ["current transaction is aborted, commands ignored until end of transaction block", "canceling statement due to lock timeout: timed out"]) {
      test(`database${m.split(" ")[0]}`, errorMessage({ message: m, code: "25P02" }) === m, `«${errorMessage({ message: m })}»`);
    }
    test("interrottaDaSupabase", italian({ message: "TimeoutError: signal timed out" }) && italian({ message: "AbortError: signal is aborted without reason" }), "l'errore riportato da supabase-js non è riconosciuto");

    el("f_cognome").value = "Prova"; el("f_nome").value = "Senzarete"; el("f_telefono").value = "333";
    [...el("f_tipologia_tessera").querySelectorAll("input")][0].click();
    netDown = true;
    await save(); await si();
    test("salvaItaliano", /connessione/i.test(toast()) && /Salva/.test(toast()) && !/fetch/i.test(toast()), `messaggio «${toast()}»`);
    test("schedaResta", el("f_cognome").value === "Prova" && !el("btnSalva").disabled, `cognome «${el("f_cognome").value}», Salva spento ${el("btnSalva").disabled}`);
    document.title = `RISULTATO ${r.join(" ")}`;
  } catch (e) { document.title = `RISULTATO eccezione=NO(${String(e?.message || e).slice(0, 120)})`; } }, 500));
}
