// Pezzi condivisi dalle due pagine del sito di ricerca.
//
// Le funzioni in cima sono pure e non toccano né la pagina né la rete: sono
// quelle che ricerca/test-ricerca.js rilegge da qui e mette alla prova.

// ---------------------------------------------------------------------------
// Testo
// ---------------------------------------------------------------------------

/** I pezzi utili di una ricerca, ripuliti da tutto ciò che non è un nome. */
function pieces(searchedText) {
  return String(searchedText || "")
    .toLowerCase()
    .split(/[\s,]+/)
    .map((p) => p.replace(/[^a-zàèéìòóùç'’-]/g, ""))
    .filter((p) => p.length >= 2)
    .slice(0, 4);
}

/**
 * I numeri tessera scritti nella ricerca, senza gli zeri davanti: "0021" è la
 * tessera 21, come la salva Soci (cardNumber() in web/index.html). Si
 * cercano uguali, non "che iniziano per": la tessera 12, non la 120.
 */
function cardNumbers(searchedText) {
  return (String(searchedText || "").match(/\d{1,15}/g) || []).map((n) => String(BigInt(n))).slice(0, 4);
}

/**
 * Il filtro per un pezzo di ricerca: la corrispondenza è all'inizio della
 * parola, si scrive "cos" e si trova Cossetta, che è il modo in cui il
 * direttivo ha sempre cercato. Anche all'inizio del cognome o del nome nella
 * chiave del nome, che ignora accenti e apostrofi.
 */
function pieceFilter(piece) {
  const keyName = nameKey(piece);
  return `last_name.ilike.${piece}%,first_name.ilike.${piece}%`
    + (keyName ? `,name_key.like.${keyName}%,name_key.like.% ${keyName}%` : "");
}

/**
 * Le sole lettere A-Z, senza accenti e apostrofi: "d'angelo" → "DANGELO". È
 * norm_name() di schema.sql, con cui il database riempie members.name_key
 * ("DANGELO MARIO"): così "d'angelo" trova DANGELO e "dangelo" trova
 * D'ANGELO. Uguale a nameKey() in web/shared.js.
 */
function nameKey(t) {
  return String(t ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z]/g, "");
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// Nel foglio di partenza "NO" voleva dire "niente": mostrarlo com'è farebbe
// leggere "Abbonamento: NO" dove non c'è nessun abbonamento.
const text = (v) =>
  v === null || v === undefined || v === "" || String(v).trim().toUpperCase() === "NO"
    ? "—" : String(v);

/** Evidenzia in giallo il pezzo cercato all'inizio della parola. */
function highlight(word, parts) {
  const p = (parts || []).find((x) => String(word).toLowerCase().startsWith(x));
  if (!p) return esc(word);
  return "<mark>" + esc(String(word).slice(0, p.length)) + "</mark>" + esc(String(word).slice(p.length));
}

// ---------------------------------------------------------------------------
// Abbonamenti a viaggi
//
// Ogni giorno ha il suo colore, sempre lo stesso in tutte le pagine: si
// riconosce il tipo di abbonamento senza leggere. Il nome del giorno resta
// scritto dentro l'etichetta, così l'informazione non è affidata al solo
// colore.
// ---------------------------------------------------------------------------

// I colori stanno in web/brand.css ("Giorni delle gite"): basta data-giorno.
const DAYS = {
  SABATO:   { nome: "Sabato" },
  DOMENICA: { nome: "Domenica" },
  MARTEDI:  { nome: "Martedì" },
  JOLLY:    { nome: "Jolly" },
};

/** Il giorno di un abbonamento, ricavato dal nome dell'opzione di listino. */
function passDay(passType) {
  const t = String(passType || "").toUpperCase();
  if (!/\d+\s*VIAGG/.test(t)) return null;
  if (t.includes("SABATO")) return "SABATO";
  if (t.includes("DOMENICA")) return "DOMENICA";
  if (t.includes("MARTED")) return "MARTEDI";
  if (t.includes("JOLLY")) return "JOLLY";
  return null;
}

/** L'etichetta colorata del giorno, o stringa vuota se il giorno non c'è. */
function dayLabel(dayKey) {
  const g = DAYS[dayKey];
  if (!g) return "";
  return `<span class="giorno-etichetta" data-giorno="${dayKey}">${g.nome}</span>`;
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

function whatsappNumber(phoneNumber) {
  if (!phoneNumber) return null;
  let n = String(phoneNumber).replace(/[^\d+]/g, "");

  if (n.startsWith("+")) n = n.slice(1);
  else if (n.startsWith("00")) n = n.slice(2);
  else if (!(n.length >= 11 && n.startsWith("39"))) n = "39" + n;

  return /^\d{8,15}$/.test(n) ? n : null;
}

/** Il numero come si compone dal telefono: le cifre così come sono scritte. */
function callNumber(phoneNumber) {
  if (!phoneNumber) return null;
  const n = String(phoneNumber).replace(/[^\d+]/g, "");
  return n.length >= 6 ? n : null;
}

/** I due pulsanti "Chiama" e "WhatsApp", o niente se manca il numero. */
function contactsHtml(phoneNumber) {
  const call = callNumber(phoneNumber);
  const whatsapp = whatsappNumber(phoneNumber);
  if (!call && !whatsapp) return "";

  return `
    <div class="contatti">
      ${call ? `<a class="chiama" href="tel:${esc(call)}">Chiama</a>` : ""}
      ${whatsapp ? `<a class="whatsapp" href="https://wa.me/${esc(whatsapp)}" target="_blank" rel="noopener">WhatsApp</a>` : ""}
    </div>`;
}

// ---------------------------------------------------------------------------
// Pagina
//
// Da qui in giù serve il browser. Le pagine chiamano protectPage() e da
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
async function protectPage(alPronto) {
  window.sb = window.supabase.createClient(
    window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.anonKey);

  const thisPage = location.pathname.split("/").pop() || "index.html";
  const { data } = await sb.auth.getSession();
  if (!data.session) {
    location.replace("../login.html?next=" + encodeURIComponent("ricerca/" + thisPage));
    return;
  }

  prepareMenu();
  // Esci sta due volte: in alto sul computer, in fondo al menu sul telefono.
  for (const btnExit of document.querySelectorAll(".voce-esci")) {
    btnExit.addEventListener("click", async () => {
      // Come nel gestionale (logout in web/shared.js): uscire chiude anche il
      // "Vedi come", così al prossimo accesso si rientra sé stessi.
      const access = await getAccess().catch(() => null);
      if (access && access.real_role === "superadmin" && access.role !== "superadmin") {
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

let _accessCache = null;

/** { email, role, real_role, permissions, change_password } di chi è collegato, o null. */
async function getAccess() {
  if (_accessCache) return _accessCache;
  const { data, error } = await sb.rpc("my_access");
  if (error) throw error;
  _accessCache = (data && data[0]) || null;
  return _accessCache;
}

/**
 * Da chiamare dentro alPronto(): chi non ha il permesso va alla radice del
 * sito, che lo porta alla pagina del suo ruolo; chi non ha ruolo al login,
 * che glielo spiega; chi ha ancora la password iniziale va a cambiarla.
 * Senza linea (sul pullman succede) si resta: la pagina gite lavora con la
 * coda, e il database controlla comunque ogni richiesta.
 */
async function requestPermission(permission) {
  let access;
  try {
    access = await getAccess();
  } catch (err) {
    if (networkError(err)) return true;
    throw err;
  }
  if (access && access.change_password) {
    location.replace("../password.html");
    return false;
  }
  if (access && access.permissions.includes(permission)) {
    drawBar(access);
    showViewAs(access);
    return true;
  }
  location.replace(access ? "../index.html" : "../login.html?senza=1");
  return false;
}

/**
 * La barra in cima è quella del gestionale (web/brand.css): le voci si
 * vedono secondo i permessi, e ruolo e permessi si ricordano per la prossima
 * pagina come fa rememberAccess() in web/shared.js. Lo script nell'head li
 * rimette prima del primo disegno, così la barra non cambia passando da una
 * pagina all'altra.
 */
function drawBar(access) {
  const html = document.documentElement;
  html.dataset.ruolo = access.role;
  html.dataset.permessi = access.permissions.join(" ");
  try {
    // Same shape as rememberAccess() in web/shared.js: those pages show email and role from here.
    localStorage.setItem("sciclub-ruolo", JSON.stringify({ role: access.role, permissions: access.permissions,
      email: access.email || "", roleName: ROLE_NAMES[access.role] || access.role }));
  } catch (err) { /* storage negato: la barra si aggiorna lo stesso qui sotto */ }
  document.querySelectorAll(".barra-voci [data-permesso]").forEach((item) => {
    item.hidden = !access.permissions.includes(item.dataset.permesso);
  });
  writeMenuLabels();
  writeUser(access);
  window.addEventListener("resize", barHeight);
  menuLabels().catch(() => {});
}

/**
 * I nomi delle voci della barra scelti in Gestione > Ruoli (tabella
 * nav_labels): come NOMI_BARRA, writeMenuLabels() e menuLabels() in
 * web/shared.js, con la stessa memoria nel browser ("sciclub-voci").
 */
let MENU_LABELS = (() => {
  try { return JSON.parse(localStorage.getItem("sciclub-voci")) || {}; } catch (e) { return {}; }
})();

function writeMenuLabels() {
  document.querySelectorAll(".barra-voci [data-permesso]").forEach((item) => {
    // Il nome sta nello span accanto all'icona (nel gruppo, dentro summary).
    const text = item.querySelector(":scope > span, :scope > summary > span") || item;
    if (item.dataset.nome === undefined) item.dataset.nome = text.textContent;
    text.textContent = MENU_LABELS[item.dataset.permesso] || item.dataset.nome;
  });
  barHeight();
}

async function menuLabels() {
  const { data, error } = await sb.from("nav_labels").select("key, label");
  if (error) throw error;
  MENU_LABELS = Object.fromEntries(data.map((r) => [r.key, r.label]));
  try { localStorage.setItem("sciclub-voci", JSON.stringify(MENU_LABELS)); } catch (e) { /* storage negato */ }
  writeMenuLabels();
}

/**
 * L'altezza vera della barra in --barra-h: sul computer la barra va su due
 * righe quando le voci non ci stanno (brand.css), e quello che si attacca
 * sotto di lei deve seguirla. Si ricalcola con le voci, coi loro nomi e con
 * la finestra (drawBar()). La stessa in web/shared.js.
 */
function barHeight() {
  const bar = document.querySelector(".barra");
  if (bar) document.documentElement.style.setProperty("--barra-h", `${bar.offsetHeight}px`);
}

/**
 * Il menu: la voce di questa pagina è già segnata nell'HTML; qui il suo nome
 * nella barra del telefono, il pannello che «Menu» apre e chiude (Esc, una voce
 * scelta e un tocco fuori lo chiudono) e il tema. Come in web/shared.js.
 */
function prepareMenu() {
  const item = document.querySelector('.barra-voci a[aria-current="page"]');
  if (item) document.querySelectorAll(".barra-pagina").forEach((x) => { x.textContent = item.textContent.trim(); });
  markTheme();
  const button = document.querySelector(".apri-menu");
  if (!button) return;
  const isOpen = () => document.documentElement.classList.contains("menu-aperto");
  button.addEventListener("click", () => openMenu(!isOpen()));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && isOpen()) openMenu(false); });
  document.addEventListener("click", (e) => {
    if (isOpen() && (!e.target.closest(".barra-voci, .apri-menu") || e.target.closest(".barra-voci a"))) openMenu(false);
  });
}

function openMenu(isOpen) {
  const button = document.querySelector(".apri-menu");
  if (!button) return;
  document.documentElement.classList.toggle("menu-aperto", isOpen);
  button.setAttribute("aria-expanded", String(isOpen));
  if (isOpen) document.querySelector(".barra-voci a:not([hidden]), .barra-voci summary")?.focus();
  else button.focus();
}

/** Tema chiaro o scuro, ricordato nel browser come in web/shared.js. */
function toggleTheme() {
  const html = document.documentElement;
  const dark = html.dataset.tema !== "scuro";
  if (dark) html.dataset.tema = "scuro";
  else delete html.dataset.tema;
  try { localStorage.setItem("sciclub-tema", dark ? "scuro" : ""); } catch (e) { /* storage negato */ }
  markTheme();
}

function markTheme() {
  const dark = document.documentElement.dataset.tema === "scuro";
  document.querySelectorAll(".voce-tema").forEach((b) => b.setAttribute("aria-pressed", String(dark)));
}

/** Chi è entrato, in alto a destra (e in fondo al menu sul telefono). */
function writeUser(access) {
  document.querySelectorAll(".barra-utente").forEach((x) => {
    x.innerHTML = access
      ? `<span class="chi">${esc(access.email || "")}</span><span class="ruolo">${esc(ROLE_NAMES[access.role] || access.role)}</span>`
      : "";
  });
}

/** Pulsante A+ della barra: come toggleTextSize() in web/shared.js, tre grandezze e poi si torna alla normale. */
function toggleTextSize() {
  const html = document.documentElement;
  const level = (Number(html.dataset.testo || 0) + 1) % 3;
  if (level) html.dataset.testo = level;
  else delete html.dataset.testo;
  try { localStorage.setItem("sciclub-testo", level); } catch (err) {}
}

/** Come si chiamano i ruoli a schermo (gli stessi di NOMI_RUOLI in web/shared.js). */
const ROLE_NAMES = {
  superadmin: "Superadmin", admin: "Admin", tesoriere: "Tesoriere",
  assicurazione: "Assicurazione", gite: "Utente (ricerca e gite)", social: "Social",
};

/** Fascia gialla del "Vedi come", come nel gestionale (mostraVediCome in web/shared.js). */
function showViewAs(access) {
  if (access.real_role !== "superadmin" || access.role === "superadmin") return;
  const band = document.createElement("div");
  band.className = "fascia-vedi-come";
  band.innerHTML = `Visualizzazione come <b>${esc(ROLE_NAMES[access.role] || access.role)}</b>
    <button type="button" class="btn-chiaro">Torna alla vista superadmin</button>`;
  band.querySelector("button").addEventListener("click", async () => {
    const { error } = await sb.rpc("set_view_as", { role: null });
    if (!error) location.replace("../gestione.html");
  });
  document.body.append(band);
}

/**
 * Distingue "la rete non ha funzionato" da "il database ha detto di no".
 * I nomi del guasto cambiano da browser a browser: Chrome dice "Failed to
 * fetch", Safari "Load failed", Firefox "NetworkError".
 */
function networkError(err) {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return true;
  const descriptionText = String((err && err.message) || "");
  return /failed to fetch|networkerror|network request failed|load failed/i.test(descriptionText);
}

/**
 * Vale la pena rimandare questa richiesta?
 *
 * Se il database ha risposto — anche solo per dire di no — l'errore porta un
 * codice, e riprovare darebbe lo stesso esito all'infinito: una voce così
 * bloccherebbe la coda dietro di sé per sempre. Se il codice non c'è, non è
 * arrivata risposta: è la linea, e quella prima o poi torna.
 */
function retryable(err) {
  // La sessione scaduta è l'eccezione: con un nuovo accesso la stessa
  // richiesta passa, e buttarla perderebbe una gita fatta davvero.
  if (networkError(err) || sessionExpired(err)) return true;
  // Anche gli errori del database che passano da soli: non raggiungibile o pool
  // esaurito (PGRST000-003), tempo scaduto, troppe connessioni, riavvio,
  // conflitto fra transazioni. Riprovare è sicuro: ogni voce ha il suo client_id.
  if (/^(PGRST00[0-3]|57014|53300|57P0[1-3]|40001|40P01)$/.test(err?.code || "")) return true;
  return !(err && err.code);
}

/** Il token non vale più (scaduto o non valido): serve un nuovo accesso. */
function sessionExpired(err) {
  return Boolean(err) && (err.status === 401 || /^PGRST30[123]$/.test(err.code || ""));
}

/** Messaggio leggibile a partire da un errore Supabase. */
function errorMessage(err) {
  if (!err) return "Errore sconosciuto";
  if (sessionExpired(err)) {
    return "Sessione scaduta: esci e rientra.";
  }
  // "Failed to fetch" non dice niente a chi è sul pullman alle sette. Quello
  // che serve sapere è che è colpa della linea e che si può riprovare: la
  // gita porta con sé l'id della pressione, quindi un secondo tentativo non
  // la scala due volte nemmeno se il primo era arrivato.
  if (networkError(err)) {
    return "Connessione assente o troppo debole: riprova.";
  }
  return err.message || String(err);
}
