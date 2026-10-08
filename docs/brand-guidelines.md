# Brand Guidelines — Sci Club Don Bosco v1.0

> Ultimo aggiornamento: 2026-09-10
> Stato: Attivo
> Fonte dei colori: il logo, `web/logo_sciclubdonbosco.svg`

Il gestionale è usato dal direttivo, in buona parte non abituato alle interfacce
dense. La leggibilità viene prima dell'estetica: testo grande, contrasto alto,
bersagli ampi.

L'impaginazione segue un impianto editoriale: spaziatura ampia, poche linee,
titoli grandi con spaziatura stretta, pulsanti a pillola, fondo grigio neutro
sotto schede bianche. Nessuna misura di leggibilità è stata ridotta per
ottenerlo.

## Quick Reference

| Element | Value |
|---------|-------|
| Primary Color | #084C8D |
| Secondary Color | #FCCF02 |
| Accent Color | #147A45 |
| Primary Font | system-ui |
| Voice | Diretto, cordiale, concreto |

---

## 1. Color Palette

I due colori del logo sono la base: blu per struttura e testo, giallo per
richiamare l'attenzione. Il giallo non porta mai testo scuro sotto i 18px né
testo bianco: su giallo si scrive solo blu scuro.

### Primary Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Blu Logo | #084C8D | rgb(8,76,141) | intestazioni, pulsanti principali, link |
| Blu Dark | #06396A | rgb(6,57,106) | hover, stati premuti |
| Blu Light | #E7EFF7 | rgb(231,239,247) | sfondi selezione, righe evidenziate |

### Secondary Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Giallo Logo | #FCCF02 | rgb(252,207,2) | barre di stato, evidenziazioni, campi da compilare |
| Giallo Dark | #6B5200 | rgb(107,82,0) | testo giallo su fondo bianco (unico uso ammesso) |
| Giallo Light | #FFF6D0 | rgb(255,246,208) | sfondo dei campi amministrativi, avvisi |

### Accent Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Verde Saldo | #147A45 | rgb(20,122,69) | pagato, saldi in regola |

### Neutral Palette

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Background | #F5F5F7 | rgb(245,245,247) | sfondo pagina |
| Surface | #FFFFFF | rgb(255,255,255) | schede, tabelle, form |
| Riga alternata | #EEF2F6 | rgb(238,242,246) | righe pari delle tabelle |
| Text Primary | #14202E | rgb(20,32,46) | testo e titoli |
| Text Secondary | #4A5361 | rgb(74,83,97) | etichette, testo secondario |
| Border | #7B8794 | rgb(123,135,148) | bordi dei campi |
| Filo | #D5DAE1 | rgb(213,218,225) | divisori e contorni delle schede |

### Semantic Colors

| State | Hex | Usage |
|-------|-----|-------|
| Success | #147A45 | pagamento registrato, saldo a zero |
| Warning | #6B5200 | testo su fondo #FFF6D0, importi in sospeso |
| Error | #B3261E | errori, cancellazioni, saldi negativi |
| Info | #084C8D | messaggi informativi |

### Codice colore degli abbonamenti

Ogni giorno di abbonamento ha un colore fisso, uguale in tutte le pagine. Il
nome del giorno resta sempre scritto dentro l'etichetta: il colore accelera la
lettura, non la sostituisce.

| Giorno | Etichetta (fondo / testo) | Contrasto | Elementi pieni |
|--------|---------------------------|-----------|----------------|
| Sabato | #E7EFF7 / #06396A | 10.0:1 | #084C8D |
| Domenica | #FFF6D0 / #6B5200 | 6.8:1 | #FCCF02 |
| Martedì | #FBE9E7 / #B3261E | 5.6:1 | #B3261E |
| Jolly | #E4F3EA / #147A45 | 4.7:1 | #147A45 |

Gli elementi pieni (barre di avanzamento, pallini dei filtri) non portano testo:
lì il colore vivo si può usare senza vincoli di contrasto.

In pagina il codice colore è un componente solo, in `web/brand.css`
("Giorni delle gite"), in tre forme; basta `data-giorno="SABATO"` (DOMENICA,
MARTEDI, JOLLY) sull'elemento:

| Forma | Classe | Aspetto | Dove |
|-------|--------|---------|------|
| Etichetta | `.giorno-etichetta` | nome su fondo chiaro, bordino del colore | schede gite, ricerca soci, abbonamenti nel form Soci e nel Riepilogo |
| Filtro | `.giorno-filtro` | pieno del colore come l'azione; quello scelto (`aria-pressed="true"`) ha un anello scuro e la spunta ✓; senza giorno è "Tutti", blu notte | giorni del pannello gite |
| Azione | `.giorno-azione` | pulsante pieno del colore, testo bianco (domenica #6B5200) | Fogli dei soci |

La barretta delle gite fatte prende lo stesso colore da `data-giorno`.

### Accessibility

Rapporti di contrasto verificati su sfondo bianco:

| Coppia | Rapporto | Livello |
|--------|----------|---------|
| #14202E su #FFFFFF | 15.4:1 | AAA |
| #084C8D su #FFFFFF | 8.7:1 | AAA |
| #4A5361 su #FFFFFF | 7.8:1 | AAA |
| #147A45 su #FFFFFF | 5.5:1 | AA |
| #B3261E su #FFFFFF | 6.6:1 | AA |
| #084C8D su #FCCF02 | 5.7:1 | AA |
| #FCCF02 su #FFFFFF | 1.5:1 | **mai per testo né da solo come anello di focus** |
| #7B8794 su #FFFFFF (bordo campi) | 3.7:1 | contorni: minimo 3:1 |
| #06396A su #FFFFFF (anello di focus) | 11.7:1 | AAA |

Regole non negoziabili:

- Nessun testo sotto i 16px. Le etichette minuscole in maiuscoletto del vecchio
  layout (0.72–0.78rem) salgono a 0.9375rem.
- Focus sempre visibile: contorno 3px #FCCF02 con offset 2px, visibile anche
  sopra i pulsanti blu.
- Lo stato non è mai affidato al solo colore: accanto al colore c'è sempre una
  parola o un simbolo (es. «Saldato», «Da saldare»).

---

## 2. Typography

Font di sistema: nessun download, resa nitida su ogni schermo, e sui PC vecchi
del direttivo non c'è il salto di layout del webfont che arriva in ritardo.

### Font Stack

```css
--font-heading: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
--font-body: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
--font-mono: ui-monospace, "SFMono-Regular", "Consolas", monospace;
```

### Type Scale

Base 17px invece dei consueti 16: un punto in più si legge, non si nota.

| Element | Size (Desktop) | Size (Mobile) | Weight | Line Height |
|---------|----------------|---------------|--------|-------------|
| H1 | 32px | 26px | 700 | 1.25 |
| H2 | 26px | 22px | 700 | 1.3 |
| H3 | 21px | 19px | 600 | 1.35 |
| Body | 17px | 17px | 400 | 1.55 |
| Label form | 16px | 16px | 600 | 1.4 |
| Small | 15px | 15px | 400 | 1.5 |
| Importi (KPI) | 34px | 28px | 800 | 1.1 |

Mai `text-transform: uppercase`: si legge più lentamente e non aggiunge
informazione. I titoli si distinguono per corpo e peso, non per maiuscolo.
Unica eccezione le voci della barra di navigazione (18px, 600, tracking
`.03em`): sono poche parole sempre uguali, e in maiuscolo si trovano prima.
I titoli usano una spaziatura stretta (`letter-spacing: -.022em`).

---

## 3. Logo Usage

Il logo del sito è `web/logo_sciclubdonbosco.svg` (copia in `ricerca/`): il
vettoriale ricalcato il 07/10/2026 dal PNG piccolo di prima (228×170, ora in
`grafica/logo/strumenti/originale_228x170.png`), che a schermo e in stampa
usciva sgranato. Dall'08/10 lo usano tutte le pagine, i post social e la scheda
PDF del socio. Non si ricolora e non si deforma; se si ritrova il file
originale del grafico, sostituisce questo (vedi `grafica/logo/README.md`).

### Clear Space

Spazio libero minimo attorno al logo = altezza della lettera «D» di «DON».

### Minimum Size

| Contesto | Larghezza minima |
|----------|------------------|
| Digitale (intestazione pagina) | 140px |
| Digitale (barra mobile) | 96px |
| Stampa | 30mm |

### Don'ts

- Non ruotare, deformare, aggiungere ombre o contorni.
- Non mettere il logo su fondo giallo o blu pieno: solo bianco o #F2F5F8.
- Non usare il logo come icona ritagliata: per la favicon serve un file dedicato.

---

## 4. Voice & Tone

Chi legge è un volontario, non un utente di un software gestionale. Si scrive
come si parla in sede.

### Brand Personality

| Trait | Descrizione |
|-------|-------------|
| **Diretto** | frasi brevi, prima l'azione poi il dettaglio |
| **Cordiale** | dai del tu, niente formule burocratiche |
| **Concreto** | numeri, nomi, importi; niente astrazioni |
| **Rassicurante** | dopo un errore si dice sempre cosa fare adesso |

### Voice Chart

| Trait | Siamo | Non siamo |
|-------|-------|-----------|
| Diretto | essenziali | sbrigativi |
| Cordiale | alla mano | confidenziali a sproposito |
| Concreto | precisi | tecnici |
| Rassicurante | chiari sul da farsi | paternalistici |

### Tone by Context

| Contesto | Tono | Esempio |
|----------|------|---------|
| Pulsanti | verbo all'infinito, azione esplicita | «Salva socio», non «Conferma» |
| Etichette form | nome della cosa, senza abbreviazioni | «Codice fiscale», non «CF» |
| Errori | cosa è successo + cosa fare | «Manca il telefono. Scrivilo e riprova.» |
| Conferme | fatto, con il dato | «Socio salvato: Rossi Mario.» |
| Vuoto | spiega perché è vuoto | «Nessun socio trovato con questo cognome.» |

### Termini da evitare

| Evitare | Motivo |
|---------|--------|
| Utente | qui sono soci |
| Record / entry | riga, socio, pagamento |
| Submit / Query | invia, cerca |
| Errore generico | dire sempre quale campo |
| Abbreviazioni (Tel., Res., Prov.) | si scrive per esteso, c'è spazio |

---

## 5. Design Components

Le misure servono a chi ha la vista lunga e il mouse impreciso.

### Buttons

| Type | Background | Text | Altezza min | Border Radius |
|------|------------|------|-------------|---------------|
| Primary | #084C8D | #FFFFFF | 48px | pillola |
| Secondary | #FFFFFF (bordo 1px #D5DAE1) | #084C8D | 48px | pillola |
| Evidenza | #FCCF02 | #084C8D | 48px | pillola |
| Pericolo | #FFFFFF (bordo 1px #B3261E) | #B3261E | 48px | pillola |

Raggi: 12px sui campi, 18px sulle schede, pillola sui pulsanti e sulle etichette.

Il pulsante che cancella non è mai adiacente a quello che salva.

### Campi

- Altezza minima 48px, testo 17px, bordo 2px #7B8794 (i campi sono l'unico
  elemento con contorno marcato: devono vedersi).
- I campi amministrativi (polizza, tessera) restano su #FFF6D0: è un codice
  colore che il direttivo usa già.
- L'etichetta sta sopra il campo, mai dentro come placeholder.

### Tabelle

- Righe alte almeno 52px, padding 14px, riga alternata #EEF2F6.
- Intestazioni in #4A5361 a 16px, in tondo minuscolo: mai in maiuscolo.
- Divisori a filo sottile (#D5DAE1), non bordi marcati.
- Su mobile la tabella scorre in orizzontale dentro il suo contenitore.

---

## 6. Impianto delle pagine

Ogni pagina ha la stessa struttura, nello stesso punto, con le stesse misure:
chi passa da una pagina all'altra trova barra, schede e titolo dove li ha
lasciati, e cambia solo il contenuto. Mockup: «Impianto delle pagine»
(proposta del 01/10/2026).

```
barra (68px, ferma)
└─ .container-main    larga come la barra: max 1180px (1280 per il superadmin), margini 18px (16 sul telefono)
   ├─ .schede-gestione / .schede-social   solo nelle sezioni con più pagine
   ├─ h1.title.is-4
   ├─ p.occhiello     una frase: a cosa serve la pagina
   ├─ .cifre > .kpi   facoltative: caselle con un numero, in fila
   └─ .riquadro × n   tutto il resto, uno sotto l'altro
```

| Regola | Misure |
|--------|--------|
| **Una larghezza sola** | `.container-main` max 1180px (= barra; 1280 per il superadmin, che ha la barra più larga), allineata al logo. Nessuna pagina ha una larghezza sua. Le pagine Gite e Cerca socio usano `.wrap` con le stesse misure. |
| **Testata fissa** | 24px sotto la barra; schede, 16px; titolo 32px (26 sul telefono); occhiello in #4A5361, 8px sotto il titolo, 24px prima del contenuto. |
| **Schede** | Un solo componente `.schede` per Gestione e Social: pillole da 48px, bordo #D5DAE1, la scheda aperta blu piena (`aria-current="page"`). |
| **Riquadri** | Un solo `.riquadro`: bianco, raggio 18px, ombra `--ombra`, padding 28px (20 sul telefono), 24px fra uno e l'altro, sempre largo quanto la pagina. Dentro: `h2` (22px, 600), frase facoltativa `.occhiello`, contenuto, `.azioni`. |
| **Cifre** | L'unica cosa affiancata: `.cifre` > `.kpi` (`.kpi-label` piccola + `.kpi-value` 32px; `.rosso` da incassare, `.verde` incassato), 4 per riga sul computer, 2 sul telefono, sopra i riquadri. |
| **Pulsanti** | In `.azioni` (figlio diretto del riquadro) in fondo, a sinistra; prima l'azione principale (blu, o giallo per incassare). Chi cancella o chiude va a destra (`.a-destra`), contornato di rosso. |
| **Comandi della pagina** | Cerca, filtri e «scarica tutto» valgono per tutta la pagina: stanno nel primo riquadro, sotto le cifre (Pagamenti: Cerca e filtra; Riepilogo: Excel e stagioni chiuse). |
| **Tabelle** | Dentro il riquadro, in un contenitore che scorre di lato (`.tabella-scorrevole`); intestazione grigia, righe alternate, numeri a destra. |
| **Niente stili di pagina** | Riquadri, cifre, schede, tabelle e pulsanti vivono in `web/brand.css`. Lo `<style>` di una pagina non ridefinisce queste classi: aggiunge solo quello che ha solo lei. |

Quello che non si fa più:
- contenuto appoggiato sul fondo grigio fuori da un riquadro (form Soci di prima);
- riquadri affiancati di larghezze diverse (fuorché le cifre);
- un `max-width` diverso per pagina (erano sette, da 820 a 1400px);
- fasce colorate o titoli di riquadro con uno stile proprio.

---

## 7. Sincronizzazione

`docs/brand-guidelines.md` è la fonte. Da qui:

```bash
node .claude/skills/brand/scripts/sync-brand-to-tokens.cjs
```

I colori applicati alle pagine vivono in `web/brand.css` come variabili CSS.
