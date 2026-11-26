// Logica del bot Telegram dello Sci Club (dalla 3.15, 26/11/2026), separata da index.ts perché si possa provare
// con node (test-logica.mjs) senza Telegram né database: `db` fa le letture, qui si decide cosa rispondere.
//   /start, /aiuto   i comandi
//   /liberi          i primi 10 numeri di tessera liberi
//   /telefono NOME   il telefono di un socio (cognome, o cognome e nome); scrivere solo il nome vale lo stesso
// Una chat non abilitata riceve solo il suo numero, da dare all'amministratore che la abilita.

const AIUTO = "Comandi:\n/liberi — i primi numeri di tessera liberi\n/telefono COGNOME NOME — il telefono di un socio "
  + "(basta anche solo il cognome, o scriverlo senza comando)";

/** Testo per il parse_mode HTML di Telegram: i nomi dei soci non diventano tag. */
export const esc = (t) => String(t ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function rigaSocio(s) {
  const nome = `${esc(s.last_name)} ${esc(s.first_name)}`.trim();
  const tessera = s.card_number ? `${esc(s.card_number)} · ` : "";
  const telefono = s.phone ? `<b>${esc(s.phone)}</b>`
    : s.payer_phone ? `nessun telefono, paga ${esc(s.payer_name)}: <b>${esc(s.payer_phone)}</b>` : "nessun telefono";
  return `${tessera}${nome} · ${telefono}${s.enrolled ? "" : " (non iscritto quest'anno)"}`;
}

/**
 * La risposta a un messaggio ({ chat, testo }). `db`: { abilitata(chat), liberi(quanti), cerca(testo),
 * registra(chat, testo, abilitata) }. Ritorna il testo da mandare, in HTML di Telegram.
 */
export async function rispondi({ chat, testo }, db) {
  const scritto = String(testo ?? "").trim();
  const ok = await db.abilitata(chat);
  await db.registra(chat, scritto.slice(0, 200), ok);
  if (!ok) return `Questa chat non è abilitata. Comunica all'amministratore dello Sci Club il numero della chat: ${chat}`;

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
