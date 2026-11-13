---
format: 1080x1920
duration: 16s
message: "Seguici per scoprire le nuove gite della stagione 2026/27"
arc: Marchio → Stagione → Cosa facciamo → Seguici
audience: chi scia ad Asti e dintorni e non conosce ancora il club (inserzione Meta nelle storie)
mode: collaborative
---

Video muto (la musica la aggiunge l'utente in Instagram). Testi in Barlow Condensed 800
maiuscolo, bianchi con ombra, accento giallo #FCCF02. Fasce coperte da Instagram libere: in alto
0–250 px, in basso 1580–1920 px.

Il logo blu tondo apre il video al centro, grande, e poi resta in alto a sinistra fino al finale
(`fixed-anchor-cycle`): è lo stesso elemento, animato sul timeline principale di `index.html`.

Cambi scena: la scena nuova si scopre dall'alto lungo un taglio a 45° (come la tessera dei post
K) in 0,8 s, con un bordo sottile: giallo col filo blu verso la scena 2, blu col filo giallo
verso la 3. Le scene si sovrappongono per quegli 0,8 s. Verso il finale non c'è la tendina: la
nuvola di neve dello spruzzo copre l'obiettivo, un lampo bianco la completa (0,12 s) e il finale si
schiarisce dal bianco tornando a fuoco (0,6 s); la frase della scena 3 e il logo piccolo spariscono
con la neve.

Il 31/10 la versione lunga e calma (24 s) è stata sostituita da questa, corta, per
l'inserzione nelle storie: marchio subito riconoscibile, informazioni in una frase sola. I tempi
qui sotto sono quelli della versione da 16 s (`index.html`), l'unica rimasta: quella da 19 s è stata
tolta il 13/11/2026.

Clip in `assets/clip/verticali/` (fuori da git, le rifà `prepara-clip.sh`): Mixkit (Stock Video
Free License) e due Pexels (licenza Pexels), ritagliate in verticale.

## Frame 1: Apertura (0-2.5s)

- act: Marchio
- status: animated
- duration: 2.5s
- transition_in: cut
- src: compositions/frames/01-intro.html
- scene: Cime innevate in time-lapse; il logo blu cade al centro grande (840 px) e rimbalza schiacciandosi; poi gira sempre più veloce (tre giri), si rimpicciolisce e vola nell'angolo in alto a sinistra, dove si ferma a 2,35 s
- clip: Mixkit 4283 «Swiss Alps snow background time-lapse» (4K), dal secondo 1
- motion: rules spring-pop-entrance (caduta e rimbalzo con schiacciamento e allungamento), rotazione di 1080° che accelera e frena, volo all'angolo

## Frame 2: Stagione (2.5-5.5s)

- act: Stagione
- status: animated
- duration: 3s
- transition_in: wipe 45° gialla
- src: compositions/frames/02-pista.html
- scene: Sciatore con la giacca gialla che curva verso la camera; «STAGIONE» e «2026/27» in giallo
- clip: Pexels 30598012 (1080×1920), dal secondo 8
- motion: rule kinetic-beat-slam (scale-slam, rise-rotate)

## Frame 3: Cosa facciamo (5.5-9s)

- act: Cosa facciamo
- status: animated
- duration: 3.5s
- transition_in: wipe 45° blu
- src: compositions/frames/03-gite.html
- scene: Prima la tavola in pista (2 s), poi uno sciatore in primo piano stretto (zoom da 1,45 a 1,7) che frena e spruzza la neve verso la camera; la nuvola che copre l'obiettivo fa da stacco verso il finale; una frase sola: «NUOVE GITE, / SETTIMANA BIANCA / E CORSI» («E CORSI» in giallo)
- clip: Mixkit 3338 «Skiing on a snowy slope» (4K), dal secondo 6,5; Pexels 11297785 «skier skiing towards camera» (1080×1920), dal secondo 0,62 (al secondo 2,12 la neve copre l'obiettivo, all'istante del finale)
- motion: rule kinetic-beat-slam (rise-rotate, side-snap, scale-slam)

## Frame 4: Seguici (9-16s)

- act: Seguici
- status: animated
- duration: 7s
- transition_in: nuvola di neve dello spruzzo, lampo bianco e schiarita con messa a fuoco
- src: compositions/frames/05-seguici.html
- scene: Bosco innevato sotto il velo blu #084C8D; logo blu tondo con anello bianco, filo giallo, ombra e alone chiaro dietro; una mano tocca il logo come il pulsante «Segui», cerchi gialli; «SEGUICI» in giallo e «per non perdere nessuna novità» in bianco; Instagram, Facebook e Canale WhatsApp coi loghi ufficiali
- clip: Mixkit 3387 «Mountain for skiing seen from the air» (4K), dal secondo 3,5
- motion: blueprint cta-morph-press; rules spring-pop-entrance (logo), press-release-spring + cursor-click-ripple (tocco), waterfall-entry (righe social)

Righe: Instagram @sciclubdonbosco_asti · Facebook Sci Club Don Bosco Asti · Canale WhatsApp.
Loghi social: Simple Icons 16.34.0 nei colori dei marchi. Mano: emoji Fluent «backhand index
pointing up» di Microsoft (licenza MIT, `assets/mano/`). Sotto le righe resta libera una fascia
per lo sticker link o menzione che l'utente mette in Instagram.
