# Piano 2.3 — Abbonamento dal pannello gite + resoconto in amministrazione

## Stato (aggiornato a ogni commit)

- [x] Piano scritto
- [ ] 1. Vista `admin_summary` + controllo in `verifica.sql`
- [ ] 2. Riquadri in `web/admin.html`
- [ ] 3. Pannello gite: solo tesserati in "senza abbonamento"
- [ ] 4. Pannello gite: assegnazione in coda (update condizionato)
- [ ] 5. Pannello gite: pulsanti «Assegna · pagato» / «Assegna · da pagare»
- [ ] 6. Prova sul telefono, README/DOCUMENTAZIONE, `graphify update .`

## Decisioni prese

- L'abbonamento gite si assegna **solo a chi è tesserato**: socio della
  stagione con `card_type` valorizzato e diverso da `NO`.
- **Nessuna tabella nuova.** Si lavora su `members`, come il form soci
  (`web/index.html`): il nome va in `pass_type`, il prezzo si prende dal listino
  `prices` (categoria `ABBONAMENTO`) e si somma a `total`.
- **Pagato / da pagare.** "Pagato" aggiunge lo stesso prezzo anche a `paid`, e
  il saldo resta invariato. "Da pagare" tocca solo `total`, e il saldo sale.
  Correzioni successive: pannello incassi, come oggi.
- **Incasso corsi** = soci con `course_type` × prezzo di listino CORSO
  (sabato o domenica indifferente).
- **Incasso totale** = `sum(paid)` della stagione.
- **Tesserati** = righe della stagione con `card_type` non vuoto e diverso da `NO`.
- **Rete**: stesse regole delle gite scalate. L'assegnazione va in coda
  (localStorage) e riparte da sola; un secondo invio non addebita due volte.

## 1. Pannello gite (`ricerca/gite.html`)

### 1a. Solo tesserati in "senza abbonamento"

`cercaSenzaAbbonamento()`: alla query si aggiunge il filtro sulla tessera
(`card_type` non nullo e diverso da `NO`). Si legge anche `paid`.

### 1b. Due pulsanti al posto di uno

Per ogni socio: la tendina abbonamento di oggi (`opzioniAbbonamento`, dal
listino) e due pulsanti, **«Assegna · pagato»** e **«Assegna · da pagare»**.

### 1c. L'assegnazione passa dalla coda

Le voci di `coda` hanno un `tipo`:

- `gita`: le voci vecchie, senza tipo, valgono gita;
- `abbonamento`: `{ id, tipo, socio, nome, prezzo, pagato, total, paid }`.

Il ciclo d'invio, per `abbonamento`, fa un update **condizionato** su `members`:

```js
sb.from("members")
  .update({
    pass_type: voce.nome,
    total: voce.total + voce.prezzo,
    paid:  voce.paid  + (voce.pagato ? voce.prezzo : 0),
  })
  .eq("id", voce.socio)
  .or("pass_type.is.null,pass_type.eq.NO")   // solo se non ce l'ha ancora
  .select("id, pass_type")
```

- Una riga aggiornata: fatto.
- Zero righe: si rilegge `pass_type` del socio. Se è uguale a `voce.nome`,
  era un ritentativo già andato a buon fine e la voce esce senza errore. Se è
  diverso, un altro telefono ha assegnato un altro abbonamento: la voce esce e
  si avvisa col nome del socio.
- Errore di rete: la voce resta in coda, come per le gite.
- Rifiuto del database: la voce esce e si avvisa col nome del socio.

Il filtro su `pass_type` rende l'operazione ripetibile senza bisogno di un
`client_id` salvato: il primo invio riuscito cambia la condizione, quindi un
secondo invio non trova più la riga e non somma di nuovo.

### 1d. A schermo, finché la voce è in coda

Il socio sparisce dall'elenco "senza abbonamento" e compare in quello
principale con la dicitura «in invio». Le gite gli si possono segnare
subito: vanno in coda dopo l'abbonamento e partono nell'ordine giusto.

`assegna()` attuale: sostituita dall'accodamento.

## 2. Pannello amministrazione (`web/admin.html`)

### 2a. Vista `admin_summary` (`supabase/schema.sql`)

Stessa impostazione `security_invoker` delle viste esistenti.

```sql
create or replace view public.admin_summary as
select
  (select coalesce(sum(p.price), 0)
     from public.members m
     join public.prices p on p.category = 'CORSO' and p.name = m.course_type
    where m.enrolled_at >= public.current_season())            as courses_income,
  (select coalesce(sum(paid), 0) from public.members
    where enrolled_at >= public.current_season())              as total_collected,
  (select count(*) from public.members
    where enrolled_at >= public.current_season()
      and card_type is not null and upper(card_type) <> 'NO')  as card_holders;
```

### 2b. Tre riquadri in cima alla pagina

| Riquadro | Campo |
|---|---|
| Incasso corsi | `courses_income` |
| Incasso totale | `total_collected` |
| Tesserati | `card_holders` |

Si ricaricano con l'ascolto in tempo reale già presente nella pagina.

## 3. Verifiche

In `supabase/verifica.sql`:

- `admin_summary.courses_income` = conteggio corsi × prezzo, calcolato a mano;
- `card_holders` esclude `card_type` nullo o `NO`.

A mano, col telefono:

- tesserato, «pagato»: saldo invariato, `total` e `paid` +prezzo;
- tesserato, «da pagare»: saldo +prezzo;
- un non tesserato non compare nell'elenco;
- in modalità aereo: assegnare, segnare una gita, riattivare la rete. Arrivano
  abbonamento poi gita, una volta sola;
- doppio tocco, o ricarica della pagina con la voce in coda: nessun doppio
  addebito.

## 4. Chiusura

- `README.md` e `docs/DOCUMENTAZIONE.md`: aggiornare le righe su pannello
  gite e amministrazione.
- `graphify update .`
- Commit solo dopo conferma dell'utente.

## Ordine di lavoro

1. Vista `admin_summary`, i casi in `verifica.sql`, poi i riquadri in
   `web/admin.html` (piccolo e indipendente).
2. `ricerca/gite.html`: filtro tesserati, poi coda con tipo, poi i due pulsanti.
3. Prova sul telefono, documentazione, graphify.
