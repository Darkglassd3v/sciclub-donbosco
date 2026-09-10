# Brand Guidelines — Sci Club Don Bosco v1.0

> Ultimo aggiornamento: 2026-09-10
> Stato: Attivo
> Fonte dei colori: `web/logo_sciclubdonbosco.png` (il logo non si tocca)

Il gestionale lo usa il direttivo: volontari, non tutti giovani, spesso di fretta
al banchetto delle iscrizioni. Il brand è moderno ma la leggibilità viene prima
dell'estetica: testo grande, contrasto alto, bersagli grossi.

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
| Background | #F2F5F8 | rgb(242,245,248) | sfondo pagina |
| Surface | #FFFFFF | rgb(255,255,255) | schede, tabelle, form |
| Text Primary | #14202E | rgb(20,32,46) | testo e titoli |
| Text Secondary | #4A5A6B | rgb(74,90,107) | etichette, testo secondario |
| Border | #C7D0DA | rgb(199,208,218) | bordi campi e divisori |

### Semantic Colors

| State | Hex | Usage |
|-------|-----|-------|
| Success | #147A45 | pagamento registrato, saldo a zero |
| Warning | #6B5200 | testo su fondo #FFF6D0, importi in sospeso |
| Error | #B3261E | errori, cancellazioni, saldi negativi |
| Info | #084C8D | messaggi informativi |

### Accessibility

Rapporti di contrasto verificati su sfondo bianco:

| Coppia | Rapporto | Livello |
|--------|----------|---------|
| #14202E su #FFFFFF | 15.4:1 | AAA |
| #084C8D su #FFFFFF | 8.7:1 | AAA |
| #4A5A6B su #FFFFFF | 6.9:1 | AAA |
| #147A45 su #FFFFFF | 5.5:1 | AA |
| #B3261E su #FFFFFF | 6.6:1 | AA |
| #084C8D su #FCCF02 | 5.7:1 | AA |
| #FCCF02 su #FFFFFF | 1.5:1 | **mai per testo** |

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

Mai `text-transform: uppercase` su frasi intere: si legge più lentamente. Resta
solo sulle intestazioni di sezione, che sono di due o tre parole.

---

## 3. Logo Usage

Il file `web/logo_sciclubdonbosco.png` è definitivo: non si ridisegna, non si
ricolora, non si ricalca in SVG «migliorato».

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
| Primary | #084C8D | #FFFFFF | 48px | 8px |
| Secondary | #FFFFFF (bordo 2px #084C8D) | #084C8D | 48px | 8px |
| Evidenza | #FCCF02 | #084C8D | 48px | 8px |
| Pericolo | #FFFFFF (bordo 2px #B3261E) | #B3261E | 48px | 8px |

Il pulsante che cancella non è mai adiacente a quello che salva.

### Campi

- Altezza minima 48px, testo 17px, bordo 2px #C7D0DA.
- I campi amministrativi (polizza, tessera) restano su #FFF6D0: è un codice
  colore che il direttivo usa già.
- L'etichetta sta sopra il campo, mai dentro come placeholder.

### Tabelle

- Righe alte almeno 52px, padding 14px, riga alternata #F7F9FB.
- Intestazioni in #4A5A6B a 15px, non minuscole schiacciate.
- Su mobile la tabella scorre in orizzontale dentro il suo contenitore.

---

## 6. Sincronizzazione

`docs/brand-guidelines.md` è la fonte. Da qui:

```bash
node .claude/skills/brand/scripts/sync-brand-to-tokens.cjs
```

I colori applicati alle pagine vivono in `web/brand.css` come variabili CSS.
