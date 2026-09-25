# Ripresa lavori — aggiornato il 2026-09-24 (2.5-SNAPSHOT)

## Fatto nella 2.5-SNAPSHOT (schema applicato in produzione il 2026-09-24)

- release **2.4** chiusa: branch e tag `2.4` su `f35797e`, workflow Pages su `["2.4", "2.5-SNAPSHOT"]`
- **ruoli per funzione** al posto della scala: `superadmin`, `admin`, `tesoriere`, `assicurazione`,
  `gite` (a schermo "Utente"), `social`. Permessi in `role_permissions()`, controllo `can()` in tutte
  le policy, `my_access()` per le pagine; niente più `ospite` e `kiosk` (account nuovo = senza riga
  profiles = senza accesso; `kiosk_search()` e la ricerca a parole intere tolte)
- tesoriere incassa senza modificare i soci (`settle_household` security definer); polizza scritta
  solo con il permesso polizze (trigger `check_policy_number`); pannello gite con `use_trip`,
  `cancel_trip`, `add_pass` security definer (il ruolo gite legge i soci ma non li modifica)
- **Vedi come** per il superadmin (`profiles.view_as`, `set_view_as()`), fascia gialla su ogni pagina
- **un solo ingresso**: la radice → login → pagina del ruolo (`PAGINE_DI_ARRIVO` in `web/shared.js`);
  `ricerca/` passa dallo stesso login; `next` accettato solo se è una pagina del sito
- pagina **Gestione** (Amministrazione, Utenti, Impostazioni, Vedi come) al posto delle tre voci rosse
- Riepilogo: entrate/uscite solo con il bilancio, link alle stagioni chiuse per chi ha lo storico
- **Social** (`web/social.html`, grafica C): post e story, calendario del mese, copertina FB, prezzo
  facoltativo, testo copiabile, pubblicato; **campagne sponsor** (tabella `sponsors`, formati collab,
  story con sticker link, grazie, copertina; UTM; avvertenza alcolici). Test `node web/test-social.js`
- `test_ruoli.sh` con la matrice ruoli × permessi (7 ruoli × 32 azioni), vedi come, passaggio 2.4→2.5
- Social, **giorni e colori delle gite** (tabella `trip_days`, una riga per giorno, colore vuoto = non è
  giorno di gita): riquadro in fondo alla pagina Social; il form della gita ha un calendario del mese al
  posto del campo data, con i giorni di gita colorati (gli altri si scelgono lo stesso, con avviso in
  rosso) e un pallino sui giorni che hanno già una gita. I colori valgono per post, story e calendario
  del mese; scritta bianca o blu scuro scelta dal contrasto
- Social, **contatti nei post** (tabella `social_contacts`: nome, telefono, orari facoltativi, in
  ordine): riquadro "Contatti nei post" in fondo alla pagina Social, al posto dei numeri scritti nel
  codice. Stanno in fondo a post e story e nel testo da incollare; senza contatti la riga non c'è; la
  riga troppo lunga si rimpicciolisce e poi l'anteprima avvisa

## Produzione (2026-09-24)

- backup CSV delle tabelle preso prima nella scratchpad della sessione; `schema.sql` applicato in una
  transazione, dopo una prova con rollback sui dati veri. Account: un superadmin e un admin (resta
  admin, senza Bilancio: deciso così); nessun utente/ospite/kiosk da spostare
- pagine della 2.5 pubblicate lo stesso giorno (deploy da `2.5-SNAPSHOT`, `d95fca7`)
- 2026-09-25: tabella `social_contacts` applicata dall'SQL Editor (`supabase/applica_social_contacts.sql`)

## Da fare
- inserire i contatti veri dalla pagina Social, riquadro "Contatti nei post" (o dal form del post,
  "Aggiungi o cambia i telefoni")
- caricare lo sponsor 958 Santero dalla pagina Social (loghi in `social/santero/`) e la sua campagna
- facoltativo: ripubblicare la Edge Function `crea-utente` (la versione nel repository non assegna
  più ruoli); quella pubblicata funziona lo stesso

---

# Ripresa lavori — aggiornato il 2026-09-24

## Fatto nella 2.4-SNAPSHOT (schema applicato in produzione il 2026-09-24)

- validatore del codice fiscale (`web/codicefiscale.js`, test `node web/test-codicefiscale.js`):
  avviso sotto il campo con il codice proposto, non blocca il salvataggio; il comune di nascita
  non si verifica (solo la forma)
- numero tessera proposto nel form Soci = il più alto numerico + 1 (`next_card_number()`), vincolo
  `members_card_number_key` (unico nella stagione, la chiusura lo azzera); se il proposto è stato
  preso da un altro operatore la pagina ne propone un altro
- più abbonamenti gite per socio, anche di giorni diversi: tabella `member_passes`,
  `trip_uses.pass_id`, viste `pass_status` (per abbonamento) e `trip_passes` (per socio, con
  `days`); `members.pass_type` è un riassunto scritto dal trigger `sync_pass_type`;
  `use_trip(member_id, client_id, day)` scala dal giorno scelto, poi JOLLY, poi il più vecchio;
  `add_pass()` per il pannello gite; Riepilogo e chiusura contano gli abbonamenti venduti
- ruolo `assicurazione` (vede solo `web/assicurazione.html`): tesserati senza polizza, CF e
  polizza modificabili, ricerca per correggere anche i già assicurati (`insurance_search()`, al
  massimo 20 risultati), Excel "da assicurare". L'Excel di **tutti** i soci della stagione sta nel
  Riepilogo e l'assicurazione non può scaricarlo (il database non glielo dà). Voce Assicurazione
  nella barra da assicurazione in su: per starci, la barra del superadmin usa tutta la larghezza
  e il testo a 17px
- creazione account: la pagina Utenti crea sempre come `ospite` e poi assegna il ruolo scelto, così
  un ruolo nuovo non richiede di ripubblicare la Edge Function
- pannello Utenti: gli account rimossi restano in fondo "senza accesso" (`accounts_without_role()`),
  con **Riattiva** (`restore_account()`) ed **Elimina per sempre** (`delete_account()`, cancella
  da auth.users); ricreare un'email rimossa la riattiva invece di dare "esiste già"
- Impostazioni: la riga del listino o delle partenze modificata e non salvata diventa gialla con
  "Salva modifiche"; lasciando la pagina con modifiche non salvate il browser chiede conferma
- superadmin: "Togli dalla stagione" nella pagina Soci (`remove_from_season()`), si ferma se il
  socio paga per dei familiari o ha gite segnate
- backup CSV di produzione preso prima dello schema nella scratchpad della sessione

## Da fare subito

- **TODO(assicurazione): tracciato dell'Excel** da definire con le specifiche dell'assicurazione:
  `COLONNE_ASSICURAZIONE` in `web/shared.js` (ora colonne provvisorie), usate sia dalla pagina
  Assicurazione sia dal Riepilogo. Se servono campi nuovi, aggiungerli a `insurance_members()` in
  `supabase/schema.sql` e alla select di `scaricaSoci()` in `web/riepilogo.html`
- facoltativo: ripubblicare la Edge Function `crea-utente` (`supabase login` e `supabase functions
  deploy crea-utente`) perché la sua lista di ruoli nel repository conosce `assicurazione`. Non
  serve più per creare gli account (vedi sopra)
- provare sul sito con i dati reali: numero tessera proposto, secondo abbonamento, pannello gite
  sul telefono con due abbonamenti, pagina Assicurazione con un account `assicurazione`
- dopo un eventuale caricamento da Excel (`generate_migration.py`) rilanciare `schema.sql`: crea
  le righe di `member_passes` dagli abbonamenti scritti nella colonna del socio

---

# Ripresa lavori — 2026-09-23

## Fatto nella 2.3 (committato, pushato, online)

- leggibilità (5b00869), fix barra Totale/Residuo (a4674d3), listino a
  righe grandi e barra in maiuscolo (8ed7e3b), Riepilogo più grande con
  somma di sezione in evidenza (d4638ad), pulsante A+ e listino dal prezzo
  più basso (0d77244)
- presciistica aggiuntiva: categoria PRESCIISTICA nel listino e colonna
  members.preski_type, scelta propria nella pagina Soci, sezione propria
  nel Riepilogo (anche per le stagioni chiuse, categoria PRESKI dello
  storico), fuori dall'incasso corsi; close_season la archivia e la azzera.
  Schema applicato in produzione il 2026-09-23: nessun socio da spostare,
  spostata la sola voce di listino (id 18). Backup CSV di prices e members
  preso prima nella scratchpad della sessione.

## Da fare

- 2.4-SNAPSHOT: funzioni social e campagne Santero. Piano già presente in
  `docs/PIANO_2.3_SOCIAL.md` (da rinominare o aggiornare per la 2.4?).
  File Santero non committati da portare qui: `social/santero/958 Santero
  Vini.png` (in stage), `campagna.html`, `export/`, `santero.png`,
  `santero-chiaro.png`
- provare sul sito con i dati reali: righe del listino e ordine per prezzo,
  presciistica insieme a un abbonamento, totali della pagina Soci,
  Riepilogo, pulsante A+
- il tag locale `2.1` è diverso da quello su GitHub (`git fetch --tags` lo
  rifiuta): capire quale dei due è giusto
- docker su questa macchina non riesce a fermare i container ("could not
  kill container: permission denied", probabile AppArmor): restano accesi
  `scdb-test-presci`, `scdb-test-presci-<pid>`, `scdb-test-ruoli`. Si
  tolgono dopo `sudo systemctl restart docker` (o un riavvio) con
  `docker rm -f`
- il pulsante A+ c'è solo nel gestionale (`web/`), non nel sito di
  ricerca (`ricerca/`): aggiungerlo se serve
- il sito di ricerca non mostra la presciistica nella scheda del socio
  (mostra solo l'abbonamento): aggiungerla se serve

---

  Storico aggregato + schema tutto in inglese                                                                                                                                                                           
                                                                                                                                                                                                                           
     Contesto                                                                                                                                                                                                              
                                                                                                                                                                                                                           
     Due problemi emersi dopo la chiusura della prima stagione.                                                                                                                                                            
                                                                                                                                                                                                                           
     Lo storico duplica l'anagrafica. soci_storico conserva una riga per ogni                                                                                                                                              
     socio di ogni stagione chiusa: 17 colonne ricopiate da soci, cioè migliaia di                                                                                                                                         
     righe che crescono di un blocco intero a ogni chiusura. Della stagione passata                                                                                                                                        
     al direttivo servono cinque numeri (stagione, soci, quote, incassato, da                                                                                                                                              
     incassare) più i conteggi per tipologia che oggi si vedono nel Riepilogo. Il                                                                                                                                          
     resto è l'anagrafica, che non se ne va da nessuna parte perché i soci restano                                                                                                                                         
     in tabella.                                                                                                                                                                                                           
                                                                                                                                                                                                                           
     I nomi nel database sono metà in italiano e metà in inglese: soci ha                                                                                                                                                  
     created_at accanto a cognome, payer_id accanto a numero_polizza. Va                                                                                                                                                   
     uniformato all'inglese.                                                                                                                                                                                               
                                                                                                                                                                                                                           
     Decisioni prese con l'utente:                                                                                                                                                                                         
                                                                                                                                                                                                                           
     - si ricrea il database da zero e si reimportano i dati dall'Excel, invece di                                                                                                                                         
       rinominare in place;                                                                                                                                                                                                
     - l'inglese si ferma al database: variabili JS, nomi di funzione delle pagine e                                                                                                                                       
       testi a schermo restano in italiano;                                                                                                                                                                                
     - lo storico conserva i cinque totali più i conteggi per tipologia, così il                                                                                                                                           
       Riepilogo di un anno passato resta consultabile.                                                                                                                                                                    
                                                                                                                                                                                                                           
     ▎ Da sapere prima di partire. Ricreare il database cancella tutto quello che                                                                                                                                          
     ▎ è stato inserito dopo la migrazione: soci aggiunti dalle pagine, acconti                                                                                                                                            
     ▎ registrati, gite segnate, la stagione già archiviata. Torna solo ciò che sta                                                                                                                                        
     ▎ nel foglio new_structure/SOCI 2026.xlsx. Va verificato che non ci sia                                                                                                                                               
     ▎ lavoro recente da perdere.    
                                                                                                                                                                                                                              
     Cosa cambia nel database                                                                                                                                                                                              
                                                                                                                                                                                                                           
     Storico: due tabelle leggere al posto della copia dell'anagrafica                                                                                                                                                     
                                                                                                                                                                                                                           
     soci_storico sparisce. Al suo posto:                                                                                                                                                                                  
                                                                                                                                                                                                                           
     - season_history — una riga per stagione chiusa: season (chiave, il 1°                                                                                                                                                
       settembre), members, total, collected, outstanding, closed_at.                                                                                                                                                      
       Chiudere due volte la stessa stagione somma sui valori esistenti (on conflict do update), così resta una riga per anno.                                                                                             
     - season_breakdown — i conteggi per tipologia, poche decine di righe per                                                                                                                                              
       stagione: season, category (CARD / PASS / COURSE / DEPARTURE),                                                                                                                                                      
       label, day (valorizzato solo per le partenze, altrove stringa vuota),                                                                                                                                               
       count, total (solo per le tessere). Unica per (season, category, label, day).                                                                                                                                       
                                                                                                                                                                                                                           
     close_season() legge le viste di riepilogo — che filtrano già sulle righe che                                                                                                                                         
     sta per azzerare — scrive le due tabelle e poi svuota, tutto nella stessa                                                                                                                                             
     transazione. La tabella temporanea da_chiudere resta: garantisce che                                                                                                                                                  
     aggregato e azzeramento coprano le stesse righe, e dà all'UPDATE il WHERE che                                                                                                                                         
     Supabase pretende (estensione safeupdate).                                                                                                                                                                            
                                                                                                                                                                                                                           
     La vista stagioni_chiuse non serve più: la tabella è il record.                                                                                                                                                       
                                                                                                                                                                                                                           
     Nomi: mappa completa                                                                                                                                                                                                  
                                                                                                                                                                                                                           
     I valori restano italiani (TESSERA, SABATO, Abbonamento 5 viaggi JOLLY…): arrivano dal foglio Excel e il front-end ci fa già il codice colore.                                                                        
     Cambiano solo gli identificatori.                                                                                                                                                                                     
                                                                                                                                                                                                                           
     Tabelle                                                                                                                                                                                                               
                                                                                                                                                                                                                           
     ┌──────────────┬────────────────────────────────────────────┐                                                                                                                                                         
     │     oggi     │                   domani                   │                                                                                                                                                         
     ├──────────────┼────────────────────────────────────────────┤                                                                                                                                                         
     │ soci         │ members                                    │                                                                                                                                                         
     ├──────────────┼────────────────────────────────────────────┤                                                                                                                                                         
     │ prezzi       │ prices                                     │                                                                                                                                                         
     ├──────────────┼────────────────────────────────────────────┤                                                                                                                                                         
     │ partenze     │ departures                                 │   
       ├──────────────┼────────────────────────────────────────────┤                                                                                                                                                         
     │ gite_usate   │ trip_uses                                  │                                                                                                                                                         
     ├──────────────┼────────────────────────────────────────────┤                                                                                                                                                         
     │ soci_storico │ rimossa → season_history, season_breakdown │                                                                                                                                                         
     └──────────────┴────────────────────────────────────────────┘                                                                                                                                                         
                                                                                                                                                                                                                           
     Colonne di members                                                                                                                                                                                                    
                                                                                                                                                                                                                           
     data_iscrizione→enrolled_at, numero_polizza→policy_number,                                                                                                                                                            
     cognome→last_name, nome→first_name, luogo_nascita→birth_place,                                                                                                                                                        
     provincia_nascita→birth_province, codice_fiscale→tax_code,                                                                                                                                                            
     data_nascita→birth_date, indirizzo→address, citta→city,                                                                                                                                                               
     provincia→province, cap→postal_code, telefono→phone,                                                                                                                                                                  
     tipologia_tessera→card_type, agevolazioni_famiglia→family_discount,                                                                                                                                                   
     tipo_abbonamento→pass_type, partenze_sabato→saturday_departure,                                                                                                                                                       
     partenza_domenica→sunday_departure, tipologia_corso→course_type,                                                                                                                                                      
     totale→total, acconto→paid, saldo→balance,                                                                                                                                                                            
     numero_tessera→card_number, note→notes.                                                                                                                                                                               
     Restano: id, created_at, updated_at, legacy_id, legacy_payer_id,                                                                                                                                                      
     email, payer_id.                                                                                                                                                                                                      
                                                                                                                                                                                                                           
     Altre colonne                                                                                                                                                                                                         
                                                                                                                                                                                                                           
     prices: categoria→category, nome→name, prezzo→price,                                                                                                                                                                  
     attivo→active, viaggi→trips, giorno→day.                                                                                                                                                                              
     departures: giorno→day, luogo→place, attivo→active.                                                                                                                                                                   
     trip_uses: socio_id→member_id, stagione→season,                                                                                                                                                                       
     data_gita→trip_date, registrato_il→logged_at.                                                                                                                                                                         
                                                                                                                                                                                                                           
     Viste                                                                                                                                                                                                                 
                                                                                                                                                                                                                           
     nuclei_familiari→households, riepilogo_stagione→season_totals,                                                                                                                                                        
     riepilogo_tessere→card_counts, riepilogo_abbonamenti→pass_counts,                                                                                                                                                     
     riepilogo_corsi→course_counts, riepilogo_partenze→departure_counts,                                                                                                                                                   
     stagioni_aperte→open_season, abbonamenti_gite→trip_passes.                                                                                                                                                            
                                                                                                                                                                                                                           
     Funzioni (con i parametri, che fanno parte dell'API RPC)                                                                                                                                                              
                                                                                                                                                                                                                           
     stagione_di(quando)→season_of(moment),                                                                                                                                                                                
     stagione_corrente()→current_season(),                                                                                                                                                                                 
     chiudi_stagione(conferma)→close_season(confirmation),                                                                                                                                                                 
     salda_nucleo(capofamiglia)→settle_household(head_id),       
      usa_gite(socio)→use_trip(member_id),                                                                                                                                                                                  
     annulla_gita(gita)→cancel_trip(trip_id),                                                                                                                                                                              
     prezzi_deduci_abbonamento()→fill_pass_details().                                                                                                                                                                      
     Indici, vincoli e policy seguono i nomi delle rispettive tabelle.                                                                                                                                                     
                                                                                                                                                                                                                           
     La frase di conferma della chiusura resta CHIUDI STAGIONE: la scrive a                                                                                                                                                
     mano un volontario italiano, non è un identificatore.                                                                                                                                                                 
                                                                                                                                                                                                                           
     File                                                                                                                                                                                                                  
                                                                                                                                                                                                                           
     supabase/reset_legacy.sql (nuovo, da lanciare una volta sola) — elimina                                                                                                                                               
     gli oggetti con i nomi italiani (drop table … cascade, drop function,                                                                                                                                                 
     drop view), tutto con if exists così è innocuo su un database già pulito.                                                                                                                                             
     Sta in un file separato e non dentro schema.sql: una drop table members in                                                                                                                                            
     uno script che si rilancia ogni volta è una mina.                                                                                                                                                                     
                                                                                                                                                                                                                           
     supabase/schema.sql — riscritto con i nomi nuovi. Resta rieseguibile                                                                                                                                                  
     (create table if not exists, create or replace, alter … if exists) e                                                                                                                                                  
     mantiene la struttura attuale: tabelle di configurazione, members, sezione di                                                                                                                                         
     aggiornamento per database esistenti, stagione, viste, chiusura, incassi,                                                                                                                                             
     abbonamenti, RLS. Sparisce il blocco soci_storico, entrano season_history e                                                                                                                                           
     season_breakdown. Il trigger fill_pass_details sul listino resta com'è: si                                                                                                                                            
     lancia prima del caricamento dati e deve continuare a riempire trips/day                                                                                                                                              
     riga per riga.                       
      supabase/scripts/generate_migration.py — genera le INSERT con i nomi                                                                                                                                                  
     nuovi: ~198 riferimenti, sostituzione meccanica sulla mappa qui sopra. È da qui                                                                                                                                       
     che escono i file di supabase/migration/, che vanno rigenerati.                                                                                                                                                       
                                                                                                                                                                                                                           
     supabase/verifica.sql — stessi nomi nuovi nelle query di controllo (33                                                                                                                                                
     riferimenti). Il nome del file resta italiano: non è un identificatore di                                                                                                                                             
     database.                                                                                                                                                                                                             
                                                                                                                                                                                                                           
     Front-end — solo i riferimenti a tabelle, colonne, viste e RPC:                                                                                                                                                       
                                                                                                                                                                                                                           
     - web/index.html — il form: select, insert, update su members, più                                                                                                                                                    
       gli id dei campi che oggi rispecchiano le colonne;                                                                                                                                                                  
     - web/admin.html — households, members, settle_household;                                                                                                                                                             
     - web/riepilogo.html — le cinque viste di riepilogo;                                                                                                                                                                  
     - web/stagione.html — open_season, season_history, close_season, più il                                                                                                                                               
       dettaglio per tipologia (sotto);                                                                                                                                                                                    
     - web/shared.js — caricaPrezzi(), caricaPartenze(), ascoltaSoci(),                                                                                                                                                    
       saldoDi(), totaliNucleo();                                                                                                                                                                                          
     - ricerca/index.html — la costante CAMPI e la scheda del socio;                                                                                                                                                       
     - ricerca/gite.html — trip_passes, trip_uses, use_trip, cancel_trip.                                                                                                                                                  
                                                                                                                                                                                                                           
     Non si toccano: ricerca/comune.js e ricerca/test-ricerca.js (lavorano su                                                                                                                                              
     testo, non su colonne), ricerca/stile.css, web/brand.css, i testi a schermo.                                                                                                                                          
                                                                                                                                                                                                                           
     Documentazione — README.md (struttura e sezione «Chiudere la stagione»),                                                                                                                                              
     docs/MIGRAZIONE_2.0.md (ordine dei passi, con reset_legacy.sql prima di                                                                                                                                               
     schema.sql), docs/DOCUMENTAZIONE.md (la tabella colonna-foglio → colonna-DB).  
                                                                                                                                                                                                                            
     Dettaglio per tipologia nella pagina Amministrazione                                                                                                                                                                  
                                                                                                                                                                                                                           
     La tabella «Stagioni chiuse» resta com'è. Ogni riga guadagna un pulsante                                                                                                                                              
     Dettaglio che carica season_breakdown per quella stagione e la mostra                                                                                                                                                 
     sotto, raggruppata in Tessere / Abbonamenti / Corsi / Partenze — la stessa                                                                                                                                            
     lettura del Riepilogo, ma di un anno archiviato. Si riusa il meccanismo già                                                                                                                                           
     presente in ricerca/gite.html (apriRegistro): una zona vuota sotto la riga                                                                                                                                            
     che viene riempita al primo clic e svuotata alla chiusura.                                                                                                                                                            
                                                                                                                                                                                                                           
     Verifica                                                                                                                                                                                                              
                                                                                                                                                                                                                           
     1. Database, su Postgres in Docker (come per le modifiche precedenti):                                                                                                                                                
        applicare reset_legacy.sql e schema.sql su un database che contiene già                                                                                                                                            
        gli oggetti italiani, verificare che non resti nulla del vecchio schema;                                                                                                                                           
        quindi caricare qualche riga di prova e controllare che                                                                                                                                                            
        - close_season('CHIUDI STAGIONE') scriva una riga in season_history e                                                                                                                                              
          le righe attese in season_breakdown, e azzeri le colonne di stagione                                                                                                                                             
          lasciando intatta l'anagrafica;                                                                                                                                                                                  
        - una seconda chiusura nella stessa stagione sommi invece di duplicare;                                                                                                                                            
        - settle_household, use_trip e cancel_trip continuino a funzionare, con                                                                                                                                            
          il rifiuto su abbonamento esaurito;                                                                                                                                                                              
        - una chiusura a vuoto non scriva niente.                                                                                                                                                                          
     2. node ricerca/test-ricerca.js — deve restare verde (non tocca il DB, ma                                                                                                                                             
        gira in CI e va confermato).                                                                                                                                                                                       
     3. Pagine, in locale con i soliti stub: web/stagione.html (storico +                                                                                                                                                  
        dettaglio per tipologia), web/admin.html, web/index.html,                                                                                                                                                          
        ricerca/index.html, ricerca/gite.html.                                                                                                                                                                             
     4. Su Supabase, nell'ordine: reset_legacy.sql → schema.sql →                                                                                                                                                          
        python3 supabase/scripts/generate_migration.py "new_structure/SOCI 2026.xlsx"                                                                                                                                      
        → i file di supabase/migration/ in ordine → verifica.sql.                                                                                                                                                          
     5. Commit e push su 2.0 dopo conferma, poi controllo del workflow Pages e                                                                                                                                             
        delle pagine pubblicate.                                                                                                                                                                                           
                                                                              