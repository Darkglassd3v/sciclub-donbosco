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
 * I pezzi utilizzabili dal tablet in negozio (ruolo kiosk), o null se chi
 * cerca non ha ancora scritto abbastanza.
 *
 * Lì davanti c'è chiunque passi dal negozio, non un volontario del direttivo:
 * deve poter ritrovare la propria scheda, non sfogliare il club. Perciò
 * servono due pezzi, cioè nome e cognome: uno solo aprirebbe l'elenco di
 * tutti gli omonimi.
 */
function pezziKiosk(parti) {
  return (parti || []).length >= 2 ? parti : null;
}

/**
 * Il filtro per un pezzo di ricerca.
 *
 * Da operatore la corrispondenza è all'inizio della parola: si scrive "cos" e
 * si trova Cossetta, che è il modo in cui il direttivo ha sempre cercato.
 *
 * Dal tablet in negozio no: con le prime lettere si sfoglierebbe il club.
 * Lì il pezzo deve essere una parola intera del nome o del cognome — "cos
 * fed" non trova niente, "cossetta federico" sì. Le quattro forme servono ai
 * cognomi composti: "de luca" trova DE LUCA perché "de" è la prima parola e
 * "luca" l'ultima, mentre un cognome corto come RE resta cercabile, cosa che
 * un minimo di lettere impedirebbe.
 */
function filtroPezzo(pezzo, paroleIntere) {
  const forme = paroleIntere
    ? [pezzo, pezzo + " %", "% " + pezzo, "% " + pezzo + " %"]
    : [pezzo + "%"];
  // Le virgolette servono solo alle forme con lo spazio dentro, che altrimenti
  // il filtro non leggerebbe come un valore solo. Senza spazio si scrive come
  // si è sempre scritto.
  return ["last_name", "first_name"]
    .map((colonna) => forme
      .map((f) => `${colonna}.ilike.${f.includes(" ") ? `"${f}"` : f}`)
      .join(","))
    .join(",");
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
 * Mostra il login finché non c'è una sessione, poi il contenuto. Senza
 * sessione non si vede nulla: i soci contengono dati personali e la policy RLS
 * su Supabase rifiuta comunque la lettura anonima.
 *
 * `alPronto` viene chiamata quando la sessione c'è.
 */
async function proteggiPagina(alPronto) {
  window.sb = window.supabase.createClient(
    window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.anonKey);

  const vistaLogin = el("vistaLogin");
  const contenuto = el("contenuto");

  function mostra(sessione) {
    vistaLogin.hidden = !!sessione;
    contenuto.hidden = !sessione;
    if (sessione) alPronto();
  }

  el("formLogin").addEventListener("submit", async (e) => {
    e.preventDefault();
    const errore = el("erroreLogin");
    errore.hidden = true;
    const { error } = await sb.auth.signInWithPassword({
      email: el("email").value.trim(),
      password: el("password").value,
    });
    if (error) {
      errore.textContent = "Email o password non corretti. Riprova.";
      errore.hidden = false;
      return;
    }
    mostra(true);
  });

  const btnEsci = el("btnEsci");
  if (btnEsci) {
    btnEsci.addEventListener("click", async () => {
      await sb.auth.signOut();
      location.reload();
    });
  }

  const { data } = await sb.auth.getSession();
  mostra(data.session);
}

// ---------------------------------------------------------------------------
// Ruoli
//
// Gerarchia: kiosk < utente < admin < superadmin, letta dalla tabella
// profiles (vedi supabase/schema.sql). Stesso pattern di web/shared.js, non
// condiviso perché i due siti non condividono file.
// ---------------------------------------------------------------------------

const LIVELLO_RUOLO = { kiosk: 0, utente: 1, admin: 2, superadmin: 3 };
let _profiloCache = null;

/** Profilo (email + ruolo) dell'utente collegato. Cache in memoria per pagina. */
async function getProfilo() {
  if (_profiloCache) return _profiloCache;
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data, error } = await sb
    .from("profiles")
    .select("role, email")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw error;
  _profiloCache = data;
  return data;
}

/** true se l'utente collegato ha almeno il ruolo minRuolo. */
async function haRuolo(minRuolo) {
  const profilo = await getProfilo();
  if (!profilo) return false;
  return LIVELLO_RUOLO[profilo.role] >= LIVELLO_RUOLO[minRuolo];
}

/**
 * Da chiamare dentro alPronto() di proteggiPagina() nelle pagine riservate:
 * se il ruolo non basta, nasconde #contenuto e mostra un messaggio al suo
 * posto. Ritorna true/false così la pagina sa se continuare il proprio init.
 */
async function richiediRuolo(minRuolo) {
  if (await haRuolo(minRuolo)) return true;
  const contenuto = el("contenuto");
  if (contenuto) {
    contenuto.hidden = true;
    contenuto.insertAdjacentHTML(
      "afterend",
      '<p id="permessiMancanti" class="aiuto">Non hai i permessi per questa pagina.</p>'
    );
  }
  return false;
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
