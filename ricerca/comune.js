// Pezzi condivisi dalle due pagine del sito di ricerca.
//
// Le funzioni in cima sono pure e non toccano né la pagina né la rete: sono
// quelle che ricerca/test-ricerca.js rilegge da qui e mette alla prova.

// ---------------------------------------------------------------------------
// Testo
// ---------------------------------------------------------------------------

/** I pezzi utili di una ricerca, ripuliti da tutto ciò che non è un nome. */
function pezzi(testoCercato) {
  return String(testoCercato || "")
    .toLowerCase()
    .split(/[\s,]+/)
    .map((p) => p.replace(/[^a-zàèéìòóùç'’-]/g, ""))
    .filter((p) => p.length >= 2)
    .slice(0, 4);
}

/**
 * Il filtro per un pezzo di ricerca: la corrispondenza è all'inizio della
 * parola, si scrive "cos" e si trova Cossetta, che è il modo in cui il
 * direttivo ha sempre cercato.
 */
function filtroPezzo(pezzo) {
  return `last_name.ilike.${pezzo}%,first_name.ilike.${pezzo}%`;
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// Nel foglio di partenza "NO" voleva dire "niente": mostrarlo com'è farebbe
// leggere "Abbonamento: NO" dove non c'è nessun abbonamento.
const testo = (v) =>
  v === null || v === undefined || v === "" || String(v).trim().toUpperCase() === "NO"
    ? "—" : String(v);

/** Evidenzia in giallo il pezzo cercato all'inizio della parola. */
function evidenzia(parola, parti) {
  const p = (parti || []).find((x) => String(parola).toLowerCase().startsWith(x));
  if (!p) return esc(parola);
  return "<mark>" + esc(String(parola).slice(0, p.length)) + "</mark>" + esc(String(parola).slice(p.length));
}

// ---------------------------------------------------------------------------
// Abbonamenti a viaggi
//
// Ogni giorno ha il suo colore, sempre lo stesso in tutte le pagine: si
// riconosce il tipo di abbonamento senza leggere. Il nome del giorno resta
// scritto dentro l'etichetta, così l'informazione non è affidata al solo
// colore.
// ---------------------------------------------------------------------------

const GIORNI = {
  SABATO:   { nome: "Sabato",   classe: "giorno-sabato" },
  DOMENICA: { nome: "Domenica", classe: "giorno-domenica" },
  MARTEDI:  { nome: "Martedì",  classe: "giorno-martedi" },
  JOLLY:    { nome: "Jolly",    classe: "giorno-jolly" },
};

/** Il giorno di un abbonamento, ricavato dal nome dell'opzione di listino. */
function giornoAbbonamento(tipoAbbonamento) {
  const t = String(tipoAbbonamento || "").toUpperCase();
  if (!/\d+\s*VIAGG/.test(t)) return null;
  if (t.includes("SABATO")) return "SABATO";
  if (t.includes("DOMENICA")) return "DOMENICA";
  if (t.includes("MARTED")) return "MARTEDI";
  if (t.includes("JOLLY")) return "JOLLY";
  return null;
}

/** L'etichetta colorata del giorno, o stringa vuota se il giorno non c'è. */
function etichettaGiorno(giorno) {
  const g = GIORNI[giorno];
  if (!g) return "";
  return `<span class="etichetta ${g.classe}">${g.nome}</span>`;
}

// ---------------------------------------------------------------------------
// Telefono
//
// I numeri in anagrafica sono scritti come capita: "380 340 9158",
// "0141/123456", "+39 333 1112222". WhatsApp invece vuole solo cifre col
// prefisso internazionale davanti.
//
// Un numero italiano scritto per intero (39 + dieci cifre) arriva già a 12
// cifre: è da lì che si distingue dal cellulare "3931234567", che di cifre ne
// ha dieci e il prefisso lo deve ancora ricevere.
// ---------------------------------------------------------------------------

function numeroWhatsapp(telefono) {
  if (!telefono) return null;
  let n = String(telefono).replace(/[^\d+]/g, "");

  if (n.startsWith("+")) n = n.slice(1);
  else if (n.startsWith("00")) n = n.slice(2);
  else if (!(n.length >= 11 && n.startsWith("39"))) n = "39" + n;

  return /^\d{8,15}$/.test(n) ? n : null;
}

/** Il numero come si compone dal telefono: le cifre così come sono scritte. */
function numeroChiamata(telefono) {
  if (!telefono) return null;
  const n = String(telefono).replace(/[^\d+]/g, "");
  return n.length >= 6 ? n : null;
}

/** I due pulsanti "Chiama" e "WhatsApp", o niente se manca il numero. */
function contattiHtml(telefono) {
  const chiamata = numeroChiamata(telefono);
  const whatsapp = numeroWhatsapp(telefono);
  if (!chiamata && !whatsapp) return "";

  return `
    <div class="contatti">
      ${chiamata ? `<a class="chiama" href="tel:${esc(chiamata)}">Chiama</a>` : ""}
      ${whatsapp ? `<a class="whatsapp" href="https://wa.me/${esc(whatsapp)}" target="_blank" rel="noopener">WhatsApp</a>` : ""}
    </div>`;
}

// ---------------------------------------------------------------------------
// Pagina
//
// Da qui in giù serve il browser. Le pagine chiamano proteggiPagina() e da
// quel momento hanno `sb` pronto.
// ---------------------------------------------------------------------------

function el(id) {
  return document.getElementById(id);
}

/**
 * Senza sessione si va al login del gestionale, che è l'unico ingresso del
 * sito: dopo l'accesso riporta qui (?next=). Senza sessione non si vede
 * nulla: i soci contengono dati personali e la policy RLS su Supabase
 * rifiuta comunque la lettura anonima.
 *
 * `alPronto` viene chiamata quando la sessione c'è.
 */
async function proteggiPagina(alPronto) {
  window.sb = window.supabase.createClient(
    window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.anonKey);

  const questa = location.pathname.split("/").pop() || "index.html";
  const { data } = await sb.auth.getSession();
  if (!data.session) {
    location.replace("../login.html?next=" + encodeURIComponent("ricerca/" + questa));
    return;
  }

  const btnEsci = el("btnEsci");
  if (btnEsci) {
    btnEsci.addEventListener("click", async () => {
      // Come nel gestionale (logout in web/shared.js): uscire chiude anche il
      // "Vedi come", così al prossimo accesso si rientra sé stessi.
      const accesso = await getAccesso().catch(() => null);
      if (accesso && accesso.real_role === "superadmin" && accesso.role !== "superadmin") {
        await sb.rpc("set_view_as", { role: null });
      }
      await sb.auth.signOut();
      location.replace("../login.html");
    });
  }
  el("contenuto").hidden = false;
  alPronto();
}

// ---------------------------------------------------------------------------
// Permessi
//
// Gli stessi di web/shared.js, letti dal database con my_access(): qui
// servono il permesso gite, "Vedi come" del superadmin e il link al
// gestionale per chi ci lavora anche. Non condiviso perché i due siti non
// condividono file.
// ---------------------------------------------------------------------------

let _accessoCache = null;

/** { email, role, real_role, permissions } di chi è collegato, o null. */
async function getAccesso() {
  if (_accessoCache) return _accessoCache;
  const { data, error } = await sb.rpc("my_access");
  if (error) throw error;
  _accessoCache = (data && data[0]) || null;
  return _accessoCache;
}

/**
 * Da chiamare dentro alPronto(): chi non ha il permesso va alla radice del
 * sito, che lo porta alla pagina del suo ruolo; chi non ha ruolo al login,
 * che glielo spiega. Senza linea (sul pullman succede) si resta: la pagina
 * gite lavora con la coda, e il database controlla comunque ogni richiesta.
 */
async function richiediPermesso(permesso) {
  let accesso;
  try {
    accesso = await getAccesso();
  } catch (errore) {
    if (erroreDiRete(errore)) return true;
    throw errore;
  }
  if (accesso && accesso.permissions.includes(permesso)) {
    mostraGestionale(accesso);
    mostraVediCome(accesso);
    return true;
  }
  location.replace(accesso ? "../index.html" : "../login.html?senza=1");
  return false;
}

/** Il link al gestionale, per chi ci lavora anche (admin, superadmin). */
function mostraGestionale(accesso) {
  const link = el("linkGestionale");
  if (link) link.hidden = !accesso.permissions.includes("soci");
}

/** Come si chiamano i ruoli a schermo (gli stessi di NOMI_RUOLI in web/shared.js). */
const NOMI_RUOLI = {
  superadmin: "Superadmin", admin: "Admin", tesoriere: "Tesoriere",
  assicurazione: "Assicurazione", gite: "Utente (ricerca e gite)", social: "Social",
};

/** Fascia gialla del "Vedi come", come nel gestionale (mostraVediCome in web/shared.js). */
function mostraVediCome(accesso) {
  if (accesso.real_role !== "superadmin" || accesso.role === "superadmin") return;
  const fascia = document.createElement("div");
  fascia.className = "fascia-vedi-come";
  fascia.innerHTML = `Stai vedendo il sito come <b>${esc(NOMI_RUOLI[accesso.role] || accesso.role)}</b>
    <button type="button" class="btn-chiaro">Torna superadmin</button>`;
  fascia.querySelector("button").addEventListener("click", async () => {
    const { error } = await sb.rpc("set_view_as", { role: null });
    if (!error) location.replace("../gestione.html");
  });
  document.body.append(fascia);
}

/**
 * Distingue "la rete non ha funzionato" da "il database ha detto di no".
 * I nomi del guasto cambiano da browser a browser: Chrome dice "Failed to
 * fetch", Safari "Load failed", Firefox "NetworkError".
 */
function erroreDiRete(errore) {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return true;
  const descrizione = String((errore && errore.message) || "");
  return /failed to fetch|networkerror|network request failed|load failed/i.test(descrizione);
}

/**
 * Vale la pena rimandare questa richiesta?
 *
 * Se il database ha risposto — anche solo per dire di no — l'errore porta un
 * codice, e riprovare darebbe lo stesso esito all'infinito: una voce così
 * bloccherebbe la coda dietro di sé per sempre. Se il codice non c'è, non è
 * arrivata risposta: è la linea, e quella prima o poi torna.
 */
function ritentabile(errore) {
  if (erroreDiRete(errore)) return true;
  return !(errore && errore.code);
}

/** Messaggio leggibile a partire da un errore Supabase. */
function messaggioErrore(errore) {
  if (!errore) return "Errore sconosciuto";
  if (errore.code === "PGRST301" || errore.status === 401) {
    return "Sessione scaduta: esci e rientra.";
  }
  // "Failed to fetch" non dice niente a chi è sul pullman alle sette. Quello
  // che serve sapere è che è colpa della linea e che si può riprovare: la
  // gita porta con sé l'id della pressione, quindi un secondo tentativo non
  // la scala due volte nemmeno se il primo era arrivato.
  if (erroreDiRete(errore)) {
    return "Connessione assente o troppo debole: riprova.";
  }
  return errore.message || String(errore);
}
