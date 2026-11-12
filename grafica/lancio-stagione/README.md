# Lancio della stagione 2026/27

Due post e un Reel per far conoscere la stagione e il suo inizio (piano del 12/11/2026).

| Quando | Cosa | File |
|---|---|---|
| 13–14 novembre | Post 1, invito alla serata di presentazione: post, storia e Reel | `invito-post.jpg`, `invito-story.jpg`, `../video-presentazione/renders/invito-serata-19s.mp4` |
| 22 novembre | Storia «Mercoledì ci vediamo», con il conto alla rovescia | `promemoria-mercoledi.jpg` |
| 25 novembre | Storia «Stasera alle 21», poi le storie dalla serata | `promemoria-stasera.jpg` |
| 26 novembre | Post 2, carosello «Si parte!» e Reel della stagione | `si-parte-1.jpg`, `si-parte-2.jpg`, `si-parte-3.jpg`, `../video-stagione/renders/story-stagione-16s.mp4` |

La serata: **mercoledì 25 novembre 2026 alle 21:00**, al Circolo Way Assauto, corso Pietro Chiesa 20,
Asti, con buffet e brindisi finale (testo del direttivo in `../presentazione_stagione.md`). L'evento è
salvato anche nel database (pagina Social del gestionale), con gli stessi testi e la stessa foto, così
il post si può riscaricare da lì.

- **Post 1**: la grafica K · Piani del generatore (`web/social-templates.js`) con la foto di gruppo del
  volantino. Il Reel è la versione da 19 s del video della stagione con il finale della serata
  (`../video-presentazione/`, scena `05-serata.html`).
- **Post 2**: la copertina con il logo e la prima gita del 1° dicembre, il calendario di dicembre del
  generatore (le 6 gite salvate) e «Da non perdere» (prova gratuita del 13 dicembre, Dream Weekend
  dall'11 al 13 dicembre, corsi dal 9 gennaio).

Le didascalie sono in `didascalie.md`.

## Sponsorizzazione

Regole in `docs/META-ADS.md`: per ogni post due gruppi di inserzioni, Facebook con l'immagine e Instagram con
il Reel, Asti con 35 km, posizionamenti scelti a mano e «spesa limitata» spenta, pulsante «Scopri di più».
Proposta: 3 € al giorno su Facebook e 2 € su Instagram, per il post 1 fino al 24 novembre e per il post 2 fino
al 6 dicembre. La bozza si prepara dopo la pubblicazione dei post (si usa il post esistente); «Pubblica» e il
pagamento li fa l'utente.

## Rifare i file

- Immagini: `sorgenti/rendi.sh` (ogni pagina deve dire «PRONTO []», cioè nessun testo che non ci sta).
- Reel: in `../video-presentazione`, `npm run check` e poi
  `npx --yes hyperframes@0.8.174 render -o renders/invito-serata-19s.mp4`. Il video è muto: la musica,
  libera da diritti se il Reel va sponsorizzato, si aggiunge in Instagram.
- Prova di tutto: `node sorgenti/prova.js` (con `DB="$(cat supabase/.postgre_connect)"` controlla anche
  l'evento nel database).
