# Lancio della stagione 2026/27

Due post e un Reel per far conoscere la stagione e il suo inizio (piano del 12/11/2026).

| Quando | Cosa | File |
|---|---|---|
| 13–14 novembre | Post 1, invito alla serata di presentazione: post, storia e Reel | `invito-post.jpg`, `invito-story.jpg`, `../video-serata-veloce/renders/invito-serata-veloce-16s.mp4` (o la versione da 19 s `../video-presentazione/renders/invito-serata-19s.mp4`) |
| 22 novembre | Storia «Mercoledì ci vediamo», con il conto alla rovescia | `promemoria-mercoledi.jpg` |
| 25 novembre | Storia «Stasera alle 21», poi le storie dalla serata | `promemoria-stasera.jpg` |
| 26 novembre | Post 2, carosello «Si parte!» e Reel della stagione | `si-parte-1.jpg`, `si-parte-2.jpg`, `si-parte-3.jpg`, `../video-stagione/renders/story-stagione-16s.mp4` |

La serata: **mercoledì 25 novembre 2026 alle 21:00**, al Circolo Way Assauto, corso Pietro Chiesa 20,
Asti, con buffet e brindisi finale (testo del direttivo in `../presentazione_stagione.md`). L'evento è
salvato anche nel database (pagina Social del gestionale), con gli stessi testi e la stessa foto, così
il post si può riscaricare da lì.

- **Post 1**: la grafica K · Piani del generatore (`web/social-templates.js`) con la foto di gruppo del
  volantino. Il Reel da pubblicare e sponsorizzare su Instagram è quello veloce da 16 s
  (`../video-serata-veloce/`): l'apertura del video della stagione col logo grande al centro, che resta
  fermo un secondo in più, poi da 3,5 s quattro inquadrature con un taglio ogni 0,95 s e «Stagione
  2026/27», perché nel feed si decide subito se fermarsi; poi lo spruzzo, la cui neve copre l'obiettivo e
  fa da stacco, e a 9 s lo stesso finale della serata (scena
  `05-serata.html`). Resta anche la versione da 19 s (`../video-presentazione/`).
- **Post 2**: la copertina con il logo e la prima gita del 1° dicembre, il calendario di dicembre del
  generatore (le 6 gite salvate) e «Da non perdere» (prova gratuita del 13 dicembre, Dream Weekend
  dall'11 al 13 dicembre, corsi dal 9 gennaio).

Le didascalie sono in `didascalie.md`.

## Sponsorizzazione

Regole in `docs/META-ADS.md`: per ogni post due gruppi di inserzioni, Facebook con l'immagine e Instagram con
il Reel, Asti con 35 km, posizionamenti scelti a mano e «spesa limitata» spenta, pulsante «Scopri di più».
Il pubblico è più largo di quello della presciistica (45–65): proposta del 12/11 con l'età come limite vero
(«Usa come suggerimento» tolto), Instagram 18–55 per i più giovani e Facebook 35–65, interessi sci,
snowboard e località sciistiche. Budget proposto: Facebook 2 € al giorno (immagine del post 1 dal 15 al 24
novembre, carosello «Si parte!» dal 26 novembre al 6 dicembre) e Instagram 3 € al giorno (Reel veloce della
serata, poi Reel della stagione con la campagna già in bozza); il carosello su Instagram resta senza
sponsorizzazione. Dopo 3–4 giorni si controlla in Gestione inserzioni «Dettagli» › per età e per
posizionamento. La bozza si prepara dopo la pubblicazione dei post (si usa il post esistente); «Pubblica» e
il pagamento li fa l'utente.

## Rifare i file

- Immagini: `sorgenti/rendi.sh` (ogni pagina deve dire «PRONTO []», cioè nessun testo che non ci sta).
- Reel: in `../video-serata-veloce`, `npm run check` e poi
  `npx --yes hyperframes@0.8.174 render -o renders/invito-serata-veloce-16s.mp4` (per la versione da 19 s lo
  stesso in `../video-presentazione` con `-o renders/invito-serata-19s.mp4`). Il video è muto: la musica,
  libera da diritti se il Reel va sponsorizzato, si aggiunge in Instagram.
- Prova di tutto: `node sorgenti/prova.js` (con `DB="$(cat supabase/.postgre_connect)"` controlla anche
  l'evento nel database).
