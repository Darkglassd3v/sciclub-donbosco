// Utility condivise tra le tre pagine.
//
// Nella 1.x showToast() era copiata identica in tre file HTML e il calcolo del
// saldo esisteva in due varianti (calc() in gestione soci, renderRow() nel
// pannello pagamenti). Qui c'è una sola implementazione di ciascuna.

const { url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY } = window.SUPABASE_CONFIG;

// Un token appena rinnovato a volte è rifiutato per un attimo: «JWT issued at future» (l'API del
// database ha l'orologio un poco indietro rispetto al login di Supabase, che firma il token; 28/10/2026).
// Si riprova dopo un secondo, al massimo tre volte; ogni altra risposta torna com'è.
const FUTURE_TOKEN_RETRIES = 3;
async function fetchRetryingFutureToken(input, init) {
  for (let attempt = 0; ; attempt++) {
    const response = await fetch(input, init);
    if (response.status !== 401 || attempt === FUTURE_TOKEN_RETRIES) return response;
    const body = await response.clone().json().catch(() => null);
    if (!body || body.message !== "JWT issued at future") return response;
    await new Promise((ok) => setTimeout(ok, 1000));
  }
}

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { fetch: fetchRetryingFutureToken } });

// ---------------------------------------------------------------------------
// Autenticazione e permessi
//
// Dalla 2.5 i ruoli non sono più una scala: ognuno ha un elenco di permessi
// (soci, pagamenti, riepilogo, storico, bilancio, gite, polizze, social,
// gestione), scritto una volta sola nel database (role_permissions() in
// supabase/schema.sql; dalla 2.6 lo sceglie il superadmin in Gestione > Ruoli)
// e letto da qui con my_access(). Le pagine chiedono un permesso, non un ruolo.
// ---------------------------------------------------------------------------

/**
 * Dove arriva chi entra, in ordine: la prima pagina che il suo ruolo può
 * aprire. È così che un link solo, la radice del sito, va bene per tutti.
 * Il sito di ricerca sta in /ricerca/, accanto alle pagine del gestionale.
 */
const LANDING_PAGES = [
  ["soci", "index.html"],
  ["pagamenti", "admin.html"],
  ["riepilogo", "riepilogo.html"],
  ["bilancio", "bilancio.html"],
  ["polizze", "assicurazione.html"],
  ["social", "social.html"],
  ["cerca", "ricerca/index.html"],
  ["gite", "ricerca/gite.html"],
  ["stampe", "stampe.html"],
];

/**
 * Il superadmin che guarda il sito come un altro ruolo torna sé stesso: da fare
 * prima di ogni uscita (anche quella del login per un ruolo senza pagine), se
 * no la vista resta salvata nel database e vale al prossimo accesso.
 */
async function closeViewAs(access) {
  if (access && access.real_role === "superadmin" && access.role !== "superadmin") {
    await sb.rpc("set_view_as", { role: null });
  }
}

/** Blocca la pagina se non c'è una sessione valida. Da chiamare per prima. */
async function requireAuth() {
  const { data } = await sb.auth.getSession();
  if (!data.session) {
    const returnTo = encodeURIComponent(location.pathname.split("/").pop() || "index.html");
    location.replace(`login.html?next=${returnTo}`);
    return null;
  }
  return data.session;
}

/**
 * Uscire chiude anche il "Vedi come" del superadmin: la vista sta nel
 * database e varrebbe anche al prossimo accesso, su qualunque dispositivo,
 * magari da una pagina senza la fascia per tornare. Si esce e si rientra
 * sé stessi.
 */
async function logout() {
  await closeViewAs(await getProfile().catch(() => null));
  rememberAccess(null);
  await sb.auth.signOut();
  location.replace("login.html");
}

let _accessCache = null;

/**
 * Chi è collegato: { email, role, real_role, permissions, change_password }.
 * `role` è il ruolo con cui si sta guardando il sito ("vedi come" del
 * superadmin), `real_role` quello vero; `change_password` è true finché la
 * password iniziale non è stata cambiata. null senza sessione o senza ruolo.
 * Cache in memoria per pagina.
 */
async function getProfile() {
  if (_accessCache) return _accessCache;
  const { data: { session } } = await sb.auth.getSession();
  if (!session) { rememberAccess(null); return null; }
  const { data, error } = await sb.rpc("my_access");
  if (error) throw error;
  _accessCache = (data && data[0]) || null;
  rememberAccess(_accessCache);
  return _accessCache;
}

/**
 * Ruolo e permessi per la barra della prossima pagina: lo script nell'head
 * li scrive su <html> prima del primo disegno (vedi brand.css), così le voci
 * non compaiono a scatti. Stanno in localStorage per valere anche in una
 * scheda nuova. null li dimentica (logout, niente sessione).
 * Email and role name too: the head script shows them in the user box (brand.css,
 * --chi and --ruolo) before my_access answers.
 */
function rememberAccess(access) {
  try {
    if (access) localStorage.setItem("sciclub-ruolo", JSON.stringify(
      { role: access.role, permissions: access.permissions,
        email: access.email || "", roleName: ROLE_NAMES[access.role] || access.role }));
    else localStorage.removeItem("sciclub-ruolo");
  } catch (e) { /* storage negato: la barra si aggiorna come prima */ }
  const html = document.documentElement;
  if (access) {
    html.dataset.ruolo = access.role;
    html.dataset.permessi = access.permissions.join(" ");
  } else {
    delete html.dataset.ruolo;
    delete html.dataset.permessi;
    delete html.dataset.chi;
  }
}

/** true se chi è collegato ha il permesso. */
async function can(permission) {
  const access = await getProfile();
  return !!access && access.permissions.includes(permission);
}

/** La pagina di arrivo di chi è collegato, o null se non può aprire niente. */
function landingPage(access) {
  const item = access && LANDING_PAGES.find(([permission]) => access.permissions.includes(permission));
  return item ? item[1] : null;
}

/**
 * Da chiamare per prima in ogni pagina: senza sessione manda al login, senza
 * il permesso manda alla pagina di arrivo del proprio ruolo (chi ha un link
 * vecchio o sbagliato finisce dove può lavorare, invece che davanti a una
 * pagina vuota). Chi non ha nessun ruolo torna al login, che glielo spiega.
 * Chi ha ancora la password iniziale va a cambiarla, prima di tutto il resto.
 * Restituisce la sessione, o null se la pagina se ne sta andando.
 */
async function requirePermission(permission) {
  const currentSession = await requireAuth();
  if (!currentSession) return null;
  let access;
  try {
    access = await getProfile();
  } catch (error) {
    // Rete o database giù: nessuna pagina prende l'errore, e restava «Caricamento…» senza dire niente.
    setLoading(false);
    showToast(`Impossibile leggere i permessi di accesso (${errorMessage(error)}). Ricaricare la pagina tra qualche istante.`, "is-danger");
    return null;
  }
  if (access && access.change_password) {
    location.replace("password.html");
    return null;
  }
  if (access && access.permissions.includes(permission)) return currentSession;
  const landing = landingPage(access);
  location.replace(landing || "login.html?senza=1");
  return null;
}

const EYE_OPEN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
  + '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
const EYE_CLOSED = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
  + '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>'
  + '<line x1="1" y1="1" x2="23" y2="23"/></svg>';

/**
 * L'occhio dentro i campi password (login e cambio password, .campo-password
 * in brand.css): data-mostra è l'id del campo. Chi vede poco scrive alla
 * cieca e sbaglia.
 */
function bindShowPassword() {
  document.querySelectorAll("[data-mostra]").forEach((button) => {
    const field = document.getElementById(button.dataset.mostra);
    const draw = () => {
      const visible = field.type === "text";
      button.innerHTML = visible ? EYE_CLOSED : EYE_OPEN;
      button.setAttribute("aria-label", visible ? "Nascondi la password" : "Mostra la password");
      button.title = button.getAttribute("aria-label");
      button.setAttribute("aria-pressed", String(visible));
    };
    button.addEventListener("click", () => {
      field.type = field.type === "password" ? "text" : "password";
      draw();
    });
    draw();
  });
}

/**
 * Chi può scegliere una tessera riservata (prices.min_role): la stessa regola
 * di card_allowed() nel database. 'utente' = tutti, 'admin' = admin e
 * superadmin, 'superadmin' = solo superadmin.
 */
function allowedCard(minRole, roleKey) {
  return !minRole || minRole === "utente" || roleKey === "superadmin" || roleKey === minRole;
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
function showToast(message, typeName = "is-success") {
  let toast = document.getElementById("statusToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "statusToast";
    document.body.appendChild(toast);
  }
  const err = typeName === "is-danger";
  toast.textContent = message;
  toast.className = `notification ${typeName}`;
  toast.setAttribute("role", err ? "alert" : "status");
  toast.style.cssText =
    "display:block;position:fixed;top:calc(var(--barra-h, 68px) + 12px);left:50%;" +
    "transform:translateX(-50%);z-index:90;max-width:min(92vw,520px);text-align:center;" +
    "box-shadow:0 4px 12px rgba(0,0,0,.2);";
  clearTimeout(showToast._timer);
  if (err) {
    const doClose = document.createElement("button");
    doClose.type = "button";
    doClose.className = "button is-light is-fullwidth mt-3";
    doClose.textContent = "Chiudi";
    doClose.addEventListener("click", () => (toast.style.display = "none"));
    toast.appendChild(doClose);
    return;
  }
  showToast._timer = setTimeout(() => {
    toast.style.display = "none";
  }, 8000);
}

// ---------------------------------------------------------------------------
// Campi con un errore: bordo rosso e la pagina che scorre fin lì
//
// Vale per tutto il sito. Un campo che il browser non accetta quando si prova
// a salvare (required, min, step...: l'evento "invalid") e un campo che una
// pagina segnala con markError() prendono il bordo rosso finché non li si
// cambia; la pagina scorre al primo e il fuoco ci va. Prima l'errore era solo
// un messaggio in alto, e il campo non si trovava.
// ---------------------------------------------------------------------------

/** Dove si vede il bordo: il campo, o per una scelta (radio, spunta) il suo gruppo. */
function fieldBorder(field) {
  const choice = field.matches?.("input[type=radio], input[type=checkbox]");
  return (choice && field.closest("fieldset, [role=radiogroup]")) || field;
}

/** Il nome del campo come lo legge chi compila: la sua etichetta, senza l'asterisco. */
function fieldName(field) {
  const border = fieldBorder(field);
  const text = border.matches("fieldset") ? border.querySelector("legend")?.textContent
    : (field.id && document.querySelector(`label[for="${CSS.escape(field.id)}"]`)?.textContent)
      || field.getAttribute("aria-label") || field.placeholder;
  return (text || "").replace(/\*/g, "").replace(/\s+/g, " ").trim();
}

/** Bordo rosso sul campo (o sul suo gruppo) finché non lo si cambia; aria-invalid per chi usa il lettore di schermo. */
function markField(field) {
  const border = fieldBorder(field);
  border.classList.add("campo-errore");
  field.setAttribute("aria-invalid", "true");
  const removeOne = () => { border.classList.remove("campo-errore"); field.removeAttribute("aria-invalid"); };
  border.addEventListener("input", removeOne, { once: true });
  border.addEventListener("change", removeOne, { once: true });
}

// I campi segnati nello stesso momento (un Salva ne trova più d'uno): si va al
// primo e, se la pagina non ha già spiegato l'errore, un messaggio li nomina tutti.
let fieldsToShow = [];
function goToFields(fields, alreadySaid = false) {
  if (!fieldsToShow.length) {
    setTimeout(() => {
      const [first] = fieldsToShow;
      const names = [...new Set(fieldsToShow.map(fieldName).filter(Boolean))];
      fieldsToShow = [];
      fieldBorder(first).scrollIntoView({ block: "center" });
      first.focus({ preventScroll: true });
      if (!goToFields.giaDetto) showToast(`Da completare o correggere: ${names.join(", ")}.`, "is-danger");
      goToFields.giaDetto = false;
    });
  }
  fieldsToShow.push(...fields);
  if (alreadySaid) goToFields.giaDetto = true;
}

/**
 * Un errore su un campo, trovato dalla pagina: bordo rosso, la pagina scorre fin
 * lì e il messaggio lo spiega. `campo` può essere anche il gruppo (fieldset): il
 * fuoco va sulla sua prima scelta.
 */
function markError(field, message) {
  const focusTarget = field.matches("fieldset") ? field.querySelector("input, select, textarea") || field : field;
  markField(focusTarget);
  showToast(message, "is-danger");
  goToFields([focusTarget], true);
}

// Quello che il browser non accetta: required vuoto, numero fuori da min/step...
document.addEventListener("invalid", (theEvent) => {
  markField(theEvent.target);
  goToFields([theEvent.target]);
}, true);

/**
 * Pulsante A+ della barra: tre grandezze del testo (17, 19, 21px), poi si
 * torna alla normale. La scelta resta in questo browser; lo script nell'head
 * di ogni pagina la rimette prima del primo disegno, così il testo non
 * salta da piccolo a grande a ogni cambio di pagina.
 */
function toggleTextSize() {
  const html = document.documentElement;
  const level = (Number(html.dataset.testo || 0) + 1) % 3;
  if (level) html.dataset.testo = level;
  else delete html.dataset.testo;
  try { localStorage.setItem("sciclub-testo", level); } catch (e) {}
}

/**
 * Segnala che si sta caricando con il filo dentro la barra.
 *
 * Prima calava un velo bianco su tutta la pagina: ad ogni salvataggio lo
 * schermo sbiancava e poi tornava, e il contenuto sembrava ricaricarsi da
 * capo. Il filo dice la stessa cosa senza far sparire niente.
 */
function setLoading(active) {
  const thread = document.getElementById("avanzamento");
  if (thread) thread.classList.toggle("attiva", !!active);
}

/**
 * Segna la voce della pagina aperta nel menu e ne scrive il nome nella barra
 * del telefono. Ogni pagina ha già nel suo HTML la voce segnata e il gruppo
 * aperto (il menu non si muove al caricamento); qui si segue anche la sezione
 * di Social scritta nell'indirizzo (#post, #grafiche, #impostazioni).
 */
(function markCurrentPage() {
  const mark = () => {
    const items = [...document.querySelectorAll(".barra-voci a[href]")];
    if (!items.length) return;
    const current = location.pathname.split("/").pop() || "index.html";
    const item = items.find((a) => a.getAttribute("href") === current + location.hash)
      || items.find((a) => a.getAttribute("href").split("#")[0] === current)
      || document.querySelector('.barra-voci a[aria-current="page"]');   // un nome di file diverso: vale quella dell'HTML
    if (!item) return;
    items.forEach((a) => { if (a !== item) a.removeAttribute("aria-current"); });
    item.setAttribute("aria-current", "page");
    if (item.closest("details")) item.closest("details").open = true;
    const nome = item.cloneNode(true);
    nome.querySelectorAll(".conta").forEach((x) => x.remove());
    document.querySelectorAll(".barra-pagina").forEach((x) => { x.textContent = nome.textContent.trim(); });
  };
  document.addEventListener("DOMContentLoaded", mark);
  window.addEventListener("hashchange", mark);
})();

/**
 * Il menu sul telefono è un pannello: «Menu» lo apre e lo chiude, come Esc,
 * una voce scelta e un tocco fuori. Aperto, il fuoco va alla prima voce;
 * chiuso, torna al pulsante.
 */
function openMenu(isOpen) {
  const button = document.querySelector(".apri-menu");
  if (!button) return;
  document.documentElement.classList.toggle("menu-aperto", isOpen);
  button.setAttribute("aria-expanded", String(isOpen));
  if (isOpen) document.querySelector(".barra-voci a:not([hidden]), .barra-voci summary")?.focus();
  else button.focus();
}
document.addEventListener("DOMContentLoaded", () => {
  const button = document.querySelector(".apri-menu");
  if (!button) return;
  const isOpen = () => document.documentElement.classList.contains("menu-aperto");
  button.addEventListener("click", () => openMenu(!isOpen()));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && isOpen()) openMenu(false); });
  document.addEventListener("click", (e) => {
    if (isOpen() && (!e.target.closest(".barra-voci, .apri-menu") || e.target.closest(".barra-voci a"))) openMenu(false);
  });
  markTheme();
});

/** Tema chiaro o scuro, ricordato nel browser: lo script nell'head lo rimette prima del primo disegno. */
function toggleTheme() {
  const html = document.documentElement;
  const dark = html.dataset.tema !== "scuro";
  if (dark) html.dataset.tema = "scuro";
  else delete html.dataset.tema;
  try { localStorage.setItem("sciclub-tema", dark ? "scuro" : ""); } catch (e) { /* storage negato: vale fino alla prossima pagina */ }
  markTheme();
}

function markTheme() {
  const dark = document.documentElement.dataset.tema === "scuro";
  document.querySelectorAll(".voce-tema").forEach((b) => b.setAttribute("aria-pressed", String(dark)));
}

/** Chi è entrato, in alto a destra (e in fondo al menu sul telefono): email e ruolo con cui si guarda il sito. */
function writeUser(access) {
  document.querySelectorAll(".barra-utente").forEach((x) => {
    x.innerHTML = access
      ? `<span class="chi">${esc(access.email || "")}</span><span class="ruolo">${esc(ROLE_NAMES[access.role] || access.role)}</span>`
      : "";
  });
}

/**
 * Le voci con data-permesso nascono nascoste nel markup e compaiono solo a
 * chi ha quel permesso: partendo nascoste non lampeggiano davanti a chi non
 * deve vederle mentre i permessi si caricano. È solo la barra: ogni pagina
 * controlla il permesso da sé (requirePermesso), e il database le policy.
 */
document.addEventListener("DOMContentLoaded", async () => {
  const items = document.querySelectorAll(".barra-voci [data-permesso]");
  if (!items.length) return;
  writeMenuLabels();
  const access = await getProfile().catch(() => null);
  for (const item of items) {
    item.hidden = !(access && access.permissions.includes(item.dataset.permesso));
  }
  writeUser(access);
  barHeight();
  showViewAs(access);
  if (access) menuLabels().catch(() => {});
});

/**
 * L'altezza vera della barra in --barra-h: sul computer la barra va su due
 * righe quando le voci non ci stanno (brand.css), e le strisce delle sezioni,
 * gli avvisi e la testa dei post si attaccano sotto di lei, non sotto
 * un'altezza fissa. Cambia solo con le voci, coi loro nomi e con la finestra
 * (anche lo zoom): si ricalcola lì. La stessa in ricerca/comune.js.
 */
function barHeight() {
  const bar = document.querySelector(".barra");
  if (bar) document.documentElement.style.setProperty("--barra-h", `${bar.offsetHeight}px`);
}
window.addEventListener("resize", barHeight);

/**
 * I nomi delle voci della barra scelti in Gestione > Ruoli (tabella
 * nav_labels), per chiave di permesso: { cerca: "Ricerca", ... }. Una voce
 * senza nome tiene quello scritto nella pagina. Si ricordano nel browser, così
 * la pagina dopo li scrive subito invece di mostrare per un attimo quelli di
 * sempre. Gli stessi in ricerca/comune.js (i due siti non condividono file).
 */
let MENU_LABELS = (() => {
  try { return JSON.parse(localStorage.getItem("sciclub-voci")) || {}; } catch (e) { return {}; }
})();

/** Scrive i nomi nella barra; il nome di sempre resta in data-nome per tornarci. */
function writeMenuLabels() {
  document.querySelectorAll(".barra-voci [data-permesso]").forEach((item) => {
    // Il nome sta nello span accanto all'icona (nel gruppo, dentro summary).
    const text = item.querySelector(":scope > span, :scope > summary > span") || item;
    if (item.dataset.nome === undefined) item.dataset.nome = text.textContent;
    text.textContent = MENU_LABELS[item.dataset.permesso] || item.dataset.nome;
  });
  barHeight();
}

/** Rilegge i nomi dal database, li ricorda e li scrive nella barra. */
async function menuLabels() {
  const { data, error } = await sb.from("nav_labels").select("key, label");
  if (error) throw error;
  MENU_LABELS = Object.fromEntries(data.map((r) => [r.key, r.label]));
  try { localStorage.setItem("sciclub-voci", JSON.stringify(MENU_LABELS)); } catch (e) { /* storage negato */ }
  writeMenuLabels();
  return MENU_LABELS;
}

/**
 * "Vedi come": mentre il superadmin guarda il sito come un altro ruolo, una
 * fascia gialla fissa in fondo allo schermo lo dice su ogni pagina, con il
 * pulsante per tornare sé stesso. Senza, dopo un po' ci si dimenticherebbe
 * di averlo acceso e si crederebbe il sito guasto.
 */
function showViewAs(access) {
  if (!access || access.real_role !== "superadmin" || access.role === "superadmin") return;
  const band = document.createElement("div");
  band.className = "fascia-vedi-come";
  band.setAttribute("role", "status");
  band.innerHTML = `Visualizzazione come <b>${esc(ROLE_NAMES[access.role] || access.role)}</b>
    <button type="button" class="button is-dark">Torna alla vista superadmin</button>`;
  band.querySelector("button").addEventListener("click", () => viewAs(null));
  document.body.append(band);
}

/** Guarda il sito come `ruolo` (null per tornare superadmin) e riparte dalla sua pagina. */
async function viewAs(roleKey) {
  const { error } = await sb.rpc("set_view_as", { role: roleKey });
  if (error) { showToast("Impossibile cambiare vista: " + errorMessage(error), "is-danger"); return; }
  _accessCache = null;
  const access = await getProfile();
  location.href = roleKey ? landingPage(access) || "index.html" : "gestione.html";
}

/** Come si chiamano i ruoli a schermo. */
const ROLE_NAMES = {
  superadmin: "Superadmin",
  admin: "Admin",
  tesoriere: "Tesoriere",
  assicurazione: "Assicurazione",
  gite: "Utente (ricerca e gite)",
  social: "Social",
};

/**
 * Avviso sotto un campo codice fiscale, a partire dall'esito di verifyTaxCode()
 * (codicefiscale.js): solo «Codice fiscale errato» (o, a campo vuoto, «Codice
 * proposto») e il codice proposto, che è un pulsante: il click lo scrive nel
 * campo. Il motivo non si dice: chi compila vuole il codice giusto, non la
 * regola. `esito.messaggio`, se c'è, prende il posto della frase. Non blocca
 * niente: chi ha il documento davanti decide. `dopo` viene chiamata quando il
 * codice proposto finisce nel campo.
 */
function showTaxCodeNotice(box, field, outcome, after) {
  if (!outcome || outcome.ok) {
    box.hidden = true;
    box.replaceChildren();
    return;
  }
  const row = document.createElement("p");
  row.textContent = outcome.messaggio || (field.value.trim()
    ? `Codice fiscale errato${outcome.suggerito ? ", codice proposto:" : "."}` : "Codice proposto:");
  box.replaceChildren(row);
  if (outcome.suggerito) {
    const usa = document.createElement("button");
    usa.type = "button";
    usa.className = "button is-link is-small";
    usa.setAttribute("aria-label", `Usa il codice proposto ${outcome.suggerito}`);
    usa.innerHTML = `<code>${esc(outcome.suggerito)}</code>`;
    usa.addEventListener("click", () => {
      field.value = outcome.suggerito;
      box.hidden = true;
      box.replaceChildren();
      if (after) after();
    });
    box.append(usa);
  }
  box.hidden = false;
}

// ---------------------------------------------------------------------------
// Excel dei tesserati della stagione (Riepilogo)
//
// L'elenco completo, per chi ha il permesso riepilogo: il ruolo assicurazione
// non lo può scaricare. Le liste per l'assicurazione, con il loro tracciato,
// le fa la pagina Assicurazione (excelList()).
// ---------------------------------------------------------------------------

/** "2026-01-31" → "31/01/2026". */
function dataIt(iso) {
  if (!iso) return "";
  const [a, m, g] = String(iso).slice(0, 10).split("-");
  return `${g}/${m}/${a}`;
}

/**
 * Carica una libreria dal CDN la prima volta che serve, una volta sola anche
 * con due clic di fila. `cosa` finisce nel messaggio d'errore ("per l'Excel").
 * Se il caricamento fallisce si può riprovare.
 */
const _scriptLoading = {};
function loadScript(src, what, integrity) {
  _scriptLoading[src] ??= new Promise((ok, ko) => {
    const script = document.createElement("script");
    script.src = src;
    // Con l'impronta il browser rifiuta un file cambiato sul CDN.
    if (integrity) { script.integrity = integrity; script.crossOrigin = "anonymous"; }
    script.onload = ok;
    script.onerror = () => {
      delete _scriptLoading[src];
      script.remove();
      ko(new Error(`impossibile scaricare il modulo ${what}: verificare la connessione e riprovare.`));
    };
    document.head.append(script);
  });
  return _scriptLoading[src];
}

// SheetJS si carica solo al primo clic, e serve due volte a stagione. Usata
// solo per SCRIVERE: i suoi problemi noti riguardano la lettura di file
// altrui. Se un giorno si leggerà il file restituito dall'assicurazione,
// passare alla versione di cdn.sheetjs.com.
// Dal 16/10/2026 è xlsx-js-style 1.2.0: la stessa SheetJS 0.18.5 (stessa
// API, XLSX) che in più scrive gli stili delle celle, grassetto e corpo del
// carattere; la versione Community non li scrive. Fissata con l'impronta.
function loadXlsx() {
  if (window.XLSX) return Promise.resolve();
  return loadScript("https://cdn.jsdelivr.net/npm/xlsx-js-style@1.2.0/dist/xlsx.bundle.js", "per l'Excel",
    "sha384-OUW9euuUyxyHcAhTqbhI+Iyb8LMssXt/cpz0yXhs9UWG2/R/uaWdakx/4cfww7Vb");
}

/**
 * Scarica un Excel da stampare: in orizzontale e largo una pagina. SheetJS
 * scrive solo i margini, non l'impostazione di stampa: la si aggiunge nel
 * file già scritto (un xlsx è uno zip; XLSX.CFB lo apre). Con i caratteri
 * grandi sei colonne non stanno più in un A4 in verticale, e la data di
 * nascita e il telefono finivano su un secondo foglio di carta.
 */
function downloadPrintableExcel(book, file) {
  for (const nome of book.SheetNames) {
    book.Sheets[nome]["!margins"] = { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 };
  }
  const zip = XLSX.CFB.read(new Uint8Array(XLSX.write(book, { type: "array", bookType: "xlsx" })), { type: "array" });
  zip.FileIndex.forEach((item, i) => {
    if (!/\/xl\/worksheets\/sheet\d+\.xml$/.test(zip.FullPaths[i])) return;
    const xml = new TextDecoder().decode(item.content)
      // sheetPr va per primo dentro worksheet, pageSetup subito dopo pageMargins (ordine dello standard).
      .replace(/(<worksheet[^>]*>)/, '$1<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>')
      .replace(/(<pageMargins[^>]*\/>)/, '$1<pageSetup paperSize="9" orientation="landscape" fitToWidth="1" fitToHeight="0"/>');
    item.content = new TextEncoder().encode(xml);
    item.size = item.content.length;
  });
  const records = XLSX.CFB.write(zip, { fileType: "zip", type: "array" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([records], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
  link.download = file;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 10000);
}

/** "1980-01-31" → data di Excel (a mezzanotte, ora locale, come la legge SheetJS); vuoto se manca. */
function dataExcel(iso) {
  if (!iso) return "";
  const [a, m, g] = String(iso).slice(0, 10).split("-").map(Number);
  return new Date(a, m - 1, g);
}

/** Lunghezza a schermo di una cella: una data vale "31/12/2026", non il numero di serie di Excel. */
const cellLength = (v) => (v instanceof Date ? 10 : String(v ?? "").length);

/**
 * Le larghezze delle colonne (!cols), dalla cella più lunga di ognuna: prima
 * erano fisse e i cognomi o i luoghi lunghi restavano tagliati. Le righe
 * prima di `intestazione` (il titolo delle Stampe) non contano: vanno su
 * tutta la larghezza. `fattore` allarga per un corpo più grande dell'11,
 * `fattoreTesta` per l'intestazione (in grassetto e più grande dei dati).
 */
function columnWidths(rows, heading = 0, factor = 1, headFactor = factor) {
  const [headerEl = [], ...records] = rows.slice(heading);
  const columns = Math.max(0, headerEl.length, ...records.map((r) => r.length));
  return Array.from({ length: columns }, (_, c) => {
    const wide = Math.max(cellLength(headerEl[c]) * headFactor, ...records.map((r) => cellLength(r[c]) * factor));
    return { wch: Math.min(50, Math.max(8, Math.ceil(wide) + 3)) };
  });
}

/**
 * Un foglio di Excel leggibile anche da chi ci vede poco: colonne larghe
 * quanto il testo, dati in corpo 14 (prima 12), intestazione delle colonne in
 * grassetto 15 bianco sul blu del club, così non si confonde coi dati. Le
 * righe prima di `intestazione` sono titoli: grassetto 18, unite su tutte le
 * colonne. `opzioni` passa ad aoa_to_sheet (dateNF).
 */
function readableSheet(rows, { intestazione: heading = 0, gruppi: groups = null, ...options } = {}) {
  const sheet = XLSX.utils.aoa_to_sheet(rows, options);
  const cols = columnWidths(rows, heading, 1.3, 1.5);
  sheet["!cols"] = cols;
  const font = { name: "Calibri", sz: 14 };
  const styles = {
    titolo: { font: { ...font, sz: 18, bold: true, color: { rgb: "084C8D" } }, alignment: { vertical: "center" } },
    testa: { font: { ...font, sz: 15, bold: true, color: { rgb: "FFFFFF" } }, fill: { patternType: "solid", fgColor: { rgb: "084C8D" } },
      alignment: { vertical: "center" } },
    // A sinistra anche date e numeri: a destra una data toccava la colonna dopo.
    dati: { font, alignment: { vertical: "center", horizontal: "left" } },
  };
  for (const [addressText, cell] of Object.entries(sheet)) {
    if (addressText[0] === "!") continue;
    const { r } = XLSX.utils.decode_cell(addressText);
    const stile = styles[r < heading ? "titolo" : r === heading ? "testa" : "dati"];
    // Il formato delle date (dateNF) va dentro lo stile, se no lo stile lo cancella.
    cell.s = cell.z ? { ...stile, numFmt: cell.z } : stile;
  }
  // Altezze delle righe per il corpo più grande: Excel non le rifà da solo.
  sheet["!rows"] = rows.map((_, r) => ({ hpt: r < heading ? 30 : r === heading ? 26 : 22 }));
  if (groups) {
    // Gruppi di colonne (`gruppi`: [{ nome, colore, colonne }], nella riga 0): ognuno col suo colore,
    // unito sulle sue colonne; i nomi delle colonne (riga 1) nello stesso colore su fondo chiaro.
    let c = 0;
    sheet["!merges"] = groups.flatMap(({ colore, colonne }) => {
      for (let k = c; k < c + colonne; k++) {
        const top = sheet[XLSX.utils.encode_cell({ r: 0, c: k })], under = sheet[XLSX.utils.encode_cell({ r: 1, c: k })];
        if (top) top.s = { ...styles.testa, fill: { patternType: "solid", fgColor: { rgb: colore } }, alignment: { vertical: "center", horizontal: "center" } };
        if (under) under.s = { ...styles.testa, font: { ...styles.testa.font, color: { rgb: colore } }, fill: { patternType: "solid", fgColor: { rgb: tint(colore) } } };
      }
      const merge = colonne > 1 ? [{ s: { r: 0, c }, e: { r: 0, c: c + colonne - 1 } }] : [];
      c += colonne;
      return merge;
    });
  } else if (heading > 0) {
    sheet["!merges"] = Array.from({ length: heading }, (_, r) => ({ s: { r, c: 0 }, e: { r, c: Math.max(0, cols.length - 1) } }));
  }
  return sheet;
}

/** "084C8D" schiarito verso il bianco (k 0–1): il fondo dei nomi delle colonne di un gruppo. */
const tint = (rgb, k = .85) => rgb.match(/../g)
  .map((h) => { const v = parseInt(h, 16); return Math.round(v + (255 - v) * k).toString(16).padStart(2, "0"); }).join("").toUpperCase();

/**
 * Il foglio (xml di xl/worksheets/sheetN.xml) con le prime `rows` righe e `cols` colonne bloccate:
 * restano in vista mentre si scorre. xlsx-js-style scrive solo <sheetView workbookViewId="0"/>,
 * senza blocco: lo si aggiunge qui.
 */
function frozenPaneXml(xml, rows, cols) {
  const pane = rows && cols ? "bottomRight" : rows ? "bottomLeft" : "topRight";
  const split = `${cols ? ` xSplit="${cols}"` : ""}${rows ? ` ySplit="${rows}"` : ""}`;
  return xml.replace(/<sheetView ([^>]*?)\/>/, `<sheetView $1><pane${split} topLeftCell="${XLSX.utils.encode_cell({ r: rows, c: cols })}" `
    + `activePane="${pane}" state="frozen"/><selection pane="${pane}"/></sheetView>`);
}

/** Scarica il libro Excel; `blocca` ({ righe, colonne }) le tiene ferme nel primo foglio mentre si scorre. */
function saveBook(book, fileName, { righe: rows = 0, colonne: cols = 0 } = {}) {
  const zip = rows || cols ? XLSX.CFB.read(new Uint8Array(XLSX.write(book, { bookType: "xlsx", type: "array" })), { type: "array" }) : null;
  const entry = zip && XLSX.CFB.find(zip, zip.FullPaths.find((p) => p.endsWith("xl/worksheets/sheet1.xml")) || "");
  // Niente blocco chiesto, o il foglio non si trova nel file: lo si scarica com'è.
  if (!entry) { XLSX.writeFile(book, fileName); return; }
  entry.content = new TextEncoder().encode(frozenPaneXml(new TextDecoder().decode(entry.content), rows, cols));
  entry.size = entry.content.length;
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([XLSX.CFB.write(zip, { fileType: "zip", type: "array" })],
    { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 10000);
}

// jsPDF per la scheda del socio, anche lui solo al primo clic.
function loadPdf() {
  if (window.jspdf) return Promise.resolve();
  return loadScript("https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js", "per il PDF",
    "sha384-JcnsjUPPylna1s1fvi1u12X5qjY5OL56iySh75FdtrwhO/SWXgMjoVqcKyIIWOLk");
}

/**
 * Scarica un foglio Excel dei soci passati. `columns`: [[intestazione, (socio) => valore], ...].
 * `gruppi` ([{ nome, colore, colonne }]) mette sopra la riga dei gruppi colorati (readableSheet());
 * `blocca` ({ righe, colonne }) le tiene ferme mentre si scorre (saveBook()).
 */
async function downloadExcel(rows, nome, columns, { gruppi: groups = null, blocca: freeze = {} } = {}) {
  if (!rows.length) { showToast("Nessun socio da scaricare."); return; }
  await loadXlsx();
  const table = [columns.map(([titleText]) => titleText), ...rows.map((s) => columns.map(([, theValue]) => theValue(s) ?? ""))];
  const sheet = groups
    ? readableSheet([groups.flatMap((g) => [g.nome, ...Array(g.colonne - 1).fill("")]), ...table], { intestazione: 1, gruppi: groups })
    : readableSheet(table);
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "Soci");
  saveBook(book, `${nome}-${new Date().toISOString().slice(0, 10)}.xlsx`, freeze);
  showToast(rows.length === 1 ? "Scaricato 1 socio." : `Scaricati ${rows.length} soci.`);
}

/**
 * Tutte le righe di una lettura, a pagine di 1000: Supabase non ne dà di più
 * per chiamata, e un elenco tagliato in silenzio (la stagione 2025 aveva 677
 * soci, non lontano) arriverebbe all'assicurazione senza che nessuno se ne
 * accorga. `crea` rifà la stessa richiesta, che deve avere un ordine stabile.
 */
async function allRows(create) {
  const PAGE = 1000;
  const rows = [];
  for (let da = 0; ; da += PAGE) {
    const { data, error } = await create().range(da, da + PAGE - 1);
    if (error) throw error;
    rows.push(...data);
    if (data.length < PAGE) return rows;
  }
}

/**
 * L'etichetta colorata di un giorno di gita (SABATO, DOMENICA, MARTEDI, JOLLY),
 * o stringa vuota. Colori in brand.css, "Giorni delle gite"; è la stessa di
 * dayLabel() in ricerca/comune.js.
 */
const DAY_NAMES = { SABATO: "Sabato", DOMENICA: "Domenica", MARTEDI: "Martedì", JOLLY: "Jolly" };
function dayLabel(dayKey) {
  return DAY_NAMES[dayKey] ? `<span class="giorno-etichetta" data-giorno="${dayKey}">${DAY_NAMES[dayKey]}</span>` : "";
}

/**
 * Cognome o nome con le sole lettere A-Z, senza accenti, spazi e apostrofi:
 * "D'Angelo" → "DANGELO". È norm_name() di schema.sql, che riempie la colonna
 * members.name_key ("DANGELO MARIO"): ricerca e doppioni confrontano quella,
 * così la stessa persona scritta in due modi si trova.
 */
function nameKey(t) {
  return String(t ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z]/g, "");
}

/** Testo scritto dagli utenti, pronto per innerHTML. */
const esc = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/**
 * Domanda di conferma in una finestra sopra tutta la pagina, al posto di
 * confirm(). Un browser che ha bloccato le finestre di conferma della pagina
 * fa rispondere a confirm() "no" da solo, senza mostrare niente. Prima la
 * domanda prendeva il posto dei pulsanti che l'avevano aperta: in fondo alla
 * pagina o in una riga di tabella si notava poco, e non si capiva che la
 * pagina stava aspettando una risposta. Ora copre lo schermo, e finché non si
 * risponde non si tocca altro. Annulla è già scelto: un Invio distratto non
 * fa niente. `dove` è il riquadro dei pulsanti che l'ha aperta: alla chiusura
 * il cursore torna lì. `pericolo: false` per le domande che non tolgono
 * niente (salvare, incassare): il "Sì" è blu invece che rosso.
 * Stile in brand.css (dialog.finestra.finestra-domanda).
 */
function ask(dove, question, si, alSi, { pericolo: danger = true, dettagli: details = null } = {}) {
  document.getElementById("finestraDomanda")?.remove();
  const dialog = document.createElement("dialog");
  dialog.id = "finestraDomanda";
  dialog.className = "finestra finestra-domanda";
  dialog.setAttribute("aria-labelledby", "finestraDomandaTesto");
  dialog.innerHTML = `<p class="domanda" id="finestraDomandaTesto">${esc(question)}</p>
    ${details ? dataTable(details) : ""}
    <div class="buttons">
      <button type="button" class="button is-medium" data-no>Annulla</button>
      <button type="button" class="button is-medium ${danger ? "is-danger" : "is-link"}" data-si>${esc(si)}</button>
    </div>`;
  const doClose = () => {
    dialog.close();
    dialog.remove();
    dove?.querySelector("button:not([hidden]):not([disabled])")?.focus();
  };
  dialog.querySelector("[data-si]").addEventListener("click", () => { doClose(); alSi(); });
  dialog.querySelector("[data-no]").addEventListener("click", doClose);
  // Esc vale come Annulla.
  dialog.addEventListener("cancel", (e) => { e.preventDefault(); doClose(); });
  document.body.append(dialog);
  dialog.showModal();
  dialog.querySelector("[data-no]").focus();
}

/**
 * Una piccola tabella per le finestre: un dato per riga, l'etichetta a
 * sinistra e il valore grande in grassetto. [[etichetta, valore], ...]; un
 * valore vuoto si scrive "non scritto" in rosso, così si nota. Prima i dati
 * stavano in una frase sola ("Salvare ROSSI MARIO? Codice fiscale …, nascita
 * …") e non si leggevano.
 */
function dataTable(rows) {
  return `<table class="tabella-dati"><tbody>${rows.map(([label, theValue]) => `<tr><th scope="row">${esc(label)}</th>
    <td${theValue ? "" : ' class="manca"'}>${theValue ? esc(theValue) : "non scritto"}</td></tr>`).join("")}</tbody></table>`;
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
function balanceOf(member) {
  return num(member.total) - num(member.paid);
}

/** Totale, acconto e saldo di un capofamiglia più i suoi familiari a carico. */
function householdTotals(householdHead, familyMembers = []) {
  const rows = [householdHead, ...familyMembers].filter(Boolean);
  const totalAmount = rows.reduce((s, r) => s + num(r.total), 0);
  const deposit = rows.reduce((s, r) => s + num(r.paid), 0);
  return { totale: totalAmount, acconto: deposit, saldo: totalAmount - deposit };
}

// ---------------------------------------------------------------------------
// Dati
// ---------------------------------------------------------------------------

/**
 * Listino raggruppato per categoria: { TESSERA: [...], FAMIGLIA: [...] }, nell'ordine del
 * modulo di carta (position). Il prezzo è quello che paga il socio: per le tessere comprende
 * l'assicurazione (card_price() nel database). Anche le voci spente (active false): un socio
 * che le ha già le tiene, e il suo totale non cambia; nuove non si scelgono.
 */
async function loadPrices() {
  const { data, error } = await sb
    .from("prices")
    .select("category, name, price:card_price, min_role, trips, day, insurance, people, active")
    .order("category")
    .order("position", { nullsFirst: false })
    .order("card_price")
    .order("name");
  if (error) throw error;

  const byCategory = { TESSERA: [], FAMIGLIA: [], ABBONAMENTO: [], PRESCIISTICA: [], CORSO: [] };
  data.forEach((p) => {
    if (byCategory[p.category]) byCategory[p.category].push(p);
  });
  return byCategory;
}

/** Luoghi di partenza: { SABATO: [...], DOMENICA: [...] } */
async function loadDepartures() {
  const { data, error } = await sb
    .from("departures")
    .select("day, place")
    .eq("active", true)
    .order("place");
  if (error) throw error;

  const byDay = { SABATO: [], DOMENICA: [] };
  data.forEach((p) => {
    if (byDay[p.day]) byDay[p.day].push(p.place);
  });
  return byDay;
}

/**
 * Si iscrive agli aggiornamenti della tabella members: quando un altro
 * operatore salva, la callback viene richiamata. Sostituisce il refresh
 * manuale della 1.x.
 */
function listenMembers(callback) {
  // Un incasso cambia le righe di tutta la famiglia, cioè un evento per riga: si
  // aspetta che la raffica finisca e si ricarica una volta. E mai due insieme: una
  // lettura più vecchia che arriva dopo coprirebbe quella nuova.
  let waiting = null, inProgress = false, still = false;
  const reload = async () => {
    if (inProgress) { still = true; return; }
    inProgress = true;
    try { await callback(); } catch { /* la pagina dice da sé i suoi errori */ }
    inProgress = false;
    if (still) { still = false; reload(); }
  };
  return sb
    .channel("soci-live")
    .on("postgres_changes", { event: "*", schema: "public", table: "members" }, () => {
      clearTimeout(waiting);
      waiting = setTimeout(reload, 400);
    })
    .subscribe();
}

/** Errore leggibile a partire da un errore Supabase. */
function errorMessage(error) {
  if (!error) return "Errore sconosciuto";
  if (error.code === "PGRST301" || error.status === 401) {
    return "Sessione scaduta: effettuare di nuovo l'accesso.";
  }
  return error.message || String(error);
}
