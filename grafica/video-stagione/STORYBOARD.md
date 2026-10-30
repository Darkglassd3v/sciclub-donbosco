---
format: 1080x1920
duration: 19s
message: "Seguici per scoprire le nuove gite della stagione 2026/27"
arc: Hook → Energia → Promessa → Cosa facciamo → Seguici
audience: soci, famiglie e sciatori di Asti e dintorni su Instagram
mode: collaborative
---

Video muto (la musica la aggiunge l'utente in Instagram). Logo bianco rotondo fisso in alto a
sinistra dalla scena 1 alla 4 (`fixed-anchor-cycle`: il logo resta fermo mentre le immagini
cambiano). Testi in Barlow Condensed 800 maiuscolo, bianchi con ombra, accento giallo #FCCF02.
Fasce coperte da Instagram libere: in alto 0–250 px, in basso 1580–1920 px.

Cambi scena: la scena nuova si scopre dall'alto lungo un taglio a 45° (come la tessera dei post
K) in 0,8 s, con un bordo sottile alternato: giallo col filo blu, poi blu col filo giallo. Le
scene si sovrappongono per quegli 0,8 s. Correzioni del 30/10: tendina piena gialla troppo
invasiva, cambi troppo rapidi (+0,5 s a scena), niente presciistica, sci sportivo oltre alla tavola,
icone ufficiali dei social, mano che tocca il logo nel finale.

Clip in `assets/clip/verticali/` (fuori da git, le rifà `prepara-clip.sh`): Mixkit (Stock Video
Free License) e una Pexels (licenza Pexels), ritagliate in verticale.

## Frame 1: Stagione (0-3.5s)

- act: Hook
- status: animated
- duration: 3.5s
- transition_in: cut
- src: compositions/frames/01-stagione.html
- scene: Cime innevate in time-lapse, spinta lenta in avanti; «STAGIONE» e «2026/27» in giallo
- clip: Mixkit 4283 «Swiss Alps snow background time-lapse» (4K), dal secondo 1
- motion: blueprint kinetic-type-beats; rule kinetic-beat-slam (scale-slam, rise-rotate)

## Frame 2: Si torna in pista (3.5-7.5s)

- act: Energia
- status: animated
- duration: 4s
- transition_in: wipe 45° gialla
- src: compositions/frames/02-pista.html
- scene: Sciatore con la giacca gialla che curva verso la camera, poi la tavola; «SI TORNA IN PISTA»
- clip: Pexels 30598012 (1080×1920) dal secondo 9; Mixkit 3338 «Skiing on a snowy slope» (4K) dal secondo 7
- motion: rule kinetic-beat-slam (side-snap)

## Frame 3: Nuove gite in arrivo (7.5-11s)

- act: Promessa
- status: animated
- duration: 3.5s
- transition_in: wipe 45° blu
- src: compositions/frames/03-gite.html
- scene: Funivia tra le Alpi innevate; «NUOVE GITE IN ARRIVO», «IN ARRIVO» in giallo, nessuna località
- clip: Mixkit 4395 «Cable car view in the Italian Alps» (1080p), dal secondo 8,5
- motion: rule kinetic-beat-slam (rise-rotate, scale-slam)

## Frame 4: Gli eventi della stagione (11-14s)

- act: Cosa facciamo
- status: animated
- duration: 3s
- transition_in: wipe 45° gialla
- src: compositions/frames/04-attivita.html
- scene: Primi piani di scarpone e attrezzatura; targhe «SETTIMANA BIANCA», «CORSI SCI E SNOWBOARD», «GARA SOCIALE» (dagli eventi 2026/27 nel gestionale)
- clip: Mixkit 3340 «Skier fitting a boot on top of a mountain» (4K) + 4017 «Mountain ski equipment» (1080p)
- motion: rule waterfall-entry (le targhe a cascata)

## Frame 5: Seguici (14-19s)

- act: Seguici
- status: animated
- duration: 5s
- transition_in: wipe 45° blu
- src: compositions/frames/05-seguici.html
- scene: Bosco innevato sotto il velo blu #084C8D; logo tondo; una mano tocca il logo come il pulsante «Segui»; «SEGUICI» e «per non perdere nessuna novità»; Instagram, Facebook e Canale WhatsApp coi loghi ufficiali
- clip: Mixkit 3387 «Mountain for skiing seen from the air» (4K), dal secondo 3,5
- motion: blueprint cta-morph-press; rules spring-pop-entrance (logo), press-release-spring + cursor-click-ripple (tocco), waterfall-entry (righe social)

Righe: Instagram @sciclubdonboscoasti · Facebook Sci Club Don Bosco Asti · Canale WhatsApp.
Loghi social: Simple Icons 16.34.0 nei colori dei marchi. Mano: emoji Fluent «backhand index
pointing up» di Microsoft (licenza MIT, `assets/mano/`). Sotto le righe resta libera una fascia
per lo sticker link o menzione che l'utente mette in Instagram.
