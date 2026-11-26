// Logica del bot Telegram dello Sci Club (dalla 3.15, 26/11/2026), separata da index.ts perché si possa provare
// con node (test-logica.mjs) senza Telegram né database: `db` fa le letture, qui si decide cosa rispondere.
//   /start, /aiuto   i comandi
//   /liberi          i primi 10 numeri di tessera liberi
//   /telefono NOME   il telefono di un socio (cognome, o cognome e nome); scrivere solo il nome vale lo stesso
// Una chat non abilitata riceve il pulsante «Condividi il mio numero» (dal 26/11/2026): se il numero condiviso è
// di chi scrive ed è fra quelli abilitati (telegram_phones), la chat si abilita da sola. Altrimenti il bot dice solo
// il numero della chat, da dare all'amministratore.

const AIUTO = "Comandi:\n/liberi — i primi numeri di tessera liberi\n/telefono COGNOME NOME — il telefono di un socio "
  + "(basta anche solo il cognome, o scriverlo senza comando)";

/** Testo per il parse_mode HTML di Telegram: i nomi dei soci non diventano tag. */
export const esc = (t) => String(t ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * Il telefono come Telegram lo rende toccabile per chiamare (dalla 3.15.4): formato internazionale senza spazi.
 * Senza prefisso è italiano (+39); con + o 00 davanti il prefisso resta quello scritto; troppo corto, com'è.
 */
export function telefonoDaChiamare(telefono) {
  const scritto = String(telefono ?? "").trim();
  const cifre = scritto.replace(/\D/g, "");
  if (scritto.startsWith("+")) return "+" + cifre;
  if (cifre.startsWith("00")) return "+" + cifre.slice(2);
  if (cifre.length === 12 && cifre.startsWith("39")) return "+" + cifre;
  if (cifre.length >= 6 && cifre.length <= 11) return "+39" + cifre;
  return scritto;
}

function rigaSocio(s) {
  const nome = `${esc(s.last_name)} ${esc(s.first_name)}`.trim();
  const tessera = s.card_number ? `${esc(s.card_number)} · ` : "";
  const telefono = s.phone ? `<b>${esc(telefonoDaChiamare(s.phone))}</b>`
    : s.payer_phone ? `nessun telefono, paga ${esc(s.payer_name)}: <b>${esc(telefonoDaChiamare(s.payer_phone))}</b>` : "nessun telefono";
  return `${tessera}${nome} · ${telefono}${s.enrolled ? "" : " (non iscritto quest'anno)"}`;
}

/**
 * La risposta a un messaggio ({ chat, testo, mittente, contatto: { telefono, utente } }). `db`: { abilitata(chat),
 * abilitaDaTelefono(chat, telefono), liberi(quanti), cerca(testo), registra(chat, testo, abilitata) }.
 * Ritorna { testo } in HTML di Telegram, con `chiediContatto` quando va mostrato il pulsante del numero.
 */
export async function rispondi(messaggio, db) {
  return { testo: await testoRisposta(messaggio, db), ...(await chiediContatto(messaggio, db)) };
}

const chiediContatto = async ({ chat, contatto }, db) => (contatto || (await db.abilitata(chat)) ? {} : { chiediContatto: true });

async function testoRisposta({ chat, testo, mittente, contatto }, db) {
  if (contatto) {
    await db.registra(chat, "(numero condiviso)", false);
    // Telegram manda anche i contatti di altre persone: vale solo il numero di chi scrive.
    if (contatto.utente !== mittente) return "Condividi solo il tuo numero, col pulsante «Condividi il mio numero».";
    const chi = await db.abilitaDaTelefono(chat, contatto.telefono);
    return chi ? `Ciao ${esc(chi)}, ora puoi usare il bot.\n${AIUTO}`
      : `Il tuo numero non è fra quelli abilitati. Comunica all'amministratore dello Sci Club il numero della chat: ${chat}`;
  }
  const scritto = String(testo ?? "").trim();
  const ok = await db.abilitata(chat);
  await db.registra(chat, scritto.slice(0, 200), ok);
  if (!ok) {
    return "Questa chat non è abilitata. Tocca «Condividi il mio numero» qui sotto: se il tuo numero è fra quelli "
      + `abilitati dallo Sci Club, il bot si attiva. Oppure comunica all'amministratore il numero della chat: ${chat}`;
  }

  const [comando, ...resto] = scritto.split(/\s+/);
  const nome = comando.startsWith("/") ? resto.join(" ") : scritto;
  const cmd = comando.toLowerCase().replace(/@.*$/, "");   // «/liberi@NomeBot» nei gruppi
  if (cmd === "/start" || cmd === "/aiuto" || cmd === "/help" || !scritto) return AIUTO;
  if (cmd === "/liberi") {
    const numeri = await db.liberi(10);
    return numeri.length ? `Primi numeri di tessera liberi: <b>${numeri.join(", ")}</b>` : "Nessun numero di tessera libero.";
  }
  if (cmd.startsWith("/") && cmd !== "/telefono") return `Comando sconosciuto.\n${AIUTO}`;
  if (nome.replace(/[^\p{L}]/gu, "").length < 2) return "Scrivi almeno 2 lettere del cognome, per esempio: /telefono rossi";
  const soci = await db.cerca(nome);
  if (!soci.length) return `Nessun socio trovato per «${esc(nome)}».`;
  return soci.map(rigaSocio).join("\n") + (soci.length === 5 ? "\n(solo i primi 5: aggiungi il nome per restringere)" : "");
}

/**
 * Cancella su Telegram le risposte del bot più vecchie di `minuti` (dalla 3.15.3: contengono i telefoni dei soci).
 * `db.risposteScadute(minuti)` le toglie dal database e le restituisce ({ chat_id, message_id }); `telegram.cancella`
 * le cancella una per una. Una che non si cancella (tolta a mano, più vecchia di 48 ore) non ferma le altre.
 */
export async function pulisci(db, telegram, minuti = 10) {
  let cancellate = 0, errori = 0;
  for (const r of await db.risposteScadute(minuti)) {
    try {
      await telegram.cancella(r.chat_id, r.message_id);
      cancellate++;
    } catch {
      errori++;
    }
  }
  return { cancellate, errori };
}
