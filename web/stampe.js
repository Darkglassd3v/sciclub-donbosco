// Fogli da stampare per giorno di gita (web/stampe.html). Solo funzioni pure,
// senza pagina: le prova `node web/test-stampe.js`.

/**
 * I giorni con i loro fogli. Sabato e domenica hanno le partenze (colonna del
 * socio) e i corsi; il martedì no. Ogni giorno stampa anche il foglio jolly,
 * perché il jolly vale per tutti i giorni.
 */
const GIORNI_STAMPA = {
  SABATO:   { nome: "Sabato",   partenza: "saturday_departure", corsi: true },
  DOMENICA: { nome: "Domenica", partenza: "sunday_departure",   corsi: true },
  MARTEDI:  { nome: "Martedì" },
};

/**
 * "  asti " → "ASTI". Le partenze sono scritte nel form con le caselle, ma
 * quelle arrivate dal vecchio foglio no: senza ripulirle, un refuso di
 * maiuscole o di spazi aprirebbe un gruppo a parte per una persona sola.
 */
function nomePartenza(testo) {
  return String(testo || "").trim().replace(/\s+/g, " ").toUpperCase();
}

const perNome = (a, b) => `${a.last_name} ${a.first_name}`.localeCompare(`${b.last_name} ${b.first_name}`, "it");

/**
 * Soci in gruppi per partenza (colonna `colonna`), "Senza partenza" in fondo:
 * chi non l'ha deve esserci lo stesso. Senza colonna, un gruppo solo senza
 * titolo. Dentro ogni gruppo, per cognome e nome.
 */
function gruppiPerPartenza(soci, colonna) {
  if (!soci.length) return [];
  if (!colonna) return [{ titolo: "", soci: [...soci].sort(perNome) }];
  const perPartenza = new Map();
  for (const s of soci) {
    const luogo = nomePartenza(s[colonna]);
    if (!perPartenza.has(luogo)) perPartenza.set(luogo, []);
    perPartenza.get(luogo).push(s);
  }
  return [...perPartenza.keys()]
    .sort((a, b) => (!a) - (!b) || a.localeCompare(b, "it"))
    .map((luogo) => ({
      titolo: luogo ? `Partenza da ${luogo}` : "Senza partenza",
      soci: perPartenza.get(luogo).sort(perNome),
    }));
}

/**
 * I fogli di un giorno, in ordine di stampa: [{ titolo, nota, gruppi }].
 *   - Corsisti: chi fa il corso quel giorno (sabato e domenica);
 *   - Abbonamenti: chi ha un abbonamento di quel giorno;
 *   - Jolly: chi ha il jolly, sempre.
 * `soci` sono i soci della stagione (members), `abbonamenti` le righe di
 * pass_status (member_id, day). Un socio con due abbonamenti dello stesso
 * giorno è una riga sola. Un foglio senza nessuno resta, con i gruppi vuoti:
 * la pagina lo stampa con "Nessuno", così si sa che non manca.
 */
function fogliDelGiorno(giorno, soci, abbonamenti) {
  const g = GIORNI_STAMPA[giorno];
  if (!g) return [];
  const conAbbonamento = (giornoAbbonamento) => {
    const chi = new Set(abbonamenti.filter((a) => a.day === giornoAbbonamento).map((a) => a.member_id));
    return soci.filter((s) => chi.has(s.id));
  };
  const fogli = [];
  if (g.corsi) {
    fogli.push({ titolo: "Corsisti", soci: soci.filter((s) => s.course_type && s.course_day === giorno) });
  }
  fogli.push({ titolo: "Abbonamenti 5 gite", soci: conAbbonamento(giorno) });
  fogli.push({ titolo: "Jolly", nota: "valido per tutti i giorni", soci: conAbbonamento("JOLLY") });
  return fogli.map(({ titolo, nota, soci: chi }) => ({ titolo, nota, gruppi: gruppiPerPartenza(chi, g.partenza) }));
}
