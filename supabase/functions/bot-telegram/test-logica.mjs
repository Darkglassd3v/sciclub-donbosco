// Prove della logica del bot Telegram (node supabase/functions/bot-telegram/test-logica.mjs): comandi, chat non
// abilitate, testi delle risposte. Il database e Telegram non ci sono: li sostituisce `db` finto.
import assert from "node:assert/strict";
import { rispondi, pulisci, telefonoDaChiamare } from "./logica.js";

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

// Abilitare col numero di telefono (26/11/2026): la chat non abilitata riceve il pulsante «Condividi il mio
// numero»; il numero condiviso, se è proprio di chi scrive e sta nella lista, abilita la chat.
db.abilitaDaTelefono = async (chat, telefono) => { chiamate.push(["abilita", chat, telefono]); return telefono === "393331234567" ? "MARIO" : null; };
let a = await rispondi({ chat: 7, testo: "/start" }, db);
assert.equal(a.chiediContatto, true);
assert.match(a.testo, /Condividi il mio numero/);
a = await rispondi({ chat: 7, mittente: 70, contatto: { telefono: "393331234567", utente: 99 } }, db);
assert.match(a.testo, /solo il tuo numero/);
assert.ok(!chiamate.some(([c]) => c === "abilita"), "contatto di un altro: abilitata la chat");
a = await rispondi({ chat: 7, mittente: 70, contatto: { telefono: "393331234567", utente: 70 } }, db);
assert.deepEqual(chiamate.find(([c]) => c === "abilita"), ["abilita", 7, "393331234567"]);
assert.match(a.testo, /Ciao MARIO/);
assert.match(a.testo, /\/liberi/);
a = await rispondi({ chat: 8, mittente: 80, contatto: { telefono: "3330000000", utente: 80 } }, db);
assert.match(a.testo, /non è fra quelli abilitati/);
assert.match(a.testo, /\b8\b/);
chiamate.length = 0;

// Chat non abilitata: dice solo il numero della chat, da dare all'amministratore, e non chiama il database.
let r = (await rispondi({ chat: 7, testo: "/liberi" }, db)).testo;
assert.match(r, /non è abilitata/);
assert.match(r, /\b7\b/);
assert.ok(!chiamate.some(([c]) => c === "liberi" || c === "cerca"), "chat non abilitata: interrogato il database");
assert.deepEqual(chiamate.at(-1), ["registra", 7, "/liberi", false]);

// /start e /aiuto: i comandi.
r = (await rispondi({ chat: 42, testo: "/start" }, db)).testo;
assert.match(r, /\/liberi/);
assert.match(r, /\/telefono/);

// /liberi: i primi 10 numeri liberi.
r = (await rispondi({ chat: 42, testo: "/liberi" }, db)).testo;
assert.deepEqual(chiamate.find(([c]) => c === "liberi"), ["liberi", 10]);
assert.match(r, /22, 25, 26/);

// /telefono con un cognome: righe con tessera, nome e telefono; senza telefono quello di chi paga.
r = (await rispondi({ chat: 42, testo: "/telefono rossi" }, db)).testo;
assert.deepEqual(chiamate.find(([c]) => c === "cerca"), ["cerca", "rossi"]);
assert.match(r, /21 · ROSSI MARIO · <b>\+393331111111<\/b>/);
assert.match(r, /ROSSI LUCA · nessun telefono, paga ROSSI MARIO: <b>\+393331111111<\/b>/);
assert.match(r, /non iscritto quest'anno/);

// Nome scritto senza comando: vale come /telefono. Nessun risultato e testo troppo corto.
r = (await rispondi({ chat: 42, testo: "nessuno" }, db)).testo;
assert.match(r, /Nessun socio/);
r = (await rispondi({ chat: 42, testo: "/telefono a" }, db)).testo;
assert.match(r, /almeno 2 lettere/);

// Il testo dei soci va in HTML di Telegram: niente tag dai nomi.
const sporco = { ...db, cerca: async () => [{ card_number: "1", last_name: "<b>X", first_name: "&Y", phone: "1", enrolled: true }] };
r = (await rispondi({ chat: 42, testo: "/telefono xx" }, sporco)).testo;
assert.ok(r.includes("&lt;b&gt;X &amp;Y"), r);

// Risposte cancellate dopo 10 minuti (dalla 3.15.3): la pulizia prende dal database le risposte scadute e le
// cancella su Telegram una per una; una che non si cancella (già tolta a mano, più di 48 ore) non ferma le altre.
const cancellate = [];
const esito = await pulisci(
  { risposteScadute: async (minuti) => { cancellate.push(["minuti", minuti]); return [{ chat_id: 42, message_id: 5 }, { chat_id: 42, message_id: 6 }, { chat_id: 7, message_id: 9 }]; } },
  { cancella: async (chat, id) => { if (id === 6) throw new Error("message to delete not found"); cancellate.push([chat, id]); } });
assert.deepEqual(cancellate, [["minuti", 10], [42, 5], [7, 9]]);
assert.deepEqual(esito, { cancellate: 2, errori: 1 });

// Telefoni da toccare per chiamare (dalla 3.15.4): Telegram li riconosce solo in formato internazionale e senza
// spazi; con un prefisso diverso da +39 il numero resta com'è scritto, senza spazi.
assert.equal(telefonoDaChiamare("333 1111111"), "+393331111111");
assert.equal(telefonoDaChiamare("336581527"), "+39336581527");
assert.equal(telefonoDaChiamare("+39 333 1111111"), "+393331111111");
assert.equal(telefonoDaChiamare("0039 333 1111111"), "+393331111111");
assert.equal(telefonoDaChiamare("393331111111"), "+393331111111");
assert.equal(telefonoDaChiamare("0141 123456"), "+390141123456");
assert.equal(telefonoDaChiamare("+41 79 123 45 67"), "+41791234567");
assert.equal(telefonoDaChiamare("0041 79 123 45 67"), "+41791234567");
assert.equal(telefonoDaChiamare("12"), "12");

console.log("bot telegram: logica a posto");
