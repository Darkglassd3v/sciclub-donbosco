# Lancio della stagione 2026/27

Due post e i Reel per far conoscere la stagione e il suo inizio (piano del 12/11/2026).

| Quando | Cosa | File |
|---|---|---|
| 13 novembre | Post 1, invito alla serata di presentazione: post su Facebook, Reel su Instagram, storia su entrambi | `invito-post.jpg`, `invito-story.jpg` e uno dei due Reel: `../video-serata-post/renders/invito-serata-post-16s.mp4` o `../video-serata-veloce/renders/invito-serata-veloce-16s.mp4` |
| 22 novembre | Storia «Mercoledì ci vediamo», con il conto alla rovescia | `promemoria-mercoledi.jpg` |
| 25 novembre | Storia «Stasera alle 21», poi le storie dalla serata | `promemoria-stasera.jpg` |
| 26 novembre | Post 2, carosello «Si parte!» e Reel della stagione | `si-parte-1.jpg`, `si-parte-2.jpg`, `si-parte-3.jpg`, `../video-stagione/renders/story-stagione-16s.mp4` |

La serata: **mercoledì 25 novembre 2026 alle 21:00**, al Circolo Way Assauto, corso Pietro Chiesa 20,
Asti, con buffet e brindisi finale (testo del direttivo in `../presentazione_stagione.md`). L'evento è
salvato anche nel database (pagina Social del gestionale), con gli stessi testi e la stessa foto, così
il post si può riscaricare da lì.

- **Post 1**: la grafica K · Piani del generatore (`web/social-templates.js`) con la foto di gruppo del
  volantino, pubblicata su Facebook. Su Instagram si pubblica e si sponsorizza uno dei due Reel da 16 s:
  - `../video-serata-post/` (seconda proposta, 13/11): il logo entra rimbalzando e sotto, sulla foto del post,
    le scritte della scheda della serata (data e ora nel riquadro giallo, luogo), così chi scorre via nei
    primi secondi sa già cosa, quando e dove; poi una tendina a 45°, i tagli veloci con «Stagione 2026/27» e
    alla fine solo «Seguici» (Instagram, Facebook, email);
  - `../video-serata-veloce/` (prima proposta, 12/11): l'apertura del video della stagione col logo grande al
    centro, i tagli veloci e a 9 s la scheda della serata (`05-serata.html`).
- **Post 2**: la copertina con il logo e la prima gita del 1° dicembre, il calendario di dicembre del
  generatore (le 6 gite salvate) e «Da non perdere» (prova gratuita del 13 dicembre, Dream Weekend
  dall'11 al 13 dicembre, corsi dal 9 gennaio).

Le didascalie sono in `didascalie.md`.

## Sponsorizzazione

Regole in `docs/META-ADS.md`. Campagna dell'invito preparata il 13/11/2026 in bozza, «Serata 25/11 - Invito -
Copertura Facebook e Instagram»: obiettivo Notorietà › copertura (conta che l'invito lo vedano in tanti, non i
like), due gruppi separati con il proprio post e i propri posizionamenti, dal 13/11 alle 14:00 al 25/11 alle
18:00, budget dei gruppi non condiviso:
- Facebook: solo il post con l'immagine, feed di Facebook, età 35–65+ come limite vero, 3 € al giorno;
- Instagram: solo il Reel, posizionamenti di Instagram (feed, profilo, Esplora, storie, Reels), età 18–44 (18 è il
  minimo: nell'Unione Europea le età da 13 a 17 non si possono scegliere), 4 € al giorno.

Luogo: Asti con raggio di 45 km. Dei 58 soci attivi di questa stagione 55 abitano entro 35 km; i 45 km tengono
dentro la zona di Alessandria, l'Acquese e i paesi verso Torino senza il centro di Torino, che con pochi euro
al giorno prenderebbe quasi tutta la spesa (pubblico stimato da 0,9–1 a 1,7–2 milioni di persone: dopo 3 giorni
si guarda «Dettagli» › per regione). Le età vengono dalla campagna della presciistica (su Facebook il 57% delle
interazioni dai 65+, su Instagram risposte sia dai 18–24 sia dai 45–64) e dai soci con la tessera, distribuiti
su tutte le fasce adulte. Per il carosello «Si parte!» dal 26/11 e il Reel della stagione vale la stessa
divisione; il carosello su Instagram resta senza sponsorizzazione. Dopo 3–4 giorni si controlla in Gestione inserzioni «Dettagli» › per età e per
posizionamento. La bozza si prepara dopo la pubblicazione dei post (si usa il post esistente); «Pubblica» e
il pagamento li fa l'utente.

## Rifare i file

- Immagini: `sorgenti/rendi.sh` (ogni pagina deve dire «PRONTO []», cioè nessun testo che non ci sta).
- Reel: in `../video-serata-post`, `npm run check` e poi
  `npx --yes hyperframes@0.8.174 render -o renders/invito-serata-post-16s.mp4`; lo stesso in `../video-serata-veloce`
  con `-o renders/invito-serata-veloce-16s.mp4`. Il video è muto: la musica, libera da diritti se il Reel va
  sponsorizzato, si aggiunge in Instagram.
- Prova di tutto: `node sorgenti/prova.js` (con `DB="$(cat supabase/.postgre_connect)"` controlla anche
  l'evento nel database).
