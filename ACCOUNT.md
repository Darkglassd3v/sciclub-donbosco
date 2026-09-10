# Account e servizi da creare — Sci Club Don Bosco 2.0

Elenco di tutti gli account necessari per far funzionare la versione 2.0, con costi reali e chi deve possederli.

**Tutto quello che serve è gratuito.** I piani a pagamento sono segnalati solo dove esiste un limite che potrebbe essere raggiunto.

---

## Riepilogo

| # | Servizio | A cosa serve | Costo | Quanti account |
|---|---|---|---|---|
| 1 | GitHub | ospita il codice e pubblica il sito | gratis | 1 (già esistente) |
| 2 | Supabase | database dei soci | gratis | 1 per il club |
| 3 | Utenti Supabase | accesso alle pagine | gratis | 1 per persona del direttivo |
| 4 | Dominio (opzionale) | indirizzo personalizzato | ~10 €/anno | 1 |
| 5 | Resend (opzionale) | invio email di riepilogo | gratis fino a 3.000/mese | 1 |

> **Regola generale:** gli account 1 e 2 andrebbero intestati a un indirizzo email **del club**
> (es. `sciclubdonbosco@gmail.com`), non a una persona singola. Se sono legati all'account
> personale di qualcuno e quella persona lascia il club, si perde l'accesso a tutto.

---

## 1. GitHub — codice e pubblicazione del sito

**Esiste già:** `github.com/Darkglassd3v/sciclub-donbosco`

Non serve creare nulla di nuovo, ma vanno fatte due configurazioni una tantum.

### 1a. Attivare GitHub Pages

1. Aprire il repository su GitHub.
2. **Settings** > **Pages** (menu di sinistra).
3. In *Build and deployment* > *Source*, selezionare **GitHub Actions**.
4. Salvare.

Da questo momento, ogni modifica alla cartella `web/` sul branch `2.0` pubblica automaticamente il sito. L'indirizzo sarà:

```
https://darkglassd3v.github.io/sciclub-donbosco/
```

### 1b. (Opzionale) Variabili con le chiavi Supabase

Se si preferisce non scrivere le chiavi dentro `web/config.js`:

1. **Settings** > **Secrets and variables** > **Actions** > scheda **Variables**.
2. **New repository variable**, due volte:
   - `SUPABASE_URL` → l'URL del progetto (Passo 2)
   - `SUPABASE_ANON_KEY` → la chiave anon (Passo 2)

Il workflow di deploy genera `config.js` da queste variabili.

> ⚠️ **Attenzione, il repository è pubblico.** Chiunque può leggere il codice. Va bene per
> il codice e per la chiave `anon` (che è pubblica per progettazione), ma **non** vanno mai
> caricati i fogli Excel dei soci né il file `migration_seed.sql`: contengono anagrafiche
> reali. Il `.gitignore` li blocca già, ma è bene saperlo.
>
> Se in futuro si volesse rendere il repository privato: *Settings > General > Danger Zone >
> Change visibility*. Attenzione però che **GitHub Pages su repository privato richiede un
> piano a pagamento** (GitHub Pro, circa 4 $/mese), quindi il sito smetterebbe di essere
> pubblicato.

---

## 2. Supabase — il database

**Chi lo crea:** una persona del direttivo, usando l'email del club.

1. Andare su [supabase.com](https://supabase.com) e premere **Start your project**.
2. Registrarsi. Si può usare "Continue with GitHub" (comodo: stesso account del punto 1) oppure email e password.
3. Creare una **New organization**: nome `Sci Club Don Bosco`, tipo *Personal*, piano **Free**.
4. Creare un **New project**:
   - **Name:** `sciclub-donbosco`
   - **Database Password:** generarne una robusta e **salvarla subito** in un gestore di password. Serve per caricare i dati e non è più recuperabile in chiaro dopo.
   - **Region:** `Central EU (Frankfurt)` — dati in Europa, più corretto sotto GDPR e più veloce dall'Italia.
   - **Pricing plan:** Free
5. Attendere circa 2 minuti che il progetto sia pronto.

### Dove trovare le chiavi

**Project Settings** (ingranaggio) > **API**:

| Valore | Dove si usa | Pubblico? |
|---|---|---|
| **Project URL** | `web/config.js` | sì, può stare nel codice |
| **anon public** | `web/config.js` | sì, è pensata per il browser |
| **service_role** | **da non usare mai nelle pagine web** | **NO, è un segreto** |

> 🔒 La chiave `service_role` scavalca tutte le regole di sicurezza: chi ce l'ha può leggere e
> modificare qualsiasi dato. Non va messa in `config.js`, non va committata, non va condivisa
> in chat. Serve solo per operazioni amministrative dalla dashboard.

### Limiti del piano gratuito

| Limite | Valore | La nostra situazione |
|---|---|---|
| Spazio database | 500 MB | ~6.000 anagrafiche occupano pochi MB: ampiamente sufficiente |
| Utenti registrati | 50.000 | ne servono meno di 10 |
| Traffico | 5 GB/mese | largamente sufficiente |
| **Sospensione per inattività** | **dopo 7 giorni senza attività** | ⚠️ vedi sotto |

> ⚠️ **Progetti inattivi:** un progetto gratuito che non riceve richieste per 7 giorni viene
> messo in pausa. Non si perde nulla — si riattiva con un clic dalla dashboard — ma il sito
> resta irraggiungibile finché non lo si riattiva. Considerato che lo sci club è stagionale,
> è normale che d'estate il progetto vada in pausa: basta riattivarlo a settembre. Chi vuole
> evitarlo può passare al piano Pro (25 $/mese), ma per l'uso del club non ne vale la pena.

### Backup

Il piano gratuito **non** include backup automatici. Consiglio: una volta al mese, e comunque a fine stagione, fare un export manuale dalla dashboard (**Database** > **Backups**, oppure *Table Editor* > tabella `soci` > *Export to CSV*) e salvarlo su Drive. Il CSV si apre in Excel, quindi resta tutto esportabile come prima.

---

## 3. Utenti del direttivo — chi può accedere alle pagine

Le pagine non sono aperte al pubblico: senza login non si vede nulla. Non esiste registrazione
autonoma, gli account li crea l'amministratore.

**Per ogni persona del direttivo che deve usare il gestionale:**

1. Dashboard Supabase > **Authentication** > **Users**.
2. **Add user** > **Create new user**.
3. Inserire email e una password iniziale.
4. Spuntare **Auto Confirm User** (altrimenti la persona resta in attesa di una conferma via email che il piano gratuito non invia).
5. Comunicare le credenziali alla persona e chiederle di cambiarle al primo accesso.

Quante persone: una per ciascun volontario che inserisce iscrizioni o incassa pagamenti. Non serve creare account per i soci: i soci non accedono al sistema.

### Chi vede cosa

Al momento **tutti gli utenti autenticati hanno gli stessi permessi**: possono leggere e modificare tutte le anagrafiche e tutti i pagamenti. È lo stesso livello della versione precedente, dove chiunque avesse il link e un account Google autorizzato poteva fare tutto.

Se in futuro servisse distinguere i ruoli (es. chi inserisce iscrizioni ma non tocca gli incassi), si fa modificando le policy in `supabase/schema.sql`. Non è previsto in questa prima versione.

### Se qualcuno lascia il direttivo

**Authentication** > **Users** > selezionare l'utente > **Delete user**. L'accesso viene revocato subito.

---

## 4. Dominio personalizzato (opzionale)

Serve solo se l'indirizzo `darkglassd3v.github.io/sciclub-donbosco` non piace e se ne vuole uno tipo `sciclubdonbosco.it`.

1. Comprare il dominio (Cloudflare Registrar, Namecheap, Aruba: 10–15 €/anno per un `.it`).
2. Su GitHub: **Settings** > **Pages** > **Custom domain**, inserire il dominio e salvare.
3. Dal pannello del registrar, creare i record DNS indicati da GitHub.
4. Attendere la propagazione (da pochi minuti a qualche ora) e spuntare **Enforce HTTPS**.

Il certificato HTTPS è gratuito e automatico.

---

## 5. Resend — email di riepilogo (opzionale)

Serve **solo** se si vuole reintrodurre l'email di riepilogo iscrizione che inviava la versione 1.x
(funzione `sendSummaryEmail`). Nella 2.0 non è implementata.

Nota: nella 1.x l'email arrivava sempre e solo a un indirizzo fisso, quindi vale la pena
chiedersi se serva davvero prima di aggiungere un altro servizio.

Se serve:

1. Registrarsi su [resend.com](https://resend.com) — piano gratuito: 3.000 email/mese, 100/giorno.
2. Verificare un dominio mittente (richiede il punto 4) oppure usare il dominio di prova.
3. Creare una **API key** e salvarla in Supabase come segreto (**Edge Functions** > **Secrets**), mai nel codice delle pagine.
4. Scrivere una Edge Function che invia l'email. Da sviluppare: non è inclusa in questo branch.

---

## Ordine consigliato

1. **Supabase** (punto 2) — crea progetto, esegui `supabase/schema.sql`, carica i dati (vedi `MIGRAZIONE_2.0.md`).
2. **Utenti** (punto 3) — almeno il proprio, per poter provare.
3. **Chiavi in `config.js`** — copia URL e chiave anon.
4. **Prova in locale:** `cd web && python3 -m http.server 8000`, poi apri `http://localhost:8000/login.html`.
5. **GitHub Pages** (punto 1a) — solo quando in locale funziona tutto.
6. Dominio ed email: dopo, se servono.

---

## Password e credenziali: dove tenerle

Servono almeno tre credenziali importanti:

- account GitHub del club
- account Supabase del club
- password del database Supabase

Non vanno tenute in un file di testo sul computer né mandate su WhatsApp. Un gestore di password
gratuito (Bitwarden, o il portachiavi del browser) con accesso condiviso tra due persone del
direttivo è la soluzione più semplice — così se una persona non è raggiungibile, il club non
resta chiuso fuori dai propri dati.
