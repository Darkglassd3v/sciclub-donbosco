// Cambio della password (password.html).
// - Dopo il cambio si chiudono le altre sessioni (signOut scope «others»): chi era
//   entrato con la password iniziale, che è pubblica, non deve restare dentro.
// - Senza l'email dell'account (non ancora letta) non si prova l'accesso con email
//   vuota: lo si dice.
// my_access in errore dopo il cambio: la pagina resta qui invece di andare avanti.
{
  FINTO.errore = (t) => (t === "rpc:my_access" ? { message: "prova: resta qui" } : null);
  const compila = () => {
    document.getElementById("attuale").value = "donbosco26!";
    document.getElementById("nuova").value = "nuovapassword";
    document.getElementById("conferma").value = "nuovapassword";
  };
  const invia = () => document.getElementById("formPassword").requestSubmit();
  const aspetta = (ms) => new Promise((ok) => setTimeout(ok, ms));
  window.addEventListener("load", () => setTimeout(async () => { try {
    const r = [];
    const prova = (nome, vero, perche) => r.push(`${nome}=${vero ? "ok" : `NO(${perche})`}`);
    compila();
    invia();
    await aspetta(400);
    const fatti = FINTO.auth.map(([c, d]) => (c === "signOut" ? `signOut:${d.scope}` : c)).join(",");
    prova("altreSessioniChiuse", /updateUser,signOut:others/.test(fatti), `chiamate ${fatti}`);

    FINTO.auth.length = 0;
    FINTO.email = null;
    // La pagina ha letto l'email all'apertura: si rifà come se non l'avesse ancora.
    email = null;
    compila();
    invia();
    await aspetta(300);
    const senza = document.getElementById("errore");
    prova("senzaEmail", !FINTO.auth.some(([c]) => c === "signIn") && senza.style.display !== "none",
      `chiamate ${FINTO.auth.map(([c]) => c).join(",")}, messaggio «${senza.textContent}»`);
    document.title = "RISULTATO " + r.join(" ");
  } catch (e) { document.title = `RISULTATO eccezione=NO(${String(e?.message || e).slice(0, 150)})`; } }, 500));
}
