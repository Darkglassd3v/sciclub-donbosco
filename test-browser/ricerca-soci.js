// Soci (index.html), ricerca: nei filtri di PostgREST «*» fa da jolly e «"» o «\»
// rompono or(); un termine che resta vuoto («*») diventava «ilike.%%», cioè tutti.
// In un blocco: gli script della pagina e della prova hanno gli stessi nomi globali.
{
  const filtri = [];
  FINTO.risposta = (t, r) => { if (t === "members" && r.filtri.some((f) => f[0] === "or")) filtri.push(...r.filtri.filter((f) => f[0] === "or").map((f) => f[1])); return []; };
  window.addEventListener("load", () => setTimeout(async () => {
    const r = [];
    const prova = (nome, vero, perche) => r.push(`${nome}=${vero ? "ok" : `NO(${perche})`}`);
    await cercaNelDatabase('ro*ss"i\\', 8);
    prova("senzaJolly", filtri.length === 1 && !/[*"\\]/.test(filtri[0]), `filtri ${JSON.stringify(filtri)}`);
    filtri.length = 0;
    await cercaNelDatabase("* d'angelo", 8);
    prova("vuotoSaltato", filtri.length === 1 && !filtri[0].includes("%%"), `filtri ${JSON.stringify(filtri)}`);
    document.title = "RISULTATO " + r.join(" ");
  }, 500));
}
