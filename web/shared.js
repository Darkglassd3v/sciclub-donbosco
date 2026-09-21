// Utility condivise tra le tre pagine.
//
// Nella 1.x showToast() era copiata identica in tre file HTML e il calcolo del
// saldo esisteva in due varianti (calc() in gestione soci, renderRow() nel
// pannello pagamenti). Qui c'è una sola implementazione di ciascuna.

const { url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY } = window.SUPABASE_CONFIG;

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ---------------------------------------------------------------------------
// Autenticazione
// ---------------------------------------------------------------------------

/** Blocca la pagina se non c'è una sessione valida. Da chiamare per prima. */
async function requireAuth() {
  const { data } = await sb.auth.getSession();
  if (!data.session) {
    const ritorno = encodeURIComponent(location.pathname.split("/").pop() || "index.html");
    location.replace(`login.html?next=${ritorno}`);
    return null;
  }
  return data.session;
}

async function logout() {
  ricordaRuolo(null);
  await sb.auth.signOut();
  location.replace("login.html");
}

// ---------------------------------------------------------------------------
// Ruoli
//
// Gerarchia: ospite < kiosk < utente < admin < superadmin. Il ruolo vive nella
// tabella profiles (vedi supabase/schema.sql), una riga per utente creata alla
// nascita dell'account. 'ospite' non può fare niente: è dove nasce ogni nuovo
// account finché un superadmin non lo promuove dal pannello Utenti.
// ---------------------------------------------------------------------------

const LIVELLO_RUOLO = { ospite: 0, kiosk: 1, utente: 2, admin: 3, superadmin: 4 };
let _profiloCache = null;

/** Profilo (email + ruolo) dell'utente collegato. Cache in memoria per pagina. */
async function getProfile() {
  if (_profiloCache) return _profiloCache;
  const { data: { user } } = await sb.auth.getUser();
  if (!user) { ricordaRuolo(null); return null; }
  const { data, error } = await sb
    .from("profiles")
    .select("role, email")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw error;
  _profiloCache = data;
  ricordaRuolo(data && data.role);
  return data;
}

/**
 * Ruolo per la barra della prossima pagina: lo legge lo script nell'head
 * prima del primo disegno (vedi brand.css). null lo dimentica (logout, niente
 * sessione). Sta in localStorage così vale anche in una scheda nuova.
 */
function ricordaRuolo(ruolo) {
  try {
    if (ruolo) localStorage.setItem("sciclub-ruolo", JSON.stringify({ role: ruolo }));
    else localStorage.removeItem("sciclub-ruolo");
  } catch (e) { /* storage negato: la barra si aggiorna come prima */ }
  if (ruolo) document.documentElement.dataset.ruolo = ruolo;
  else delete document.documentElement.dataset.ruolo;
}

/** true se l'utente collegato ha almeno il ruolo minRuolo. */
async function hasRole(minRuolo) {
  const profilo = await getProfile();
  if (!profilo) return false;
  return LIVELLO_RUOLO[profilo.role] >= LIVELLO_RUOLO[minRuolo];
}

/**
 * Come requireAuth(), ma per le pagine riservate a un ruolo minimo (es.
 * impostazioni, utenti). Senza sessione redirige al login come requireAuth();
 * con sessione ma ruolo insufficiente NON redirige (evita lo sbattimento di
 * una pagina che appare e sparisce): ritorna null e tocca alla pagina
 * mostrare un messaggio al posto del contenuto.
 */
async function requireRole(minRuolo) {
  const sessione = await requireAuth();
  if (!sessione) return null;
  if (!(await hasRole(minRuolo))) return null;
  return sessione;
}

// ---------------------------------------------------------------------------
// Notifiche
// ---------------------------------------------------------------------------

/**
 * Mostra un messaggio temporaneo. Crea da sé il contenitore se la pagina non
 * ce l'ha, così ogni pagina può chiamarla senza markup dedicato.
 *
 * Sta sotto la barra e non sopra: comparendo in cima copriva i pulsanti di
 * navigazione proprio mentre si stava cercando di premerli.
 */
function showToast(messaggio, tipo = "is-success") {
  let toast = document.getElementById("statusToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "statusToast";
    document.body.appendChild(toast);
  }
  toast.textContent = messaggio;
  toast.className = `notification ${tipo}`;
  toast.style.cssText =
    "display:block;position:fixed;top:calc(var(--barra-h, 68px) + 12px);left:50%;" +
    "transform:translateX(-50%);z-index:90;max-width:min(92vw,520px);text-align:center;" +
    "box-shadow:0 4px 12px rgba(0,0,0,.2);";
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => {
    toast.style.display = "none";
  }, 4000);
}

/**
 * Segnala che si sta caricando con il filo dentro la barra.
 *
 * Prima calava un velo bianco su tutta la pagina: ad ogni salvataggio lo
 * schermo sbiancava e poi tornava, e il contenuto sembrava ricaricarsi da
 * capo. Il filo dice la stessa cosa senza far sparire niente.
 */
function setLoading(attivo) {
  const filo = document.getElementById("avanzamento");
  if (filo) filo.classList.toggle("attiva", !!attivo);
}

/**
 * Colora la voce della pagina aperta. La barra è identica in tutti i file
 * proprio per non spostare niente fra una pagina e l'altra: l'unica differenza
 * la mette qui il browser, e non cambia nessun ingombro.
 */
(function segnaPaginaCorrente() {
  const attuale = location.pathname.split("/").pop() || "index.html";
  document.addEventListener("DOMContentLoaded", () => {
    const elenco = document.querySelector(".barra-voci");
    if (!elenco) return;
    const voce = elenco.querySelector(`a[href="${attuale}"]`);
    if (!voce) return;
    voce.setAttribute("aria-current", "page");

    // Volutamente non si scorre l'elenco per portare in vista la voce attiva:
    // sposterebbe la striscia di una quantità diversa su ogni pagina, cioè di
    // nuovo pulsanti che cambiano posto. Su quale pagina si è lo dice il
    // titolo grande subito sotto la barra, che non si muove mai.
  });
})();

/**
 * Le voci con data-ruolo nascono nascoste nel markup e compaiono solo a chi
 * ha quel ruolo: partendo nascoste non lampeggiano davanti a chi non deve
 * vederle mentre il ruolo si carica. È solo la barra: ogni pagina riservata
 * controlla il ruolo da sé, e il database con le sue policy.
 */
document.addEventListener("DOMContentLoaded", async () => {
  // Una alla volta: la prima carica il profilo, le altre lo trovano in cache.
  for (const voce of document.querySelectorAll(".barra-voci [data-ruolo]")) {
    voce.hidden = !(await hasRole(voce.dataset.ruolo).catch(() => false));
  }
});

// ---------------------------------------------------------------------------
// Importi
// ---------------------------------------------------------------------------

const num = (v) => parseFloat(v) || 0;

/**
 * Formatta un importo in euro con il separatore delle migliaia: "€ 51.230,00"
 * è leggibile a colpo d'occhio, "€ 51230,00" richiede di contare le cifre.
 */
function fmt(v) {
  return "€ " + num(v).toLocaleString("it-IT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Saldo di un socio. Il database lo espone già come colonna generata: questa
 * funzione serve per l'anteprima nel form, prima che la riga venga salvata.
 */
function saldoDi(socio) {
  return num(socio.total) - num(socio.paid);
}

/** Totale, acconto e saldo di un capofamiglia più i suoi familiari a carico. */
function totaliNucleo(capofamiglia, familiari = []) {
  const righe = [capofamiglia, ...familiari].filter(Boolean);
  const totale = righe.reduce((s, r) => s + num(r.total), 0);
  const acconto = righe.reduce((s, r) => s + num(r.paid), 0);
  return { totale, acconto, saldo: totale - acconto };
}

// ---------------------------------------------------------------------------
// Dati
// ---------------------------------------------------------------------------

/** Listino raggruppato per categoria: { TESSERA: [...], FAMIGLIA: [...] } */
async function caricaPrezzi() {
  const { data, error } = await sb
    .from("prices")
    .select("category, name, price, min_role")
    .eq("active", true)
    .order("category")
    .order("name");
  if (error) throw error;

  const perCategoria = { TESSERA: [], FAMIGLIA: [], ABBONAMENTO: [], CORSO: [] };
  data.forEach((p) => {
    if (perCategoria[p.category]) perCategoria[p.category].push(p);
  });
  return perCategoria;
}

/** Luoghi di partenza: { SABATO: [...], DOMENICA: [...] } */
async function caricaPartenze() {
  const { data, error } = await sb
    .from("departures")
    .select("day, place")
    .eq("active", true)
    .order("place");
  if (error) throw error;

  const perGiorno = { SABATO: [], DOMENICA: [] };
  data.forEach((p) => {
    if (perGiorno[p.day]) perGiorno[p.day].push(p.place);
  });
  return perGiorno;
}

/**
 * Si iscrive agli aggiornamenti della tabella members: quando un altro
 * operatore salva, la callback viene richiamata. Sostituisce il refresh
 * manuale della 1.x.
 */
function ascoltaSoci(callback) {
  return sb
    .channel("soci-live")
    .on("postgres_changes", { event: "*", schema: "public", table: "members" }, callback)
    .subscribe();
}

/** Errore leggibile a partire da un errore Supabase. */
function messaggioErrore(error) {
  if (!error) return "Errore sconosciuto";
  if (error.code === "PGRST301" || error.status === 401) {
    return "Sessione scaduta: rifai il login.";
  }
  return error.message || String(error);
}
