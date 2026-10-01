-- Sci Club Don Bosco 2.0 — verifica della migrazione
--
-- Da eseguire nell'editor SQL di Supabase dopo aver caricato tutti i file di
-- supabase/migration/. È una sola query: restituisce una tabella di controlli,
-- così l'esito si legge tutto insieme.
--
-- Non modifica nulla: sola lettura, rieseguibile quando si vuole.
--
-- Colonna ESITO:
--   OK              il controllo è passato
--   !! CONTROLLARE  qualcosa non torna, vedi la colonna "trovato"
--   info            dato informativo, non è un errore

with
  n_soci        as (select count(*)::bigint c from public.members),
  n_prezzi      as (select count(*)::bigint c from public.prices),
  n_partenze    as (select count(*)::bigint c from public.departures),
  n_dup         as (select coalesce(sum(n - 1), 0)::bigint c
                      from (select count(*) n from public.members
                             where legacy_id is not null
                             group by legacy_id having count(*) > 1) x),
  n_viste       as (select count(*)::bigint c from information_schema.views
                     where table_schema = 'public'
                       and table_name in ('households','season_totals','card_counts',
                                          'pass_counts','course_counts','departure_counts')),
  n_rls         as (select count(*)::bigint c from pg_tables
                     where schemaname = 'public'
                       and tablename in ('members','prices','departures')
                       and rowsecurity),
  n_policy      as (select count(*)::bigint c from pg_policies where schemaname = 'public'),
  n_saldo       as (select count(*)::bigint c from information_schema.columns
                     where table_name = 'members' and column_name = 'balance'
                       and is_generated = 'ALWAYS'),
  n_realtime    as (select count(*)::bigint c from pg_publication_tables
                     where pubname = 'supabase_realtime' and tablename = 'members'),
  n_saldo_err   as (select count(*)::bigint c from public.members
                     where balance is distinct from (total - paid)),
  n_stagione    as (select total_members::bigint c from public.season_totals),
  n_nascita     as (select count(*)::bigint c from public.members where birth_date is not null),
  n_cf          as (select count(*)::bigint c from public.members where tax_code is not null),
  n_tel         as (select count(*)::bigint c from public.members where phone is not null),
  n_fam         as (select count(payer_id)::bigint c from public.members),
  n_tesserati   as (select coalesce(sum(count), 0)::bigint c from public.card_counts),
  n_riepilogo   as (select card_holders::bigint c from public.admin_summary),
  n_incassi_corsi as (select count(*)::bigint c from public.season_breakdown
                      where category = 'COURSE' and label ilike 'INCASSO%'),
  n_fam_orfani  as (select count(*)::bigint c from public.members
                     where legacy_payer_id is not null and legacy_payer_id <> '' and payer_id is null),
  n_archivio    as (select count(*)::bigint c from public.members
                     where enrolled_at < date '2001-01-01'),
  -- Bilancio stagione (2.3): movimenti extra, saldo banca, storico chiuso.
  n_rls_bil     as (select count(*)::bigint c from pg_tables
                     where schemaname = 'public'
                       and tablename in ('ledger_entries','season_accounts')
                       and rowsecurity),
  bil           as (select * from public.season_balance),
  bil_calc      as (select bank_opening + members_collected + other_income - expenses c from bil),
  n_chiuse_err  as (select count(*)::bigint c from public.season_history
                     where bank_closing is not null
                       and bank_closing is distinct from
                           (bank_opening + collected + other_income - expenses)),
  n_mov_err     as (select count(*)::bigint c from public.ledger_entries
                     where amount <= 0 or kind is null or kind not in ('ENTRATA','USCITA'))

select * from (
  values
    (1, 'Anagrafiche caricate',
        '5778', (select c::text from n_soci),
        case when (select c from n_soci) = 5778 then 'OK' else '!! CONTROLLARE' end),
    (2, 'Anagrafiche duplicate',
        '0', (select c::text from n_dup),
        case when (select c from n_dup) = 0 then 'OK' else '!! CONTROLLARE' end),
    (3, 'Voci di listino (prezzi)',
        '22', (select c::text from n_prezzi),
        case when (select c from n_prezzi) = 22 then 'OK' else '!! CONTROLLARE' end),
    (4, 'Luoghi di partenza',
        '5', (select c::text from n_partenze),
        case when (select c from n_partenze) = 5 then 'OK' else '!! CONTROLLARE' end),
    (5, 'Viste di riepilogo presenti',
        '6', (select c::text from n_viste),
        case when (select c from n_viste) = 6 then 'OK' else '!! CONTROLLARE' end),
    (6, 'Row Level Security attiva (members, prices, departures)',
        '3', (select c::text from n_rls),
        case when (select c from n_rls) = 3 then 'OK' else '!! CONTROLLARE' end),
    (7, 'Policy di accesso definite',
        '>= 16', (select c::text from n_policy),
        case when (select c from n_policy) >= 16 then 'OK' else '!! CONTROLLARE' end),
    (8, 'Colonna balance generata dal database',
        '1', (select c::text from n_saldo),
        case when (select c from n_saldo) = 1 then 'OK' else '!! CONTROLLARE' end),
    (9, 'Saldi incoerenti (devono essere impossibili)',
        '0', (select c::text from n_saldo_err),
        case when (select c from n_saldo_err) = 0 then 'OK' else '!! CONTROLLARE' end),
    (10,'Realtime attivo sulla tabella members',
        '1', (select c::text from n_realtime),
        case when (select c from n_realtime) = 1 then 'OK' else '!! CONTROLLARE' end),
    (11,'Anagrafiche marcate come archivio storico',
        '5778', (select c::text from n_archivio),
        case when (select c from n_archivio) = (select c from n_soci) then 'OK' else 'info' end),
    (12,'Soci nella stagione corrente',
        '0 finche non si iscrive nessuno', (select c::text from n_stagione),
        'info'),
    (13,'Collegamenti familiari ricostruiti',
        'dipende dai dati', (select c::text from n_fam),
        'info'),
    (14,'Collegamenti familiari non risolti',
        '0', (select c::text from n_fam_orfani),
        case when (select c from n_fam_orfani) = 0 then 'OK' else '!! CONTROLLARE' end),
    -- Valori attesi calcolati sul foglio di partenza. 56 date di nascita non
    -- erano interpretabili e una cella "telefono" conteneva solo spazi: in
    -- entrambi i casi il campo resta vuoto, la riga non viene scartata.
    (15,'Anagrafiche con data di nascita',
        '5722 (56 date illeggibili)', (select c::text from n_nascita), 'info'),
    (16,'Anagrafiche con codice fiscale',
        '1138 (il foglio non lo aveva per tutti)', (select c::text from n_cf), 'info'),
    (17,'Anagrafiche con telefono',
        '4879', (select c::text from n_tel), 'info'),
    (18,'Tesserati nel resoconto uguali al conteggio tessere',
        (select c::text from n_tesserati), (select c::text from n_riepilogo),
        case when (select c from n_tesserati) = (select c from n_riepilogo) then 'OK' else '!! CONTROLLARE' end),
    (19,'Incassi corsi dello storico fuori da COURSE_INCOME',
        '0', (select c::text from n_incassi_corsi),
        case when (select c from n_incassi_corsi) = 0 then 'OK' else '!! CONTROLLARE' end),
    (20,'Row Level Security attiva (ledger_entries, season_accounts)',
        '2', (select c::text from n_rls_bil),
        case when (select c from n_rls_bil) = 2 then 'OK' else '!! CONTROLLARE' end),
    (21,'Bilancio: banca attuale = iniziale + quote + entrate - uscite',
        (select c::text from bil_calc), (select bank_current::text from bil),
        case when (select bank_current from bil) = (select c from bil_calc) then 'OK' else '!! CONTROLLARE' end),
    (22,'Bilancio: quote incassate uguali al riepilogo stagione',
        (select total_collected::text from public.season_totals), (select members_collected::text from bil),
        case when (select members_collected from bil) = (select total_collected from public.season_totals)
             then 'OK' else '!! CONTROLLARE' end),
    (23,'Stagioni chiuse con saldo banca finale incoerente',
        '0', (select c::text from n_chiuse_err),
        case when (select c from n_chiuse_err) = 0 then 'OK' else '!! CONTROLLARE' end),
    -- amount <= 0 dovrebbe essere impossibile (quantity > 0) salvo prezzo
    -- unitario 0: un movimento da zero euro è comunque da guardare.
    (24,'Movimenti con importo <= 0 o tipo non valido',
        '0', (select c::text from n_mov_err),
        case when (select c from n_mov_err) = 0 then 'OK' else '!! CONTROLLARE' end)
) as t(n, controllo, atteso, trovato, esito)
order by n;
