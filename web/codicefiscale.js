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

const CF_MESI = "ABCDEHLMPRST";

// Omocodia: quando due persone avrebbero lo stesso codice, l'Agenzia sostituisce
// alcune cifre con lettere (0 = L, 1 = M, ... 9 = V), partendo da destra.
const CF_OMOCODIA = "LMNPQRSTUV";
const CF_POSIZIONI_NUMERICHE = [6, 7, 9, 10, 12, 13, 14];

// Valori dei caratteri in posizione dispari (1ª, 3ª, ...) per il carattere di
// controllo: una tabella fissa, non ha una regola da cui ricavarla.
const CF_DISPARI = {
  0: 1, 1: 0, 2: 5, 3: 7, 4: 9, 5: 13, 6: 15, 7: 17, 8: 19, 9: 21,
  A: 1, B: 0, C: 5, D: 7, E: 9, F: 13, G: 15, H: 17, I: 19, J: 21, K: 2, L: 4, M: 18,
  N: 20, O: 11, P: 3, Q: 6, R: 8, S: 12, T: 14, U: 16, V: 10, W: 22, X: 25, Y: 24, Z: 23,
};

/** Maiuscolo, senza spazi né altri segni: come lo si legge sulla tessera. */
function normalizzaCF(codice) {
  return String(codice ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** Solo lettere A-Z: "Nicolò D'Amico" → "NICOLODAMICO". */
function soloLettere(testo) {
  return String(testo ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toUpperCase().replace(/[^A-Z]/g, "");
}

function consonantiEVocali(testo) {
  const lettere = soloLettere(testo);
  return {
    consonanti: lettere.replace(/[AEIOU]/g, ""),
    vocali: lettere.replace(/[^AEIOU]/g, ""),
  };
}

/** Le tre lettere del cognome: consonanti, poi vocali, poi X. */
function codiceCognome(cognome) {
  const { consonanti, vocali } = consonantiEVocali(cognome);
  return (consonanti + vocali + "XXX").slice(0, 3);
}

/**
 * Le tre lettere del nome. Come il cognome, tranne un caso: con quattro o più
 * consonanti si prendono la prima, la terza e la quarta (Gianfranco → GFR).
 */
function codiceNome(nome) {
  const { consonanti, vocali } = consonantiEVocali(nome);
  if (consonanti.length >= 4) return consonanti[0] + consonanti[2] + consonanti[3];
  return (consonanti + vocali + "XXX").slice(0, 3);
}

/** Toglie l'omocodia: rimette le cifre dove l'Agenzia ha messo lettere. */
function senzaOmocodia(codice) {
  const caratteri = codice.split("");
  CF_POSIZIONI_NUMERICHE.forEach((i) => {
    const cifra = CF_OMOCODIA.indexOf(caratteri[i]);
    if (i < caratteri.length && cifra >= 0) caratteri[i] = String(cifra);
  });
  return caratteri.join("");
}

/** Il 16° carattere, calcolato sui primi 15. */
function carattereControllo(primi15) {
  let somma = 0;
  for (let i = 0; i < 15; i++) {
    const c = primi15[i];
    // Posizioni dispari contando da 1, cioè indici pari contando da 0.
    somma += i % 2 === 0 ? CF_DISPARI[c] : (/\d/.test(c) ? Number(c) : c.charCodeAt(0) - 65);
  }
  return String.fromCharCode(65 + (somma % 26));
}

/** "2026-01-31" (come la dà un <input type="date">) → { anno, mese, giorno }, o null. */
function leggiData(data) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(data ?? ""));
  if (!m) return null;
  return { anno: Number(m[1]), mese: Number(m[2]), giorno: Number(m[3]) };
}

/** I cinque caratteri della data (anno, lettera del mese, giorno): per le donne il giorno è aumentato di 40. */
function codiceData(data, femmina) {
  return String(data.anno % 100).padStart(2, "0") + CF_MESI[data.mese - 1]
    + String(data.giorno + (femmina ? 40 : 0)).padStart(2, "0");
}

/**
 * Il codice fiscale calcolato dall'anagrafica { cognome, nome, dataNascita,
 * sesso: "M" o "F", comune: codice catastale come "A479" }, o null se manca
 * qualcosa. Non conosce l'omocodia: è una proposta, chi ha la tessera davanti
 * controlla.
 */
function calcolaCF({ cognome, nome, dataNascita, sesso, comune } = {}) {
  const data = leggiData(dataNascita);
  if (!soloLettere(cognome) || !soloLettere(nome) || !data || data.mese < 1 || data.mese > 12
    || !/^[MF]$/.test(sesso ?? "") || !/^[A-Z]\d{3}$/.test(comune ?? "")) return null;
  const primi15 = codiceCognome(cognome) + codiceNome(nome) + codiceData(data, sesso === "F") + comune;
  return primi15 + carattereControllo(primi15);
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
function comuneDaiCF(codici, minimo = 1) {
  const conti = {};
  for (const cf of new Set(codici.map(normalizzaCF))) {
    if (cf.length !== 16 || carattereControllo(cf.slice(0, 15)) !== cf[15]) continue;
    const comune = senzaOmocodia(cf).slice(11, 15);
    if (/^[A-Z]\d{3}$/.test(comune)) conti[comune] = (conti[comune] || 0) + 1;
  }
  const totale = Object.values(conti).reduce((a, b) => a + b, 0);
  const [comune, volte] = Object.entries(conti).sort((a, b) => b[1] - a[1])[0] || [];
  return totale >= minimo && volte > totale / 2 ? comune : null;
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
function verificaCF(codice, anagrafica = {}) {
  const cf = normalizzaCF(codice);
  if (!cf) return null;

  const problemi = [];

  // 15 caratteri: quasi sempre è l'ultimo che manca, e si può calcolare.
  if (cf.length !== 16 && cf.length !== 15) {
    return {
      ok: false,
      problemi: [`Il codice fiscale deve avere 16 caratteri: ne ha ${cf.length}.`],
      suggerito: null,
    };
  }

  const decodificato = senzaOmocodia(cf);
  const parti = {
    cognome: cf.slice(0, 3),
    nome: cf.slice(3, 6),
    anno: decodificato.slice(6, 8),
    mese: cf[8],
    giorno: decodificato.slice(9, 11),
    comune: decodificato.slice(11, 15),
  };
  // Ogni parte giusta resta com'era scritta, omocodia compresa: si
  // sostituisce solo quello che non torna.
  const corretto = {
    cognome: parti.cognome, nome: parti.nome,
    data: cf.slice(6, 11), comune: cf.slice(11, 15),
  };
  let ricostruibile = true;

  // Cognome e nome
  const cognome = soloLettere(anagrafica.cognome);
  if (cognome) {
    const atteso = codiceCognome(cognome);
    if (parti.cognome !== atteso) {
      problemi.push(`Le lettere del cognome non tornano: per ${anagrafica.cognome.trim().toUpperCase()} dovrebbero essere ${atteso}.`);
      corretto.cognome = atteso;
    }
  } else if (!/^[A-Z]{3}$/.test(parti.cognome)) {
    problemi.push("Le prime tre lettere (cognome) non sono valide.");
    ricostruibile = false;
  }

  const nome = soloLettere(anagrafica.nome);
  if (nome) {
    const atteso = codiceNome(nome);
    if (parti.nome !== atteso) {
      problemi.push(`Le lettere del nome non tornano: per ${anagrafica.nome.trim().toUpperCase()} dovrebbero essere ${atteso}.`);
      corretto.nome = atteso;
    }
  } else if (!/^[A-Z]{3}$/.test(parti.nome)) {
    problemi.push("Le lettere dalla 4ª alla 6ª (nome) non sono valide.");
    ricostruibile = false;
  }

  // Data e sesso: il giorno delle donne è aumentato di 40.
  const giornoCF = /^\d{2}$/.test(parti.giorno) ? Number(parti.giorno) : NaN;
  const sessoScelto = /^[MF]$/.test(anagrafica.sesso ?? "") ? anagrafica.sesso : null;
  const femminaNelCodice = giornoCF > 40;
  const femmina = sessoScelto ? sessoScelto === "F" : femminaNelCodice;
  const giornoValido = (giornoCF >= 1 && giornoCF <= 31) || (giornoCF >= 41 && giornoCF <= 71);
  const formaData = /^\d{2}$/.test(parti.anno) && CF_MESI.includes(parti.mese) && giornoValido;

  const data = leggiData(anagrafica.dataNascita);
  if (data && giornoValido) {
    const attesa = codiceData(data, femmina);
    const scritta = parti.anno + parti.mese + parti.giorno;
    if (scritta !== attesa) {
      // Data giusta ma col sesso opposto a quello scelto: lo si dice, se no
      // "la data non torna" con la data giusta sotto gli occhi non si capisce.
      problemi.push(codiceData(data, femminaNelCodice) === scritta
        ? `Nel codice il giorno (${parti.giorno}) è quello ${femminaNelCodice ? "di una donna (il giorno più 40)" : "di un uomo"}, ma il sesso scelto è ${sessoScelto}: controlla sulla tessera sanitaria.`
        : `La data di nascita non torna con quella della scheda (${String(data.giorno).padStart(2, "0")}/${String(data.mese).padStart(2, "0")}/${data.anno}).`);
      corretto.data = attesa;
    }
  } else if (!formaData) {
    problemi.push("La data di nascita nel codice (caratteri dal 7° all'11°) non è valida.");
    // Senza un giorno leggibile non si sa se è un uomo o una donna: la data
    // della scheda basta solo se il sesso l'ha indicato chi compila.
    const sesso = sessoScelto || (/^[MF]$/.test(anagrafica.sessoProbabile ?? "") ? anagrafica.sessoProbabile : null);
    if (data && sesso) corretto.data = codiceData(data, sesso === "F");
    else ricostruibile = false;
  }

  const comuneAtteso = /^[A-Z]\d{3}$/.test(anagrafica.comune ?? "") ? anagrafica.comune : null;
  const luogo = String(anagrafica.luogo ?? "").trim().toUpperCase() || "il luogo di nascita della scheda";
  const formaComune = /^[A-Z]\d{3}$/.test(parti.comune);
  // Coerente: ogni parte ha la sua forma e il carattere finale torna. Un codice
  // così è quasi sempre copiato giusto da una tessera, e se non torna con la
  // scheda è la scheda a dire un'altra cosa (data battuta male, secondo nome,
  // nato all'estero): rifarlo dalla scheda ci porterebbe dentro i suoi sbagli.
  // Sull'archivio (15/10/2026) erano 81 delle 196 proposte. La forma serve: una
  // lettera dalla A alla J al posto della cifra corrispondente (G per 6) dà lo
  // stesso carattere finale.
  const coerente = cf.length === 16 && carattereControllo(cf.slice(0, 15)) === cf[15]
    && /^[A-Z]{6}$/.test(cf.slice(0, 6)) && formaData && formaComune;
  const problemiDellaScheda = problemi.length;
  if (comuneAtteso && parti.comune !== comuneAtteso && coerente) {
    problemi.push(`Il comune nel codice (${parti.comune}) non è quello dei soci nati a ${luogo} (${comuneAtteso}): controlla il luogo di nascita sulla tessera sanitaria.`);
  } else if (comuneAtteso && parti.comune !== comuneAtteso) {
    problemi.push(`Il comune di nascita nel codice non torna: per ${luogo} i codici dei soci nati lì hanno ${comuneAtteso}.`);
    corretto.comune = comuneAtteso;
  } else if (!formaComune) {
    problemi.push("Il codice del comune di nascita (caratteri dal 12° al 15°) non è valido.");
    ricostruibile = false;
  }

  if (!ricostruibile) return { ok: false, problemi, suggerito: null };
  if (coerente && problemi.length) {
    if (problemiDellaScheda) problemi.push("Il codice però torna col suo carattere finale: di solito è giusto, ed è la scheda a dire un'altra cosa. Controlla sulla tessera sanitaria prima di cambiarlo.");
    return { ok: false, problemi, suggerito: null };
  }

  const primi15 = corretto.cognome + corretto.nome + corretto.data + corretto.comune;
  const controllo = carattereControllo(primi15);
  const suggerito = primi15 + controllo;

  if (cf.length === 15) {
    problemi.push(`Manca l'ultimo carattere: dovrebbe essere ${controllo}.`);
  } else if (!problemi.length && cf[15] !== controllo) {
    // Solo se il resto è giusto: altrimenti il carattere finale è sbagliato
    // per forza, e dirlo sarebbe una riga in più da leggere per niente.
    if (!comuneAtteso) {
      // Senza il comune dei soci nati lì, lo sbaglio può essere nel comune e
      // non nel finale: proporre un finale nuovo rovinerebbe un finale giusto.
      problemi.push(`L'ultimo carattere non torna col resto del codice: o è sbagliato lui (dovrebbe essere ${controllo}) o un altro carattere, di solito del comune (dal 12° al 15°). Controlla sulla tessera sanitaria.`);
      return { ok: false, problemi, suggerito: null };
    }
    problemi.push(`L'ultimo carattere è sbagliato: dovrebbe essere ${controllo}.`);
  }

  // Uguale a quello scritto (solo un avviso sul luogo): niente da proporre.
  return { ok: problemi.length === 0, problemi, suggerito: problemi.length && suggerito !== cf ? suggerito : null };
}

/**
 * Il sesso ricavato dai codici fiscali dei soci con lo stesso nome ("M" o
 * "F"), o null: come comuneDaiCF, contano solo i codici buoni, una volta
 * ciascuno, e vince chi ha più della metà. Serve quando il giorno nel codice
 * è illeggibile e chi compila non ha indicato il sesso.
 */
function sessoDaiCF(codici, minimo = 2) {
  const conti = { M: 0, F: 0 };
  for (const cf of new Set(codici.map(normalizzaCF))) {
    if (cf.length !== 16 || carattereControllo(cf.slice(0, 15)) !== cf[15]) continue;
    const giorno = Number(senzaOmocodia(cf).slice(9, 11));
    if (giorno >= 1 && giorno <= 31) conti.M++;
    else if (giorno >= 41 && giorno <= 71) conti.F++;
  }
  const totale = conti.M + conti.F;
  if (totale < minimo) return null;
  if (conti.M > totale / 2) return "M";
  return conti.F > totale / 2 ? "F" : null;
}
