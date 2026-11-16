# Fuga di dati personali: cosa fare

Procedura dello Sci Club Don Bosco Asti per le violazioni di dati personali («data breach»), secondo gli
articoli 33 e 34 del Regolamento UE 2016/679 (GDPR) e le indicazioni del Garante per la protezione dei
dati personali (pagina «Data Breach» del Garante, consultata il 16/11/2026). Vale per l'associazione
anche se è piccola e senza dipendenti: il titolare del trattamento è l'associazione, rappresentata dal
presidente.

Qui non ci sono nomi né recapiti personali, perché il repository è pubblico: chi ricopre i ruoli citati
(presidente, chi segue il sito, segreteria) è scritto nel verbale del direttivo e nel KeePass di chi
segue il sito.

## Che cos'è una fuga di dati

Ogni incidente per cui dati personali di soci, familiari o contatti vengono **visti o presi da chi non
doveva**, **persi**, **cancellati** o **modificati** senza permesso, per errore o per un attacco. Esempi
che possono capitare al club:

- un'email con l'elenco dei soci inviata ai destinatari in chiaro (in «A» o «Cc» invece che in «Ccn»),
  o inviata alla persona sbagliata;
- un file Excel esportato dal gestionale (soci, pagamenti, liste per l'assicurazione) condiviso in un
  gruppo WhatsApp, su Drive con un link aperto a tutti, o lasciato su un PC non del club;
- un telefono o un PC perso o rubato con l'accesso al gestionale aperto, o con file esportati;
- la password di un volontario, dell'account Google del club o dell'amministrazione di WordPress
  scoperta da altri (phishing, password riusata);
- la chiave `service_role` di Supabase finita in un posto pubblico (il repository, una chat, una
  pagina web): permette di leggere e modificare tutto il database;
- il sito WordPress violato, o i dati del gestionale cancellati o alterati da qualcuno senza permesso;
- un backup del database finito in mano ad altri insieme alla frase che lo apre.

Dati che teniamo, e perché una fuga può essere grave: cognome e nome, data e luogo di nascita,
**codice fiscale**, indirizzo, telefono, email, tessera, iscrizioni, pagamenti e note; tra i soci ci sono
anche **minorenni**. Codice fiscale e data di nascita insieme permettono furti d'identità e truffe, quindi
una fuga dell'anagrafica completa va considerata quasi sempre **a rischio** e spesso **a rischio
elevato**.

## Le prime ore: cosa fa chi se ne accorge

Chiunque nel club si accorga di una fuga di dati, o anche solo la sospetti:

1. **Avvisa subito** il presidente e chi segue il sito, per telefono e poi per scritto (email o
   WhatsApp), con: che cosa è successo, quando, quali dati, quante persone, come se n'è accorto.
   Dal momento in cui il club ne viene a conoscenza partono le **72 ore** per la notifica al Garante.
2. **Non cancella le tracce**: niente cancellazione di email, messaggi o file prima di averne fatto una
   copia o uno screenshot con data e ora. Servono per capire cosa è successo e per il registro.
3. **Ferma la fuga, se può farlo da solo**: chiede a chi ha ricevuto un'email sbagliata di cancellarla
   e di confermarlo per scritto; toglie il file dal gruppo o dal link condiviso; cambia la propria
   password se pensa che sia stata scoperta.

## Contenere: cosa fa chi segue il sito

Secondo il caso, il prima possibile e annotando ogni azione con data e ora:

- **Password o accessi di un volontario**: dal gestionale togliere i permessi o bloccare l'utente, e
  farlo uscire da tutti i dispositivi (in Supabase: Authentication › Users › l'utente). Fargli cambiare
  la password.
- **Chiave `service_role` o altre chiavi di Supabase esposte**: rigenerarle subito nel pannello del
  progetto (Project Settings › API Keys) e aggiornare i segreti dove sono usate (per esempio GitHub ›
  Settings › Secrets). La chiave `anon` è pubblica per progettazione e da sola non basta a
  leggere i dati, grazie alle regole di sicurezza (RLS) attive su tutte le tabelle.
- **Password del database esposta**: cambiarla nel pannello di Supabase e aggiornare
  `supabase/.postgre_connect`, i segreti di GitHub e i backup automatici. Solo in questo caso: senza
  esposizione la password resta quella decisa.
- **Account Google del club o amministrazione di WordPress**: cambiare la password, chiudere le sessioni
  aperte, controllare le regole di inoltro della posta e gli utenti amministratori di WordPress; in
  WordPress fare una scansione con Wordfence e, se il sito è stato modificato, ripristinarlo con
  UpdraftPlus.
- **Dati cancellati o alterati nel gestionale**: rimetterli dal backup più recente (`docs/BACKUP.md`).
- **Registri da salvare subito**: sul piano gratuito di Supabase i log (Logs › API, Auth, Postgres)
  restano disponibili per poco tempo, circa un giorno: esportarli o fotografarli prima di tutto il resto.

## Valutare il rischio e decidere entro 72 ore

Il presidente e chi segue il sito, insieme, entro le 72 ore:

1. Ricostruiscono **che dati**, **di quante persone** (soci adulti, minorenni), **chi può averli visti**
   e **se la fuga è finita**.
2. Usano lo **strumento di autovalutazione** del Garante su <https://servizi.gpdp.it/databreach/s/>, che
   indica quali azioni sono richieste.
3. Decidono:
   - **Nessun rischio probabile** per le persone (per esempio un file cifrato perso insieme alla sua
     frase rimasta al sicuro, o un'email sbagliata cancellata subito da un altro volontario del club):
     **non si notifica**, ma si scrive nel registro, con il motivo della decisione.
   - **Rischio** (per esempio anagrafica con codice fiscale vista da estranei): **si notifica al
     Garante** entro 72 ore.
   - **Rischio elevato** (per esempio codici fiscali, indirizzi o dati di minorenni pubblicati o presi
     da un attacco): **si notifica al Garante e si avvisano le persone coinvolte**.

Nel dubbio si notifica: una notifica in più non è un errore, una mancata notifica sì.

## Notificare al Garante

- Dal 1° luglio 2021 la notifica si fa **solo con la procedura telematica** del Garante:
  <https://servizi.gpdp.it/databreach/s/>. Nella stessa pagina c'è un facsimile da guardare prima, che
  però **non** va usato per notificare.
- La fa il presidente, come rappresentante del titolare, o un delegato con le sue istruzioni.
- Termine: **senza ingiustificato ritardo e, ove possibile, entro 72 ore** dalla scoperta. Se si supera
  il termine, la notifica va fatta lo stesso e deve **spiegare i motivi del ritardo**.
- Se non si sa ancora tutto, si notifica con quello che si sa e si completa dopo con una notifica
  integrativa.
- Si conserva la ricevuta della notifica insieme al registro.

## Avvisare le persone coinvolte

Se il rischio è elevato, il club avvisa ogni persona coinvolta (per i minorenni chi esercita la
responsabilità genitoriale) **senza ingiustificato ritardo**, con un linguaggio semplice, per email o di
persona, una per una e mai con un messaggio che mostri gli altri destinatari. Il messaggio dice:

- che cosa è successo e quali dati di quella persona sono coinvolti;
- che cosa ha già fatto il club per fermare la fuga;
- che cosa può fare la persona (per esempio fare attenzione a email, telefonate o messaggi che chiedono
  dati o pagamenti a nome del club o di altri; controllare i propri conti);
- a chi rivolgersi nel club per domande.

Non serve avvisare le persone se il club ha già preso misure che rendono improbabile il rischio elevato
(per esempio i dati erano cifrati e la chiave non è uscita), ma la decisione va scritta nel registro.

## Il registro delle violazioni

Ogni fuga di dati va scritta nel registro, **anche quando non si notifica**: il Garante può chiederlo.
Il registro **non** sta in questo repository (è pubblico): è un foglio nella cartella riservata del
direttivo su Google Drive, condiviso solo con presidente e chi segue il sito. Per ogni violazione:

| Campo | Cosa scrivere |
|---|---|
| Data e ora della scoperta | e chi se n'è accorto |
| Che cosa è successo | in parole semplici, con data e ora dell'incidente se diversa |
| Dati e persone coinvolte | tipo di dati, numero di persone, se ci sono minorenni |
| Conseguenze probabili | per le persone coinvolte |
| Azioni fatte | per fermare la fuga e rimediare, con data e ora |
| Decisione | notificata al Garante sì o no, persone avvisate sì o no, e perché |
| Notifica | data, ora e numero di protocollo della ricevuta, o motivo del ritardo |
| Cosa cambiamo | perché non succeda più |

## Per evitare che succeda

- Le email a più soci si mandano sempre con i destinatari in **Ccn**.
- I file esportati dal gestionale non si mandano nei gruppi WhatsApp e non si condividono con link
  aperti: si condividono su Drive solo con le persone che servono, e si cancellano quando non servono
  più.
- Ogni volontario ha il suo accesso con i soli permessi che gli servono (Gestione › Ruoli); quando
  lascia l'incarico i permessi si tolgono.
- La chiave `service_role` e la frase dei backup non si scrivono in chat, email o file del repository.
- Una volta all'anno, a inizio stagione, il direttivo rilegge questa procedura e il registro.
