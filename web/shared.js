// Utility condivise tra le tre pagine.
//
// Nella 1.x showToast() era copiata identica in tre file HTML e il calcolo del
// saldo esisteva in due varianti (calc() in gestione soci, renderRow() nel
// pannello pagamenti). Qui c'è una sola implementazione di ciascuna.

const { url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY } = window.SUPABASE_CONFIG;

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ---------------------------------------------------------------------------
// Autenticazione e permessi
//
// Dalla 2.5 i ruoli non sono più una scala: ognuno ha un elenco di permessi
// (soci, pagamenti, riepilogo, storico, bilancio, gite, polizze, social,
// gestione), scritto una volta sola nel database (role_permissions() in
// supabase/schema.sql) e letto da qui con my_access(). Le pagine chiedono un
// permesso, non un ruolo.
// ---------------------------------------------------------------------------

/**
 * Dove arriva chi entra, in ordine: la prima pagina che il suo ruolo può
 * aprire. È così che un link solo, la radice del sito, va bene per tutti.
 * Il sito di ricerca sta in /ricerca/, accanto alle pagine del gestionale.
 */
const PAGINE_DI_ARRIVO = [
  ["soci", "index.html"],
  ["riepilogo", "riepilogo.html"],
  ["polizze", "assicurazione.html"],
  ["social", "social.html"],
  ["gite", "ricerca/index.html"],
];

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
  ricordaAccesso(null);
  await sb.auth.signOut();
  location.replace("login.html");
}

let _accessoCache = null;

/**
 * Chi è collegato: { email, role, real_role, permissions }. `role` è il ruolo
 * con cui si sta guardando il sito ("vedi come" del superadmin), `real_role`
 * quello vero. null senza sessione o senza ruolo. Cache in memoria per pagina.
 */
async function getProfile() {
  if (_accessoCache) return _accessoCache;
  const { data: { session } } = await sb.auth.getSession();
  if (!session) { ricordaAccesso(null); return null; }
  const { data, error } = await sb.rpc("my_access");
  if (error) throw error;
  _accessoCache = (data && data[0]) || null;
  ricordaAccesso(_accessoCache);
  return _accessoCache;
}

/**
 * Ruolo e permessi per la barra della prossima pagina: lo script nell'head
 * li scrive su <html> prima del primo disegno (vedi brand.css), così le voci
 * non compaiono a scatti. Stanno in localStorage per valere anche in una
 * scheda nuova. null li dimentica (logout, niente sessione).
 */
function ricordaAccesso(accesso) {
  try {
    if (accesso) localStorage.setItem("sciclub-ruolo", JSON.stringify(
      { role: accesso.role, permissions: accesso.permissions }));
    else localStorage.removeItem("sciclub-ruolo");
  } catch (e) { /* storage negato: la barra si aggiorna come prima */ }
  const html = document.documentElement;
  if (accesso) {
    html.dataset.ruolo = accesso.role;
    html.dataset.permessi = accesso.permissions.join(" ");
  } else {
    delete html.dataset.ruolo;
    delete html.dataset.permessi;
  }
}

/** true se chi è collegato ha il permesso. */
async function puo(permesso) {
  const accesso = await getProfile();
  return !!accesso && accesso.permissions.includes(permesso);
}

/** La pagina di arrivo di chi è collegato, o null se non può aprire niente. */
function paginaDiArrivo(accesso) {
  const voce = accesso && PAGINE_DI_ARRIVO.find(([permesso]) => accesso.permissions.includes(permesso));
  return voce ? voce[1] : null;
}

/**
 * Da chiamare per prima in ogni pagina: senza sessione manda al login, senza
 * il permesso manda alla pagina di arrivo del proprio ruolo (chi ha un link
 * vecchio o sbagliato finisce dove può lavorare, invece che davanti a una
 * pagina vuota). Chi non ha nessun ruolo torna al login, che glielo spiega.
 * Restituisce la sessione, o null se la pagina se ne sta andando.
 */
async function requirePermesso(permesso) {
  const sessione = await requireAuth();
  if (!sessione) return null;
  const accesso = await getProfile();
  if (accesso && accesso.permissions.includes(permesso)) return sessione;
  const arrivo = paginaDiArrivo(accesso);
  location.replace(arrivo || "login.html?senza=1");
  return null;
}

/**
 * Chi può scegliere una tessera riservata (prices.min_role): la stessa regola
 * di card_allowed() nel database. 'utente' = tutti, 'admin' = admin e
 * superadmin, 'superadmin' = solo superadmin.
 */
function tesseraConsentita(minRuolo, ruolo) {
  return !minRuolo || minRuolo === "utente" || ruolo === "superadmin" || ruolo === minRuolo;
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
 *
 * Un errore resta finché non lo si chiude: dopo quattro secondi spariva prima
 * che chi legge piano arrivasse in fondo, e il socio restava non salvato
 * senza che nessuno se ne accorgesse. Le conferme se ne vanno da sole.
 */
function showToast(messaggio, tipo = "is-success") {
  let toast = document.getElementById("statusToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "statusToast";
    document.body.appendChild(toast);
  }
  const errore = tipo === "is-danger";
  toast.textContent = messaggio;
  toast.className = `notification ${tipo}`;
  toast.setAttribute("role", errore ? "alert" : "status");
  toast.style.cssText =
    "display:block;position:fixed;top:calc(var(--barra-h, 68px) + 12px);left:50%;" +
    "transform:translateX(-50%);z-index:90;max-width:min(92vw,520px);text-align:center;" +
    "box-shadow:0 4px 12px rgba(0,0,0,.2);";
  clearTimeout(showToast._timer);
  if (errore) {
    const chiudi = document.createElement("button");
    chiudi.type = "button";
    chiudi.className = "button is-light is-fullwidth mt-3";
    chiudi.textContent = "Chiudi";
    chiudi.addEventListener("click", () => (toast.style.display = "none"));
    toast.appendChild(chiudi);
    return;
  }
  showToast._timer = setTimeout(() => {
    toast.style.display = "none";
  }, 8000);
}

/**
 * Pulsante A+ della barra: tre grandezze del testo (17, 19, 21px), poi si
 * torna alla normale. La scelta resta in questo browser; lo script nell'head
 * di ogni pagina la rimette prima del primo disegno, così il testo non
 * salta da piccolo a grande a ogni cambio di pagina.
 */
function cambiaTesto() {
  const html = document.documentElement;
  const livello = (Number(html.dataset.testo || 0) + 1) % 3;
  if (livello) html.dataset.testo = livello;
  else delete html.dataset.testo;
  try { localStorage.setItem("sciclub-testo", livello); } catch (e) {}
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
    // Amministrazione, Utenti e Impostazioni si aprono da Gestione: lì resta
    // accesa la voce Gestione, così si sa da dove si è arrivati.
    const voceDi = { "stagione.html": "gestione.html", "utenti.html": "gestione.html", "impostazioni.html": "gestione.html" };
    const voce = elenco.querySelector(`a[href="${voceDi[attuale] || attuale}"]`);
    if (!voce) return;
    voce.setAttribute("aria-current", "page");

    // Volutamente non si scorre l'elenco per portare in vista la voce attiva:
    // sposterebbe la striscia di una quantità diversa su ogni pagina, cioè di
    // nuovo pulsanti che cambiano posto. Su quale pagina si è lo dice il
    // titolo grande subito sotto la barra, che non si muove mai.
  });
})();

/**
 * Le voci con data-permesso nascono nascoste nel markup e compaiono solo a
 * chi ha quel permesso: partendo nascoste non lampeggiano davanti a chi non
 * deve vederle mentre i permessi si caricano. È solo la barra: ogni pagina
 * controlla il permesso da sé (requirePermesso), e il database le policy.
 */
document.addEventListener("DOMContentLoaded", async () => {
  const voci = document.querySelectorAll(".barra-voci [data-permesso]");
  if (!voci.length) return;
  const accesso = await getProfile().catch(() => null);
  for (const voce of voci) {
    voce.hidden = !(accesso && accesso.permissions.includes(voce.dataset.permesso));
  }
  mostraVediCome(accesso);
});

/**
 * "Vedi come": mentre il superadmin guarda il sito come un altro ruolo, una
 * fascia gialla fissa in fondo allo schermo lo dice su ogni pagina, con il
 * pulsante per tornare sé stesso. Senza, dopo un po' ci si dimenticherebbe
 * di averlo acceso e si crederebbe il sito guasto.
 */
function mostraVediCome(accesso) {
  if (!accesso || accesso.real_role !== "superadmin" || accesso.role === "superadmin") return;
  const fascia = document.createElement("div");
  fascia.className = "fascia-vedi-come";
  fascia.setAttribute("role", "status");
  fascia.innerHTML = `Stai vedendo il sito come <b>${esc(NOMI_RUOLI[accesso.role] || accesso.role)}</b>
    <button type="button" class="button is-dark">Torna superadmin</button>`;
  fascia.querySelector("button").addEventListener("click", () => vediCome(null));
  document.body.append(fascia);
}

/** Guarda il sito come `ruolo` (null per tornare superadmin) e riparte dalla sua pagina. */
async function vediCome(ruolo) {
  const { error } = await sb.rpc("set_view_as", { role: ruolo });
  if (error) { showToast("Non riesco a cambiare vista: " + messaggioErrore(error), "is-danger"); return; }
  _accessoCache = null;
  const accesso = await getProfile();
  location.href = ruolo ? paginaDiArrivo(accesso) || "index.html" : "gestione.html";
}

/** Come si chiamano i ruoli a schermo. */
const NOMI_RUOLI = {
  superadmin: "Superadmin",
  admin: "Admin",
  tesoriere: "Tesoriere",
  assicurazione: "Assicurazione",
  gite: "Utente (ricerca e gite)",
  social: "Social",
};

/**
 * Avviso sotto un campo codice fiscale, a partire dall'esito di verificaCF()
 * (codicefiscale.js): cosa non torna e, se c'è, il pulsante per mettere nel
 * campo il codice proposto. Non blocca niente: chi ha il documento davanti
 * decide. `dopo` viene chiamata quando il codice proposto finisce nel campo.
 */
function mostraAvvisoCF(box, campo, esito, dopo) {
  if (!esito || esito.ok) {
    box.hidden = true;
    box.replaceChildren();
    return;
  }
  const righe = esito.problemi.map((p) => {
    const riga = document.createElement("p");
    riga.textContent = p;
    return riga;
  });
  box.replaceChildren(...righe);
  if (esito.suggerito) {
    const usa = document.createElement("button");
    usa.type = "button";
    usa.className = "button is-link is-small";
    usa.innerHTML = `Usa il codice proposto: <code>${esc(esito.suggerito)}</code>`;
    usa.addEventListener("click", () => {
      campo.value = esito.suggerito;
      box.hidden = true;
      box.replaceChildren();
      if (dopo) dopo();
    });
    box.append(usa);
  }
  box.hidden = false;
}

// ---------------------------------------------------------------------------
// Excel per l'assicurazione
//
// Lo usano due pagine: Assicurazione (i tesserati ancora da assicurare) e
// Riepilogo (tutti i tesserati della stagione, che il ruolo assicurazione non
// può scaricare). Stesse colonne per tutti e due i file.
// ---------------------------------------------------------------------------

/** "2026-01-31" → "31/01/2026". */
function dataIt(iso) {
  if (!iso) return "";
  const [a, m, g] = String(iso).slice(0, 10).split("-");
  return `${g}/${m}/${a}`;
}

// TODO(assicurazione): tracciato del file da concordare con l'assicurazione.
// Quando arrivano le specifiche si cambiano solo queste righe: intestazione
// della colonna e come si ricava dal socio. Mandare solo le colonne che
// l'assicurazione chiede: sono dati personali che escono dal club. Un campo
// nuovo va aggiunto anche dove si leggono i soci: insurance_members() in
// supabase/schema.sql e scaricaSoci() in riepilogo.html.
const COLONNE_ASSICURAZIONE = [
  ["Cognome", (s) => s.last_name],
  ["Nome", (s) => s.first_name],
  ["Data di nascita", (s) => dataIt(s.birth_date)],
  ["Luogo di nascita", (s) => s.birth_place],
  ["Provincia di nascita", (s) => s.birth_province],
  ["Codice fiscale", (s) => s.tax_code],
  ["Indirizzo", (s) => s.address],
  ["Città", (s) => s.city],
  ["Provincia", (s) => s.province],
  ["CAP", (s) => s.postal_code],
  ["Tessera", (s) => s.card_type],
  ["Numero tessera", (s) => s.card_number],
  ["Numero polizza", (s) => s.policy_number],
];

// SheetJS si carica solo al primo clic: pesa quasi un mega, e serve due
// volte a stagione. È la versione pubblicata su npm, usata solo per
// SCRIVERE: i suoi problemi noti riguardano la lettura di file altrui. Se
// un giorno si leggerà il file restituito dall'assicurazione, passare alla
// versione di cdn.sheetjs.com.
let _xlsxInArrivo = null;
function caricaXlsx() {
  if (window.XLSX) return Promise.resolve();
  _xlsxInArrivo ??= new Promise((ok, ko) => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";
    script.onload = ok;
    script.onerror = () => {
      _xlsxInArrivo = null;
      script.remove();
      ko(new Error("non riesco a scaricare il modulo per l'Excel: controlla la connessione e riprova."));
    };
    document.head.append(script);
  });
  return _xlsxInArrivo;
}

/** Scarica un foglio Excel dei soci passati, con le colonne per l'assicurazione. */
async function scaricaExcel(righe, nome) {
  if (!righe.length) { showToast("Non c'è nessun socio da scaricare."); return; }
  await caricaXlsx();
  const foglio = XLSX.utils.aoa_to_sheet([
    COLONNE_ASSICURAZIONE.map(([titolo]) => titolo),
    ...righe.map((s) => COLONNE_ASSICURAZIONE.map(([, valore]) => valore(s) ?? "")),
  ]);
  foglio["!cols"] = COLONNE_ASSICURAZIONE.map(([titolo]) => ({ wch: Math.max(14, titolo.length + 2) }));
  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, foglio, "Soci");
  XLSX.writeFile(libro, `${nome}-${new Date().toISOString().slice(0, 10)}.xlsx`);
  showToast(righe.length === 1 ? "Scaricato 1 socio." : `Scaricati ${righe.length} soci.`);
}

/**
 * Tutte le righe di una lettura, a pagine di 1000: Supabase non ne dà di più
 * per chiamata, e un elenco tagliato in silenzio (la stagione 2025 aveva 677
 * soci, non lontano) arriverebbe all'assicurazione senza che nessuno se ne
 * accorga. `crea` rifà la stessa richiesta, che deve avere un ordine stabile.
 */
async function tutteLeRighe(crea) {
  const PAGINA = 1000;
  const righe = [];
  for (let da = 0; ; da += PAGINA) {
    const { data, error } = await crea().range(da, da + PAGINA - 1);
    if (error) throw error;
    righe.push(...data);
    if (data.length < PAGINA) return righe;
  }
}

/** Testo scritto dagli utenti, pronto per innerHTML. */
const esc = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

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
    // In italiano il punto delle migliaia manca sotto i 10.000 (5000,00 ma
    // 11.000,00): "always" lo mette sempre, così gli importi si confrontano.
    useGrouping: "always",
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
    .select("category, name, price, min_role, trips")
    .eq("active", true)
    .order("category")
    .order("price")
    .order("name");
  if (error) throw error;

  const perCategoria = { TESSERA: [], FAMIGLIA: [], ABBONAMENTO: [], PRESCIISTICA: [], CORSO: [] };
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
