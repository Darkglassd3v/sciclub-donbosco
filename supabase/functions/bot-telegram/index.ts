// Bot Telegram dello Sci Club (dalla 3.15, 26/11/2026): Telegram manda qui ogni messaggio (webhook), la funzione
// risponde con i numeri di tessera liberi o il telefono di un socio. Cosa rispondere lo decide logica.js; qui solo
// Telegram e database.
//
// Sicurezza:
// - Telegram firma ogni chiamata con l'intestazione X-Telegram-Bot-Api-Secret-Token, uguale al segreto dato con
//   setWebhook (TELEGRAM_WEBHOOK_SECRET): senza, la chiamata non è di Telegram e si scarta.
// - La funzione legge il database con la service_role (SUPABASE_SERVICE_ROLE_KEY, messa da Supabase), ma solo per
//   le chat in telegram_users; le due funzioni del database del bot non le può chiamare nessun altro.
// - Ogni domanda resta in telegram_queries, anche quelle delle chat non abilitate.
//
// - Le risposte si cancellano da Telegram dopo 10 minuti (dalla 3.15.3): ognuna resta in telegram_replies e ogni
//   minuto un'attività pianificata del database (pg_cron) chiama questa funzione con l'intestazione
//   X-Pulizia-Bot uguale a TELEGRAM_CLEANUP_SECRET; la funzione cancella quelle scadute.
//
// Pubblicazione: senza verifica del JWT (Telegram non ne manda), con i segreti TELEGRAM_BOT_TOKEN,
// TELEGRAM_WEBHOOK_SECRET e TELEGRAM_CLEANUP_SECRET; vedi docs/TELEGRAM.md.

import { createClient } from "jsr:@supabase/supabase-js@2";
import { pulisci, rispondi } from "./logica.js";

const TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";
const SEGRETO = Deno.env.get("TELEGRAM_WEBHOOK_SECRET") ?? "";
const PULIZIA = Deno.env.get("TELEGRAM_CLEANUP_SECRET") ?? "";
const MINUTI = 10;   // dopo quanto si cancellano le risposte

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const db = {
  abilitata: async (chat: number) => {
    const { data, error } = await sb.from("telegram_users").select("chat_id").eq("chat_id", chat).maybeSingle();
    if (error) throw error;
    return Boolean(data);
  },
  liberi: async (quanti: number) => {
    const { data, error } = await sb.rpc("telegram_free_cards", { how_many: quanti });
    if (error) throw error;
    return data as number[];
  },
  cerca: async (testo: string) => {
    const { data, error } = await sb.rpc("telegram_phone_search", { query: testo });
    if (error) throw error;
    return data;
  },
  abilitaDaTelefono: async (chat: number, telefono: string) => {
    const { data, error } = await sb.rpc("telegram_enable_by_phone", { chat, phone: telefono });
    if (error) throw error;
    return data as string | null;
  },
  registra: async (chat: number, testo: string, abilitata: boolean) => {
    // Il registro non deve fermare la risposta: un errore qui si scrive solo nel log della funzione.
    const { error } = await sb.from("telegram_queries").insert({ chat_id: chat, text: testo, allowed: abilitata });
    if (error) console.error("registro del bot non scritto:", error.message);
  },
  ricordaRisposta: async (chat: number, messaggio: number) => {
    const { error } = await sb.from("telegram_replies").insert({ chat_id: chat, message_id: messaggio });
    if (error) console.error("risposta da cancellare non ricordata:", error.message);
  },
  risposteScadute: async (minuti: number) => {
    const { data, error } = await sb.rpc("telegram_take_due_replies", { older_than_minutes: minuti });
    if (error) throw error;
    return data as { chat_id: number; message_id: number }[];
  },
};

const telegram = {
  cancella: async (chat: number, messaggio: number) => {
    const r = await fetch(`https://api.telegram.org/bot${TOKEN}/deleteMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chat, message_id: messaggio }),
    });
    if (!r.ok) throw new Error(`deleteMessage ${r.status}: ${await r.text()}`);
  },
};

// Con `chiediContatto` sotto il messaggio il pulsante che manda il numero di chi lo tocca; con `menu` (chat abilitata,
// dalla 3.15.8) i pulsanti sempre visibili «Tessere libere» e «Numero di telefono»; senza, la tastiera sparisce.
async function manda(chat: number, testo: string, chiediContatto = false, menu?: string[]) {
  const tastiera = chiediContatto
    ? { keyboard: [[{ text: "Condividi il mio numero", request_contact: true }]], resize_keyboard: true, one_time_keyboard: true }
    : menu ? { keyboard: [menu.map((text) => ({ text }))], resize_keyboard: true, is_persistent: true }
    : { remove_keyboard: true };
  const r = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chat, text: testo, parse_mode: "HTML", disable_web_page_preview: true, reply_markup: tastiera }),
  });
  if (!r.ok) { console.error("risposta non mandata:", r.status, await r.text()); return; }
  // Ricordata per cancellarla dopo MINUTI minuti.
  const id = (await r.json())?.result?.message_id;
  if (typeof id === "number") await db.ricordaRisposta(chat, id);
}

Deno.serve(async (richiesta) => {
  if (richiesta.method !== "POST") return new Response("Metodo non ammesso.", { status: 405 });
  // La pulizia delle risposte scadute, chiamata ogni minuto dal database.
  if (richiesta.headers.has("X-Pulizia-Bot")) {
    if (!PULIZIA || richiesta.headers.get("X-Pulizia-Bot") !== PULIZIA) return new Response("Non autorizzato.", { status: 401 });
    try {
      return Response.json(await pulisci(db, telegram, MINUTI));
    } catch (errore) {
      console.error("pulizia:", errore);
      return new Response("Errore della pulizia.", { status: 500 });
    }
  }
  if (!SEGRETO || richiesta.headers.get("X-Telegram-Bot-Api-Secret-Token") !== SEGRETO) {
    return new Response("Non autorizzato.", { status: 401 });
  }
  let update;
  try { update = await richiesta.json(); } catch { return new Response("ok"); }
  const messaggio = update?.message;
  const chat = messaggio?.chat?.id;
  // Solo testo e numeri condivisi; il resto (foto, modifiche, entrate nei gruppi) si ignora.
  const contatto = messaggio?.contact
    ? { telefono: String(messaggio.contact.phone_number ?? ""), utente: messaggio.contact.user_id }
    : null;
  if (typeof chat !== "number" || (typeof messaggio?.text !== "string" && !contatto)) return new Response("ok");
  try {
    const r = await rispondi({ chat, testo: messaggio.text, mittente: messaggio.from?.id, contatto }, db);
    await manda(chat, r.testo, r.chiediContatto, r.menu);
  } catch (errore) {
    console.error("bot:", errore);
    await manda(chat, "Errore del sito, riprova fra poco.");
  }
  // Sempre 200: con un errore Telegram ripeterebbe lo stesso messaggio più volte.
  return new Response("ok");
});
