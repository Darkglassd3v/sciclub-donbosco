# Reel veloce dell'invito alla serata

Reel di 16 secondi (1080×1920, muto) per pubblicare e sponsorizzare su Instagram l'invito alla serata di
presentazione della stagione 2026/27 (mercoledì 25 novembre 2026, ore 21, Circolo Way Assauto).

- **0–3,5 s**: l'apertura del video della stagione, con il logo grande che cade al centro sulle cime e
  resta fermo un secondo in più prima di girare e volare nell'angolo.
- **3,5–9 s**: il montaggio `compositions/frames/00-veloce.html`, con quattro inquadrature da 0,95
  secondi (sciatore, pista, funivia, scarpone) e poi lo spruzzo verso la camera per 1,7 secondi, la cui
  neve copre l'obiettivo all'arrivo del finale; sopra, «Stagione 2026/27» e «Nuove gite, settimana bianca
  e corsi».
- **9–16 s**: il finale della serata `compositions/frames/05-serata.html`.

`assets` e `compositions` sono collegamenti a `../video-stagione`; le clip in `assets/clip/verticali/` le
prepara `../video-stagione/prepara-clip.sh` (fuori da git).

```bash
npm run check
npx --yes hyperframes@0.8.174 render -o renders/invito-serata-veloce-16s.mp4
node ../lancio-stagione/sorgenti/prova.js
```

La musica, libera da diritti perché il Reel va sponsorizzato, si aggiunge in Instagram. Calendario,
didascalie e sponsorizzazione sono in `../lancio-stagione/`.
