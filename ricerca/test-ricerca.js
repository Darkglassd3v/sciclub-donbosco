// Controllo delle parti che possono sbagliare in silenzio: come il testo
// digitato diventa pezzi di ricerca, come i pezzi diventano filtri, e come un
// numero scritto a mano diventa un link WhatsApp.
//
//   node ricerca/test-ricerca.js

const assert = require("assert");
const fs = require("fs");
const path = require("path");

// comune.js definisce funzioni pure in cima e tocca il browser solo dentro
// proteggiPagina(): si può caricare qui senza finta finestra.
const sorgente = fs.readFileSync(path.join(__dirname, "comune.js"), "utf8");
const { pezzi, evidenzia, numeroWhatsapp, numeroChiamata, contattiHtml, testo,
        giornoAbbonamento, etichettaGiorno } =
  (0, eval)(`(() => { ${sorgente}
    return { pezzi, evidenzia, numeroWhatsapp, numeroChiamata, contattiHtml, testo,
             giornoAbbonamento, etichettaGiorno }; })()`);

// --- Ricerca ---------------------------------------------------------------

// Quello che ha chiesto il direttivo: si scrive l'inizio, non tutto.
assert.deepStrictEqual(pezzi("cos"), ["cos"]);
assert.deepStrictEqual(pezzi("fede"), ["fede"]);
assert.deepStrictEqual(pezzi("cos fede"), ["cos", "fede"]);
assert.deepStrictEqual(pezzi("  COSSETTA,  Federico "), ["cossetta", "federico"]);

// Una lettera sola non cerca: restituirebbe mezzo archivio.
assert.deepStrictEqual(pezzi("c"), []);
assert.deepStrictEqual(pezzi(""), []);
assert.deepStrictEqual(pezzi(null), []);

// Gli apostrofi dei cognomi restano, la punteggiatura e le cifre no.
assert.deepStrictEqual(pezzi("d'ang"), ["d'ang"]);
assert.deepStrictEqual(pezzi("ros%si"), ["rossi"]);
assert.deepStrictEqual(pezzi("cos*,ni.eq.1"), ["cos", "nieq"]);

// Al massimo quattro pezzi: oltre, la URL del filtro cresce senza servire.
assert.strictEqual(pezzi("a1 bb cc dd ee ff").length, 4);

// L'evidenziazione marca solo l'inizio della parola, e solo se corrisponde.
assert.strictEqual(evidenzia("Cossetta", ["cos"]), "<mark>Cos</mark>setta");
assert.strictEqual(evidenzia("Federico", ["cos"]), "Federico");

// Ogni pezzo diventa un filtro a sé: concatenati sono in AND, quindi
// "cos fede" chiede una riga che soddisfi entrambi.
const filtri = pezzi("cos fede").map((p) => `cognome.ilike.${p}%,nome.ilike.${p}%`);
assert.deepStrictEqual(filtri, [
  "cognome.ilike.cos%,nome.ilike.cos%",
  "cognome.ilike.fede%,nome.ilike.fede%",
]);

// --- "NO" vuol dire niente -------------------------------------------------

assert.strictEqual(testo("NO"), "—");
assert.strictEqual(testo(" no "), "—");
assert.strictEqual(testo(""), "—");
assert.strictEqual(testo(null), "—");
assert.strictEqual(testo("STAGIONALE"), "STAGIONALE");

// --- Abbonamenti a viaggi --------------------------------------------------

// I nomi arrivano dal listino così come sono scritti nel foglio.
assert.strictEqual(giornoAbbonamento("Abbonamento 5 viaggi SABATO"), "SABATO");
assert.strictEqual(giornoAbbonamento("Abbonamento 5 viaggi DOMENICA"), "DOMENICA");
assert.strictEqual(giornoAbbonamento("Abbonamento 5 viaggi MARTEDÌ"), "MARTEDI");
assert.strictEqual(giornoAbbonamento("abbonamento 10 viaggi jolly"), "JOLLY");

// Quello che non è un abbonamento a viaggi non prende nessun colore.
assert.strictEqual(giornoAbbonamento("CORSO PRESCIISTICA"), null);
assert.strictEqual(giornoAbbonamento("NO"), null);
assert.strictEqual(giornoAbbonamento(null), null);

// Il colore non è mai l'unica informazione: il nome del giorno resta scritto.
assert.ok(etichettaGiorno("SABATO").includes("Sabato"), "manca il nome del giorno");
assert.ok(etichettaGiorno("SABATO").includes("giorno-sabato"), "manca la classe del colore");
assert.strictEqual(etichettaGiorno(null), "");

// --- Telefono --------------------------------------------------------------

// I numeri in anagrafica sono scritti come capita.
assert.strictEqual(numeroWhatsapp("380 340 9158"), "393803409158");
assert.strictEqual(numeroWhatsapp("380-340-9158"), "393803409158");
assert.strictEqual(numeroWhatsapp("+39 380 340 9158"), "393803409158");
assert.strictEqual(numeroWhatsapp("0039 380 340 9158"), "393803409158");
assert.strictEqual(numeroWhatsapp("393803409158"), "393803409158");

// Un fisso tiene lo zero iniziale anche col prefisso internazionale.
assert.strictEqual(numeroWhatsapp("0141/123456"), "390141123456");

// Un cellulare che comincia per 39 è un numero italiano da dieci cifre, non un
// numero già internazionale: il prefisso gli va aggiunto lo stesso.
assert.strictEqual(numeroWhatsapp("3931234567"), "393931234567");

// Numeri inutilizzabili: nessun link, invece di un link che apre WhatsApp a vuoto.
assert.strictEqual(numeroWhatsapp(""), null);
assert.strictEqual(numeroWhatsapp(null), null);
assert.strictEqual(numeroWhatsapp("12"), null);

// La chiamata usa le cifre così come sono scritte: il telefono sa comporle.
assert.strictEqual(numeroChiamata("380 340 9158"), "3803409158");
assert.strictEqual(numeroChiamata("+39 380 340 9158"), "+393803409158");
assert.strictEqual(numeroChiamata("123"), null);

// Senza numero non compare nessun pulsante.
assert.strictEqual(contattiHtml(null), "");
const bottoni = contattiHtml("380 340 9158");
assert.ok(bottoni.includes('href="tel:3803409158"'), "manca il link di chiamata");
assert.ok(bottoni.includes("https://wa.me/393803409158"), "manca il link WhatsApp");

console.log("ok — ricerca");
