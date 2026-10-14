// Controllo del validatore del codice fiscale (web/codicefiscale.js).
//
//   node web/test-codicefiscale.js
//
// I codici qui sotto sono inventati: nessuno appartiene a un socio.

const assert = require("assert");
const fs = require("fs");
const path = require("path");

// codicefiscale.js ha solo funzioni pure: si carica senza finta finestra.
const sorgente = fs.readFileSync(path.join(__dirname, "codicefiscale.js"), "utf8");
const { verificaCF, codiceCognome, codiceNome, carattereControllo, normalizzaCF, calcolaCF, comuneDaiCF, sessoDaiCF } =
  (0, eval)(`(() => { ${sorgente}
    return { verificaCF, codiceCognome, codiceNome, carattereControllo, normalizzaCF, calcolaCF, comuneDaiCF, sessoDaiCF }; })()`);

const rossi = { cognome: "Rossi", nome: "Mario", dataNascita: "1985-12-10" };

// --- Lettere di cognome e nome ---------------------------------------------

assert.strictEqual(codiceCognome("Rossi"), "RSS");
assert.strictEqual(codiceCognome("Fo"), "FOX");                // corto: si riempie con X
assert.strictEqual(codiceCognome("D'Angelo"), "DNG");          // apostrofo ignorato
assert.strictEqual(codiceCognome("De Luca"), "DLC");           // cognome doppio: tutto attaccato
assert.strictEqual(codiceNome("Mario"), "MRA");
assert.strictEqual(codiceNome("Gianfranco"), "GFR");           // 4+ consonanti: 1ª, 3ª, 4ª
assert.strictEqual(codiceNome("Ugo"), "GUO");
assert.strictEqual(codiceNome("Nicolò"), "NCL");               // accento ignorato
assert.strictEqual(normalizzaCF(" rss mra 85t10 a562s "), "RSSMRA85T10A562S");

// --- Codici giusti ----------------------------------------------------------

assert.strictEqual(carattereControllo("RSSMRA85T10A562"), "S");
assert.strictEqual(verificaCF(""), null);                      // vuoto: niente da dire
assert.strictEqual(verificaCF(null), null);
assert.deepStrictEqual(verificaCF("RSSMRA85T10A562S", rossi), { ok: true, problemi: [], suggerito: null });
assert.ok(verificaCF("rss mra 85t10 a562s", rossi).ok);       // minuscole e spazi vanno bene

// Donna: giorno + 40.
const bianchi15 = "BNCMRA80A41F205";
const bianchi = bianchi15 + carattereControllo(bianchi15);
assert.ok(verificaCF(bianchi, { cognome: "Bianchi", nome: "Maria", dataNascita: "1980-01-01" }).ok);

// Omocodia: il 2 del comune diventato N resta valido.
const omocodico15 = "RSSMRA85T10A56N";
const omocodico = omocodico15 + carattereControllo(omocodico15);
assert.ok(verificaCF(omocodico, rossi).ok, "omocodia non riconosciuta");

// --- Codici sbagliati -------------------------------------------------------

// Carattere finale sbagliato: si propone quello giusto.
let esito = verificaCF("RSSMRA85T10A562X", rossi);
assert.strictEqual(esito.ok, false);
assert.strictEqual(esito.suggerito, "RSSMRA85T10A562S");
assert.match(esito.problemi[0], /ultimo carattere/);

// Anche senza anagrafica si controlla il carattere finale.
assert.strictEqual(verificaCF("RSSMRA85T10A562X").suggerito, "RSSMRA85T10A562S");

// Ultimo carattere dimenticato.
esito = verificaCF("RSSMRA85T10A562", rossi);
assert.strictEqual(esito.suggerito, "RSSMRA85T10A562S");
assert.match(esito.problemi[0], /Manca l'ultimo carattere: dovrebbe essere S/);

// Cognome che non torna: si rifanno le tre lettere e il carattere finale.
esito = verificaCF("RSSMRA85T10A562S", { ...rossi, cognome: "Bianchi" });
assert.strictEqual(esito.ok, false);
assert.strictEqual(esito.suggerito, "BNCMRA85T10A562" + carattereControllo("BNCMRA85T10A562"));
assert.strictEqual(esito.problemi.length, 1, "il carattere finale non va segnalato a parte");

// Data sbagliata di una donna: il +40 resta.
esito = verificaCF(bianchi, { cognome: "Bianchi", nome: "Maria", dataNascita: "1980-01-02" });
assert.strictEqual(esito.suggerito.slice(6, 11), "80A42");
assert.match(esito.problemi[0], /data di nascita/);

// Omocodico con carattere finale sbagliato: la N del comune non si tocca.
esito = verificaCF(omocodico15 + (omocodico.endsWith("A") ? "B" : "A"), rossi);
assert.strictEqual(esito.suggerito, omocodico);

// Troppo corto o comune illeggibile: si segnala, ma non si può proporre niente.
esito = verificaCF("RSSMRA85T1", rossi);
assert.strictEqual(esito.suggerito, null);
assert.match(esito.problemi[0], /16 caratteri: ne ha 10/);

esito = verificaCF("RSSMRA85T10AA62S", rossi);
assert.strictEqual(esito.suggerito, null);
assert.ok(esito.problemi.some((p) => /comune/.test(p)));

// Giorno impossibile (35): non si sa se uomo o donna, niente proposta.
esito = verificaCF("RSSMRA85T35A562S", rossi);
assert.strictEqual(esito.suggerito, null);
assert.ok(esito.problemi.some((p) => /data di nascita/.test(p)));

// --- Comune atteso e sesso indicato da chi compila ---------------------------

// Comune sbagliato che sembra omocodia: la P al posto del 2 si legge come 3
// (A563), e il carattere finale è quello del codice giusto. Senza il comune
// atteso si propone solo un altro carattere finale (sbagliato), col comune dei
// soci nati lì si rifà il comune e il finale torna quello di prima.
const comuneSbagliato = "RSSMRA85T10A56PS";
assert.strictEqual(verificaCF(comuneSbagliato, rossi).suggerito.slice(0, 15), "RSSMRA85T10A56P");
esito = verificaCF(comuneSbagliato, { ...rossi, comune: "A562", luogo: "napoli" });
assert.strictEqual(esito.ok, false);
assert.strictEqual(esito.suggerito, "RSSMRA85T10A562S");
assert.match(esito.problemi[0], /comune di nascita.*NAPOLI.*A562/);
assert.strictEqual(esito.problemi.length, 1, "il carattere finale non va segnalato a parte");

// Comune diverso ma codice coerente col suo finale: sarà sbagliato il luogo
// della scheda. Si avvisa e non si propone niente.
const altroComune15 = "RSSMRA85T10F205";
esito = verificaCF(altroComune15 + carattereControllo(altroComune15), { ...rossi, comune: "A562", luogo: "NAPOLI" });
assert.strictEqual(esito.ok, false);
assert.strictEqual(esito.suggerito, null);
assert.match(esito.problemi[0], /F205.*NAPOLI.*A562.*luogo di nascita/);

// L'omocodia vera resta valida anche col comune atteso.
assert.ok(verificaCF(omocodico, { ...rossi, comune: "A562" }).ok);

// Comune illeggibile: col comune atteso si rifà.
assert.strictEqual(verificaCF("RSSMRA85T10AA62S", { ...rossi, comune: "A562" }).suggerito, "RSSMRA85T10A562S");

// Giorno illeggibile (C al posto dell'1): senza sesso niente proposta, con il
// sesso la data si rifà da quella della scheda.
esito = verificaCF("RSSMRA85TC0A562S", rossi);
assert.strictEqual(esito.suggerito, null);
assert.ok(esito.problemi.some((p) => /data di nascita/.test(p)));
assert.strictEqual(verificaCF("RSSMRA85TC0A562S", { ...rossi, sesso: "M" }).suggerito, "RSSMRA85T10A562S");
assert.strictEqual(verificaCF("RSSMRA85TC0A562S", { ...rossi, sesso: "F" }).suggerito.slice(6, 11), "85T50");
// Senza data nella scheda il sesso non basta.
assert.strictEqual(verificaCF("RSSMRA85TC0A562S", { ...rossi, dataNascita: "", sesso: "M" }).suggerito, null);

// Giorno e comune sbagliati insieme: si rifanno tutti e due.
esito = verificaCF("RSSMRA85TC0A56PX", { ...rossi, sesso: "M", comune: "A562", luogo: "NAPOLI" });
assert.strictEqual(esito.suggerito, "RSSMRA85T10A562S");
assert.strictEqual(esito.problemi.length, 2);

// Il sesso dai codici dei soci con lo stesso nome.
assert.strictEqual(sessoDaiCF(["RSSMRA85T10A562S", "VRDLCU70C05A562Z"]), "M");
assert.strictEqual(sessoDaiCF([bianchi, bianchi]), null);                        // una persona sola: non basta
assert.strictEqual(sessoDaiCF(["RSSMRA85T10A562S", "VRDLCU70C05A562Z", bianchi]), "M");
assert.strictEqual(sessoDaiCF(["RSSMRA85T10A562S", bianchi]), null);             // uno a uno: non si sceglie
assert.strictEqual(sessoDaiCF(["RSSMRA85T10A562X", "VRDLCU70C05A562Y"]), null);  // finali sbagliati: non contano

// --- Codice proposto a campo vuoto -----------------------------------------

// Il Mario Rossi degli esempi: il codice calcolato è quello noto.
assert.strictEqual(calcolaCF({ ...rossi, sesso: "M", comune: "A562" }), "RSSMRA85T10A562S");
// Donna: giorno + 40, e il codice calcolato passa la verifica.
const maria = { cognome: "Bianchi", nome: "Maria", dataNascita: "1980-01-01" };
assert.strictEqual(calcolaCF({ ...maria, sesso: "F", comune: "F205" }), bianchi);
assert.ok(verificaCF(calcolaCF({ ...maria, sesso: "F", comune: "F205" }), maria).ok);
// Manca qualcosa: niente proposta.
assert.strictEqual(calcolaCF({ ...rossi, comune: "A562" }), null);           // sesso
assert.strictEqual(calcolaCF({ ...rossi, sesso: "M" }), null);               // comune
assert.strictEqual(calcolaCF({ ...rossi, sesso: "M", comune: "ASTI" }), null);
assert.strictEqual(calcolaCF({ ...rossi, dataNascita: "", sesso: "M", comune: "A562" }), null);

// Il comune dai codici dei soci nati lì: vince chi ha più della metà.
assert.strictEqual(comuneDaiCF(["RSSMRA85T10A562S", "rssmra85t10a562s"]), "A562");
assert.strictEqual(comuneDaiCF([omocodico]), "A562");                         // omocodia tolta
assert.strictEqual(comuneDaiCF(["RSSMRA85T10A562S", "RSSMRA85T10F205X"]), "A562"); // finale sbagliato: non conta
assert.strictEqual(comuneDaiCF(["RSSMRA85T10A562S", bianchi]), null);         // uno a uno: non si sceglie
const verdi = "VRDLCU70C05A562Z";                                             // un altro nato a A562
assert.strictEqual(comuneDaiCF(["RSSMRA85T10A562S", verdi, bianchi]), "A562");
// La stessa persona su due schede conta una volta: uno a uno, non si sceglie.
assert.strictEqual(comuneDaiCF(["RSSMRA85T10A562S", "RSSMRA85T10A562S", bianchi]), null);
assert.strictEqual(comuneDaiCF([]), null);
assert.strictEqual(comuneDaiCF([null, "", "RSSMRA85T1"]), null);
// Con un minimo: due codici buoni non bastano a dirne tre.
assert.strictEqual(comuneDaiCF(["RSSMRA85T10A562S", verdi, "RSSMRA85T10F205X"], 3), null);
assert.strictEqual(comuneDaiCF(["RSSMRA85T10A562S", verdi, bianchi], 3), "A562");

console.log("codicefiscale: tutti i controlli passati");
