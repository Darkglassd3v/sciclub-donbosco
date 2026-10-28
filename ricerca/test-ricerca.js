// Controllo delle parti che possono sbagliare in silenzio: come il testo
// digitato diventa pezzi di ricerca, come i pezzi diventano filtri, e come un
// numero scritto a mano diventa un link WhatsApp.
//
//   node ricerca/test-ricerca.js

const assert = require("assert");
const fs = require("fs");
const path = require("path");

// comune.js definisce funzioni pure in cima e tocca il browser solo dentro
// protectPage(): si può caricare qui senza finta finestra.
const source = fs.readFileSync(path.join(__dirname, "comune.js"), "utf8");
const { pieces, cardNumbers, pieceFilter, nameKey, highlight, whatsappNumber, callNumber, contactsHtml, text,
        passDay, dayLabel, errorMessage, retryable, fetchRetryingFutureToken } =
  (0, eval)(`(() => { ${source}
    return { pieces, cardNumbers, pieceFilter, nameKey, highlight, whatsappNumber, callNumber, contactsHtml, text,
             passDay, dayLabel, errorMessage, retryable, fetchRetryingFutureToken }; })()`);

// --- Ricerca ---------------------------------------------------------------

// Quello che ha chiesto il direttivo: si scrive l'inizio, non tutto.
assert.deepStrictEqual(pieces("cos"), ["cos"]);
assert.deepStrictEqual(pieces("fede"), ["fede"]);
assert.deepStrictEqual(pieces("cos fede"), ["cos", "fede"]);
assert.deepStrictEqual(pieces("  COSSETTA,  Federico "), ["cossetta", "federico"]);

// Una lettera sola non cerca: restituirebbe mezzo archivio.
assert.deepStrictEqual(pieces("c"), []);
assert.deepStrictEqual(pieces(""), []);
assert.deepStrictEqual(pieces(null), []);

// Gli apostrofi dei cognomi restano, la punteggiatura e le cifre no.
assert.deepStrictEqual(pieces("d'ang"), ["d'ang"]);
assert.deepStrictEqual(pieces("ros%si"), ["rossi"]);
assert.deepStrictEqual(pieces("cos*,ni.eq.1"), ["cos", "nieq"]);

// Al massimo quattro pezzi: oltre, la URL del filtro cresce senza servire.
assert.strictEqual(pieces("a1 bb cc dd ee ff").length, 4);

// Il numero tessera si cerca come il nome: le cifre scritte sono numeri tessera, uguali e
// non «che iniziano per» (si cerca la tessera 12, non la 120). "0021" è la tessera 21,
// come la salva Soci (cardNumber() in web/index.html); i nomi restano nei pezzi.
assert.deepStrictEqual(cardNumbers("125"), ["125"]);
assert.deepStrictEqual(cardNumbers("0021"), ["21"]);
assert.deepStrictEqual(cardNumbers("rossi 125"), ["125"]);
assert.deepStrictEqual(pieces("rossi 125"), ["rossi"]);
assert.deepStrictEqual(cardNumbers("7"), ["7"]);
assert.deepStrictEqual(cardNumbers("rossi"), []);
assert.deepStrictEqual(cardNumbers(null), []);

// Il filtro è quello di sempre: inizio della parola, nel cognome o nel nome.
assert.strictEqual(pieceFilter("cos"),
  "last_name.ilike.cos%,first_name.ilike.cos%,name_key.like.COS%,name_key.like.% COS%");

// "d'angelo" trova anche DANGELO, e "dangelo" trova D'ANGELO: la chiave del
// nome toglie apostrofi e accenti (norm_name() nel database).
assert.strictEqual(nameKey("d'àngelo"), "DANGELO");
assert.strictEqual(pieceFilter("d'angelo"),
  "last_name.ilike.d'angelo%,first_name.ilike.d'angelo%,name_key.like.DANGELO%,name_key.like.% DANGELO%");

// L'evidenziazione marca solo l'inizio della parola, e solo se corrisponde.
assert.strictEqual(highlight("Cossetta", ["cos"]), "<mark>Cos</mark>setta");
assert.strictEqual(highlight("Federico", ["cos"]), "Federico");

// Ogni pezzo diventa un filtro a sé: concatenati sono in AND, quindi
// "cos fede" chiede una riga che soddisfi entrambi.
const filters = pieces("cos fede").map((p) => `cognome.ilike.${p}%,nome.ilike.${p}%`);
assert.deepStrictEqual(filters, [
  "cognome.ilike.cos%,nome.ilike.cos%",
  "cognome.ilike.fede%,nome.ilike.fede%",
]);

// --- "NO" vuol dire niente -------------------------------------------------

assert.strictEqual(text("NO"), "—");
assert.strictEqual(text(" no "), "—");
assert.strictEqual(text(""), "—");
assert.strictEqual(text(null), "—");
assert.strictEqual(text("STAGIONALE"), "STAGIONALE");

// --- Abbonamenti a viaggi --------------------------------------------------

// I nomi arrivano dal listino così come sono scritti nel foglio.
assert.strictEqual(passDay("Abbonamento 5 viaggi SABATO"), "SABATO");
assert.strictEqual(passDay("Abbonamento 5 viaggi DOMENICA"), "DOMENICA");
assert.strictEqual(passDay("Abbonamento 5 viaggi MARTEDÌ"), "MARTEDI");
assert.strictEqual(passDay("abbonamento 10 viaggi jolly"), "JOLLY");

// Quello che non è un abbonamento a viaggi non prende nessun colore.
assert.strictEqual(passDay("CORSO PRESCIISTICA"), null);
assert.strictEqual(passDay("NO"), null);
assert.strictEqual(passDay(null), null);

// Il colore non è mai l'unica informazione: il nome del giorno resta scritto.
assert.ok(dayLabel("SABATO").includes("Sabato"), "manca il nome del giorno");
assert.ok(dayLabel("SABATO").includes('data-giorno="SABATO"'), "manca il giorno per il colore");
assert.strictEqual(dayLabel(null), "");

// --- Telefono --------------------------------------------------------------

// I numeri in anagrafica sono scritti come capita.
assert.strictEqual(whatsappNumber("380 340 9158"), "393803409158");
assert.strictEqual(whatsappNumber("380-340-9158"), "393803409158");
assert.strictEqual(whatsappNumber("+39 380 340 9158"), "393803409158");
assert.strictEqual(whatsappNumber("0039 380 340 9158"), "393803409158");
assert.strictEqual(whatsappNumber("393803409158"), "393803409158");

// Un fisso tiene lo zero iniziale anche col prefisso internazionale.
assert.strictEqual(whatsappNumber("0141/123456"), "390141123456");

// Un cellulare che comincia per 39 è un numero italiano da dieci cifre, non un
// numero già internazionale: il prefisso gli va aggiunto lo stesso.
assert.strictEqual(whatsappNumber("3931234567"), "393931234567");

// Numeri inutilizzabili: nessun link, invece di un link che apre WhatsApp a vuoto.
assert.strictEqual(whatsappNumber(""), null);
assert.strictEqual(whatsappNumber(null), null);
assert.strictEqual(whatsappNumber("12"), null);

// La chiamata usa le cifre così come sono scritte: il telefono sa comporle.
assert.strictEqual(callNumber("380 340 9158"), "3803409158");
assert.strictEqual(callNumber("+39 380 340 9158"), "+393803409158");
assert.strictEqual(callNumber("123"), null);

// Senza numero non compare nessun pulsante.
assert.strictEqual(contactsHtml(null), "");
const buttons = contactsHtml("380 340 9158");
assert.ok(buttons.includes('href="tel:3803409158"'), "manca il link di chiamata");
assert.ok(buttons.includes("https://wa.me/393803409158"), "manca il link WhatsApp");

// --- Errori ----------------------------------------------------------------

// Il guasto di rete ha un nome diverso per ogni browser, e nessuno dei tre
// dice niente a chi sta caricando il pullman: conta sapere che è la linea e
// che si può riprovare.
const NETWORK = "Connessione assente o troppo debole: riprova.";
assert.strictEqual(errorMessage({ name: "TypeError", message: "Failed to fetch" }), NETWORK);
assert.strictEqual(errorMessage({ message: "Load failed" }), NETWORK);
assert.strictEqual(errorMessage({ message: "NetworkError when attempting to fetch resource." }), NETWORK);

// Un rifiuto del database invece va riportato così com'è: dice una cosa vera
// sull'abbonamento, non sulla connessione.
assert.strictEqual(
  errorMessage({ message: "Abbonamento esaurito: non restano gite da scalare." }),
  "Abbonamento esaurito: non restano gite da scalare.");
assert.strictEqual(errorMessage({ code: "PGRST301" }), "Sessione scaduta: esci e rientra.");
assert.strictEqual(errorMessage(null), "Errore sconosciuto");

// --- Cosa si riprova a mandare ---------------------------------------------

// Se il database ha risposto, la risposta non cambia riprovando: la gita esce
// dalla coda, altrimenti resterebbe lì a bloccare tutte quelle dietro.
assert.strictEqual(retryable({ code: "P0001", message: "Abbonamento esaurito: non restano gite da scalare." }), false);
assert.strictEqual(retryable({ code: "42501", message: "permission denied" }), false);
// Tranne la sessione scaduta: dopo un nuovo accesso la stessa gita passa.
assert.strictEqual(retryable({ code: "PGRST301" }), true);
assert.strictEqual(retryable({ code: "PGRST303", message: "JWT expired" }), true);
assert.strictEqual(errorMessage({ code: "PGRST303" }), "Sessione scaduta: esci e rientra.");

// Se invece non è arrivata risposta è la linea, e quella torna.
assert.strictEqual(retryable({ message: "Failed to fetch" }), true);
assert.strictEqual(retryable({ message: "Load failed" }), true);
// Un guasto che non sappiamo leggere si riprova: perdere una gita è peggio
// che riprovare a vuoto.
assert.strictEqual(retryable({ message: "qualcosa di inatteso" }), true);
assert.strictEqual(retryable(null), true);
// Errori del database che passano da soli: database non raggiungibile o pool
// esaurito (PGRST000-003), tempo scaduto (57014), troppe connessioni, riavvio,
// conflitto fra transazioni. Buttare la voce perderebbe una gita o una vendita.
for (const code of ["PGRST000", "PGRST001", "PGRST002", "PGRST003", "57014", "53300", "57P01", "57P03", "40001", "40P01"]) {
  assert.strictEqual(retryable({ code, message: "temporaneo" }), true, `${code} va riprovato`);
}
// Un no vero resta un no: riprovare darebbe lo stesso esito.
for (const code of ["23505", "P0001", "42501", "PGRST116"]) {
  assert.strictEqual(retryable({ code, message: "no" }), false, `${code} non va riprovato`);
}

console.log("ok — ricerca");

// --- Token rifiutato per un attimo («JWT issued at future») ------------------
// Come in web/shared.js: quel 401 si riprova (al massimo tre volte), gli altri no.
(async () => {
  const answer = (status, body) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
  const future = () => answer(401, { code: "PGRST303", message: "JWT issued at future" });
  const realFetch = global.fetch;
  let replies = [], calls = 0;
  global.fetch = async () => { calls++; return replies.shift(); };
  const ask = async (list) => { replies = list; calls = 0; const r = await fetchRetryingFutureToken("https://x/rest/v1/rpc/my_access", {}); return [r.status, calls]; };
  assert.deepStrictEqual(await ask([future(), answer(200, [])]), [200, 2], "il token appena rinnovato non si riprova");
  assert.deepStrictEqual(await ask([answer(401, { code: "PGRST303", message: "JWT expired" })]), [401, 1], "un token scaduto non si riprova");
  assert.deepStrictEqual(await ask(Array.from({ length: 10 }, future)), [401, 4], "deve arrendersi dopo tre tentativi");
  global.fetch = realFetch;
  console.log("ricerca: token rifiutato per un attimo, riprovato");
})();
