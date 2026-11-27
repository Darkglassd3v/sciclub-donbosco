# Bot Telegram dello Sci Club

Dalla 3.15 (26/11/2026) i volontari abilitati chiedono a un bot Telegram. Dalla 3.15.8 non servono comandi: sotto la
chat ci sono sempre due pulsanti, **Tessere libere** e **Numero di telefono** (che chiede poi cognome e nome); i comandi
restano:

- `/liberi`: i primi 10 numeri di tessera liberi, contati dal numero delle Impostazioni (`card_gaps_from`) in su,
  come nella pagina Soci;
- `/telefono COGNOME NOME` (o solo il cognome, o scritto senza comando): fino a 5 soci con tessera e telefono; chi
  non ha un telefono suo ha quello di chi paga per lui. Prima gli iscritti di quest'anno. I telefoni sono scritti in formato internazionale
  (`+39…`, senza spazi; dalla 3.15.4): così Telegram li rende toccabili per chiamare.

Dopo **10 minuti** si cancellano da soli i messaggi del volontario (i cognomi cercati) e le risposte con i telefoni
dei soci (dalla 3.15.3, i messaggi del volontario dalla 3.15.9): i telefoni non devono restare sui telefoni dei
volontari. Le altre risposte (benvenuto, tessere libere, «Scrivi il cognome…») restano: con l'ultima restano anche i
pulsanti, che Telegram toglie insieme al messaggio che li ha mostrati.

Chi non è abilitato riceve il pulsante «Condividi il mio numero»: se il suo numero è fra quelli della lista
(`telegram_phones`), il bot si attiva da solo; altrimenti gli dice il numero della sua chat, da comunicare all'amministratore.

## Come funziona

```
Telegram → webhook → Edge Function bot-telegram → database (sola lettura, più il registro e le risposte mandate)
pg_cron, ogni minuto → Edge Function bot-telegram (X-Pulizia-Bot) → deleteMessage delle risposte di più di 10 minuti
```

- `supabase/functions/bot-telegram/index.ts`: riceve i messaggi, controlla il segreto del webhook, legge il
  database con la service_role e risponde. Cosa rispondere lo decide `logica.js`, provato con
  `node supabase/functions/bot-telegram/test-logica.mjs` (anche nella CI).
- Database (`schema.sql`, in fondo): `telegram_users` (le chat abilitate), `telegram_queries` (il registro di
  tutte le domande), `telegram_replies` (le risposte da cancellare), `telegram_free_cards()`,
  `telegram_phone_search()` e `telegram_take_due_replies()`. Le funzioni e le risposte da cancellare le usa
  solo la funzione del bot. Dalla 3.16 numeri e chat abilitati, e il registro in sola lettura, li vede anche il
  superadmin dalla pagina «Bot Telegram»; gli altri utenti del sito non vedono nessuna riga
  (`supabase/test_ruoli.sh`).
- A ogni messaggio, anche /start e i pulsanti, il bot verifica in `telegram_users` che la chat sia abilitata
  prima di rispondere: tolto l'accesso, il messaggio successivo non riceve più dati.

## Pubblicazione (una volta sola)

Servono, fuori da git e mai incollati in chat:

- il token del bot, da @BotFather, in `~/.config/telegram/sciclub_bot_token`;
- un token personale di Supabase (https://supabase.com/dashboard/account/tokens) in
  `~/.config/supabase/access_token`.

Poi:

1. segreti della funzione: `TELEGRAM_BOT_TOKEN` (il token del bot) e `TELEGRAM_WEBHOOK_SECRET` (una stringa
   casuale, la stessa del punto 3);
2. pubblicazione della funzione `bot-telegram` **senza verifica del JWT** (Telegram non lo manda; il controllo è
   il segreto del webhook);
3. `setWebhook` di Telegram verso `https://<progetto>.supabase.co/functions/v1/bot-telegram` con
   `secret_token` uguale a `TELEGRAM_WEBHOOK_SECRET` e `allowed_updates: ["message"]`.

4. pulizia delle risposte (dalla 3.15.3): segreto della funzione `TELEGRAM_CLEANUP_SECRET` (una stringa casuale),
   la stessa nel Vault del database, e l'attività pianificata, dall'SQL Editor:

   ```sql
   create extension if not exists pg_net;
   create extension if not exists pg_cron;
   select vault.create_secret('<TELEGRAM_CLEANUP_SECRET>', 'telegram_cleanup_secret');
   select cron.schedule('bot-telegram-pulizia', '* * * * *', $$
     select net.http_post(
       url := 'https://<progetto>.supabase.co/functions/v1/bot-telegram',
       headers := jsonb_build_object('Content-Type', 'application/json', 'X-Pulizia-Bot',
         (select decrypted_secret from vault.decrypted_secrets where name = 'telegram_cleanup_secret')),
       body := '{}'::jsonb,
       timeout_milliseconds := 30000)   -- la funzione appena pubblicata può metterci più di 5 secondi
     where exists (select 1 from public.telegram_replies where sent_at < now() - interval '10 minutes');
   $$);
   ```

   La funzione si chiama solo quando c'è qualcosa da cancellare. Telegram lascia cancellare a un bot i suoi
   messaggi fino a 48 ore dopo: se la pulizia resta ferma più a lungo, quelle risposte vanno tolte a mano.

## Abilitare un volontario

Dalla 3.16 si fa dal sito, nella pagina **Gestione › Bot Telegram** (`web/bot.html`), che vede solo il superadmin.

**Col numero di telefono** (il modo normale): in «Numeri abilitati» si scrivono cognome, nome e cellulare e si
preme «Aggiungi numero» (il numero si salva in sole cifre, senza +39). Il volontario scrive `/start` al bot e tocca
**«Condividi il mio numero»**: Telegram manda al bot il suo numero (solo il suo, verificato da Telegram) e, se è in
lista, la chat si abilita da sola e ricorda con quale numero è entrata (`telegram_users.phone`).

**Con il numero della chat**, per chi non vuole condividere il telefono: il volontario scrive `/start` e riceve il
numero della sua chat, che il superadmin inserisce in «Chat attive» con «Aggiungi col numero della chat».

**Togliere l'accesso**: «Togli» accanto al numero, oppure «Togli accesso» accanto alla chat, con due conferme.
Togliendo il numero si toglie anche la chat entrata con quel numero (cancellazione a cascata); per una chat entrata
col numero, «Togli accesso» toglie il numero, altrimenti basterebbe condividerlo di nuovo per rientrare.

In «Ultime domande» ci sono le ultime 50 domande arrivate al bot (chi, testo, risposta data o chat non abilitata,
quando). Il registro completo resta in `telegram_queries`.

## Privacy

Il bot manda i telefoni dei soci su Telegram, cioè sui server di Telegram e sui telefoni dei volontari: si
abilitano solo le chat di chi ne ha bisogno, si tolgono quando non serve più, e il bot non dà mai codice fiscale,
indirizzo o email.
