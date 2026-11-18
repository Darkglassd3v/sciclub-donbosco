// Soci (index.html): l'Elenco soci porta alla scheda con index.html?socio=<id> (18/11/2026).
// - Con un id valido nell'indirizzo la pagina apre quella scheda.
// - Con un valore che non è un id non chiede niente al database.
{
  const asked = [];
  FAKE.risposta = (t, r) => { if (t === "members") asked.push(r.filtri.filter((f) => f[0] === "eq").map((f) => f.slice(1).join("="))); return []; };
  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const ID = "11111111-2222-3333-4444-555555555555";
  window.addEventListener("load", () => setTimeout(async () => { try {
    const r = [];
    const test = (nome, passed, why) => r.push(`${nome}=${passed ? "ok" : `NO(${why})`}`);
    asked.length = 0;
    await openFromAddress(`?socio=${ID}`);
    await wait(300);
    test("apre", asked.some((a) => a.includes(`id=${ID}`)), JSON.stringify(asked));
    asked.length = 0;
    await openFromAddress("?socio=1;drop");
    await wait(200);
    test("idNonValido", asked.length === 0, JSON.stringify(asked));
    document.title = "RISULTATO " + r.join(" ");
  } catch (e) { document.title = `RISULTATO eccezione=NO(${String(e?.message || e).slice(0, 120)})`; } }, 500));
}
