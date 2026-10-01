-- Controlli durante le iscrizioni: solo letture, nessuna modifica.
--
--   supabase/scripts/controlli.sh      (usa supabase/.monitor_connect)
--
-- Una riga per anomalia trovata: controllo, quante, esempi. Nessuna riga =
-- tutto a posto. In fondo il riassunto della stagione e dell'ultima ora.
-- "Iscritto" = enrolled_at valorizzato (la stagione in corso); "NO" e vuoto
-- valgono come voce non scelta, come nel resto del gestionale.

\pset footer off
\pset null ''

with iscritti as (
  select m.*,
         nullif(nullif(upper(trim(m.card_type)), 'NO'), '')   as tessera,
         nullif(nullif(upper(trim(m.course_type)), 'NO'), '') as corso,
         nullif(nullif(upper(trim(m.pass_type)), 'NO'), '')   as abbonamento
    from public.members m
   where m.enrolled_at is not null
),
nome as (select id, last_name || ' ' || first_name as chi from public.members),
anomalie (controllo, chi) as (
  -- Stesso codice fiscale su due anagrafiche, almeno una iscritta.
  select 'Doppione: stesso codice fiscale', string_agg(n.chi, ' / ' order by n.chi)
    from public.members m join nome n using (id)
   where nullif(trim(m.tax_code), '') is not null
   group by upper(trim(m.tax_code))
  having count(*) > 1 and bool_or(m.enrolled_at is not null)
  union all
  -- Stesso nome e data di nascita: spesso la stessa persona inserita due volte.
  select 'Doppione: stesso nome e data di nascita', string_agg(n.chi, ' / ' order by n.chi)
    from public.members m join nome n using (id)
   where m.birth_date is not null
   group by upper(trim(m.last_name)), upper(trim(m.first_name)), m.birth_date
  having count(*) > 1 and bool_or(m.enrolled_at is not null)
  union all
  select 'Tesserato senza codice fiscale (non si può assicurare)', last_name || ' ' || first_name
    from iscritti where tessera is not null and nullif(trim(tax_code), '') is null
  union all
  -- Solo la forma (16 caratteri al posto giusto): il carattere di controllo lo
  -- verifica già il modulo Soci (web/codicefiscale.js).
  select 'Codice fiscale scritto male', last_name || ' ' || first_name || ': ' || tax_code
    from iscritti
   where nullif(trim(tax_code), '') is not null
     and upper(trim(tax_code)) !~ '^[A-Z]{6}[0-9LMNPQRSTUV]{2}[ABCDEHLMPRST][0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{3}[A-Z]$'
  union all
  select 'Tessera senza numero', last_name || ' ' || first_name
    from iscritti where tessera is not null and nullif(trim(card_number), '') is null
  union all
  select 'Abbonamento o corso senza tessera', last_name || ' ' || first_name
    from iscritti where tessera is null and (corso is not null or abbonamento is not null)
  union all
  select 'Corso senza giorno (sabato o domenica)', last_name || ' ' || first_name
    from iscritti where corso is not null and course_day is null
  union all
  select 'Pagato più del dovuto', last_name || ' ' || first_name || ': pagato ' || paid || ', totale ' || total
    from iscritti where coalesce(paid, 0) > coalesce(total, 0)
  union all
  select 'Importi negativi', last_name || ' ' || first_name
    from iscritti where coalesce(paid, 0) < 0 or coalesce(total, 0) < 0
  union all
  -- La quota la paga un familiare che non è iscritto: in Pagamenti non compare.
  select 'Pagato da un familiare non iscritto', i.last_name || ' ' || i.first_name || ' → ' || p.last_name || ' ' || p.first_name
    from iscritti i join public.members p on p.id = i.payer_id
   where p.enrolled_at is null
)
select controllo, count(*) as quanti,
       string_agg(chi, ' | ' order by chi) filter (where chi is not null) as esempi
  from anomalie
 group by controllo
 order by controllo;

-- Riassunto: per capire a colpo d'occhio se le iscrizioni stanno andando.
select (select count(*) from public.members where enrolled_at is not null)                      as iscritti,
       (select count(*) from public.members where enrolled_at > now() - interval '1 hour')     as iscritti_ultima_ora,
       (select count(*) from public.member_amount_changes where changed_at > now() - interval '1 hour') as cambi_importi_ultima_ora,
       (select coalesce(sum(paid), 0) from public.members where enrolled_at is not null)         as incassato,
       (select coalesce(sum(balance), 0) from public.members where enrolled_at is not null and balance > 0) as da_incassare;
