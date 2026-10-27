// Soci (index.html), ricerca: nei filtri di PostgREST «*» fa da jolly e «"» o «\»
// rompono or(); un termine che resta vuoto («*») diventava «ilike.%%», cioè tutti.
// In un blocco: gli script della pagina e della prova hanno gli stessi nomi globali.
{
  const filters = [];
  FAKE.risposta = (t, r) => { if (t === "members" && r.filtri.some((f) => f[0] === "or")) filters.push(...r.filtri.filter((f) => f[0] === "or").map((f) => f[1])); return []; };
  window.addEventListener("load", () => setTimeout(async () => {
    const r = [];
    const test = (nome, real, why) => r.push(`${nome}=${real ? "ok" : `NO(${why})`}`);
    await searchDatabase('ro*ss"i\\', 8);
    test("senzaJolly", filters.length === 1 && !/[*"\\]/.test(filters[0]), `filtri ${JSON.stringify(filters)}`);
    filters.length = 0;
    await searchDatabase("* d'angelo", 8);
    test("vuotoSaltato", filters.length === 1 && !filters[0].includes("%%"), `filtri ${JSON.stringify(filters)}`);
    document.title = "RISULTATO " + r.join(" ");
  }, 500));
}
