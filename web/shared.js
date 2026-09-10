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
  await sb.auth.signOut();
  location.replace("login.html");
}

// ---------------------------------------------------------------------------
// Notifiche
// ---------------------------------------------------------------------------

/**
 * Mostra un messaggio temporaneo. Crea da sé il contenitore se la pagina non
 * ce l'ha, così ogni pagina può chiamarla senza markup dedicato.
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
    "display:block;position:fixed;top:20px;left:50%;transform:translateX(-50%);" +
    "z-index:3000;min-width:300px;text-align:center;box-shadow:0 4px 12px rgba(0,0,0,.2);";
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => {
    toast.style.display = "none";
  }, 4000);
}

function setLoading(attivo) {
  const loader = document.getElementById("loader");
  if (loader) loader.style.display = attivo ? "flex" : "none";
}

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
  return num(socio.totale) - num(socio.acconto);
}

/** Totale, acconto e saldo di un capofamiglia più i suoi familiari a carico. */
function totaliNucleo(capofamiglia, familiari = []) {
  const righe = [capofamiglia, ...familiari].filter(Boolean);
  const totale = righe.reduce((s, r) => s + num(r.totale), 0);
  const acconto = righe.reduce((s, r) => s + num(r.acconto), 0);
  return { totale, acconto, saldo: totale - acconto };
}

// ---------------------------------------------------------------------------
// Dati
// ---------------------------------------------------------------------------

/** Listino raggruppato per categoria: { TESSERA: [...], FAMIGLIA: [...] } */
async function caricaPrezzi() {
  const { data, error } = await sb
    .from("prezzi")
    .select("categoria, nome, prezzo")
    .eq("attivo", true)
    .order("categoria")
    .order("nome");
  if (error) throw error;

  const perCategoria = { TESSERA: [], FAMIGLIA: [], ABBONAMENTO: [], CORSO: [] };
  data.forEach((p) => {
    if (perCategoria[p.categoria]) perCategoria[p.categoria].push(p);
  });
  return perCategoria;
}

/** Luoghi di partenza: { SABATO: [...], DOMENICA: [...] } */
async function caricaPartenze() {
  const { data, error } = await sb
    .from("partenze")
    .select("giorno, luogo")
    .eq("attivo", true)
    .order("luogo");
  if (error) throw error;

  const perGiorno = { SABATO: [], DOMENICA: [] };
  data.forEach((p) => {
    if (perGiorno[p.giorno]) perGiorno[p.giorno].push(p.luogo);
  });
  return perGiorno;
}

/**
 * Si iscrive agli aggiornamenti della tabella soci: quando un altro operatore
 * salva, la callback viene richiamata. Sostituisce il refresh manuale della 1.x.
 */
function ascoltaSoci(callback) {
  return sb
    .channel("soci-live")
    .on("postgres_changes", { event: "*", schema: "public", table: "soci" }, callback)
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
