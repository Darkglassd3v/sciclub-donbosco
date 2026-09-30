// Fogli Excel dei soci per le gite (web/stampe.html). Solo funzioni pure,
// senza pagina: le prova `node web/test-stampe.js`.

/**
 * I pulsanti della pagina. Sabato e domenica stampano insieme, divisi per
 * partenza senza distinguere il giorno; hanno anche i corsi. Il martedì non ha
 * né partenze né corsi. Tutti e due stampano il foglio jolly, che vale per
 * tutti i giorni.
 */
const GIORNI_STAMPA = {
  WEEKEND: { nome: "Sabato e domenica", giorni: ["SABATO", "DOMENICA"], corsi: true, partenze: true },
  MARTEDI: { nome: "Martedì", giorni: ["MARTEDI"] },
};

/** La colonna del socio con la partenza di quel giorno. */
const COLONNA_PARTENZA = { SABATO: "saturday_departure", DOMENICA: "sunday_departure" };

/**
 * "  asti " → "ASTI". Le partenze sono scritte nel form con le caselle, ma
 * quelle arrivate dal vecchio foglio no: senza ripulirle, un refuso di
 * maiuscole o di spazi aprirebbe un gruppo a parte per una persona sola.
 */
function nomePartenza(testo) {
  return String(testo || "").trim().replace(/\s+/g, " ").toUpperCase();
}

/**
 * Nome del foglio di lavoro Excel: "Partenza da NIZZA M." → "NIZZA M.". Excel
 * rifiuta [ ] : * ? / \ e più di 31 caratteri, e il file non si aprirebbe.
 */
function nomeFoglioExcel(titolo) {
  const nome = String(titolo || "").replace(/^Partenza da /, "").replace(/[[\]:*?/\\]/g, " ").trim().slice(0, 31);
  return nome || "Foglio1";
}

const perNome = (a, b) => `${a.last_name} ${a.first_name}`.localeCompare(`${b.last_name} ${b.first_name}`, "it");

/**
 * Soci in gruppi per partenza, "Senza partenza" in fondo: chi non l'ha deve
 * esserci lo stesso. `righe` sono coppie [socio, giorni]: la partenza è quella
 * di quei giorni, e chi ne ha due diverse (sabato da Asti, domenica da Nizza)
 * compare in tutti e due i gruppi, perché è su tutti e due i pullman. Senza
 * partenze (martedì), un gruppo solo senza titolo. Dentro ogni gruppo, per
 * cognome e nome, una riga per persona.
 */
function gruppiPerPartenza(righe, conPartenze) {
  if (!righe.length) return [];
  const perPartenza = new Map();
  for (const [socio, giorni] of righe) {
    const luoghi = conPartenze
      ? new Set(giorni.map((g) => nomePartenza(socio[COLONNA_PARTENZA[g]])).filter(Boolean))
      : new Set();
    for (const luogo of luoghi.size ? luoghi : [""]) {
      if (!perPartenza.has(luogo)) perPartenza.set(luogo, new Map());
      perPartenza.get(luogo).set(socio.id, socio);
    }
  }
  return [...perPartenza.keys()]
    .sort((a, b) => (!a) - (!b) || a.localeCompare(b, "it"))
    .map((luogo) => ({
      titolo: luogo ? `Partenza da ${luogo}` : conPartenze ? "Senza partenza" : "",
      soci: [...perPartenza.get(luogo).values()].sort(perNome),
    }));
}

/**
 * I fogli di un pulsante, in ordine di stampa: [{ titolo, nota, gruppi }].
 *   - Corsisti: chi fa il corso in uno di quei giorni (sabato e domenica);
 *   - Abbonamenti 5 gite: chi ha un abbonamento di quei giorni;
 *   - Jolly: chi ha il jolly, sempre.
 * `soci` sono i soci della stagione (members), `abbonamenti` le righe di
 * pass_status (member_id, day). Un foglio senza nessuno resta, con i gruppi
 * vuoti: la pagina lo stampa con "Nessuno", così si sa che non manca.
 */
function fogliDelGiorno(chiave, soci, abbonamenti) {
  const g = GIORNI_STAMPA[chiave];
  if (!g) return [];
  const giorniDi = new Map();   // socio -> giorni dei suoi abbonamenti
  for (const a of abbonamenti) {
    if (!giorniDi.has(a.member_id)) giorniDi.set(a.member_id, new Set());
    giorniDi.get(a.member_id).add(a.day);
  }
  const fogli = [];
  if (g.corsi) {
    fogli.push({ titolo: "Corsisti", righe: soci
      .filter((s) => s.course_type && g.giorni.includes(s.course_day))
      .map((s) => [s, [s.course_day]]) });
  }
  fogli.push({ titolo: "Abbonamenti 5 gite", righe: soci
    .map((s) => [s, g.giorni.filter((d) => giorniDi.get(s.id)?.has(d))])
    .filter(([, giorni]) => giorni.length) });
  fogli.push({ titolo: "Jolly", nota: "valido per tutti i giorni", righe: soci
    .filter((s) => giorniDi.get(s.id)?.has("JOLLY"))
    .map((s) => [s, g.giorni]) });
  return fogli.map(({ titolo, nota, righe }) => ({ titolo, nota, gruppi: gruppiPerPartenza(righe, g.partenze) }));
}
