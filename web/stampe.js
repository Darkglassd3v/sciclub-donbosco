// Fogli da stampare per giorno di gita (web/stampe.html). Solo funzioni pure,
// senza pagina: le prova `node web/test-stampe.js`.

/**
 * I quattro fogli. Sabato e domenica hanno le partenze (colonna del socio) e i
 * corsi; martedì e jolly no. Il jolly vale per tutti i giorni e ha sempre il
 * suo foglio a parte.
 */
const FOGLI = {
  SABATO:   { nome: "Sabato",   partenza: "saturday_departure", corsi: true },
  DOMENICA: { nome: "Domenica", partenza: "sunday_departure",   corsi: true },
  MARTEDI:  { nome: "Martedì" },
  JOLLY:    { nome: "Jolly", nota: "valido per tutti i giorni" },
};

/**
 * "  asti " → "ASTI". Le partenze sono scritte nel form con le caselle, ma
 * quelle arrivate dal vecchio foglio no: senza ripulirle, un refuso di
 * maiuscole o di spazi aprirebbe un gruppo a parte per una persona sola.
 */
function nomePartenza(testo) {
  return String(testo || "").trim().replace(/\s+/g, " ").toUpperCase();
}

/**
 * I gruppi del foglio di un giorno: [{ titolo, righe: [{ socio, abbonamento, corso }] }].
 *
 * `soci` sono i soci della stagione (members), `abbonamenti` le righe di
 * pass_status (member_id, day). Una riga per persona anche con due
 * abbonamenti dello stesso giorno, o abbonamento e corso. Sabato e domenica
 * in gruppi per partenza, "Senza partenza" in fondo: chi non l'ha deve
 * esserci lo stesso. Dentro ogni gruppo, per cognome e nome.
 */
function gruppiDelFoglio(giorno, soci, abbonamenti) {
  const foglio = FOGLI[giorno];
  if (!foglio) return [];
  const conAbbonamento = new Set(abbonamenti.filter((a) => a.day === giorno).map((a) => a.member_id));
  const righe = soci
    .map((socio) => ({
      socio,
      abbonamento: conAbbonamento.has(socio.id),
      corso: Boolean(foglio.corsi && socio.course_type && socio.course_day === giorno),
    }))
    .filter((r) => r.abbonamento || r.corso);

  const perNome = (a, b) =>
    `${a.socio.last_name} ${a.socio.first_name}`.localeCompare(`${b.socio.last_name} ${b.socio.first_name}`, "it");

  if (!foglio.partenza) return righe.length ? [{ titolo: foglio.nome, righe: righe.sort(perNome) }] : [];

  const perPartenza = new Map();
  for (const r of righe) {
    const luogo = nomePartenza(r.socio[foglio.partenza]);
    if (!perPartenza.has(luogo)) perPartenza.set(luogo, []);
    perPartenza.get(luogo).push(r);
  }
  return [...perPartenza.keys()]
    .sort((a, b) => (!a) - (!b) || a.localeCompare(b, "it"))
    .map((luogo) => ({
      titolo: luogo ? `Partenza da ${luogo}` : "Senza partenza",
      righe: perPartenza.get(luogo).sort(perNome),
    }));
}

/** Cosa fa quel giorno: "Abbonamento", "Corso" o tutti e due. */
function tipoRiga(r) {
  return r.abbonamento && r.corso ? "Abbonamento e corso" : r.corso ? "Corso" : "Abbonamento";
}
