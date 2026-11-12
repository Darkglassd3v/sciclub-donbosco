# Reel dell'invito alla serata (19 secondi)

Il video della stagione nella versione da 19 secondi (1080×1920, muto), con il finale della serata di
presentazione (`compositions/frames/05-serata.html`: mercoledì 25 novembre 2026, ore 21, Circolo Way
Assauto, buffet e brindisi finale) al posto di «Seguici». Per le inserzioni Instagram c'è la versione veloce
da 16 secondi in `../video-serata-veloce/`.

`assets` e `compositions` sono collegamenti a `../video-stagione`; le clip in `assets/clip/verticali/` le
prepara `../video-stagione/prepara-clip.sh` (fuori da git).

```bash
npm run check
npx --yes hyperframes@0.8.174 render -o renders/invito-serata-19s.mp4
node ../lancio-stagione/sorgenti/prova.js
```

Calendario, didascalie e sponsorizzazione sono in `../lancio-stagione/`.
