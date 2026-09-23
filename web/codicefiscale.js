// Controllo del codice fiscale.
//
// Il codice fiscale si scrive a mano, spesso copiandolo da una tessera
// sanitaria tenuta in mano da un socio: una lettera sbagliata passa
// inosservata e arriva così all'assicurazione, che rimanda indietro la
// pratica. Queste funzioni confrontano il codice con cognome, nome e data di
// nascita già scritti nella scheda e, se qualcosa non torna, propongono il
// codice che ne verrebbe fuori.
//
// È un avviso, non un blocco: il codice lo assegna l'Agenzia delle Entrate e
// in casi rari (omocodia, nomi stranieri trascritti in modi diversi, errori
// nell'anagrafica invece che nel codice) quello giusto non coincide con il
// calcolo. Chi ha il documento davanti ha l'ultima parola.
//
// Il comune di nascita non si controlla: servirebbe l'elenco dei codici
// catastali di tutti i comuni e degli stati esteri. Se ne guarda solo la forma
// (una lettera e tre cifre) e nel codice proposto resta quello scritto.
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
  const femmina = giornoCF > 40;
  const giornoValido = (giornoCF >= 1 && giornoCF <= 31) || (giornoCF >= 41 && giornoCF <= 71);
  const formaData = /^\d{2}$/.test(parti.anno) && CF_MESI.includes(parti.mese) && giornoValido;

  const data = leggiData(anagrafica.dataNascita);
  if (data && giornoValido) {
    const attesa = String(data.anno % 100).padStart(2, "0")
      + CF_MESI[data.mese - 1]
      + String(data.giorno + (femmina ? 40 : 0)).padStart(2, "0");
    if (parti.anno + parti.mese + parti.giorno !== attesa) {
      problemi.push(`La data di nascita non torna con quella della scheda (${String(data.giorno).padStart(2, "0")}/${String(data.mese).padStart(2, "0")}/${data.anno}).`);
      corretto.data = attesa;
    }
  } else if (!formaData) {
    // Senza un giorno leggibile non si sa se è un uomo o una donna, quindi
    // nemmeno con la data della scheda si può riscrivere questa parte.
    problemi.push("La data di nascita nel codice (caratteri dal 7° all'11°) non è valida.");
    ricostruibile = false;
  }

  if (!/^[A-Z]\d{3}$/.test(parti.comune)) {
    problemi.push("Il codice del comune di nascita (caratteri dal 12° al 15°) non è valido.");
    ricostruibile = false;
  }

  if (!ricostruibile) return { ok: false, problemi, suggerito: null };

  const primi15 = corretto.cognome + corretto.nome + corretto.data + corretto.comune;
  const controllo = carattereControllo(primi15);
  const suggerito = primi15 + controllo;

  if (cf.length === 15) {
    problemi.push(`Manca l'ultimo carattere: dovrebbe essere ${controllo}.`);
  } else if (!problemi.length && cf[15] !== controllo) {
    // Solo se il resto è giusto: altrimenti il carattere finale è sbagliato
    // per forza, e dirlo sarebbe una riga in più da leggere per niente.
    problemi.push(`L'ultimo carattere è sbagliato: dovrebbe essere ${controllo}.`);
  }

  return { ok: problemi.length === 0, problemi, suggerito: problemi.length ? suggerito : null };
}
