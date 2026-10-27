// Cambio della password (password.html).
// - Dopo il cambio si chiudono le altre sessioni (signOut scope «others»): chi era
//   entrato con la password iniziale, che è pubblica, non deve restare dentro.
// - Senza l'email dell'account (non ancora letta) non si prova l'accesso con email
//   vuota: lo si dice.
// my_access in errore dopo il cambio: la pagina resta qui invece di andare avanti.
{
  FAKE.errore = (t) => (t === "rpc:my_access" ? { message: "prova: resta qui" } : null);
  const fill = () => {
    document.getElementById("attuale").value = "donbosco26!";
    document.getElementById("nuova").value = "nuovapassword";
    document.getElementById("conferma").value = "nuovapassword";
  };
  const send = () => document.getElementById("formPassword").requestSubmit();
  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  window.addEventListener("load", () => setTimeout(async () => { try {
    const r = [];
    const test = (nome, real, why) => r.push(`${nome}=${real ? "ok" : `NO(${why})`}`);
    fill();
    send();
    await wait(400);
    const done = FAKE.auth.map(([c, d]) => (c === "signOut" ? `signOut:${d.scope}` : c)).join(",");
    test("altreSessioniChiuse", /updateUser,signOut:others/.test(done), `chiamate ${done}`);

    FAKE.auth.length = 0;
    FAKE.email = null;
    // La pagina ha letto l'email all'apertura: si rifà come se non l'avesse ancora.
    email = null;
    fill();
    send();
    await wait(300);
    const without = document.getElementById("errore");
    test("senzaEmail", !FAKE.auth.some(([c]) => c === "signIn") && without.style.display !== "none",
      `chiamate ${FAKE.auth.map(([c]) => c).join(",")}, messaggio «${without.textContent}»`);
    document.title = "RISULTATO " + r.join(" ");
  } catch (e) { document.title = `RISULTATO eccezione=NO(${String(e?.message || e).slice(0, 150)})`; } }, 500));
}
