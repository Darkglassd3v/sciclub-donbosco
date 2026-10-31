---
workflow: general-video
flow: automation
storyboard: yes
message: "Seguici per scoprire le nuove gite della stagione 2026/27"
destination: instagram-story
aspect: 1080x1920
language: it
audience: chi scia ad Asti e dintorni e non conosce ancora il club (inserzione Meta nelle storie), oltre ai follower
length: 16s
---

## Intent

Story di Instagram per promuovere la stagione 2026/27 dello Sci Club Don Bosco Asti e far
seguire i social: «devi seguirci per trovare info sulle nuove gite». Il video verrà anche
sponsorizzato nelle storie con un'inserzione Meta, rivolta soprattutto a chi non conosce il club:
per questo, dal 31/10, è corto, con il marchio riconoscibile fin dal primo secondo e le
informazioni condensate in una sola frase. Ci sono due versioni con le stesse scene: 16 s, con
cambi più frequenti (questa cartella), e 19 s, un po' più calma (`../video-stagione-19s/`, che usa
gli stessi file tramite collegamenti).

## Assets

- ../logo/logo-ufficiale-blu-tondo.svg — logo blu tondo: apre il video al centro, poi resta in alto a sinistra; è anche il logo del finale, toccato dalla mano
- ../font/barlow, ../font/barlow-condensed — font del club

## Customizations

- Apertura: il logo blu cade al centro grande (circa 840 px) e rimbalza schiacciandosi come una gomma; poi gira sempre più veloce (tre giri), si rimpicciolisce, vola nell'angolo in alto a sinistra e lì si ferma; nessun testo, perché il nome del club è già nel logo (31/10).
- Finale «Seguici» su fondo blu; il logo blu risalta con un anello bianco, un filo giallo, l'ombra e un alone chiaro dietro (il fondo giallo provato il 31/10 non convinceva): Instagram @sciclubdonbosco_asti, Facebook «Sci Club Don Bosco Asti», Canale WhatsApp.
- Spazio libero sul finale per lo sticker link/menzione aggiunto in Instagram.
- Loghi ufficiali di Instagram, Facebook e WhatsApp, non disegnati (30/10).
- Nel finale una mano tocca il logo del club come il pulsante «Segui»; il logo si abbassa come premuto (30/10).
- Cambi scena a 45° con bordo giallo o blu alternato, non invasivi (30/10); verso il finale, invece, lo stacco è la nuvola di neve dello spruzzo che copre l'obiettivo, seguita da un lampo bianco da cui il finale si schiarisce (31/10).
- Uno sciatore sportivo in pista oltre alla tavola (30/10); nella scena della frase, dopo la tavola, uno sciatore che frena e spruzza la neve verso la camera, per cambi più frequenti, ripreso in primo piano stretto (zoom da 1,45 a 1,7) (31/10).

## Notes

- Video gratuiti generici (Mixkit, Pexels): niente nomi di località, né scritti né sulle immagini.
- Sciatori con casco e maschera, non riconoscibili (regole Pexels sulle persone).
- Video muto: la musica la mette l'utente in Instagram. Per sponsorizzare il Reel serve un brano libero da diritti.
- Testi lontani dalle zone coperte da Instagram (alto ~250 px, basso ~340 px).
- Testi: «Stagione 2026/27» · «Nuove gite, settimana bianca e corsi» · «Seguici per non perdere nessuna novità».
- Niente presciistica (30/10).
- Colori del logo: blu #084C8D, giallo #FCCF02; su giallo solo testo blu scuro.
- La versione lunga e calma (24 s) è stata sostituita da questa il 31/10; resta nella storia dei commit.
- I video scaricati restano fuori da git (pesano): cartella assets/clip/ in .gitignore.
