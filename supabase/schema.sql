-- Sci Club Don Bosco 2.0 — schema Supabase/Postgres
-- Sostituisce il Google Sheet "SOCI 2026" (fogli SOCI, PREZZI, PARTENZE).
--
-- Eseguire una sola volta su un progetto Supabase nuovo (dopo aver lanciato
-- supabase/reset_legacy.sql se il database viene da uno schema italiano):
--   Supabase Dashboard > SQL Editor > incolla questo file > Run
-- Poi eseguire in ordine i file di supabase/migration/ per caricare i dati,
-- e supabase/verifica.sql per controllare che sia andato tutto bene.
-- Istruzioni complete: docs/MIGRAZIONE_2.0.md

-- ---------------------------------------------------------------------------
-- Tabelle di configurazione (ex fogli PREZZI e PARTENZE)
-- ---------------------------------------------------------------------------

create table if not exists public.prices (
  id          bigint generated always as identity primary key,
  category    text not null check (category in ('TESSERA', 'FAMIGLIA', 'ABBONAMENTO', 'CORSO')),
  name        text not null,
  price       numeric(10, 2) not null default 0,
  active      boolean not null default true,
  unique (category, name)
);

comment on table public.prices is 'Listino: ex foglio PREZZI. Le categorie corrispondono a quelle lette da getPrices() nella 1.x.';

create table if not exists public.departures (
  id          bigint generated always as identity primary key,
  day         text not null check (day in ('SABATO', 'DOMENICA')),
  place       text not null,
  active      boolean not null default true,
  unique (day, place)
);

comment on table public.departures is 'Luoghi di partenza per giorno: ex foglio PARTENZE.';

-- ---------------------------------------------------------------------------
-- Soci (members)
--
-- Come nella 1.x, la tabella è cumulativa: ogni iscrizione stagionale è una
-- riga. Una persona che si iscrive per più stagioni ha più righe. Il filtro di
-- stagione avviene in lettura (vedi funzione current_season()).
--
-- Differenze volute rispetto al foglio Google (fix ai problemi documentati in
-- docs/DOCUMENTAZIONE.md):
--   * `balance` è una colonna GENERATA (total - paid): non può più andare
--     fuori sincrono. Nella 1.x la colonna saldo del foglio era stale e
--     Admin.gs doveva ricalcolarla a mano ad ogni lettura.
--   * le colonne hanno il nome giusto: nel foglio le etichette di colonna 21 e
--     23 erano invertite rispetto al contenuto reale.
--   * `payer_id` è una vera foreign key verso members(id), non testo libero.
--     Nella 1.x si chiamava `payerCode` ed era documentato come "codice
--     fiscale del pagante" ma conteneva in realtà l'UUID: nome e contenuto
--     ora coincidono.
--   * il totale del nucleo familiare non è più una colonna copiata e mantenuta
--     a mano da updateFamilyTotal(): è la vista households, sempre coerente
--     per costruzione.
-- ---------------------------------------------------------------------------

create table if not exists public.members (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  -- Data di iscrizione alla stagione: è questa (non created_at) a decidere in
  -- che stagione ricade un socio. Nella 1.x le due cose erano la stessa colonna
  -- del foglio, riscritta ad ogni salvataggio: un socio di archivio rientrava
  -- nella stagione corrente semplicemente risalvandolo. Qui created_at resta la
  -- data reale di creazione della riga e enrolled_at viene aggiornata dal
  -- form ad ogni iscrizione.
  enrolled_at       timestamptz not null default now(),

  -- id della riga nel vecchio foglio Google, conservato per tracciabilità e
  -- per risolvere i collegamenti familiari in fase di migrazione. Gli ID
  -- storici non sono UUID validi (formati misti), quindi restano testo.
  legacy_id         text unique,

  -- id del pagante nel vecchio foglio (colonna "ID PAGANTE"). Serve alla
  -- migrazione per ricostruire i nuclei familiari e resta come traccia: la
  -- fonte di verità per i collegamenti è payer_id.
  legacy_payer_id   text,

  policy_number     text,
  last_name         text not null,
  first_name        text not null,
  birth_place       text,
  birth_province    text,
  tax_code          text,
  birth_date        date,
  address           text,
  city              text,
  province          text,
  postal_code       text,
  phone             text,
  email             text,

  card_type         text,
  family_discount   text,
  pass_type         text,
  sunday_departure  text,
  saturday_departure text,
  course_type       text,

  total             numeric(10, 2) not null default 0,
  paid              numeric(10, 2) not null default 0,
  balance           numeric(10, 2) generated always as (total - paid) stored,

  card_number       text,

  -- capofamiglia: chi paga per questo socio. NULL = paga per sé.
  payer_id          uuid references public.members (id) on delete set null,

  notes             text
);

-- ---------------------------------------------------------------------------
-- Aggiornamento di database già esistenti
--
-- `create table if not exists` NON aggiunge colonne a una tabella già creata:
-- su un database nato da una versione precedente di questo file le colonne
-- nuove verrebbero saltate in silenzio, e la migrazione fallirebbe con
-- "column ... does not exist". Queste ALTER rendono lo script capace di
-- aggiornare, non solo di creare. Su un database nuovo non fanno nulla.
-- ---------------------------------------------------------------------------

alter table public.members add column if not exists enrolled_at timestamptz not null default now();
alter table public.members add column if not exists legacy_payer_id text;
alter table public.members add column if not exists card_number     text;
alter table public.members add column if not exists notes           text;

comment on column public.members.balance is 'Colonna generata: sempre total - paid. Non scrivibile.';
comment on column public.members.payer_id is 'Capofamiglia che paga per questo socio. NULL = socio indipendente.';
comment on column public.members.legacy_id is 'ID della riga nel Google Sheet 1.x (colonna 24). Solo tracciabilità.';
comment on column public.members.legacy_payer_id is 'ID del pagante nel Google Sheet 1.x (colonna 26). Traccia: la fonte di verità è payer_id.';
comment on column public.members.enrolled_at is 'Data di iscrizione alla stagione: è questa a decidere in che stagione ricade il socio.';

create index if not exists members_last_name_first_name_idx on public.members (last_name, first_name);
create index if not exists members_tax_code_idx  on public.members (tax_code);
create index if not exists members_payer_id_idx   on public.members (payer_id);
create index if not exists members_enrolled_at_idx on public.members (enrolled_at);

-- un socio non può pagare per se stesso tramite payer_id
alter table public.members drop constraint if exists members_payer_not_self;
alter table public.members add constraint members_payer_not_self check (payer_id is null or payer_id <> id);

-- updated_at automatico
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists members_set_updated_at on public.members;
create trigger members_set_updated_at
  before update on public.members
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Stagione
--
-- Stessa regola della 1.x: la stagione parte il 1° settembre. Se siamo a
-- settembre o dopo, parte quest'anno; altrimenti l'anno scorso.
-- ---------------------------------------------------------------------------

create or replace function public.current_season()
returns timestamptz
language sql
stable
as $$
  select case
    when extract(month from now()) >= 9
      then make_timestamptz(extract(year from now())::int,     9, 1, 0, 0, 0)
    else   make_timestamptz(extract(year from now())::int - 1, 9, 1, 0, 0, 0)
  end;
$$;

comment on function public.current_season is 'Inizio della stagione corrente (1 settembre). Equivale al calcolo seasonStart della 1.x.';

-- ---------------------------------------------------------------------------
-- Vista: nuclei familiari / households (ex getAdminData di Admin.gs)
--
-- Un "nucleo" è un socio senza payer_id più tutti quelli che lo indicano come
-- pagante. Totale, acconto e saldo sono aggregati sul nucleo. Sostituisce sia
-- l'aggregazione JS lato server della 1.x sia la colonna 27 del foglio.
-- ---------------------------------------------------------------------------

create or replace view public.households as
with heads as (
  select * from public.members where payer_id is null
)
select
  h.id                                        as head_id,
  h.last_name,
  h.first_name,
  h.tax_code,
  h.policy_number,
  h.card_number,
  h.enrolled_at,
  h.total                                     as head_total,
  h.paid                                      as head_paid,
  h.balance                                   as head_balance,
  count(d.id)                                 as dependents_count,
  h.total + coalesce(sum(d.total),  0)        as household_total,
  h.paid  + coalesce(sum(d.paid),   0)        as household_paid,
  h.balance + coalesce(sum(d.balance), 0)     as household_balance
from heads h
left join public.members d on d.payer_id = h.id
group by h.id, h.last_name, h.first_name, h.tax_code, h.policy_number,
         h.card_number, h.enrolled_at, h.total, h.paid, h.balance;

comment on view public.households is 'Aggregazione per nucleo familiare. Sostituisce getAdminData() e la colonna TOTALE FAMILIARI A CARICO.';

-- ---------------------------------------------------------------------------
-- Vista: riepilogo stagione / season_totals (ex getRiepilogo di Riepilogo.gs)
-- ---------------------------------------------------------------------------

create or replace view public.season_totals as
select
  count(*)                                  as total_members,
  coalesce(sum(total), 0)                   as total_due,
  coalesce(sum(paid),  0)                   as total_collected,
  coalesce(sum(balance), 0)                 as outstanding
from public.members
where enrolled_at >= public.current_season();

comment on view public.season_totals is 'KPI della stagione corrente. Sostituisce i totali calcolati in getRiepilogo().';

-- Conteggi per tipologia, arricchiti con il prezzo di listino.
create or replace view public.card_counts as
select
  m.card_type                    as name,
  count(*)                       as count,
  p.price                        as price,
  count(*) * coalesce(p.price, 0) as total
from public.members m
left join public.prices p
  on p.category = 'TESSERA' and p.name = m.card_type
where m.enrolled_at >= public.current_season()
  and m.card_type is not null
  and upper(m.card_type) <> 'NO'
group by m.card_type, p.price;

create or replace view public.pass_counts as
select pass_type as name, count(*) as count
from public.members
where enrolled_at >= public.current_season()
  and pass_type is not null
  and upper(pass_type) <> 'NO'
group by pass_type;

create or replace view public.course_counts as
select course_type as name, count(*) as count
from public.members
where enrolled_at >= public.current_season()
  and course_type is not null
  and upper(course_type) <> 'NO'
group by course_type;

-- Le partenze sono liste separate da virgola come nella 1.x: vengono esplose.
create or replace view public.departure_counts as
select 'SABATO' as day, trim(place) as place, count(*) as count
from public.members, unnest(string_to_array(saturday_departure, ',')) as place
where enrolled_at >= public.current_season()
  and saturday_departure is not null
  and upper(saturday_departure) <> 'NO'
  and trim(place) <> ''
group by trim(place)
union all
select 'DOMENICA' as day, trim(place) as place, count(*) as count
from public.members, unnest(string_to_array(sunday_departure, ',')) as place
where enrolled_at >= public.current_season()
  and sunday_departure is not null
  and upper(sunday_departure) <> 'NO'
  and trim(place) <> ''
group by trim(place);

-- ---------------------------------------------------------------------------
-- Row Level Security
--
-- Nella 1.x l'accesso era protetto dal login Google: le web app Apps Script
-- non erano raggiungibili senza un account autorizzato. Qui la chiave anon è
-- pubblica per definizione (finisce nel JS del browser), quindi il controllo
-- deve stare nelle policy: nessun accesso anonimo, solo utenti autenticati.
--
-- I soci contengono dati personali (codice fiscale, telefono, indirizzi, anche
-- di minori): non vanno esposti in lettura pubblica.
--
-- Gli account del direttivo si creano dalla dashboard Supabase
-- (Authentication > Users > Add user). Non c'è registrazione self-service.
-- ---------------------------------------------------------------------------

alter table public.members    enable row level security;
alter table public.prices     enable row level security;
alter table public.departures enable row level security;

drop policy if exists members_select on public.members;
drop policy if exists members_insert on public.members;
drop policy if exists members_update on public.members;
drop policy if exists members_delete on public.members;

create policy members_select on public.members
  for select to authenticated using (true);

create policy members_insert on public.members
  for insert to authenticated with check (true);

create policy members_update on public.members
  for update to authenticated using (true) with check (true);

-- La cancellazione resta esclusa: si archivia, non si cancella. Se serve
-- davvero, si fa dalla dashboard Supabase con l'utente service_role.

drop policy if exists prices_select on public.prices;
drop policy if exists prices_write  on public.prices;
create policy prices_select on public.prices
  for select to authenticated using (true);
create policy prices_write on public.prices
  for all to authenticated using (true) with check (true);

drop policy if exists departures_select on public.departures;
drop policy if exists departures_write  on public.departures;
create policy departures_select on public.departures
  for select to authenticated using (true);
create policy departures_write on public.departures
  for all to authenticated using (true) with check (true);

-- Le viste ereditano la RLS delle tabelle sottostanti (security invoker).
alter view public.households      set (security_invoker = true);
alter view public.season_totals   set (security_invoker = true);
alter view public.card_counts     set (security_invoker = true);
alter view public.pass_counts     set (security_invoker = true);
alter view public.course_counts   set (security_invoker = true);
alter view public.departure_counts set (security_invoker = true);

-- ---------------------------------------------------------------------------
-- Realtime: permette alle pagine di ricevere gli aggiornamenti via websocket
-- senza ricaricare (es. il pannello pagamenti si aggiorna quando un altro
-- operatore salva un'iscrizione).
-- ---------------------------------------------------------------------------

-- Su Supabase la publication esiste già. Il blocco la crea se manca (utile per
-- test su un Postgres normale) e ignora il caso "tabella già pubblicata", così
-- lo script resta rieseguibile senza errori.
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;

  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'members'
  ) then
    alter publication supabase_realtime add table public.members;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Chiusura della stagione
--
-- A settembre si ricomincia da capo: le anagrafiche restano (sono le stesse
-- persone, anno dopo anno), mentre tesseramento, pagamenti, partenze e nuclei
-- familiari appartengono alla stagione appena finita e vanno azzerati.
--
-- Nella 1.x questo si faceva a mano sul foglio: si duplicava il file, si
-- selezionavano le colonne e si cancellavano. Bastava una selezione storta per
-- perdere un'anagrafica, e la stagione precedente restava in un file sparso su
-- Drive che nessuno ritrovava più.
--
-- A differenza della prima versione della 2.0 (che copiava l'intera riga di
-- ogni socio in soci_storico), qui lo storico non duplica l'anagrafica: tiene
-- solo i numeri che servono a rileggere "com'era andata" un anno — i cinque
-- totali di season_history più i conteggi per tipologia di season_breakdown.
-- L'anagrafica resta dov'è, in members: è la stessa persona, anno dopo anno.
--
-- close_season() legge le stesse viste di riepilogo che il Riepilogo mostra
-- per la stagione corrente (filtrate sulle sole righe che sta per azzerare
-- tramite la tabella temporanea da_chiudere), scrive season_history e
-- season_breakdown e infine azzera, tutto nella stessa transazione.
--
-- Cosa viene azzerato: polizza, tessera, tipologia tessera, agevolazione
-- famiglia, abbonamento, corso, partenze, totale, acconto, capofamiglia
-- (payer_id), note e data di iscrizione.
-- Cosa resta: nome, cognome, nascita, codice fiscale, residenza, telefono,
-- email, legacy_id.
-- ---------------------------------------------------------------------------

-- Inizio della stagione (1° settembre) a cui appartiene un istante qualsiasi.
-- current_season() diventa il caso particolare "adesso".
create or replace function public.season_of(moment timestamptz)
returns timestamptz
language sql
immutable
as $$
  select case
    when extract(month from moment) >= 9
      then make_timestamptz(extract(year from moment)::int,     9, 1, 0, 0, 0)
    else   make_timestamptz(extract(year from moment)::int - 1, 9, 1, 0, 0, 0)
  end;
$$;

comment on function public.season_of is 'Il 1° settembre della stagione in cui cade il timestamp passato.';

create or replace function public.current_season()
returns timestamptz
language sql
stable
as $$
  select public.season_of(now());
$$;

-- Dopo la chiusura un socio non è iscritto a nessuna stagione finché non lo si
-- risalva dal form: enrolled_at deve poter essere vuota. Le viste del
-- riepilogo filtrano con `>= current_season()`, che scarta già i NULL.
alter table public.members alter column enrolled_at drop not null;

-- Una riga per stagione chiusa: i cinque totali che servono al direttivo.
-- Chiudere due volte la stessa stagione somma sui valori esistenti (on
-- conflict do update), così resta una sola riga per anno anche se la
-- chiusura viene lanciata più volte (es. soci iscritti dopo una prima
-- chiusura parziale).
create table if not exists public.season_history (
  season      timestamptz primary key,
  members     bigint not null default 0,
  total       numeric(10, 2) not null default 0,
  collected   numeric(10, 2) not null default 0,
  outstanding numeric(10, 2) not null default 0,
  closed_at   timestamptz not null default now()
);

comment on table public.season_history is 'Un socio per stagione chiusa: i cinque totali che servivano nel Riepilogo. Scrive solo close_season().';

-- I conteggi per tipologia di una stagione chiusa: poche decine di righe,
-- la stessa lettura del Riepilogo ma di un anno archiviato.
create table if not exists public.season_breakdown (
  season  timestamptz not null,
  category text not null check (category in ('CARD', 'PASS', 'COURSE', 'DEPARTURE')),
  label   text not null,
  -- Valorizzato solo per le partenze (SABATO/DOMENICA), stringa vuota altrove:
  -- fa parte della chiave, quindi non può essere NULL.
  day     text not null default '',
  count   bigint not null default 0,
  -- Solo per le tessere: le altre categorie non hanno un prezzo di listino
  -- univoco da moltiplicare.
  total   numeric(10, 2),
  primary key (season, category, label, day)
);

comment on table public.season_breakdown is 'Conteggi per tipologia (tessere/abbonamenti/corsi/partenze) di una stagione chiusa. Scrive solo close_season().';

-- Quante righe verrebbero toccate da una chiusura, per stagione. Serve al
-- pannello per dire in anticipo cosa sta per succedere.
create or replace view public.open_season as
select
  public.season_of(coalesce(enrolled_at, now())) as season,
  count(*)                    as members,
  coalesce(sum(total), 0)     as total,
  coalesce(sum(paid),  0)     as collected,
  coalesce(sum(balance), 0)   as outstanding
from public.members
where enrolled_at is not null
   or policy_number is not null or card_number is not null
   or card_type is not null or family_discount is not null
   or pass_type is not null or course_type is not null
   or saturday_departure is not null or sunday_departure is not null
   or payer_id is not null or total <> 0 or paid <> 0
group by 1
order by 1 desc;

alter view public.open_season set (security_invoker = true);

comment on view public.open_season is 'La stagione in corso: righe di soci che portano ancora dati di stagione. Dopo una chiusura è vuota finché non si iscrive qualcuno.';

/**
 * Archivia in season_history/season_breakdown e azzera i dati di stagione di
 * tutti i soci.
 *
 * `confirmation` deve valere esattamente 'CHIUDI STAGIONE': è l'ultimo
 * ostacolo prima di un'operazione che tocca tutte le righe, e obbliga chi la
 * lancia a scriverlo, non solo a cliccare. La frase resta in italiano: la
 * scrive a mano un volontario italiano, non è un identificatore.
 *
 * Restituisce quante righe sono state archiviate e azzerate.
 */
create or replace function public.close_season(confirmation text)
returns table (archived bigint, season_closed timestamptz)
language plpgsql
security invoker
as $$
declare
  how_many bigint;
  which    timestamptz;
begin
  if confirmation is distinct from 'CHIUDI STAGIONE' then
    raise exception 'Conferma mancante: per chiudere la stagione serve la frase esatta CHIUDI STAGIONE.';
  end if;

  which := public.current_season();

  -- Le righe da chiudere si decidono una volta sola e si tengono da parte:
  -- aggregazione e azzeramento devono lavorare esattamente sulle stesse, e
  -- ripetere il filtro due volte sarebbe due occasioni di scriverlo diverso.
  -- Il nome resta in italiano: è una tabella temporanea interna alla
  -- funzione, non un identificatore pubblico dello schema.
  create temporary table da_chiudere on commit drop as
  select id from public.members
   where enrolled_at is not null
      or policy_number is not null or card_number is not null
      or card_type is not null or family_discount is not null
      or pass_type is not null or course_type is not null
      or saturday_departure is not null or sunday_departure is not null
      or payer_id is not null or total <> 0 or paid <> 0;

  select count(*) into how_many from da_chiudere;

  -- Una chiusura a vuoto (nessuna riga da archiviare) non deve toccare lo
  -- storico: niente riga nuova in season_history, niente closed_at
  -- aggiornato su una stagione già chiusa in precedenza.
  if how_many > 0 then

    -- I cinque totali della stagione, sommati su quello che c'era già se la
    -- stagione era già stata chiusa in parte.
    insert into public.season_history (season, members, total, collected, outstanding, closed_at)
    select
      which,
      count(*),
      coalesce(sum(m.total), 0),
      coalesce(sum(m.paid),  0),
      coalesce(sum(m.balance), 0),
      now()
    from public.members m
    join da_chiudere t on t.id = m.id
    on conflict (season) do update set
      members     = public.season_history.members     + excluded.members,
      total       = public.season_history.total       + excluded.total,
      collected   = public.season_history.collected   + excluded.collected,
      outstanding = public.season_history.outstanding + excluded.outstanding,
      closed_at   = excluded.closed_at;

    -- I conteggi per tipologia, la stessa lettura di card_counts/pass_counts/
    -- course_counts/departure_counts ma ristretta alle righe che si stanno
    -- chiudendo, invece che alla stagione corrente (che tra un istante sarà
    -- vuota).
    insert into public.season_breakdown (season, category, label, day, count, total)
    select which, 'CARD', m.card_type, '', count(*), count(*) * coalesce(p.price, 0)
    from public.members m
    join da_chiudere t on t.id = m.id
    left join public.prices p on p.category = 'TESSERA' and p.name = m.card_type
    where m.card_type is not null and upper(m.card_type) <> 'NO'
    group by m.card_type, p.price
    union all
    select which, 'PASS', m.pass_type, '', count(*), null
    from public.members m
    join da_chiudere t on t.id = m.id
    where m.pass_type is not null and upper(m.pass_type) <> 'NO'
    group by m.pass_type
    union all
    select which, 'COURSE', m.course_type, '', count(*), null
    from public.members m
    join da_chiudere t on t.id = m.id
    where m.course_type is not null and upper(m.course_type) <> 'NO'
    group by m.course_type
    union all
    select which, 'DEPARTURE', trim(place), 'SABATO', count(*), null
    from public.members m
    join da_chiudere t on t.id = m.id, unnest(string_to_array(m.saturday_departure, ',')) as place
    where m.saturday_departure is not null and upper(m.saturday_departure) <> 'NO' and trim(place) <> ''
    group by trim(place)
    union all
    select which, 'DEPARTURE', trim(place), 'DOMENICA', count(*), null
    from public.members m
    join da_chiudere t on t.id = m.id, unnest(string_to_array(m.sunday_departure, ',')) as place
    where m.sunday_departure is not null and upper(m.sunday_departure) <> 'NO' and trim(place) <> ''
    group by trim(place)
    on conflict (season, category, label, day) do update set
      count = public.season_breakdown.count + excluded.count,
      total = coalesce(public.season_breakdown.total, 0) + coalesce(excluded.total, 0);

  end if;

  -- Un solo UPDATE, e con il WHERE: le anagrafiche non sono nominate, quindi
  -- non c'è modo che questa riga le tocchi. Il WHERE serve anche a Supabase,
  -- che rifiuta gli UPDATE senza (estensione safeupdate): un "azzera tutto"
  -- scritto per sbaglio non deve poter partire.
  update public.members set
    policy_number      = null,
    card_number        = null,
    card_type          = null,
    family_discount    = null,
    pass_type          = null,
    course_type        = null,
    saturday_departure = null,
    sunday_departure   = null,
    total              = 0,
    paid               = 0,
    payer_id           = null,
    notes              = null,
    enrolled_at        = null
  where id in (select id from da_chiudere);

  return query select how_many, which;
end;
$$;

comment on function public.close_season is 'Archivia in season_history/season_breakdown e azzera i dati di stagione di tutti i soci. Conserva le anagrafiche.';

alter table public.season_history   enable row level security;
alter table public.season_breakdown enable row level security;

drop policy if exists season_history_select   on public.season_history;
drop policy if exists season_history_insert   on public.season_history;
drop policy if exists season_history_update   on public.season_history;
drop policy if exists season_breakdown_select on public.season_breakdown;
drop policy if exists season_breakdown_insert on public.season_breakdown;
drop policy if exists season_breakdown_update on public.season_breakdown;

-- Lo storico si legge e si scrive solo passando da close_season(), che gira
-- come l'utente collegato: servono quindi insert e update (per l'upsert), ma
-- non delete. Una stagione archiviata non si cancella.
create policy season_history_select on public.season_history
  for select to authenticated using (true);
create policy season_history_insert on public.season_history
  for insert to authenticated with check (true);
create policy season_history_update on public.season_history
  for update to authenticated using (true) with check (true);

create policy season_breakdown_select on public.season_breakdown
  for select to authenticated using (true);
create policy season_breakdown_insert on public.season_breakdown
  for insert to authenticated with check (true);
create policy season_breakdown_update on public.season_breakdown
  for update to authenticated using (true) with check (true);

-- ---------------------------------------------------------------------------
-- Saldo di un nucleo familiare
--
-- L'incasso avviene per nucleo familiare: il capofamiglia salda l'intero
-- importo dovuto dal nucleo. La funzione sta sul database perché le righe del
-- nucleo devono cambiare in un'unica transazione: aggiornandole una alla volta
-- dal browser, una connessione interrotta lascerebbe il nucleo saldato a metà.
--
-- Chi ha già pagato più del dovuto non viene toccato (`balance > 0`): un
-- acconto in eccesso è un caso da sistemare a mano, non da azzerare in
-- silenzio.
-- ---------------------------------------------------------------------------

create or replace function public.settle_household(head_id uuid)
returns table (members_settled bigint, amount numeric)
language plpgsql
security invoker
as $$
declare
  how_many bigint;
  how_much numeric(10, 2);
begin
  select count(*), coalesce(sum(balance), 0)
    into how_many, how_much
    from public.members
   where (id = head_id or payer_id = head_id)
     and balance > 0;

  if how_many = 0 then
    return query select 0::bigint, 0::numeric;
    return;
  end if;

  update public.members
     set paid = total
   where (id = head_id or payer_id = head_id)
     and balance > 0;

  return query select how_many, how_much;
end;
$$;

comment on function public.settle_household is 'Porta a zero il saldo del capofamiglia e dei suoi familiari a carico. Restituisce quante righe e quanto è stato incassato.';

-- ---------------------------------------------------------------------------
-- Abbonamenti a viaggi
--
-- Il listino vende "Abbonamento 5 viaggi SABATO / DOMENICA / MARTEDÌ / JOLLY",
-- ma l'abbonamento era finora solo un valore testuale nella riga del socio,
-- senza alcun conteggio delle gite effettuate.
--
-- Numero di gite e giorno di validità sono proprietà del listino, non del
-- socio: stanno qui, accanto al prezzo. Il socio continua a puntare al listino
-- con `pass_type`.
--
-- JOLLY vale qualunque giorno: è un giorno come gli altri in tabella, e sono
-- le query a decidere se includerlo.
-- ---------------------------------------------------------------------------

alter table public.prices add column if not exists trips int;
alter table public.prices add column if not exists day text;

alter table public.prices drop constraint if exists prices_day_valid;
alter table public.prices add constraint prices_day_valid
  check (day is null or day in ('SABATO', 'DOMENICA', 'MARTEDI', 'JOLLY'));

alter table public.prices drop constraint if exists prices_trips_positive;
alter table public.prices add constraint prices_trips_positive
  check (trips is null or trips > 0);

comment on column public.prices.trips is 'Quante gite comprende l''abbonamento. NULL per tutto ciò che non è un abbonamento a viaggi.';
comment on column public.prices.day is 'Giorno dell''abbonamento. JOLLY = utilizzabile in qualsiasi giorno.';

-- Viaggi e giorno si leggono dal nome dell'opzione ("Abbonamento 5 viaggi
-- SABATO"): il listino arriva dal foglio Excel, dove sono scritti lì dentro e
-- basta.
--
-- Il riempimento è un trigger e non un UPDATE una tantum perché lo schema si
-- lancia PRIMA di caricare i dati: un UPDATE qui non troverebbe nessuna riga,
-- e il listino entrerebbe senza abbonamenti riconoscibili. Così invece ogni
-- riga si sistema da sé quando entra, in qualsiasi ordine si facciano le cose.
--
-- Tocca solo i campi lasciati vuoti: una correzione fatta a mano dalla
-- dashboard resta dov'è.
create or replace function public.fill_pass_details()
returns trigger
language plpgsql
as $$
begin
  if new.category = 'ABBONAMENTO' and new.trips is null and new.day is null then
    new.trips := nullif(substring(new.name from '(\d+)\s*[vV]iagg'), '')::int;
    new.day := case
      when upper(new.name) like '%SABATO%'   then 'SABATO'
      when upper(new.name) like '%DOMENICA%' then 'DOMENICA'
      when upper(new.name) like '%MARTED%'   then 'MARTEDI'
      when upper(new.name) like '%JOLLY%'    then 'JOLLY'
    end;

    -- Un abbonamento senza numero di viaggi (es. il corso di presciistica)
    -- non è un abbonamento a gite: resta senza giorno.
    if new.trips is null then
      new.day := null;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists fill_pass_details on public.prices;
create trigger fill_pass_details
  before insert or update on public.prices
  for each row execute function public.fill_pass_details();

-- Le righe già in tabella (database creato prima di questa aggiunta) passano
-- dal trigger con un aggiornamento a vuoto.
update public.prices set name = name
 where category = 'ABBONAMENTO' and trips is null and day is null;

-- ---------------------------------------------------------------------------
-- Gite usate
--
-- Una riga = una gita. La registrazione è una sola pressione: nessuna data da
-- scegliere (viene usata quella del giorno) e nessun numero di persone (per
-- due partecipanti si registra due volte).
--
-- La data serve a ritrovare e annullare una registrazione sbagliata, non a
-- ricostruire il calendario della stagione: una gita segnata il giorno dopo
-- lascia comunque il conteggio corretto.
--
-- Le righe non si cancellano a fine stagione: portano la stagione con sé, e
-- così l'anno prossimo si può ancora guardare com'era andata.
-- ---------------------------------------------------------------------------

create table if not exists public.trip_uses (
  id            uuid primary key default gen_random_uuid(),
  member_id     uuid not null references public.members (id) on delete cascade,

  -- Fissata alla registrazione: se una gita viene segnata a settembre inoltrato
  -- resta nella stagione in cui è stata fatta.
  season        timestamptz not null default public.current_season(),

  trip_date     date not null default current_date,
  logged_at     timestamptz not null default now(),

  -- Identificativo della pressione, generato dal telefono PRIMA di partire con
  -- la chiamata. Serve a distinguere "l'operatore ha premuto due volte" da "ha
  -- premuto una volta e la risposta si è persa": vedi use_trip().
  client_id     uuid
);

-- Prima una riga poteva valere più gite e portarsi dietro i nomi di chi era
-- salito: adesso vale una gita e basta, e le colonne vanno tolte anche dai
-- database creati con la versione precedente.
alter table public.trip_uses drop column if exists quante;
alter table public.trip_uses drop column if exists partecipanti;
alter table public.trip_uses drop column if exists nota;

alter table public.trip_uses add column if not exists client_id uuid;

-- Le righe segnate prima di questa aggiunta hanno client_id nullo, e in
-- Postgres i NULL non fanno conflitto fra loro: restano dov'erano.
alter table public.trip_uses drop constraint if exists trip_uses_client_id_key;
alter table public.trip_uses add constraint trip_uses_client_id_key unique (client_id);

comment on column public.trip_uses.client_id is 'Id della pressione, generato dal telefono. Rende use_trip() ripetibile senza scalare due gite.';

create index if not exists trip_uses_member_idx on public.trip_uses (member_id);
create index if not exists trip_uses_season_idx on public.trip_uses (season);

comment on table public.trip_uses is 'Registro delle gite scalate dagli abbonamenti: una riga per gita. Ci si scrive solo con use_trip().';

-- Stato di ogni abbonamento della stagione: quante gite comprende, quante ne
-- restano, e i contatti per chiamare chi non si è ancora visto.
create or replace view public.trip_passes as
select
  m.id                                as member_id,
  m.last_name,
  m.first_name,
  m.phone,
  m.email,
  m.payer_id,
  p.name                              as pass_name,
  p.day,
  p.trips                             as trips_total,
  coalesce(u.used, 0)::int            as trips_used,
  (p.trips - coalesce(u.used, 0))::int as trips_left
from public.members m
join public.prices p
  on  p.category = 'ABBONAMENTO'
  and p.name      = m.pass_type
  and p.trips is not null
left join (
  select member_id, count(*) as used
    from public.trip_uses
   where season = public.current_season()
   group by member_id
) u on u.member_id = m.id
where m.enrolled_at >= public.current_season();

alter view public.trip_passes set (security_invoker = true);

comment on view public.trip_passes is 'Abbonamenti a viaggi della stagione corrente con gite fatte e residue.';

/**
 * Scala una gita dall'abbonamento di un socio.
 *
 * Il controllo sul residuo sta qui e non nella pagina: due telefoni che
 * segnano la stessa gita nello stesso momento non possono far scendere il
 * contatore sotto zero.
 *
 * `client_id` è l'id della pressione, generato dal telefono prima di
 * chiamare. Chi segna le gite è sul pullman alle sette del mattino, dove la
 * linea va e viene: se la richiesta arriva ma la risposta si perde, la pagina
 * non può sapere se la gita è stata scalata, e riprovare rischierebbe di
 * scalarla due volte. Con l'id della pressione il secondo tentativo viene
 * riconosciuto come lo stesso gesto e non scala niente: la chiamata si può
 * ripetere quante volte serve.
 */
-- La firma è cambiata più volte (prima accettava numero di gite, data e
-- partecipanti; poi il solo socio): `create or replace` da solo lascerebbe in
-- giro le vecchie versioni come funzioni sovrapposte, e la chiamata
-- diventerebbe ambigua.
drop function if exists public.use_trip(uuid, int, date, text, text);
drop function if exists public.use_trip(uuid, int, date);
drop function if exists public.use_trip(uuid);

-- client_id ha un default perché una pagina già aperta sul telefono, rimasta
-- alla versione precedente, continua a chiamare con il solo socio: meglio che
-- funzioni senza ritentativi sicuri piuttosto che rispondere "funzione non
-- trovata" a chi sta caricando il pullman.
create or replace function public.use_trip(member_id uuid, client_id uuid default gen_random_uuid())
returns table (trips_used int, trips_left int)
language plpgsql
security invoker
as $$
declare
  left_over int;
begin
  -- FOR UPDATE sulla riga del socio: chi arriva secondo aspetta e rilegge il
  -- residuo aggiornato invece di scalare sullo stesso conteggio. Serializza
  -- anche i ritentativi, che quindi trovano già scritta la pressione di prima.
  perform 1 from public.members where id = member_id for update;

  -- Questa pressione è già registrata: è un ritentativo, non una gita nuova.
  -- Si risponde com'era andata la prima volta, senza errore "esaurito" nel
  -- caso quella di prima fosse l'ultima gita disponibile.
  if exists (select 1 from public.trip_uses u where u.client_id = use_trip.client_id) then
    return query
      select a.trips_used, a.trips_left
        from public.trip_passes a
       where a.member_id = use_trip.member_id;
    return;
  end if;

  select a.trips_left into left_over
    from public.trip_passes a
   where a.member_id = use_trip.member_id;

  if left_over is null then
    raise exception 'Questo socio non ha un abbonamento a viaggi in questa stagione.';
  end if;

  if left_over < 1 then
    raise exception 'Abbonamento esaurito: non restano gite da scalare.';
  end if;

  -- `on conflict` è la rete di sicurezza sotto al controllo qui sopra: due
  -- richieste con lo stesso id arrivate insieme non possono diventare due
  -- righe, qualunque cosa faccia il lock.
  insert into public.trip_uses (member_id, client_id) values (member_id, client_id)
  on conflict on constraint trip_uses_client_id_key do nothing;

  return query
    select a.trips_used, a.trips_left
      from public.trip_passes a
     where a.member_id = use_trip.member_id;
end;
$$;

comment on function public.use_trip is 'Scala una gita dall''abbonamento del socio, con la data di oggi. Ripetibile: la stessa client_id non scala due gite.';

/**
 * Annulla una registrazione sbagliata. Si cancella una riga precisa, non
 * "l'ultima": chi corregge deve vedere cosa sta togliendo.
 */
create or replace function public.cancel_trip(trip_id uuid)
returns table (trips_used int, trips_left int)
language plpgsql
security invoker
as $$
declare
  who uuid;
begin
  delete from public.trip_uses where id = trip_id returning member_id into who;
  if who is null then
    raise exception 'Questa registrazione non esiste più.';
  end if;

  return query
    select a.trips_used, a.trips_left
      from public.trip_passes a
     where a.member_id = who;
end;
$$;

comment on function public.cancel_trip is 'Cancella una gita registrata per errore e restituisce il nuovo residuo.';

alter table public.trip_uses enable row level security;

drop policy if exists trip_uses_select on public.trip_uses;
drop policy if exists trip_uses_insert on public.trip_uses;
drop policy if exists trip_uses_delete on public.trip_uses;

-- Si scrive e si corregge solo passando dalle due funzioni, che girano come
-- l'utente collegato. Manca apposta l'update: una gita sbagliata si annulla e
-- si riscrive, non si ritocca.
create policy trip_uses_select on public.trip_uses
  for select to authenticated using (true);

create policy trip_uses_insert on public.trip_uses
  for insert to authenticated with check (true);

create policy trip_uses_delete on public.trip_uses
  for delete to authenticated using (true);
