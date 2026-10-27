// Pagamenti (admin.html), aggiornamento dal vivo (ascoltaSoci in shared.js).
// - Un incasso cambia N righe di members, cioè N eventi: un ricaricamento solo.
// - Due ricaricamenti mai insieme: uno più vecchio che arriva dopo coprirebbe il nuovo.
{
  let inProgress = 0, maximum = 0, reads = 0;
  FAKE.ritardo = (t) => { if (t === "households") { inProgress++; maximum = Math.max(maximum, inProgress); reads++; return 600; } return 20; };
  FAKE.risposta = (t) => { if (t === "households") inProgress--; return []; };
  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  window.addEventListener("load", () => setTimeout(async () => {
    const r = [];
    const test = (nome, real, why) => r.push(`${nome}=${real ? "ok" : `NO(${why})`}`);
    if (!FAKE.realtime.length) { document.title = "RISULTATO realtime=NO(nessuna iscrizione al realtime)"; return; }
    const theEvent = () => FAKE.realtime.forEach((cb) => cb({ eventType: "UPDATE" }));
    let before = reads;
    for (let i = 0; i < 5; i++) theEvent();
    await wait(1500);
    test("unaPerRaffica", reads - before === 1, `${reads - before} letture per 5 eventi`);
    before = reads; maximum = 0;
    theEvent();
    await wait(450);   // il primo ricaricamento (0,6 s) è in corso, o sta per partire
    theEvent();
    await wait(2000);
    test("maiInsieme", maximum === 1 && reads - before === 2, `in corso insieme ${maximum}, letture ${reads - before}`);
    document.title = "RISULTATO " + r.join(" ");
  }, 1200));   // la prima lettura (0,6 s) deve finire: l'iscrizione al realtime viene dopo
}
