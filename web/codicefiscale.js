// Controllo del codice fiscale.
//
// Il codice fiscale si scrive a mano, spesso copiandolo da una tessera
// sanitaria tenuta in mano da un socio: una lettera sbagliata passa
// inosservata e arriva così all'assicurazione, che rimanda indietro la
// pratica. Queste funzioni confrontano il codice con cognome, nome e data di
// nascita già scritti nella scheda e, se qualcosa non torna, propongono il
// codice che ne verrebbe fuori.
//
// Un codice che torna col suo carattere finale non si propone di cambiarlo:
// quasi sempre è copiato giusto, e lo sbaglio è nella scheda. Si avvisa e basta.
//
// È un avviso, non un blocco: il codice lo assegna l'Agenzia delle Entrate e
// in casi rari (omocodia, nomi stranieri trascritti in modi diversi, errori
// nell'anagrafica invece che nel codice) quello giusto non coincide con il
// calcolo. Chi ha il documento davanti ha l'ultima parola.
//
// Per il comune di nascita non c'è l'elenco dei codici catastali di tutti i
// comuni e degli stati esteri: lo si ricava dai codici fiscali dei soci nati
// nello stesso posto (comuneDaiCF), e solo se ce ne sono abbastanza si dice
// che quello scritto è sbagliato. Altrimenti se ne guarda solo la forma (una
// lettera e tre cifre) e nel codice proposto resta quello scritto.
//
// Per un socio nuovo, a campo vuoto, il codice si propone intero (calcolaCF):
// il sesso lo indica chi compila, il comune si ricava dai codici fiscali dei
// soci nati nello stesso posto (comuneDaiCF). Per un posto mai visto non si
// propone niente.
//
// Funzioni pure, senza pagina: le prova web/test-codicefiscale.js.

const CF_MONTHS = "ABCDEHLMPRST";

// Omocodia: quando due persone avrebbero lo stesso codice, l'Agenzia sostituisce
// alcune cifre con lettere (0 = L, 1 = M, ... 9 = V), partendo da destra.
const CF_OMOCODE = "LMNPQRSTUV";
const CF_NUMERIC_POSITIONS = [6, 7, 9, 10, 12, 13, 14];

// Valori dei caratteri in posizione dispari (1ª, 3ª, ...) per il carattere di
// controllo: una tabella fissa, non ha una regola da cui ricavarla.
const CF_ODD = {
  0: 1, 1: 0, 2: 5, 3: 7, 4: 9, 5: 13, 6: 15, 7: 17, 8: 19, 9: 21,
  A: 1, B: 0, C: 5, D: 7, E: 9, F: 13, G: 15, H: 17, I: 19, J: 21, K: 2, L: 4, M: 18,
  N: 20, O: 11, P: 3, Q: 6, R: 8, S: 12, T: 14, U: 16, V: 10, W: 22, X: 25, Y: 24, Z: 23,
};

/** Maiuscolo, senza spazi né altri segni: come lo si legge sulla tessera. */
function normalizeTaxCode(codeValue) {
  return String(codeValue ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** Solo lettere A-Z: "Nicolò D'Amico" → "NICOLODAMICO". */
function lettersOnly(text) {
  return String(text ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toUpperCase().replace(/[^A-Z]/g, "");
}

function consonantsAndVowels(text) {
  const letters = lettersOnly(text);
  return {
    consonanti: letters.replace(/[AEIOU]/g, ""),
    vocali: letters.replace(/[^AEIOU]/g, ""),
  };
}

/** Le tre lettere del cognome: consonanti, poi vocali, poi X. */
function surnameCode(surname) {
  const { consonanti: consonants, vocali: vowels } = consonantsAndVowels(surname);
  return (consonants + vowels + "XXX").slice(0, 3);
}

/**
 * Le tre lettere del nome. Come il cognome, tranne un caso: con quattro o più
 * consonanti si prendono la prima, la terza e la quarta (Gianfranco → GFR).
 */
function firstNameCode(nome) {
  const { consonanti: consonants, vocali: vowels } = consonantsAndVowels(nome);
  if (consonants.length >= 4) return consonants[0] + consonants[2] + consonants[3];
  return (consonants + vowels + "XXX").slice(0, 3);
}

/** Toglie l'omocodia: rimette le cifre dove l'Agenzia ha messo lettere. */
function withoutOmocode(codeValue) {
  const chars = codeValue.split("");
  CF_NUMERIC_POSITIONS.forEach((i) => {
    const digit = CF_OMOCODE.indexOf(chars[i]);
    if (i < chars.length && digit >= 0) chars[i] = String(digit);
  });
  return chars.join("");
}

/** Il 16° carattere, calcolato sui primi 15. */
function checkChar(first15) {
  let sum = 0;
  for (let i = 0; i < 15; i++) {
    const c = first15[i];
    // Posizioni dispari contando da 1, cioè indici pari contando da 0.
    sum += i % 2 === 0 ? CF_ODD[c] : (/\d/.test(c) ? Number(c) : c.charCodeAt(0) - 65);
  }
  return String.fromCharCode(65 + (sum % 26));
}

/** "2026-01-31" (come la dà un <input type="date">) → { anno, mese, giorno }, o null. */
function readDate(data) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(data ?? ""));
  if (!m) return null;
  return { anno: Number(m[1]), mese: Number(m[2]), giorno: Number(m[3]) };
}

/** I cinque caratteri della data (anno, lettera del mese, giorno): per le donne il giorno è aumentato di 40. */
function dateCode(data, female) {
  return String(data.anno % 100).padStart(2, "0") + CF_MONTHS[data.mese - 1]
    + String(data.giorno + (female ? 40 : 0)).padStart(2, "0");
}

/**
 * Il codice fiscale calcolato dall'anagrafica { cognome, nome, dataNascita,
 * sesso: "M" o "F", comune: codice catastale come "A479" }, o null se manca
 * qualcosa. Non conosce l'omocodia: è una proposta, chi ha la tessera davanti
 * controlla.
 */
function computeTaxCode({ cognome: surname, nome, dataNascita: birthDate, sesso: sex, comune: municipality } = {}) {
  const data = readDate(birthDate);
  if (!lettersOnly(surname) || !lettersOnly(nome) || !data || data.mese < 1 || data.mese > 12
    || !/^[MF]$/.test(sex ?? "") || !/^[A-Z]\d{3}$/.test(municipality ?? "")) return null;
  const first15 = surnameCode(surname) + firstNameCode(nome) + dateCode(data, sex === "F") + municipality;
  return first15 + checkChar(first15);
}

/**
 * Il codice catastale del comune ricavato dai codici fiscali dei soci nati lì
 * ("ASTI" → A479). Contano solo i codici col carattere finale giusto, e vince
 * quello che compare in più della metà: un codice scritto male, o due comuni
 * con lo stesso nome, non bastano a dare un comune sbagliato. Null se non c'è
 * una maggioranza o se i codici buoni sono meno di `minimo`: per proporre un
 * codice ne basta uno, per dire che uno scritto è sbagliato ne servono di più.
 * Ogni codice conta una volta: le schede doppie della stessa persona non sono
 * più soci.
 */
function municipalityFromCodes(codes, minimum = 1) {
  const counts = {};
  for (const cf of new Set(codes.map(normalizeTaxCode))) {
    if (cf.length !== 16 || checkChar(cf.slice(0, 15)) !== cf[15]) continue;
    const municipality = withoutOmocode(cf).slice(11, 15);
    if (/^[A-Z]\d{3}$/.test(municipality)) counts[municipality] = (counts[municipality] || 0) + 1;
  }
  const totalAmount = Object.values(counts).reduce((a, b) => a + b, 0);
  const [municipality, times] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0] || [];
  return totalAmount >= minimum && times > totalAmount / 2 ? municipality : null;
}

/**
 * Confronta un codice fiscale con l'anagrafica.
 *
 * Restituisce null se il codice è vuoto (niente da dire), altrimenti
 * { ok, problemi, suggerito }:
 *   - problemi: frasi da mostrare a chi compila, una per cosa che non torna;
 *   - suggerito: il codice corretto, o null se non si può ricostruire (codice
 *     troppo rovinato, o manca quello che servirebbe per rifarlo).
 *
 * Senza cognome, nome o data si controlla quello che si può: la forma e il
 * carattere finale.
 *
 * Nell'anagrafica possono esserci anche:
 *   - comune: il codice catastale atteso (da comuneDaiCF), con luogo, il nome
 *     del posto da scrivere nell'avviso. Un comune diverso si segnala e si
 *     corregge nella proposta;
 *   - sesso: "M" o "F", indicato da chi compila. Vale più del giorno scritto
 *     (T42 per un uomo nato il 12 è una cifra sbagliata, non una donna), e
 *     quando il giorno è illeggibile la data si rifà con quella della scheda;
 *   - sessoProbabile: "M" o "F" ricavato dai soci con lo stesso nome
 *     (sessoDaiCF). Serve solo a rifare un giorno illeggibile: uno leggibile
 *     dice il sesso meglio di una statistica sui nomi.
 */
function verifyTaxCode(codeValue, personalDetails = {}) {
  const cf = normalizeTaxCode(codeValue);
  if (!cf) return null;

  const problems = [];

  // 15 caratteri: quasi sempre è l'ultimo che manca, e si può calcolare.
  if (cf.length !== 16 && cf.length !== 15) {
    return {
      ok: false,
      problemi: [`Il codice fiscale deve contenere 16 caratteri (inseriti: ${cf.length}).`],
      suggerito: null,
    };
  }

  const decoded = withoutOmocode(cf);
  const parts = {
    cognome: cf.slice(0, 3),
    nome: cf.slice(3, 6),
    anno: decoded.slice(6, 8),
    mese: cf[8],
    giorno: decoded.slice(9, 11),
    comune: decoded.slice(11, 15),
  };
  // Ogni parte giusta resta com'era scritta, omocodia compresa: si
  // sostituisce solo quello che non torna.
  const correct = {
    cognome: parts.cognome, nome: parts.nome,
    data: cf.slice(6, 11), comune: cf.slice(11, 15),
  };
  let rebuildable = true;

  // Cognome e nome
  const surname = lettersOnly(personalDetails.cognome);
  if (surname) {
    const expected = surnameCode(surname);
    if (parts.cognome !== expected) {
      problems.push(`Le lettere del cognome non corrispondono: per ${personalDetails.cognome.trim().toUpperCase()} sono attese ${expected}.`);
      correct.cognome = expected;
    }
  } else if (!/^[A-Z]{3}$/.test(parts.cognome)) {
    problems.push("Le prime tre lettere (cognome) non sono valide.");
    rebuildable = false;
  }

  const nome = lettersOnly(personalDetails.nome);
  if (nome) {
    const expected = firstNameCode(nome);
    if (parts.nome !== expected) {
      problems.push(`Le lettere del nome non corrispondono: per ${personalDetails.nome.trim().toUpperCase()} sono attese ${expected}.`);
      correct.nome = expected;
    }
  } else if (!/^[A-Z]{3}$/.test(parts.nome)) {
    problems.push("Le lettere dalla 4ª alla 6ª (nome) non sono valide.");
    rebuildable = false;
  }

  // Data e sesso: il giorno delle donne è aumentato di 40.
  const taxCodeDay = /^\d{2}$/.test(parts.giorno) ? Number(parts.giorno) : NaN;
  const chosenSex = /^[MF]$/.test(personalDetails.sesso ?? "") ? personalDetails.sesso : null;
  const femaleInCode = taxCodeDay > 40;
  const female = chosenSex ? chosenSex === "F" : femaleInCode;
  const validDay = (taxCodeDay >= 1 && taxCodeDay <= 31) || (taxCodeDay >= 41 && taxCodeDay <= 71);
  const dateForm = /^\d{2}$/.test(parts.anno) && CF_MONTHS.includes(parts.mese) && validDay;

  const data = readDate(personalDetails.dataNascita);
  if (data && validDay) {
    const expectedDate = dateCode(data, female);
    const writtenDate = parts.anno + parts.mese + parts.giorno;
    if (writtenDate !== expectedDate) {
      // Data giusta ma col sesso opposto a quello scelto: lo si dice, se no
      // "la data non torna" con la data giusta sotto gli occhi non si capisce.
      problems.push(dateCode(data, femaleInCode) === writtenDate
        ? `Nel codice il giorno (${parts.giorno}) corrisponde a ${femaleInCode ? "una donna (giorno più 40)" : "un uomo"}, ma il sesso indicato è ${chosenSex}: verificare sulla tessera sanitaria.`
        : `La data di nascita non corrisponde a quella della scheda (${String(data.giorno).padStart(2, "0")}/${String(data.mese).padStart(2, "0")}/${data.anno}).`);
      correct.data = expectedDate;
    }
  } else if (!dateForm) {
    problems.push("La data di nascita nel codice (caratteri dal 7° all'11°) non è valida.");
    // Senza un giorno leggibile non si sa se è un uomo o una donna: la data
    // della scheda basta solo se il sesso l'ha indicato chi compila.
    const sex = chosenSex || (/^[MF]$/.test(personalDetails.sessoProbabile ?? "") ? personalDetails.sessoProbabile : null);
    if (data && sex) correct.data = dateCode(data, sex === "F");
    else rebuildable = false;
  }

  const expectedMunicipality = /^[A-Z]\d{3}$/.test(personalDetails.comune ?? "") ? personalDetails.comune : null;
  const placeName = String(personalDetails.luogo ?? "").trim().toUpperCase() || "il luogo di nascita della scheda";
  const municipalityForm = /^[A-Z]\d{3}$/.test(parts.comune);
  // Coerente: ogni parte ha la sua forma e il carattere finale torna. Un codice
  // così è quasi sempre copiato giusto da una tessera, e se non torna con la
  // scheda è la scheda a dire un'altra cosa (data battuta male, secondo nome,
  // nato all'estero): rifarlo dalla scheda ci porterebbe dentro i suoi sbagli.
  // Sull'archivio (15/10/2026) erano 81 delle 196 proposte. La forma serve: una
  // lettera dalla A alla J al posto della cifra corrispondente (G per 6) dà lo
  // stesso carattere finale.
  const consistent = cf.length === 16 && checkChar(cf.slice(0, 15)) === cf[15]
    && /^[A-Z]{6}$/.test(cf.slice(0, 6)) && dateForm && municipalityForm;
  const cardProblems = problems.length;
  if (expectedMunicipality && parts.comune !== expectedMunicipality && consistent) {
    problems.push(`Il comune nel codice (${parts.comune}) non corrisponde a quello dei soci nati a ${placeName} (${expectedMunicipality}): verificare il luogo di nascita sulla tessera sanitaria.`);
  } else if (expectedMunicipality && parts.comune !== expectedMunicipality) {
    problems.push(`Il comune di nascita nel codice non corrisponde: per i soci nati a ${placeName} il codice del comune è ${expectedMunicipality}.`);
    correct.comune = expectedMunicipality;
  } else if (!municipalityForm) {
    problems.push("Il codice del comune di nascita (caratteri dal 12° al 15°) non è valido.");
    rebuildable = false;
  }

  if (!rebuildable) return { ok: false, problemi: problems, suggerito: null };
  if (consistent && problems.length) {
    if (cardProblems) problems.push("Il codice è tuttavia coerente con il carattere di controllo: di norma è corretto ed è la scheda a riportare dati diversi. Verificare sulla tessera sanitaria prima di modificarlo.");
    return { ok: false, problemi: problems, suggerito: null };
  }

  const first15 = correct.cognome + correct.nome + correct.data + correct.comune;
  const checkResult = checkChar(first15);
  const suggested = first15 + checkResult;

  if (cf.length === 15) {
    problems.push(`Manca il carattere di controllo finale: il valore atteso è ${checkResult}.`);
  } else if (!problems.length && cf[15] !== checkResult) {
    // Solo se il resto è giusto: altrimenti il carattere finale è sbagliato
    // per forza, e dirlo sarebbe una riga in più da leggere per niente.
    if (!expectedMunicipality) {
      // Senza il comune dei soci nati lì, lo sbaglio può essere nel comune e
      // non nel finale: proporre un finale nuovo rovinerebbe un finale giusto.
      problems.push(`Il carattere di controllo finale non corrisponde al resto del codice: è errato il carattere finale (valore atteso ${checkResult}) oppure un altro carattere, di solito del comune (dal 12° al 15°). Verificare sulla tessera sanitaria.`);
      return { ok: false, problemi: problems, suggerito: null };
    }
    problems.push(`Il carattere di controllo finale è errato: il valore atteso è ${checkResult}.`);
  }

  // Uguale a quello scritto (solo un avviso sul luogo): niente da proporre.
  return { ok: problems.length === 0, problemi: problems, suggerito: problems.length && suggested !== cf ? suggested : null };
}

/**
 * Il sesso ricavato dai codici fiscali dei soci con lo stesso nome ("M" o
 * "F"), o null: come comuneDaiCF, contano solo i codici buoni, una volta
 * ciascuno, e vince chi ha più della metà. Serve quando il giorno nel codice
 * è illeggibile e chi compila non ha indicato il sesso.
 */
function sexFromCodes(codes, minimum = 2) {
  const counts = { M: 0, F: 0 };
  for (const cf of new Set(codes.map(normalizeTaxCode))) {
    if (cf.length !== 16 || checkChar(cf.slice(0, 15)) !== cf[15]) continue;
    const dayKey = Number(withoutOmocode(cf).slice(9, 11));
    if (dayKey >= 1 && dayKey <= 31) counts.M++;
    else if (dayKey >= 41 && dayKey <= 71) counts.F++;
  }
  const totalAmount = counts.M + counts.F;
  if (totalAmount < minimum) return null;
  if (counts.M > totalAmount / 2) return "M";
  return counts.F > totalAmount / 2 ? "F" : null;
}
