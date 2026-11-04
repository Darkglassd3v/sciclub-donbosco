---
workflow: general-video
flow: automation
storyboard: no
message: "Dream Weekend al Sestriere, 11-13 dicembre, posti limitati: come iscriversi"
destination: instagram-reel
aspect: 1080x1920
language: it
audience: chi segue il club e chi scia ad Asti e dintorni
length: 14s
---

## Intent

Reel per il Dream Weekend al Sestriere (post `0d8e762f-d78f-4940-81b3-723b51bb0e37`), senza prezzi. Questa versione
segue la richiesta dell'utente del 4/11/2026: la foto del post resta ferma e il testo compare un pezzo alla volta,
«come fosse un post, sempre in aggiunta», senza diventare un video di animazione. La versione con scene e clip è in
`../reel-sestriere-scene/`.

## Come è fatto

- `sorgenti/congela.cjs` disegna la story vera con `web/social-templates.js` in Chrome headless e scrive `index.html`:
  stile, testi e colori sono quelli del generatore. `index.html` non va modificato a mano.
- Foto, piani e logo tondo ci sono dal primo fotogramma. Poi si aggiungono tessera, frase gialla, titolo, le tre voci
  dell'elenco, il luogo, le iscrizioni e i telefoni, che arrivano a 8,9 s. Il post completo resta fermo fino a 14 s.
- In fondo, da 9,4 s, compare la riga «Seguici per non perderti i nuovi aggiornamenti». Da 10 s arriva la mano del video
  della stagione (`assets/mano` è un collegamento a `../video-stagione/assets/mano`), che tocca il tasto a 10,7 e a
  12,2 s e resta lì.
- Rispetto alla story, la colonna del testo finisce più in alto e più a sinistra, perché nei Reels didascalia e
  pulsanti coprono più spazio e sotto serve posto per la riga «Seguici». Lo script si ferma se un dato manca, se compare
  un prezzo, se il testo viene rimpicciolito o se entra nelle zone coperte.

## Comandi

```bash
node sorgenti/congela.cjs
node <plugin hyperframes>/skills/hyperframes/scripts/plugin-cli.mjs check
node <plugin hyperframes>/skills/hyperframes/scripts/plugin-cli.mjs render -o renders/reel-sestriere-post.mp4
ffmpeg -sseof -0.1 -i renders/reel-sestriere-post.mp4 -frames:v 1 -q:v 2 renders/copertina.jpg
```

## Notes

- Video muto: la musica si aggiunge in Instagram. Per sponsorizzare il Reel serve un brano libero da diritti.
- La scadenza delle iscrizioni non compare perché nel post è vuota: la mail del club riporta una data con l'anno sbagliato.
- La foto è larga 1080 px, la stessa delle gite al Sestriere. Non ne risulta una copia più grande nel database.
- Il testo da incollare in Instagram è in `didascalia.md`.
