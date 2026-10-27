// Fogli Excel dei soci per le gite (web/stampe.html). Solo funzioni pure,
// senza pagina: le prova `node web/test-stampe.js`.

/**
 * I pulsanti della pagina, uno per giorno. Sabato e domenica hanno le
 * partenze e i corsi; il martedì né l'una né l'altra cosa. Ogni giorno ha
 * anche il foglio jolly, che vale per tutti i giorni: al massimo tre fogli.
 */
const PRINT_DAYS = {
  SABATO:   { nome: "Sabato",   giorni: ["SABATO"],   corsi: true, partenze: true },
  DOMENICA: { nome: "Domenica", giorni: ["DOMENICA"], corsi: true, partenze: true },
  MARTEDI:  { nome: "Martedì",  giorni: ["MARTEDI"] },
};

/** La colonna del socio con la partenza di quel giorno. */
const DEPARTURE_COLUMN = { SABATO: "saturday_departure", DOMENICA: "sunday_departure" };

/**
 * "  asti " → "ASTI". Le partenze sono scritte nel form con le caselle, ma
 * quelle arrivate dal vecchio foglio no: senza ripulirle, un refuso di
 * maiuscole o di spazi aprirebbe un gruppo a parte per una persona sola.
 */
function departureName(text) {
  return String(text || "").trim().replace(/\s+/g, " ").toUpperCase();
}

/**
 * Nome del foglio di lavoro Excel: "Partenza da NIZZA M." → "NIZZA M.". Excel
 * rifiuta [ ] : * ? / \ e più di 31 caratteri, e il file non si aprirebbe.
 */
function excelSheetName(titleText, usedItems = null) {
  const base = String(titleText || "").replace(/^Partenza da /, "").replace(/[[\]:*?/\\]/g, " ").trim().slice(0, 31) || "Foglio1";
  if (!usedItems) return base;
  // Nello stesso file due fogli non possono chiamarsi uguale (anche a parte le
  // maiuscole): «ASTI/CENTRO» e «ASTI:CENTRO» diventano «ASTI CENTRO» e «ASTI CENTRO 2».
  let nome = base;
  for (let n = 2; usedItems.has(nome.toLowerCase()); n++) nome = `${base.slice(0, 31 - String(n).length - 1).trim()} ${n}`;
  usedItems.add(nome.toLowerCase());
  return nome;
}

/**
 * Il titolo in cima al foglio scaricato, come lo chiamano al club: "CORSI
 * SABATO", "ABBONAMENTI DOMENICA", "ABBONAMENTI JOLLY". Prima c'era tutto
 * (giorno, foglio, nota, partenza) e non si capiva; la partenza resta nel nome
 * del foglio di lavoro (nomeFoglioExcel).
 */
function excelTitle(keyName, titleText) {
  if (titleText === "Jolly") return "ABBONAMENTI JOLLY";
  return `${titleText === "Corsisti" ? "CORSI" : "ABBONAMENTI"} ${PRINT_DAYS[keyName].nome.toUpperCase()}`;
}

/**
 * Le gite fatte coi suoi abbonamenti di quei giorni (pass_status.day:
 * "DOMENICA", "JOLLY"): "1/5", con due abbonamenti "5/5, 1/5". Sul pullman
 * si vede se ne ha ancora. Vuoto se non ne ha.
 */
function tripsDone(passList, memberId, dayList) {
  return passList
    .filter((a) => a.member_id === memberId && dayList.includes(a.day) && a.trips_total)
    .map((a) => `${a.trips_used}/${a.trips_total}`).join(", ");
}

const perNome = (a, b) => `${a.last_name} ${a.first_name}`.localeCompare(`${b.last_name} ${b.first_name}`, "it");

/**
 * Soci in gruppi per partenza, "Senza partenza" in fondo: chi non l'ha deve
 * esserci lo stesso. `righe` sono coppie [socio, giorni]: la partenza è quella
 * di quei giorni. Senza partenze (martedì), un gruppo solo senza titolo.
 * Dentro ogni gruppo, per cognome e nome, una riga per persona.
 */
function groupsByDeparture(rows, withDepartures) {
  if (!rows.length) return [];
  const byDeparture = new Map();
  for (const [member, dayList] of rows) {
    const places = withDepartures
      ? new Set(dayList.map((g) => departureName(member[DEPARTURE_COLUMN[g]])).filter(Boolean))
      : new Set();
    for (const placeName of places.size ? places : [""]) {
      if (!byDeparture.has(placeName)) byDeparture.set(placeName, new Map());
      byDeparture.get(placeName).set(member.id, member);
    }
  }
  return [...byDeparture.keys()]
    .sort((a, b) => (!a) - (!b) || a.localeCompare(b, "it"))
    .map((placeName) => ({
      titolo: placeName ? `Partenza da ${placeName}` : withDepartures ? "Senza partenza" : "",
      soci: [...byDeparture.get(placeName).values()].sort(perNome),
    }));
}

/**
 * I fogli di un pulsante, in ordine: [{ titolo, nota, gite, gruppi }]. `gite`:
 * i giorni degli abbonamenti di cui contare le gite fatte (giteFatte), solo nei
 * fogli degli abbonamenti.
 *   - Corsisti: chi fa il corso quel giorno (sabato e domenica);
 *   - Abbonamenti 5 gite: chi ha un abbonamento di quel giorno;
 *   - Jolly: chi ha il jolly, sempre.
 * `soci` sono i soci della stagione (members), `abbonamenti` le righe di
 * pass_status (member_id, day). Un foglio senza nessuno resta, con i gruppi
 * vuoti: la pagina lo stampa con "Nessuno", così si sa che non manca.
 */
function daySheets(keyName, members, passList) {
  const g = PRINT_DAYS[keyName];
  if (!g) return [];
  const daysOf = new Map();   // socio -> giorni dei suoi abbonamenti
  for (const a of passList) {
    if (!daysOf.has(a.member_id)) daysOf.set(a.member_id, new Set());
    daysOf.get(a.member_id).add(a.day);
  }
  const sheets = [];
  if (g.corsi) {
    sheets.push({ titolo: "Corsisti", righe: members
      // «NO» nei fogli vecchi vuol dire niente corso, come nelle viste del database.
      .filter((s) => s.course_type && s.course_type.toUpperCase() !== "NO" && g.giorni.includes(s.course_day))
      .map((s) => [s, [s.course_day]]) });
  }
  sheets.push({ titolo: "Abbonamenti 5 gite", gite: g.giorni, righe: members
    .map((s) => [s, g.giorni.filter((d) => daysOf.get(s.id)?.has(d))])
    .filter(([, dayList]) => dayList.length) });
  sheets.push({ titolo: "Jolly", nota: "valido per tutti i giorni", gite: ["JOLLY"], righe: members
    .filter((s) => daysOf.get(s.id)?.has("JOLLY"))
    .map((s) => [s, g.giorni]) });
  return sheets.map(({ titolo: titleText, nota: note, gite: tripList, righe: rows }) => ({ titolo: titleText, nota: note, gite: tripList, gruppi: groupsByDeparture(rows, g.partenze) }));
}
