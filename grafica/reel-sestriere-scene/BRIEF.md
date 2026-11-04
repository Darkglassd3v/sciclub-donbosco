---
workflow: general-video
flow: automation
storyboard: no
message: "Dream Weekend al Sestriere, 11-13 dicembre, posti limitati: come iscriversi"
destination: instagram-reel
aspect: 1080x1920
language: it
audience: chi segue il club e chi scia ad Asti e dintorni
length: 20s
---

## Intent

Reel per il Dream Weekend al Sestriere (post `0d8e762f-d78f-4940-81b3-723b51bb0e37`), senza prezzi, con il linguaggio
del video della stagione: apertura col logo, tendine a 45°, stacco con la nuvola di neve e finale «Seguici». La versione
più semplice, con la foto ferma e il testo che si aggiunge, è in `../reel-sestriere-post/`.

## Scene

| Tempo | Scena | Fondo | Testo |
|---|---|---|---|
| 0–3,2 s | `01-gancio` | clip dello sciatore | Dream Weekend, Posti limitati |
| 3,2–7,2 s | `02-sestriere` | foto vera del post | Sestriere, Hotel Fronte Piste, tessera verde 11–13 dicembre, 2 notti |
| 7,2–11,3 s | `03-cosa` | clip della pista, poi lo spruzzo | Mezza pensione, Skipass Vialattea, Prezzi ridotti |
| 11,3–16,3 s | `04-iscrizioni` | clip del bosco sotto il velo blu | Posti limitati, iscrizioni, telefoni, mail |
| 16,3–20 s | `05-seguici` | clip del bosco sotto il velo blu | Seguici, Instagram, Facebook, Canale WhatsApp |

## Regole

- Il nome del posto si scrive solo sulla foto vera: le clip di Pexels e Mixkit sono generiche e non mostrano il Sestriere.
- Il logo tondo è presente in tutto il video. Nella scena dei contatti lo stacca dal fondo blu un anello bianco.
- I testi stanno fra 270 e 1500 px di altezza e, nella metà bassa, lontani dal bordo destro: nei Reels didascalia e
  pulsanti coprono più spazio che nelle story.

## Comandi

Le clip restano fuori da git: `assets/clip` è un collegamento a `../video-stagione/assets/clip`, che si ricrea con
`../video-stagione/prepara-clip.sh`.

```bash
node <plugin hyperframes>/skills/hyperframes/scripts/plugin-cli.mjs check
node <plugin hyperframes>/skills/hyperframes/scripts/plugin-cli.mjs render -o renders/reel-sestriere-scene.mp4
ffmpeg -ss 6.8 -i renders/reel-sestriere-scene.mp4 -frames:v 1 -q:v 2 renders/copertina.jpg
```

## Notes

- Video muto: la musica si aggiunge in Instagram. Per sponsorizzare il Reel serve un brano libero da diritti.
- La scadenza delle iscrizioni non compare perché nel post è vuota: la mail del club riporta una data con l'anno sbagliato.
- La scena finale è una copia di `../video-stagione/compositions/frames/05-seguici.html` con tempi più stretti.
- La didascalia è in `../reel-sestriere-post/didascalia.md`.
