# Bot Telegram dello Sci Club

Dalla 3.15 (26/11/2026) i volontari abilitati chiedono a un bot Telegram:

- `/liberi`: i primi 10 numeri di tessera liberi, contati dal numero delle Impostazioni (`card_gaps_from`) in su,
  come nella pagina Soci;
- `/telefono COGNOME NOME` (o solo il cognome, o scritto senza comando): fino a 5 soci con tessera e telefono; chi
  non ha un telefono suo ha quello di chi paga per lui. Prima gli iscritti di quest'anno.

Le risposte del bot si **cancellano da sole dopo 10 minuti** (dalla 3.15.3): contengono i telefoni dei soci e
non devono restare sui telefoni dei volontari.

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
  `telegram_phone_search()` e `telegram_take_due_replies()`. Né le pagine né gli utenti del sito
  possono leggerle o chiamarle: solo la funzione del bot (`supabase/test_ruoli.sh`).

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
       body := '{}'::jsonb)
     where exists (select 1 from public.telegram_replies where sent_at < now() - interval '10 minutes');
   $$);
   ```

   La funzione si chiama solo quando c'è qualcosa da cancellare. Telegram lascia cancellare a un bot i suoi
   messaggi fino a 48 ore dopo: se la pulizia resta ferma più a lungo, quelle risposte vanno tolte a mano.

## Abilitare un volontario

**Col numero di telefono** (il modo normale): il superadmin mette il numero nella lista, una volta sola, dall'SQL
Editor (solo cifre, senza +39):

```sql
insert into public.telegram_phones (phone, name) values ('3331234567', 'Nome del volontario');
```

Il volontario scrive `/start` al bot e tocca **«Condividi il mio numero»**: Telegram manda al bot il suo numero
(solo il suo, verificato da Telegram) e, se è in lista, la chat si abilita da sola. Per togliere un numero:
`delete from public.telegram_phones where phone = '3331234567';` (e la sua chat da `telegram_users`, sotto).

**Con il numero della chat**, per chi non vuole condividere il telefono: il volontario scrive `/start` e riceve il
numero della sua chat. Il superadmin lo abilita dall'SQL Editor:

```sql
insert into public.telegram_users (chat_id, name) values (123456789, 'Nome del volontario');
```

Per togliere l'accesso: `delete from public.telegram_users where chat_id = 123456789;`.
Le domande fatte restano in `telegram_queries` (chat, testo, abilitata o no, quando).

## Privacy

Il bot manda i telefoni dei soci su Telegram, cioè sui server di Telegram e sui telefoni dei volontari: si
abilitano solo le chat di chi ne ha bisogno, si tolgono quando non serve più, e il bot non dà mai codice fiscale,
indirizzo o email.
