// Prove della logica del bot Telegram (node supabase/functions/bot-telegram/test-logica.mjs): comandi, chat non
// abilitate, testi delle risposte. Il database e Telegram non ci sono: li sostituisce `db` finto.
import assert from "node:assert/strict";
import { rispondi } from "./logica.js";

const chiamate = [];
const db = {
  abilitata: async (chat) => chat === 42,
  liberi: async (quanti) => { chiamate.push(["liberi", quanti]); return [22, 25, 26]; },
  cerca: async (testo) => {
    chiamate.push(["cerca", testo]);
    if (testo === "nessuno") return [];
    return [{ card_number: "21", last_name: "ROSSI", first_name: "MARIO", phone: "333 1111111", payer_name: null, payer_phone: null, enrolled: true },
      { card_number: null, last_name: "ROSSI", first_name: "LUCA", phone: null, payer_name: "ROSSI MARIO", payer_phone: "333 1111111", enrolled: false }];
  },
  registra: async (chat, testo, ok) => chiamate.push(["registra", chat, testo, ok]),
};

// Chat non abilitata: dice solo il numero della chat, da dare all'amministratore, e non chiama il database.
let r = await rispondi({ chat: 7, testo: "/liberi" }, db);
assert.match(r, /non è abilitata/);
assert.match(r, /\b7\b/);
assert.ok(!chiamate.some(([c]) => c === "liberi" || c === "cerca"), "chat non abilitata: interrogato il database");
assert.deepEqual(chiamate.at(-1), ["registra", 7, "/liberi", false]);

// /start e /aiuto: i comandi.
r = await rispondi({ chat: 42, testo: "/start" }, db);
assert.match(r, /\/liberi/);
assert.match(r, /\/telefono/);

// /liberi: i primi 10 numeri liberi.
r = await rispondi({ chat: 42, testo: "/liberi" }, db);
assert.deepEqual(chiamate.find(([c]) => c === "liberi"), ["liberi", 10]);
assert.match(r, /22, 25, 26/);

// /telefono con un cognome: righe con tessera, nome e telefono; senza telefono quello di chi paga.
r = await rispondi({ chat: 42, testo: "/telefono rossi" }, db);
assert.deepEqual(chiamate.find(([c]) => c === "cerca"), ["cerca", "rossi"]);
assert.match(r, /21 · ROSSI MARIO · <b>333 1111111<\/b>/);
assert.match(r, /ROSSI LUCA · nessun telefono, paga ROSSI MARIO: <b>333 1111111<\/b>/);
assert.match(r, /non iscritto quest'anno/);

// Nome scritto senza comando: vale come /telefono. Nessun risultato e testo troppo corto.
r = await rispondi({ chat: 42, testo: "nessuno" }, db);
assert.match(r, /Nessun socio/);
r = await rispondi({ chat: 42, testo: "/telefono a" }, db);
assert.match(r, /almeno 2 lettere/);

// Il testo dei soci va in HTML di Telegram: niente tag dai nomi.
const sporco = { ...db, cerca: async () => [{ card_number: "1", last_name: "<b>X", first_name: "&Y", phone: "1", enrolled: true }] };
r = await rispondi({ chat: 42, testo: "/telefono xx" }, sporco);
assert.ok(r.includes("&lt;b&gt;X &amp;Y"), r);

console.log("bot telegram: logica a posto");
