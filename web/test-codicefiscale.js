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
const { verificaCF, codiceCognome, codiceNome, carattereControllo, normalizzaCF } =
  (0, eval)(`(() => { ${sorgente}
    return { verificaCF, codiceCognome, codiceNome, carattereControllo, normalizzaCF }; })()`);

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

console.log("codicefiscale: tutti i controlli passati");
