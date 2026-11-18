// Accesso con Google (login.html, dalla 3.4).
// - Il pulsante «Accedi con Google» chiama Supabase con il fornitore google e torna a questa stessa pagina,
//   tenendo la pagina richiesta (?next=), senza il frammento con i dati di Google.
// - Un account Google non registrato nel gestionale torna con un errore («Signups not allowed»): la pagina
//   lo dice in italiano e indica a chi rivolgersi; un altro errore di Google è detto come errore di accesso.
// - Email e password restano: il pulsante sta sotto il modulo, separato, e ha un nome leggibile.
{
  // my_access in errore: la pagina resta sull'accesso invece di entrare con la sessione finta.
  FAKE.errore = (t) => (t === "rpc:my_access" ? { message: "prova", code: "PGRST001" } : null);
  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  // Le funzioni del database chiamate dalla pagina, in ordine.
  FAKE.chiamate = [];
  const realRisposta = FAKE.risposta;
  FAKE.risposta = (t, r) => { if (t.startsWith("rpc:")) FAKE.chiamate.push(t.slice(4)); return realRisposta(t, r); };
  FAKE.rpc.retire_initial_password = undefined;
  delete FAKE.rpc.retire_initial_password;

  window.addEventListener("load", () => setTimeout(async () => { try {
    const r = [];
    const test = (nome, passed, why) => r.push(`${nome}=${passed ? "ok" : `NO(${why})`}`);
    const button = document.getElementById("btnGoogle");
    test("pulsante", button && /Accedi con Google/.test(button.textContent) && document.getElementById("loginForm").compareDocumentPosition(button) & Node.DOCUMENT_POSITION_FOLLOWING,
      "manca il pulsante «Accedi con Google» sotto il modulo");
    test("passwordResta", !!document.getElementById("password") && !!document.getElementById("btnLogin"), "email e password non ci sono più");
    button?.click();
    await wait(300);
    const call = FAKE.auth.find((a) => a[0] === "signInWithOAuth")?.[1];
    const back = new URL(call?.options?.redirectTo || "about:blank");
    test("fornitore", call?.provider === "google", `chiamata ${JSON.stringify(call)}`);
    test("ritornoQui", back.origin === location.origin && back.pathname === location.pathname && !back.hash,
      `ritorno a ${back.href}`);

    const message = (frammento) => { try { return googleError(frammento) || ""; } catch (e) { return ""; } };
    const unknown = message("#error=access_denied&error_code=signup_disabled&error_description=Signups+not+allowed+for+this+instance");
    test("nonRegistrato", /non è registrato/.test(unknown) && /amministratore/.test(unknown) && !/Signups/.test(unknown), `«${unknown}»`);
    const other = message("#error=server_error&error_description=Unable+to+exchange+external+code");
    test("altroErrore", /Accesso con Google non riuscito/.test(other), `«${other}»`);
    test("senzaErrore", message("#access_token=x&refresh_token=y") === "" && message("") === "", "un ritorno senza errore dà un messaggio");
    // Rimandato qui senza ruolo (?senza=1): il ritorno da Google non deve richiudere la sessione appena aperta.
    history.replaceState(null, "", location.pathname + "?senza=1&next=admin.html");
    FAKE.auth.length = 0;
    button?.click();
    await wait(300);
    const again = new URL(FAKE.auth.find((a) => a[0] === "signInWithOAuth")?.[1]?.options?.redirectTo || "about:blank");
    test("senzaTolto", !again.searchParams.has("senza") && again.searchParams.get("next") === "admin.html", `ritorno a ${again.search}`);
    // Supabase può mettere l'errore anche nella query (?error=...) invece che nel frammento.
    const inQuery = message("?error=access_denied&error_code=signup_disabled&error_description=Signups+not+allowed");
    test("erroreNellaQuery", /non è registrato/.test(inQuery), `«${inQuery}»`);
    // Ogni accesso chiede di ritirare la password iniziale: il database lo fa solo per chi è entrato con Google.
    // Un account senza ruolo: enter() resta sulla pagina invece di andare a quella del ruolo.
    FAKE.errore = () => null;
    FAKE.rpc.my_access = [{ email: "prova@sciclub.it", role: "gite", real_role: "gite", change_password: false, permissions: [] }];
    await enter().catch(() => null);
    test("ritiraPassword", FAKE.chiamate?.includes("retire_initial_password"), `rpc chiamate ${JSON.stringify(FAKE.chiamate)}`);
    document.title = "RISULTATO " + r.join(" ");
  } catch (e) { document.title = `RISULTATO eccezione=NO(${String(e?.message || e).slice(0, 120)})`; } }, 800));
}
