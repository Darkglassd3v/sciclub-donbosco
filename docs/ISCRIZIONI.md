# Iscrizioni di massa — preparazione e giorni di apertura

Per chi gestisce il sito. La guida per i volontari è in `GUIDA_VOLONTARI.md`
(una pagina, da stampare).

## Una settimana prima: prova generale

- [ ] **Un account per ogni volontario**, niente account condivisi (Gestione >
      Utenti). Al primo accesso ognuno cambia la password iniziale.
- [ ] **Ruoli giusti**: chi iscrive = Admin; chi sta in cassa = Admin o
      Tesoriere; chi segna le gite = Utente. Controllare in Gestione > Ruoli
      cosa vede ogni ruolo.
- [ ] **"Vedi come" per ogni ruolo** (Gestione > Ruoli): aprire Soci,
      Pagamenti, Gite e controllare che ci sia quello che serve, e niente di più.
- [ ] **Listino**: prezzi di tessere, abbonamenti, corsi e presciistica
      giusti e attivi (Gestione > Impostazioni). Partenze del sabato e della
      domenica.
- [ ] **Dieci iscrizioni di prova in contemporanea**, da tre o quattro
      dispositivi diversi: un rinnovo, un socio nuovo, una famiglia con chi
      paga per tutti, un corso con il giorno, due abbonamenti alla stessa
      persona. Poi incassare da Pagamenti.
- [ ] **Controlli**: lanciare `supabase/scripts/controlli.sh` dopo la prova.
      Le iscrizioni di prova devono comparire nelle anomalie se fatte male.
- [ ] **Togliere le iscrizioni di prova**: Soci > "Togli dalla stagione"
      (superadmin), e rilanciare i controlli.
- [ ] **Stampare** la guida per i volontari, una copia per postazione.
- [ ] **Telefoni**: aprire Gite sui telefoni di chi lo userà e salvarla
      nella schermata iniziale.

## Nei giorni delle iscrizioni

**Controlli ogni 15 minuti.** Sul PC, in Claude Code nella cartella del
repository:

```
/loop 15m lancia supabase/scripts/controlli.sh e avvisami solo se ci sono anomalie nuove rispetto al giro prima, con nome e cosa fare. Non modificare mai dati.
```

I controlli usano l'utente `monitor` del database (`supabase/.monitor_connect`),
che può solo leggere: né lo script né Claude possono cambiare un dato.
Le correzioni le fa un volontario dal sito (Soci, Pagamenti), o il
superadmin dopo averle approvate.

Cosa controllano (`supabase/scripts/controlli.sql`):

| Anomalia | Cosa fare |
|---|---|
| Doppione: stesso codice fiscale / nome e data | Aprire le due schede in Soci: tenere quella giusta, togliere dalla stagione l'altra |
| Tesserato senza codice fiscale | Chiederlo al socio: senza non si assicura |
| Codice fiscale scritto male | Correggerlo in Soci (il modulo propone quello giusto) |
| Tessera senza numero | Aprire il socio in Soci e salvare: il numero viene proposto |
| Abbonamento o corso senza tessera | Scegliere la tessera in Soci |
| Corso senza giorno | Scegliere sabato o domenica in Soci |
| Pagato più del dovuto | Controllare in Pagamenti > Storico; correggere con Modifica importi |
| Pagato da un familiare non iscritto | Iscrivere il familiare, o togliere "La paga un familiare" |

**Se qualcosa non va**: il volontario lo dice a chi segue il sito (nome del
socio, pagina, cosa ha premuto, cosa è comparso). Si passa a Claude con il
testo dell'errore: legge con `monitor` e propone la correzione.

## Dopo

- [ ] `drop role monitor;` (con l'utente postgres) e cancellare
      `supabase/.monitor_connect`: l'utente di sola lettura serve solo per la
      campagna. Si ricrea con `supabase/scripts/crea_monitor.sql`.
- [ ] Controllare in Actions che il backup (martedì, giovedì, sabato) sia
      andato.
