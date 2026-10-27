// Controllo del validatore del codice fiscale (web/codicefiscale.js).
//
//   node web/test-codicefiscale.js
//
// I codici qui sotto sono inventati: nessuno appartiene a un socio.

const assert = require("assert");
const fs = require("fs");
const path = require("path");

// codicefiscale.js ha solo funzioni pure: si carica senza finta finestra.
const source = fs.readFileSync(path.join(__dirname, "codicefiscale.js"), "utf8");
const { verifyTaxCode, surnameCode, firstNameCode, checkChar, normalizeTaxCode, computeTaxCode, municipalityFromCodes, sexFromCodes } =
  (0, eval)(`(() => { ${source}
    return { verifyTaxCode, surnameCode, firstNameCode, checkChar, normalizeTaxCode, computeTaxCode, municipalityFromCodes, sexFromCodes }; })()`);

const reds = { cognome: "Rossi", nome: "Mario", dataNascita: "1985-12-10" };

// --- Lettere di cognome e nome ---------------------------------------------

assert.strictEqual(surnameCode("Rossi"), "RSS");
assert.strictEqual(surnameCode("Fo"), "FOX");                // corto: si riempie con X
assert.strictEqual(surnameCode("D'Angelo"), "DNG");          // apostrofo ignorato
assert.strictEqual(surnameCode("De Luca"), "DLC");           // cognome doppio: tutto attaccato
assert.strictEqual(firstNameCode("Mario"), "MRA");
assert.strictEqual(firstNameCode("Gianfranco"), "GFR");           // 4+ consonanti: 1ª, 3ª, 4ª
assert.strictEqual(firstNameCode("Ugo"), "GUO");
assert.strictEqual(firstNameCode("Nicolò"), "NCL");               // accento ignorato
assert.strictEqual(normalizeTaxCode(" rss mra 85t10 a562s "), "RSSMRA85T10A562S");

// --- Codici giusti ----------------------------------------------------------

assert.strictEqual(checkChar("RSSMRA85T10A562"), "S");
assert.strictEqual(verifyTaxCode(""), null);                      // vuoto: niente da dire
assert.strictEqual(verifyTaxCode(null), null);
assert.deepStrictEqual(verifyTaxCode("RSSMRA85T10A562S", reds), { ok: true, problemi: [], suggerito: null });
assert.ok(verifyTaxCode("rss mra 85t10 a562s", reds).ok);       // minuscole e spazi vanno bene

// Donna: giorno + 40.
const whites15 = "BNCMRA80A41F205";
const whites = whites15 + checkChar(whites15);
assert.ok(verifyTaxCode(whites, { cognome: "Bianchi", nome: "Maria", dataNascita: "1980-01-01" }).ok);

// Omocodia: il 2 del comune diventato N resta valido.
const omocode15 = "RSSMRA85T10A56N";
const omocode = omocode15 + checkChar(omocode15);
assert.ok(verifyTaxCode(omocode, reds).ok, "omocodia non riconosciuta");

// --- Codici sbagliati -------------------------------------------------------

// Carattere finale sbagliato: col comune dei soci nati lì si propone quello giusto.
let outcome = verifyTaxCode("RSSMRA85T10A562X", { ...reds, comune: "A562" });
assert.strictEqual(outcome.ok, false);
assert.strictEqual(outcome.suggerito, "RSSMRA85T10A562S");
assert.match(outcome.problemi[0], /carattere di controllo/);

// Senza il comune lo sbaglio può essere nel comune: si dice dove guardare, ma
// non si propone un finale nuovo (rovinerebbe quello giusto).
outcome = verifyTaxCode("RSSMRA85T10A562X", reds);
assert.strictEqual(outcome.ok, false);
assert.strictEqual(outcome.suggerito, null);
assert.match(outcome.problemi[0], /carattere di controllo.*comune/);
// Anche senza anagrafica si controlla il carattere finale.
assert.match(verifyTaxCode("RSSMRA85T10A562X").problemi[0], /carattere di controllo/);

// Ultimo carattere dimenticato.
outcome = verifyTaxCode("RSSMRA85T10A562", reds);
assert.strictEqual(outcome.suggerito, "RSSMRA85T10A562S");
assert.match(outcome.problemi[0], /Manca il carattere di controllo finale: il valore atteso è S/);

// Cognome che non torna (e finale sbagliato): si rifanno le tre lettere e il carattere finale.
outcome = verifyTaxCode("RSSMRA85T10A562X", { ...reds, cognome: "Bianchi" });
assert.strictEqual(outcome.ok, false);
assert.strictEqual(outcome.suggerito, "BNCMRA85T10A562" + checkChar("BNCMRA85T10A562"));
assert.strictEqual(outcome.problemi.length, 1, "il carattere finale non va segnalato a parte");

// Codice coerente col suo finale che non torna con la scheda: sarà la scheda
// (data battuta male, secondo nome). Si avvisa, ma non si propone di cambiarlo.
outcome = verifyTaxCode("RSSMRA85T10A562S", { ...reds, cognome: "Bianchi" });
assert.strictEqual(outcome.ok, false);
assert.strictEqual(outcome.suggerito, null);
assert.match(outcome.problemi[0], /cognome/);
assert.match(outcome.problemi[1], /coerente con il carattere di controllo.*tessera sanitaria/);

// Data sbagliata di una donna (e finale sbagliato): il +40 resta.
const whitesSkewed = whites15 + (whites.endsWith("A") ? "B" : "A");
outcome = verifyTaxCode(whitesSkewed, { cognome: "Bianchi", nome: "Maria", dataNascita: "1980-01-02" });
assert.strictEqual(outcome.suggerito.slice(6, 11), "80A42");
assert.match(outcome.problemi[0], /data di nascita/);
// Lo stesso col finale giusto: la data della scheda può essere sbagliata, niente proposta.
outcome = verifyTaxCode(whites, { cognome: "Bianchi", nome: "Maria", dataNascita: "1980-01-02" });
assert.strictEqual(outcome.suggerito, null);
assert.match(outcome.problemi[0], /data di nascita/);

// Omocodico con carattere finale sbagliato: la N del comune non si tocca.
outcome = verifyTaxCode(omocode15 + (omocode.endsWith("A") ? "B" : "A"), { ...reds, comune: "A562" });
assert.strictEqual(outcome.suggerito, omocode);

// Troppo corto o comune illeggibile: si segnala, ma non si può proporre niente.
outcome = verifyTaxCode("RSSMRA85T1", reds);
assert.strictEqual(outcome.suggerito, null);
assert.match(outcome.problemi[0], /16 caratteri \(inseriti: 10\)/);

outcome = verifyTaxCode("RSSMRA85T10AA62S", reds);
assert.strictEqual(outcome.suggerito, null);
assert.ok(outcome.problemi.some((p) => /comune/.test(p)));

// Giorno impossibile (35): non si sa se uomo o donna, niente proposta.
outcome = verifyTaxCode("RSSMRA85T35A562S", reds);
assert.strictEqual(outcome.suggerito, null);
assert.ok(outcome.problemi.some((p) => /data di nascita/.test(p)));

// --- Comune atteso e sesso indicato da chi compila ---------------------------

// Comune sbagliato che sembra omocodia: la P al posto del 2 si legge come 3
// (A563), e il carattere finale è quello del codice giusto. Senza il comune
// atteso non si propone niente (un finale nuovo sarebbe sbagliato), col comune
// dei soci nati lì si rifà il comune e il finale torna quello di prima.
const wrongMunicipality = "RSSMRA85T10A56PS";
assert.strictEqual(verifyTaxCode(wrongMunicipality, reds).suggerito, null);
outcome = verifyTaxCode(wrongMunicipality, { ...reds, comune: "A562", luogo: "napoli" });
assert.strictEqual(outcome.ok, false);
assert.strictEqual(outcome.suggerito, "RSSMRA85T10A562S");
assert.match(outcome.problemi[0], /comune di nascita.*NAPOLI.*A562/);
assert.strictEqual(outcome.problemi.length, 1, "il carattere finale non va segnalato a parte");

// Comune diverso ma codice coerente col suo finale: sarà sbagliato il luogo
// della scheda. Si avvisa e non si propone niente.
const otherMunicipality15 = "RSSMRA85T10F205";
outcome = verifyTaxCode(otherMunicipality15 + checkChar(otherMunicipality15), { ...reds, comune: "A562", luogo: "NAPOLI" });
assert.strictEqual(outcome.ok, false);
assert.strictEqual(outcome.suggerito, null);
assert.match(outcome.problemi[0], /F205.*NAPOLI.*A562.*luogo di nascita/);

// Il finale torna ma il cognome e il comune no: è un codice vero di qualcuno
// (sull'archivio, un nato in Cina con la scheda che dice ASTI). Si avvisa di
// tutti e due, e il codice non si riscrive.
const rsx15 = "RSXMRA85T10F205";
outcome = verifyTaxCode(rsx15 + checkChar(rsx15), { ...reds, comune: "A562", luogo: "NAPOLI" });
assert.strictEqual(outcome.suggerito, null);
assert.match(outcome.problemi[0], /cognome/);
assert.match(outcome.problemi[1], /F205.*NAPOLI.*A562/);
assert.strictEqual(outcome.problemi.length, 3);
// Col finale sbagliato invece è un codice copiato male: si rifanno cognome e comune.
outcome = verifyTaxCode(rsx15 + (checkChar(rsx15) === "A" ? "B" : "A"), { ...reds, comune: "A562", luogo: "NAPOLI" });
assert.strictEqual(outcome.suggerito, "RSSMRA85T10A562S");
assert.strictEqual(outcome.problemi.length, 2);

// G al posto del 6 nel comune: per il carattere finale valgono uguale, ma il
// comune così non esiste. Si rifà col comune atteso.
assert.strictEqual(checkChar("RSSMRA85T10D9G9"), checkChar("RSSMRA85T10D969"));
const genoa = "RSSMRA85T10D969" + checkChar("RSSMRA85T10D969");
outcome = verifyTaxCode("RSSMRA85T10D9G9" + genoa[15], { ...reds, comune: "D969", luogo: "GENOVA" });
assert.strictEqual(outcome.suggerito, genoa);
assert.match(outcome.problemi[0], /comune di nascita.*GENOVA.*D969/);
// Senza comune atteso: comune non valido, niente proposta.
outcome = verifyTaxCode("RSSMRA85T10D9G9" + genoa[15], reds);
assert.strictEqual(outcome.suggerito, null);
assert.ok(outcome.problemi.some((p) => /comune/.test(p)));

// L'omocodia vera resta valida anche col comune atteso.
assert.ok(verifyTaxCode(omocode, { ...reds, comune: "A562" }).ok);

// Comune illeggibile: col comune atteso si rifà.
assert.strictEqual(verifyTaxCode("RSSMRA85T10AA62S", { ...reds, comune: "A562" }).suggerito, "RSSMRA85T10A562S");

// Giorno illeggibile (C al posto dell'1): senza sesso niente proposta, con il
// sesso la data si rifà da quella della scheda.
outcome = verifyTaxCode("RSSMRA85TC0A562S", reds);
assert.strictEqual(outcome.suggerito, null);
assert.ok(outcome.problemi.some((p) => /data di nascita/.test(p)));
assert.strictEqual(verifyTaxCode("RSSMRA85TC0A562S", { ...reds, sesso: "M" }).suggerito, "RSSMRA85T10A562S");
assert.strictEqual(verifyTaxCode("RSSMRA85TC0A562S", { ...reds, sesso: "F" }).suggerito.slice(6, 11), "85T50");
// Il sesso scelto vale più del giorno leggibile: 50 (donna, il 10) per un uomo.
const donna15 = "RSSMRA85T50A562";
outcome = verifyTaxCode(donna15 + (checkChar(donna15) === "A" ? "B" : "A"), { ...reds, sesso: "M", comune: "A562" });
assert.strictEqual(outcome.suggerito, "RSSMRA85T10A562S");
assert.match(outcome.problemi[0], /giorno \(50\).*donna.*sesso indicato è M/);
// Col finale giusto è un codice da donna vero: si avvisa, senza proposta.
outcome = verifyTaxCode(donna15 + checkChar(donna15), { ...reds, sesso: "M", comune: "A562" });
assert.strictEqual(outcome.suggerito, null);
assert.match(outcome.problemi[0], /sesso indicato è M/);
// Data sbagliata davvero, col sesso scelto: si dice la data.
outcome = verifyTaxCode("RSSMRA85T11A562" + checkChar("RSSMRA85T11A562"), { ...reds, sesso: "M", comune: "A562" });
assert.match(outcome.problemi[0], /data di nascita non corrisponde/);
// Il sesso dei soci con lo stesso nome non cambia un giorno leggibile...
assert.ok(verifyTaxCode(whites, { cognome: "Bianchi", nome: "Maria", dataNascita: "1980-01-01", sessoProbabile: "M" }).ok);
// ...ma rifà quello illeggibile.
assert.strictEqual(verifyTaxCode("RSSMRA85TC0A562S", { ...reds, sessoProbabile: "M" }).suggerito, "RSSMRA85T10A562S");
// Senza data nella scheda il sesso non basta.
assert.strictEqual(verifyTaxCode("RSSMRA85TC0A562S", { ...reds, dataNascita: "", sesso: "M" }).suggerito, null);

// Giorno e comune sbagliati insieme: si rifanno tutti e due.
outcome = verifyTaxCode("RSSMRA85TC0A56PX", { ...reds, sesso: "M", comune: "A562", luogo: "NAPOLI" });
assert.strictEqual(outcome.suggerito, "RSSMRA85T10A562S");
assert.strictEqual(outcome.problemi.length, 2);

// Il sesso dai codici dei soci con lo stesso nome.
assert.strictEqual(sexFromCodes(["RSSMRA85T10A562S", "VRDLCU70C05A562Z"]), "M");
assert.strictEqual(sexFromCodes([whites, whites]), null);                        // una persona sola: non basta
assert.strictEqual(sexFromCodes(["RSSMRA85T10A562S", "VRDLCU70C05A562Z", whites]), "M");
assert.strictEqual(sexFromCodes(["RSSMRA85T10A562S", whites]), null);             // uno a uno: non si sceglie
assert.strictEqual(sexFromCodes(["RSSMRA85T10A562X", "VRDLCU70C05A562Y"]), null);  // finali sbagliati: non contano

// --- Codice proposto a campo vuoto -----------------------------------------

// Il Mario Rossi degli esempi: il codice calcolato è quello noto.
assert.strictEqual(computeTaxCode({ ...reds, sesso: "M", comune: "A562" }), "RSSMRA85T10A562S");
// Donna: giorno + 40, e il codice calcolato passa la verifica.
const maria = { cognome: "Bianchi", nome: "Maria", dataNascita: "1980-01-01" };
assert.strictEqual(computeTaxCode({ ...maria, sesso: "F", comune: "F205" }), whites);
assert.ok(verifyTaxCode(computeTaxCode({ ...maria, sesso: "F", comune: "F205" }), maria).ok);
// Manca qualcosa: niente proposta.
assert.strictEqual(computeTaxCode({ ...reds, comune: "A562" }), null);           // sesso
assert.strictEqual(computeTaxCode({ ...reds, sesso: "M" }), null);               // comune
assert.strictEqual(computeTaxCode({ ...reds, sesso: "M", comune: "ASTI" }), null);
assert.strictEqual(computeTaxCode({ ...reds, dataNascita: "", sesso: "M", comune: "A562" }), null);

// Il comune dai codici dei soci nati lì: vince chi ha più della metà.
assert.strictEqual(municipalityFromCodes(["RSSMRA85T10A562S", "rssmra85t10a562s"]), "A562");
assert.strictEqual(municipalityFromCodes([omocode]), "A562");                         // omocodia tolta
assert.strictEqual(municipalityFromCodes(["RSSMRA85T10A562S", "RSSMRA85T10F205X"]), "A562"); // finale sbagliato: non conta
assert.strictEqual(municipalityFromCodes(["RSSMRA85T10A562S", whites]), null);         // uno a uno: non si sceglie
const verdi = "VRDLCU70C05A562Z";                                             // un altro nato a A562
assert.strictEqual(municipalityFromCodes(["RSSMRA85T10A562S", verdi, whites]), "A562");
// La stessa persona su due schede conta una volta: uno a uno, non si sceglie.
assert.strictEqual(municipalityFromCodes(["RSSMRA85T10A562S", "RSSMRA85T10A562S", whites]), null);
assert.strictEqual(municipalityFromCodes([]), null);
assert.strictEqual(municipalityFromCodes([null, "", "RSSMRA85T1"]), null);
// Con un minimo: due codici buoni non bastano a dirne tre.
assert.strictEqual(municipalityFromCodes(["RSSMRA85T10A562S", verdi, "RSSMRA85T10F205X"], 3), null);
assert.strictEqual(municipalityFromCodes(["RSSMRA85T10A562S", verdi, whites], 3), "A562");

console.log("codicefiscale: tutti i controlli passati");
