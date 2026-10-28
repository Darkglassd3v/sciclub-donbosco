// Supabase a volte rifiuta per un attimo un token appena rinnovato: «JWT issued at future»
// (l'orologio dell'API del database è un poco indietro rispetto a quello che firma il token).
// - Quel rifiuto si riprova da solo dopo un attimo e la risposta buona arriva alla pagina.
// - Un altro 401 (es. «JWT expired») non si riprova: torna subito.
// - Se continua, dopo pochi tentativi si arrende e la pagina mostra l'errore.
window.addEventListener("load", () => setTimeout(async () => { try {
  const realFetch = window.fetch;
  const calls = [];
  let replies = [];
  const answer = (status, body) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
  const future = () => answer(401, { code: "PGRST303", details: null, hint: null, message: "JWT issued at future" });
  window.fetch = async (...a) => { calls.push(a); return replies.shift(); };
  const ask = async () => { calls.length = 0; const r = await fetchRetryingFutureToken("https://x/rest/v1/rpc/my_access", { method: "POST", body: "{}" }); return [r, calls.length]; };

  replies = [future(), answer(200, [{ ok: 1 }])];
  const [r1, n1] = await ask();
  const body1 = r1.ok ? await r1.json() : null;
  replies = [answer(401, { code: "PGRST303", message: "JWT expired" })];
  const [r2, n2] = await ask();
  replies = Array.from({ length: 10 }, future);
  const [r3, n3] = await ask();
  window.fetch = realFetch;
  document.title = "RISULTATO"
    + ` riprova=${r1.status === 200 && n1 === 2 && body1?.[0]?.ok === 1 ? "ok" : `NO(${r1.status}, ${n1} chiamate)`}`
    + ` scadutoNo=${r2.status === 401 && n2 === 1 ? "ok" : `NO(${r2.status}, ${n2} chiamate)`}`
    + ` siArrende=${r3.status === 401 && n3 === 4 ? "ok" : `NO(${r3.status}, ${n3} chiamate)`}`;
} catch (e) { document.title = `RISULTATO eccezione=NO(${String(e?.message || e).slice(0, 120)})`; } }, 400));
