# Proposte di grafica per i post social

Tre grafiche da scegliere per tutti i post del club su Instagram e Facebook:
**A · Biglietto**, **B · Calendario**, **C · Divano**. Dalla 2.8 sono nel
generatore dei post (Social > Impostazioni > Grafica dei post: `biglietto`,
`calendario`, `divano` in `web/social-templates.js`), accanto a Ritocco e
Montagna; queste pagine restano il riferimento del disegno. Ogni tavola mostra una
proposta su quattro post: il corso (la ginnastica presciistica, da cui è
partito tutto), una gita, un evento (una cena) e il calendario del mese.

![A · Biglietto](tavola-a.jpg)

![B · Calendario](tavola-b.jpg)

![C · Divano](tavola-c.jpg)

Dall'11/10 ci sono anche due proposte di stile, ispirate ai marchi dello sci, solo come
tavole (non ancora nel generatore): **D · Pista** (stile da gara, alla Head) ed
**E · Fascia** (stile classico, alla Rossignol). Stessi colori, stessi testi; vedi
"Le proposte di stile" in fondo.

![D · Pista](tavola-d.jpg)

![E · Fascia](tavola-e.jpg)

E una terza, **F · Diagonale**, ispirata ai post dello Ski Club of Great Britain.

![F · Diagonale](tavola-f.jpg)

| Cartella | Cosa |
|---|---|
| `tavola-a.jpg`, `-b`, `-c` | le tre proposte, una tavola ciascuna |
| `post/` | i post uno per uno: `corso-a.jpg`, `gita-b.jpg`, `evento-c.jpg`, `calendario-a.jpg`...; il corso anche in story (`corso-a-story.jpg`) e la panoramica del corso (`corso-panoramica.jpg`) |
| `Mail per Presciistica.docx` | la mail da cui vengono i testi del corso |
| `sorgenti/` | le pagine HTML e lo script che rifà le immagini |

Tutti i post sono 4:5 (1080×1350, come Montagna); gita, evento e calendario
hanno dati inventati.

- **Il testo non si sposta:** in ogni proposta titolo, fascia e testo partono
  sempre dallo stesso punto, in tutti i post; un testo più lungo scende più in
  basso. Il titolo occupa sempre due righe anche quando ne basta una (in A
  più la riga del sottotitolo, anche vuota), così i dati sotto partono alla
  stessa altezza. In A la foto (o il disegno) in alto è alta uguale per tutti; in C
  gancio e disegno hanno altezza fissa, così la fascia centrale sta sempre lì
  (tranne nel calendario, che non ha disegno). `./sorgenti/rendi.sh verifica`
  stampa le coordinate per controllarlo.
- **B senza la griglia del mese:** nel calendario le gite sono righe dentro il
  foglio, perché la griglia dei giorni ripeteva le stesse date.
- **I dettagli importanti si vedono subito:** orari, prezzi e scadenze in blu
  in A, in giallo in B, evidenziati in C. Nella gita di B il foglio non porta
  l'ora (contano le partenze, accanto) ma resta lungo come gli altri.
- **Per ora solo giallo e blu** (niente rosso del martedì né arancio delle
  cene): gita di domenica in giallo, evento e calendario in blu; nel
  calendario c'è un sabato al posto della gita del martedì.
- **A e C prendono il colore del post**, **B è sempre blu** e il colore sta
  nella testata del foglio.
- In ogni post della stessa tavola le informazioni sono quelle che servono a
  quel post; la proposta cambia solo come sono disegnate.
- **Giallo dei corsi e domeniche:** sono lo stesso giallo. Nel calendario il
  corso è un'etichetta contornata, non piena, per non confondersi.
- **C** è "Divano" per la presciistica. In alto il nome ("Ginnastica
  presciistica", "Gita a La Thuile"), nella fascia la data, sotto il gancio
  ("Alzati dal divano!", "Tutti in pista!", "Si chiude in festa!") e i dati, in
  un riquadro bianco uguale sul giallo e sul blu, con le iscrizioni in fondo: si
  capisce subito cos'è e quando. Il gancio va scritto post per post: è la
  grafica che chiede più lavoro a chi pubblica. Sullo sfondo fiocchi e
  montagne stilizzate in bianco trasparente (più opachi sul giallo, dove il
  bianco si vede meno).
- **Titoli che dicono cos'è:** "Gita a La Thuile", non solo il posto;
  "Calendario di gennaio" per il calendario del mese.
- **A con la foto:** in alto la foto caricata nel generatore (gita, cena,
  calendario); senza foto resta il disegno, come nel corso. Foto d'esempio da
  Wikimedia Commons, libere (CC0): pista San Bernardo e Ponteilles a La Thuile
  di DimiTalen, la tavola apparecchiata da Unsplash.

## Regole fisse

**Colori, in tutte le proposte:** un solo blu `#084C8D` e un solo giallo
`#FCCF02` (quelli del logo), più il bianco e il testo scuro `#14202E`. Niente
blu più scuri o più chiari: le sfumature (montagne di B, cuscini del divano)
sono bianco trasparente sul blu; i riquadri in evidenza sono gialli.

**Misure, uguali in tutti i post della stessa proposta (px su 1080):**

| | A · Biglietto | B · Calendario | C · Divano |
|---|---|---|---|
| Titolo | 104, sempre alto 2 righe (+ sottotitolo 40) | 104, sempre alto 2 righe | nome 150 su 2 righe; fascia con la data 72 |
| Dati | etichette 36, valori 50 | etichette 38, valori 56, note 40 | gancio 58 ("Alzati dal divano!"), righe 46, note 40 |
| In evidenza | orari, prezzi, scadenze in blu | orari e prezzi in giallo; riquadro giallo 54 | sotto la fascia un riquadro bianco uguale in tutti i post, testo blu; orari, prezzi e scadenze in un riquadrino blu con la scritta gialla |
| Iscrizioni | 40 / 46, nel biglietto | 40 / 48, in un riquadro bianco | 40 / 48, in fondo al riquadro bianco, dopo un filo |

Nel foglio di B mese 46, giorno 48, numero 250 e ora 58: il foglio è lungo
uguale anche quando l'ora non c'è (la gita).

---

## Il post del corso (presciistica)

Testi presi dalla mail, con post e story per ogni proposta.

**Rivisto il 10/10** dopo il primo giro: A sul giallo, che diventa il colore
di tutti i corsi; B senza "Torna il corso di", senza la linea del tempo e la
pausa di Natale, con la frase "Tutti i mercoledì fino al 13 gennaio"; logo
più grande in tutte e tre (150 px invece di 96–100). Poi B e C con le stesse
informazioni di A: titolo, mercoledì 21 ottobre, ore 19:30 e lezioni di
un'ora, Palestra Way Assauto ad Asti, ogni mercoledì fino al 13 gennaio, soci
tesserati e assicurati, iscrizioni in negozio o via mail con l'indirizzo.

- Testi presi dalla mail `Mail per Presciistica.docx`, niente di aggiunto:
  niente prezzo, niente nome dell'istruttore, niente telefoni.
- Testo grande: almeno 34 px nel post e 44 px nella story.
- Story: niente di importante nei 250 px in alto e nei 340 px in basso,
  dove Instagram mette il profilo e la risposta.

**Regola per dividere immagine e testo.** L'immagine gira da sola (WhatsApp,
schermate, inoltri): in tutte e tre c'è tutto quello che serve per andarci e
iscriversi (le informazioni di A). Il testo del post aggiunge l'invito,
l'istruttore dello scorso anno e la pausa di Natale. La mail va sempre anche
nel testo, perché dal testo si può copiare e da un'immagine no.

### A · Biglietto

<img src="post/corso-a.jpg" width="49%"> <img src="post/corso-a-story.jpg" width="49%">

**Idea.** È Ritocco portato al 4:5: il biglietto bianco sul giallo dei corsi,
con il bollo blu della data in alto. Il giallo vale per tutti i corsi (in
Genera post andrebbe cambiato il colore della categoria corso), e sul giallo
gli accenti sono il blu del club. Al posto della foto, il paesaggio disegnato
con una figura in posizione da sci. È la più vicina a quello che c'è già e
può diventare il modello "corso" di Genera post.

**Nell'immagine:** tutto. Titolo, primo giorno, orario e durata, palestra,
ogni mercoledì fino al 13 gennaio, per chi, iscrizioni e mail.

**Nel testo:** l'invito, l'istruttore dello scorso anno, le stesse
informazioni scritte per esteso.

**Perché:** è il biglietto completo, come quelli delle gite: chi lo riceve
inoltrato ha tutto quello che serve. È la più fitta delle tre.

```text
Alzati dal divano: è ora di prepararsi alla prossima stagione sci! ⛷️

Mercoledì 21 ottobre 2026 alle 19:30 riparte il corso
di ginnastica presciistica, nella palestra della Way Assauto di Asti.
Lezioni di un'ora con l'istruttore dello scorso anno,
tutti i mercoledì fino al 13 gennaio 2027 (escluso il periodo di Natale).

Il corso è riservato ai soci tesserati e assicurati
con lo Sci Club Don Bosco Asti.
Iscrizioni come sempre in negozio o via mail:
sciclubdonboscoasti@gmail.com

Vi aspettiamo numerosi!
#sciclubdonbosco #presciistica #sci
```

---

### B · Calendario

<img src="post/corso-b.jpg" width="49%"> <img src="post/corso-b-story.jpg" width="49%">

**Idea.** Il messaggio è la data. Un foglio di calendario con il 21 ottobre
e sotto una frase sola: "Tutti i mercoledì fino al 13 gennaio".
Fondo blu del club con neve e montagne, come Montagna.

**Nell'immagine:** le stesse informazioni di A. Il foglio porta giorno e ora;
accanto palestra, lezioni di un'ora e per chi (soci tesserati e assicurati);
sotto "Tutti i mercoledì fino al 13 gennaio" e le iscrizioni con la mail.

**Nel testo:** l'invito, l'istruttore dello scorso anno, la pausa di Natale.

**Perché:** chi salva l'immagine come promemoria vede subito giorno, ora e
fino a quando dura, e ha comunque tutto per iscriversi.

```text
📅 Segnatevi il mercoledì: dal 21 ottobre torna la ginnastica presciistica!

Ci vediamo alle 19:30 nella palestra della Way Assauto di Asti,
poi tutti i mercoledì fino al 13 gennaio 2027 (escluso il periodo di Natale).
Un'ora di preparazione mirata allo sci, con l'istruttore dello scorso anno.

👉 Riservato ai soci tesserati e assicurati con lo Sci Club Don Bosco Asti.
✍️ Iscrizioni come sempre in negozio o via mail:
sciclubdonboscoasti@gmail.com

#sciclubdonbosco #presciistica #sci
```

---

### C · Divano

<img src="post/corso-c.jpg" width="49%"> <img src="post/corso-c-story.jpg" width="49%">

**Idea.** Un manifesto. La prima riga della mail, «Alzati dal divano!»,
diventa il titolo, enorme, sul giallo del logo; sotto, un divano vuoto con
il telecomando lasciato lì e gli sci appoggiati. È la più diversa dai post
di sempre e quella che si nota di più scorrendo.

**Nell'immagine:** il titolo «Alzati dal divano!», il nome del corso e sotto
le stesse informazioni di A: primo appuntamento (giorno, ora, palestra), poi
tutti i mercoledì fino al 13 gennaio, lezioni di un'ora, soci tesserati e
assicurati, iscrizioni in negozio o via mail con l'indirizzo. Il divano si è
rimpicciolito per fare posto.

**Nel testo:** l'invito, l'istruttore dello scorso anno, la pausa di Natale.

**Perché:** il titolo grande si nota scorrendo, le informazioni sotto bastano
per iscriversi. Sul giallo si scrive solo blu scuro e il logo sta su bianco,
come chiedono le regole del marchio.

```text
Alzati dal divano: la prossima stagione sci si prepara adesso! 🛋️⛷️

Corso di ginnastica presciistica
📅 Si comincia mercoledì 21 ottobre 2026 alle 19:30
📍 Palestra della Way Assauto, Asti
🔁 Tutti i mercoledì fino al 13 gennaio 2027, escluso il periodo di Natale
⏱️ Lezioni di un'ora con l'istruttore dello scorso anno

Riservato ai soci tesserati e assicurati con lo Sci Club Don Bosco Asti.
Iscrizioni come sempre in negozio o via mail:
sciclubdonboscoasti@gmail.com

Vi aspettiamo numerosi!
#sciclubdonbosco #presciistica #sci
```

---

## Sorgenti

In `sorgenti/` una pagina HTML per tipo e proposta (`corso-a.html`,
`gita-b.html`...; `#post` o `#story` nell'indirizzo sceglie il formato, la
story c'è solo per il corso), i fogli comuni (`comune.css`, `comune.js`, e
`a.css`, `b.css`, `c.css` per gita, evento e calendario), le foto d'esempio
in `foto/`, `panoramica.html` e `tavola.html#a`, `#b`, `#c`.

`./rendi.sh` rifà tutti i JPEG con Chrome (il carattere Barlow è in
`../font/barlow/`, così non dipende dalla rete); `./rendi.sh verifica` controlla corpi minimi, fasce coperte della
story e testo tagliato.

---

## Le proposte di stile (D, E ed F)

Richiesta dell'11/10: un redesign con i colori del club ma con lo stile dei marchi
famosi dello sci. Solo l'ispirazione: niente loghi, galletti o strisce riconoscibili
dei marchi veri. Stessi testi e stesse foto di A, B e C, stesse misure (post 4:5 e
story del corso), stessi controlli di `rendi.sh verifica` (corpi minimi, fasce della
story). Il titolo è in **Barlow Condensed** (stessa famiglia di Barlow, licenza OFL),
in locale in `grafica/font/barlow-condensed/`: nel generatore sarebbe un font in più.
Il maiuscolo stretto è solo per titoli, date ed etichette; i dati restano in Barlow
dritto, minuscolo e grande, per chi legge con vista debole.

### D · Pista (stile da gara, alla Head)

<img src="post/corso-d.jpg" width="49%"> <img src="post/corso-d-story.jpg" width="49%">

- Sempre il **blu pieno** del club, usato come il nero dei marchi da gara; il giallo
  solo negli accenti. Angoli vivi, niente fiocchi né riquadri bianchi.
- La foto in alto tagliata **in diagonale**, con sotto la **doppia striscia gialla**
  parallela al taglio: è il segno della proposta. Senza foto (il corso), il blu con
  linee di velocità e la figura dell'esercizio in bianco.
- La **data** in numeri grandi corsivi (`17.01`) in un parallelogramma blu in alto a
  destra, col giorno in giallo.
- Il **titolo** in Barlow Condensed corsivo nero (900), maiuscolo, 124 px, sempre alto
  due righe. I dati su righe con un filo sottile: etichette gialle maiuscole 36,
  valori bianchi 48; orari, prezzi e scadenze in giallo.
- Le **iscrizioni** nella fascia gialla in fondo, col bordo alto in diagonale.
- Nel calendario i giorni sono etichette inclinate: domenica gialla, sabato bianca.

### E · Fascia (stile classico, alla Rossignol)

<img src="post/corso-e.jpg" width="49%"> <img src="post/corso-e-story.jpg" width="49%">

- Il **bianco** come fondo e tanto spazio vuoto; la foto grande ad angoli vivi e
  sotto la **doppia fascia** blu (spessa) e gialla (sottile), a tutta larghezza.
- La **data** in un riquadro bianco appoggiato sul bordo della foto: giorno, numero
  grande, mese.
- Sopra il titolo una **riga spaziata** che dice cos'è ("Corso", "Gita sociale",
  "Serata del club", "Le gite del mese"): nel generatore andrebbe presa dalla categoria.
- Il **titolo** in Barlow Condensed dritto (800), maiuscolo, blu, 112 px, sempre alto
  due righe. Dati con fili sottili: etichette grigie maiuscole 34, valori 46;
  orari, prezzi e scadenze in blu.
- Le **iscrizioni** nella fascia blu in fondo, la mail in giallo (contrasto 5,8:1).
- Senza foto (il corso), montagne disegnate a linee bianche sul blu, il sole giallo
  e la figura dell'esercizio.

### F · Diagonale (alla Ski Club of Great Britain)

<img src="post/corso-f.jpg" width="49%"> <img src="post/corso-f-story.jpg" width="49%">

Dagli esempi del loro Instagram: foto a tutta pagina, grandi blocchi di colore in
diagonale, tre livelli di testo ognuno col suo colore, dati brevi separati da "//".

- La **foto a tutta pagina** (meglio se con le persone della gita). In alto un velo
  blu che sfuma, con la riga bianca che dice cos'è (Barlow Condensed 42) e il
  **titolo giallo** in Barlow maiuscolo 98, sempre alto due righe.
- In basso il **grande blocco blu in diagonale**, che parte sempre dallo stesso
  punto: la **data in giallo** (Barlow maiuscolo 62), poi i dati in bianco 46 su
  righe brevi; orari, prezzi e scadenze in giallo; le barre gialle `//` solo fra
  due dati che stanno sulla stessa riga. In fondo le iscrizioni con la mail gialla.
- Il **logo nel triangolo bianco** in alto a destra: le regole del marchio lo
  vogliono su bianco. Lo stesso triangolo, più grande, potrebbe portare gli
  sponsor (come il blocco bianco dei loro post con gli sponsor).
- **Diverso da loro:** i dati non vanno mai sulla foto, perché con foto qualsiasi
  resterebbero illeggibili; solo bianco, giallo e blu al posto dei loro cinque colori.
  Il velo e il triangolo trasparente sul blocco fanno vedere sfumature di blu sulla
  foto: è il compromesso con la regola di un solo blu.
- Nel calendario il blocco non ha la riga della data (il mese è nel titolo).
- Senza foto (il corso) il blu con le montagne a linee, il sole giallo e la figura.

**Da decidere:** quale delle tre (o nessuna) portare nel generatore, accanto a
Ritocco, Montagna, Biglietto, Calendario e Divano.
