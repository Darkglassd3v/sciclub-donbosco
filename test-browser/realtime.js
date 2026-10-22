// Pagamenti (admin.html), aggiornamento dal vivo (ascoltaSoci in shared.js).
// - Un incasso cambia N righe di members, cioè N eventi: un ricaricamento solo.
// - Due ricaricamenti mai insieme: uno più vecchio che arriva dopo coprirebbe il nuovo.
{
  let inCorso = 0, massimo = 0, letture = 0;
  FINTO.ritardo = (t) => { if (t === "households") { inCorso++; massimo = Math.max(massimo, inCorso); letture++; return 600; } return 20; };
  FINTO.risposta = (t) => { if (t === "households") inCorso--; return []; };
  const aspetta = (ms) => new Promise((ok) => setTimeout(ok, ms));
  window.addEventListener("load", () => setTimeout(async () => {
    const r = [];
    const prova = (nome, vero, perche) => r.push(`${nome}=${vero ? "ok" : `NO(${perche})`}`);
    if (!FINTO.realtime.length) { document.title = "RISULTATO realtime=NO(nessuna iscrizione al realtime)"; return; }
    const evento = () => FINTO.realtime.forEach((cb) => cb({ eventType: "UPDATE" }));
    let prima = letture;
    for (let i = 0; i < 5; i++) evento();
    await aspetta(1500);
    prova("unaPerRaffica", letture - prima === 1, `${letture - prima} letture per 5 eventi`);
    prima = letture; massimo = 0;
    evento();
    await aspetta(450);   // il primo ricaricamento (0,6 s) è in corso, o sta per partire
    evento();
    await aspetta(2000);
    prova("maiInsieme", massimo === 1 && letture - prima === 2, `in corso insieme ${massimo}, letture ${letture - prima}`);
    document.title = "RISULTATO " + r.join(" ");
  }, 1200));   // la prima lettura (0,6 s) deve finire: l'iscrizione al realtime viene dopo
}
