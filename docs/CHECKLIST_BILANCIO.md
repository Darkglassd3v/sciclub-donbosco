# Checklist manuale — Bilancio stagione (2.3)

Prima: eseguire supabase/verifica.sql, controlli 20-24 tutti OK.

## Menu
- [ ] Da **admin**: la voce "Bilancio" compare in tutte le pagine, subito prima di "Amministrazione", e non lampeggia al caricamento.
- [ ] Da **superadmin**: la voce "Bilancio" compare come sopra.
- [ ] Da **utente** (e ospite/kiosk): la voce "Bilancio" non compare mai, nemmeno per un istante.

## Pagina Bilancio
- [ ] Da **utente**: aprendo bilancio.html a mano si viene respinti (requireRole admin), nessun dato visibile.
- [ ] Da **admin**: la pagina si apre, riquadri Bilancio e sezione Movimenti presenti.
- [ ] Riquadri coerenti: banca attuale = saldo iniziale + quote soci + altre entrate - uscite.
- [ ] Quote soci uguale all'incassato del Riepilogo della stagione corrente.

## Saldo iniziale
- [ ] Senza riga salvata: il valore è segnato come **proposto** (chiusura della stagione precedente, oppure 0).
- [ ] Salvando un valore: diventa **salvato**, resta dopo il ricaricamento, e la banca attuale si aggiorna.
- [ ] Salvando lo stesso valore proposto: passa comunque da proposto a salvato.

## Movimenti
- [ ] Aggiungere un'ENTRATA (es. Giornalieri, 3 x 25): compare in elenco con importo 75, altre entrate +75.
- [ ] Aggiungere un'USCITA (es. Pullman, 1 x 400): uscite +400, banca attuale -400.
- [ ] Quantità 0 o prezzo negativo: rifiutati con messaggio in pagina (nessun alert del browser).
- [ ] Eliminare un movimento: conferma in pagina (no confirm() del browser), sparisce e i totali tornano indietro.

## Chiusura stagione (stagione.html)
- [ ] Il pulsante apre un dialog nativo, non un confirm() del browser.
- [ ] Il dialog spiega cosa succede e mostra il saldo finale previsto (= banca attuale della pagina Bilancio).
- [ ] Senza scrivere CHIUDI STAGIONE la chiusura non parte; Annulla/Esc chiude senza effetti.
- [ ] Dopo la chiusura i movimenti della stagione chiusa restano in ledger_entries (non azzerati).
- [ ] La stagione cambia alla chiusura, non il 1° settembre: prima di chiudere, anche dopo il 1/9, il Bilancio mostra ancora la stagione vecchia con le sue quote; dopo la chiusura mostra la stagione successiva, quote a 0 e saldo iniziale proposto = saldo finale appena archiviato.
- [ ] Un movimento aggiunto dopo la chiusura finisce nella stagione nuova.

## Riepilogo stagione chiusa (riepilogo.html?stagione=...)
- [ ] Stagione chiusa dopo la 2.3: la fascia mostra "Banca: <iniziale> → <finale>" e il finale torna con verifica.sql n. 23.
- [ ] Stagione chiusa prima della 2.3 (colonne banca vuote): la fascia mostra "Banca: n.d.".
