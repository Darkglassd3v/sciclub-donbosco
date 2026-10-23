# Backup e dati quando il sito non funziona

Tutti i dati del gestionale (soci, pagamenti, abbonamenti, gite, bilancio, social) stanno in
un database Supabase. Se il sito o il database non rispondono, i dati si leggono dai backup.

## Dove sono i backup

Il backup parte da solo martedì, giovedì e sabato verso le 5 del mattino
(`.github/workflows/backup-db.yml`). Ogni backup è in tre posti:

| Dove | Per quanto | Come ci si arriva |
| --- | --- | --- |
| GitHub | 90 giorni | Repository → **Actions** → **Backup del database** → un'esecuzione → **Artifacts** → `backup-AAAA-MM-GG` (uno zip). Serve un account GitHub. |
| PC del club | per sempre | Cartella `~/Backup/sciclub-donbosco/backup-AAAA-MM-GG/`. Si aggiorna ogni giorno alle 13 (o alla prima accensione dopo). |
| Google Drive del club | per sempre | Cartella `SciClubDonBosco-backup`, solo dopo averla attivata (vedi sotto). |

Ogni backup contiene due file, tutti e due cifrati con la **frase dei backup** (nel KeePass di
chi segue il sito; sul PC del club anche in `supabase/.backup_passphrase`). Senza la frase i
backup non si aprono: non perderla.

- `dati-AAAA-MM-GG.7z`: ogni tabella in un file che si apre con Excel. È quello da usare per
  **leggere** i dati.
- `backup-AAAA-MM-GG.dump.gpg`: il database intero, per **rimetterlo** su un database nuovo.

I backup di prima del 23/10/2026 hanno solo il file `.dump.gpg`.

## Leggere i dati senza il sito

1. Prendere il backup più recente (PC del club, Google Drive o GitHub) e, se è uno zip,
   estrarlo.
2. Aprire `dati-AAAA-MM-GG.7z` con 7-Zip (gratuito, <https://www.7-zip.org>; su Mac Keka, su
   Linux `7z x dati-AAAA-MM-GG.7z`). Alla richiesta della password inserire la frase dei backup.
3. Nella cartella estratta: `LEGGIMI.txt` elenca i file e quante righe ha ciascuno; il file
   dei soci è `soci.csv`. Un doppio clic lo apre in Excel o LibreOffice.

I file hanno colonne separate da «;», decimali con la virgola e ore italiane. I nomi delle
colonne sono quelli del database, in inglese: `LEGGIMI.txt` traduce i principali. Le immagini
dei post non ci sono (troppo grandi per una cella di Excel): restano nel file `.dump.gpg`.

**Al termine cancellare la cartella estratta**: contiene i dati personali dei soci in chiaro.

## Il sito non si apre ma il database funziona

Le pagine sono file statici: se GitHub Pages non risponde, si aprono dal PC del club con lo
stesso database e gli stessi account.

```bash
cd web && python3 -m http.server 8000
```

Poi nel browser `http://localhost:8000/login.html`.

## Rimettere il database (per un tecnico)

Serve se il progetto Supabase è perso o cancellato. Se è solo in pausa, si riattiva dalla
dashboard di Supabase.

1. Aprire il dump (serve `pg_restore` 17, come il server):

   ```bash
   gpg --batch --pinentry-mode loopback --passphrase-file supabase/.backup_passphrase \
       -o backup.dump -d backup-AAAA-MM-GG.dump.gpg
   pg_restore --list backup.dump | head
   ```

2. Su un progetto Supabase nuovo: lo schema con `supabase/schema.sql`, poi i dati delle tabelle
   con `pg_restore --data-only --no-owner -n public -d "$DB" backup.dump`.
3. Aggiornare indirizzo e chiave pubblica in `web/config.js` e `ricerca/config.js`, poi
   pubblicare (vedi `docs/SVILUPPO.md`). Gli account si ricreano da **Utenti**
   (`docs/ACCOUNT.md`).

Provato il 01/10/2026: ripristino completo in un Postgres 17 vuoto, con i conteggi uguali alla
produzione. Il ripristino dei soli dati di `public` sopra lo schema lo fanno a ogni giro le
prove di `test-reale/avvia.sh`. Su un progetto Supabase nuovo la procedura non è ancora stata
provata.

## La copia sul PC del club

È `supabase/scripts/scarica-backup.sh`, avviato ogni giorno da un timer di systemd
(installato con `bash supabase/scripts/scarica-backup.sh --installa`). Scarica i backup nuovi
da GitHub e controlla che si aprano con la frase. Se qualcosa non va, compare un avviso sul
desktop, e il backup resta da controllare (cartella `backup-AAAA-MM-GG.da-controllare`) finché
non si apre. I casi sono tre:

- il download non riesce, oppure `gh` non è più collegato a GitHub (`gh auth status`);
- un backup non si apre: la frase in `supabase/.backup_passphrase` è cambiata;
- l'ultimo backup ha più di 4 giorni: il workflow si è fermato. In un repository pubblico GitHub
  sospende gli orari dopo 60 giorni senza commit (d'estate): si riattiva da Actions.

Controlli: `systemctl --user list-timers sciclub-backup.timer` e
`journalctl --user -u sciclub-backup`. Le prove sono in `./supabase/test_backup.sh`.

## Attivare la copia su Google Drive (una volta sola)

Sul PC del club:

1. `sudo apt install rclone`
2. `rclone config`: `n` (nuovo), nome `drive`, tipo `drive`, client_id e secret vuoti, scope
   `drive.file` (rclone vede solo i file che crea lui), poi l'accesso con l'account Google del
   club nel browser.
3. `gh secret set RCLONE_CONFIG -R darkglassd3v/sciclub-donbosco < ~/.config/rclone/rclone.conf`
4. Su GitHub: **Actions** → **Backup del database** → **Run workflow** (branch `dev`). Su Drive
   compare la cartella `SciClubDonBosco-backup` coi due file.

Il file di rclone contiene la chiave di accesso a quel Drive: resta solo sul PC e nei secret di
GitHub, mai nel repository.
