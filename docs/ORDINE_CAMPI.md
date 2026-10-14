# Ordine dei campi della scheda Soci — proposta da approvare

Riferimento: il modulo di carta **Tesseramento 2026/2027** (la scheda compilata a mano). Chi iscrive
copia il modulo dall'alto in basso: la pagina deve chiedere le cose nello stesso ordine. I prezzi
scritti sul modulo non si considerano (sono quelli vecchi). Non si aggiungono né si tolgono campi:
cambia solo l'ordine. Le righe con **cambia** sono le differenze da oggi.

## Pagina Soci (`web/index.html`)

Le quattro sezioni restano quelle di oggi e nello stesso ordine, come i blocchi del modulo:
Anagrafica, Tessera, Gite e corsi, Pagamento.

### 1. Anagrafica

Le righe del modulo, una dopo l'altra.

| # | Campi | Sul modulo | Oggi |
|---|-------|------------|------|
| 1 | Cognome* · Nome* | Cognome, Nome | uguale |
| 2 | Città di nascita · Provincia di nascita · Codice fiscale (con l'avviso sotto) | nato a, Prov., C.F. | uguale |
| 3 | Data di nascita · Sesso | il (data) | uguale. Il sesso non è sul modulo: resta qui, vicino al codice fiscale a cui serve |
| 4 | Indirizzo di residenza | residente in via | uguale |
| 5 | Città di residenza · Provincia · CAP | Città, Provincia, Cap | uguale |
| 6 | Telefono* · Email | tel, e-mail (ultima riga) | **cambia**: oggi il telefono sta prima dell'indirizzo |

### 2. Tessera

| # | Campo | Sul modulo | Oggi |
|---|-------|------------|------|
| 1 | Numero tessera | "tess. n." in alto a destra, la prima cosa | **cambia**: oggi è in fondo alla sezione |
| 2 | Tipologia tessera* | il primo blocco di caselle | uguale |
| 3 | Agevolazione famiglia | sotto le tessere | uguale |

Voci della **tipologia tessera** nell'ordine del modulo, non più per prezzo (**cambia**):

1. Tessera ordinaria con assicurazione Base
2. Solo tessera, senza assicurazione
3. Tessera ordinaria con Neve Plus (oggi non attiva: non compare)
4. Tessera ordinaria con Global Sport
5. Tessera scontata (nati nel '57 e prima) con assicurazione Base
6. Tessera scontata senza assicurazione
7. Direttivo (non è sul modulo: in fondo)

Oggi l'ordine è per prezzo: Direttivo, scontata senza, solo tessera, scontata con Base, ordinaria
Base, Global Sport. Le **agevolazioni famiglia** restano come oggi: 3, 4, 5 persone senza
assicurazione, poi 3, 4, 5 con l'assicurazione (sul modulo sono le due colonne).

### 3. Gite e corsi

| # | Campo | Sul modulo | Oggi |
|---|-------|------------|------|
| 1 | Abbonamenti gite | blocco GITE | uguale |
| 2 | Presciistica | sotto gli abbonamenti | uguale |
| 3 | Partenza della domenica | PARTENZE DOMENICA | **cambia**: oggi in fondo, dopo il sabato |
| 4 | Partenza del sabato | PARTENZE SABATO | **cambia**: oggi in fondo, dopo il corso |
| 5 | Corso sci o snowboard | CORSI DI SCI E SNOWBOARD | **cambia**: oggi prima delle partenze |
| 6 | Giorno del corso* | SABATO / DOMENICA, sopra i corsi | uguale (vedi la domanda 1) |

Voci nell'ordine del modulo (**cambia**, oggi per prezzo e poi per nome):

- Abbonamenti: martedì, domenica, sabato, jolly, gita singola.
- Corsi: adulti, ragazzi 10-14 anni, baby fino a 10 anni, snowboard.
- Partenze: già nell'ordine del modulo (alfabetico). Domenica: Asti, Opessina-Montegrosso.
  Sabato: Asti, Felizzano, Opessina-Montegrosso, Portacomaro.

### 4. Pagamento

Come oggi: Acconto versato, Totale scritto a mano, Chi paga la quota; in basso la barra con
Totale e Residuo. Il modulo ha Totale dovuto, Acconto, Saldo: gli stessi dati.

## Stampa (il PDF della scheda)

Le stesse sezioni, nello stesso ordine della pagina. Cambia solo Gite e corsi: Abbonamenti,
Presciistica, **Partenza della domenica, Partenza del sabato, Corso** (oggi il corso viene prima
delle partenze e il sabato prima della domenica). Anagrafica, Residenza e contatti, Tessera e
Pagamento seguono già il modulo.

## Cosa serve per l'ordine delle voci

Oggi la pagina mette le voci in ordine di prezzo (`caricaPrezzi()` in `web/shared.js`). Per
l'ordine del modulo serve una colonna `position` nel listino (`prices`), riempita una volta da
`supabase/schema.sql`; una voce nuova va in fondo. Impostazioni mostra le voci nello stesso
ordine. È una modifica dello schema in produzione: si fa insieme a quella delle assicurazioni (un
backup e una review sola). I nomi delle voci restano quelli del listino di oggi.

## Domande

1. **Giorno del corso**: sul modulo sabato/domenica sta sopra i corsi. Nella pagina compare solo
   dopo aver scelto un corso, per non far rispondere chi il corso non lo fa. Lo lascio sotto il
   corso?
2. **Numero tessera** primo della sezione Tessera: va bene, o lo vuoi nella testata col nome?
3. **Direttivo** in fondo alle tessere: va bene?
