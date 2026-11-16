# Reel dell'invito alla serata

Reel di 16 secondi (1080×1920, muto) per pubblicare e sponsorizzare su Instagram l'invito alla serata di
presentazione della stagione 2026/27 (mercoledì 25 novembre 2026, ore 21, Circolo Way Assauto), nello stile del
Reel veloce della prima proposta (tolta il 16/11/2026). Richiesta del 13/11/2026: l'invito subito all'inizio, con
le stesse scritte della scheda finale, e alla fine solo «Seguici».

- **0–3,9 s**: `compositions/frames/00-apertura-serata.html`. Il logo cade dall'alto e rimbalza; sotto, le scritte
  della scheda della serata identiche (`05-serata.html`: «Ti aspettiamo», «Presentazione della stagione 2026/27»,
  data e ora nel riquadro giallo, luogo, buffet) sulla foto del post (`assets/social/foto-gruppo.jpg`, copia di
  `../lancio-stagione/sorgenti/foto-gruppo.jpg`) con un velo blu più leggero in alto.
- **3,9–4,7 s**: una tendina a 45° come nel video della stagione porta ai tagli veloci.
- **4–9,5 s**: il montaggio `compositions/frames/00-veloce.html` del Reel veloce, partito mezzo secondo dopo per
  lasciare il tempo di leggere: sciatore, pista, funivia e scarpone con «Stagione 2026/27» e «Nuove gite, settimana
  bianca e corsi», poi lo spruzzo, la cui neve copre l'obiettivo a 9,5 s.
- **9,5–16 s**: `compositions/frames/05-seguici-serata.html`, «Seguici» con Instagram, Facebook ed email (come il
  finale del video della stagione, con l'email al posto del canale WhatsApp), senza ripetere l'evento.

Niente logo nell'angolo durante i tagli: il logo è nell'apertura e nel finale. `assets` e `compositions` sono
collegamenti a `../video-stagione`; le clip in `assets/clip/verticali/` le prepara
`../video-stagione/prepara-clip.sh` (fuori da git).

```bash
npm run check
npx --yes hyperframes@0.8.174 render -o renders/invito-serata-post-16s.mp4
node ../lancio-stagione/sorgenti/prova.js
```

## Versione per TikTok

Richiesta del 16/11/2026: lo stesso Reel con, alla fine, anche il profilo TikTok e il canale WhatsApp.
`rendi-tiktok.sh` prende i primi 9,5 s di `renders/invito-serata-post-16s.mp4` (fino al lampo della neve), rende
`finale-tiktok.html` (7,5 s, il finale `compositions/frames/05-seguici-tiktok.html` con Instagram, Facebook, TikTok,
canale WhatsApp ed email, sulla foto del post al posto della clip del bosco) e li unisce in
`renders/invito-serata-tiktok.mp4`: 17 s, 1080×1920, sotto i 10 MB per il caricamento dal browser. Il profilo TikTok
è indicato con il nome del club, perché il nome utente ha un refuso correggibile solo dal 15/12/2026.

```bash
./rendi-tiktok.sh
```

Su TikTok la musica va scelta fra i suoni commerciali (Commercial Music Library): con un altro brano il video non
si può promuovere, e il 15/11 la sostituzione del suono chiesta da TikTok è fallita. Didascalia:

```text
Presentazione della stagione 2026/27 ❄️
Mercoledì 25 novembre alle 21:00 ti aspettiamo al Circolo Way Assauto, corso Pietro Chiesa 20, Asti, per scoprire
insieme gite, corsi e novità della nuova stagione.
Buffet finale. Tutto il direttivo ti aspetta: non mancare!
📸 Instagram: sciclubdonbosco_asti
👍 Facebook: Sci Club Don Bosco Asti
💬 Canale WhatsApp: Sci Club Don Bosco Asti
#sciclubdonbosco #asti #sci #snowboard #stagione2026 #montagna
```

«Brindisi» non è vietato dalle regole di TikTok sull'alcol, che riguardano le inserzioni che promuovono o vendono
bevande alcoliche; nella didascalia della promozione si scrive comunque solo «Buffet finale», senza 🥂, per non
far scattare la revisione automatica. Nel video resta la scritta della scheda, «Buffet e brindisi finale».

La musica, libera da diritti perché il Reel va sponsorizzato, si aggiunge in Instagram. Calendario,
didascalie e sponsorizzazione sono in `../lancio-stagione/`.
