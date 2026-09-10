-- Sci Club Don Bosco 2.0 — schema Supabase/Postgres
-- Sostituisce il Google Sheet "SOCI 2026" (fogli SOCI, PREZZI, PARTENZE).
--
-- Eseguire una sola volta su un progetto Supabase nuovo:
--   Supabase Dashboard > SQL Editor > incolla questo file > Run
-- Poi eseguire in ordine i file di supabase/migration/ per caricare i dati,
-- e supabase/verifica.sql per controllare che sia andato tutto bene.
-- Istruzioni complete: docs/MIGRAZIONE_2.0.md

-- ---------------------------------------------------------------------------
-- Tabelle di configurazione (ex fogli PREZZI e PARTENZE)
-- ---------------------------------------------------------------------------

create table if not exists public.prezzi (
  id          bigint generated always as identity primary key,
  categoria   text not null check (categoria in ('TESSERA', 'FAMIGLIA', 'ABBONAMENTO', 'CORSO')),
  nome        text not null,
  prezzo      numeric(10, 2) not null default 0,
  attivo      boolean not null default true,
  unique (categoria, nome)
);

comment on table public.prezzi is 'Listino: ex foglio PREZZI. Le categorie corrispondono a quelle lette da getPrices() nella 1.x.';

create table if not exists public.partenze (
  id          bigint generated always as identity primary key,
  giorno      text not null check (giorno in ('SABATO', 'DOMENICA')),
  luogo       text not null,
  attivo      boolean not null default true,
  unique (giorno, luogo)
);

comment on table public.partenze is 'Luoghi di partenza per giorno: ex foglio PARTENZE.';

-- ---------------------------------------------------------------------------
-- Soci
--
-- Come nella 1.x, la tabella è cumulativa: ogni iscrizione stagionale è una
-- riga. Una persona che si iscrive per più stagioni ha più righe. Il filtro di
-- stagione avviene in lettura (vedi funzione stagione_corrente()).
--
-- Differenze volute rispetto al foglio Google (fix ai problemi documentati in
-- docs/DOCUMENTAZIONE.md):
--   * `saldo` è una colonna GENERATA (totale - acconto): non può più andare
--     fuori sincrono. Nella 1.x la colonna saldo del foglio era stale e
--     Admin.gs doveva ricalcolarla a mano ad ogni lettura.
--   * le colonne hanno il nome giusto: nel foglio le etichette di colonna 21 e
--     23 erano invertite rispetto al contenuto reale.
--   * `payer_id` è una vera foreign key verso soci(id), non testo libero. Nella
--     1.x si chiamava `payerCode` ed era documentato come "codice fiscale del
--     pagante" ma conteneva in realtà l'UUID: nome e contenuto ora coincidono.
--   * il totale del nucleo familiare non è più una colonna copiata e mantenuta
--     a mano da updateFamilyTotal(): è la vista nuclei_familiari, sempre
--     coerente per costruzione.
-- ---------------------------------------------------------------------------

create table if not exists public.soci (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  -- Data di iscrizione alla stagione: è questa (non created_at) a decidere in
  -- che stagione ricade un socio. Nella 1.x le due cose erano la stessa colonna
  -- del foglio, riscritta ad ogni salvataggio: un socio di archivio rientrava
  -- nella stagione corrente semplicemente risalvandolo. Qui created_at resta la
  -- data reale di creazione della riga e data_iscrizione viene aggiornata dal
  -- form ad ogni iscrizione.
  data_iscrizione   timestamptz not null default now(),

  -- id della riga nel vecchio foglio Google, conservato per tracciabilità e
  -- per risolvere i collegamenti familiari in fase di migrazione. Gli ID
  -- storici non sono UUID validi (formati misti), quindi restano testo.
  legacy_id         text unique,

  -- id del pagante nel vecchio foglio (colonna "ID PAGANTE"). Serve alla
  -- migrazione per ricostruire i nuclei familiari e resta come traccia: la
  -- fonte di verità per i collegamenti è payer_id.
  legacy_payer_id   text,

  numero_polizza    text,
  cognome           text not null,
  nome              text not null,
  luogo_nascita     text,
  provincia_nascita text,
  codice_fiscale    text,
  data_nascita      date,
  indirizzo         text,
  citta             text,
  provincia         text,
  cap               text,
  telefono          text,
  email             text,

  tipologia_tessera    text,
  agevolazioni_famiglia text,
  tipo_abbonamento     text,
  partenza_domenica    text,
  partenze_sabato      text,
  tipologia_corso      text,

  totale            numeric(10, 2) not null default 0,
  acconto           numeric(10, 2) not null default 0,
  saldo             numeric(10, 2) generated always as (totale - acconto) stored,

  numero_tessera    text,

  -- capofamiglia: chi paga per questo socio. NULL = paga per sé.
  payer_id          uuid references public.soci (id) on delete set null,

  note              text
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

alter table public.soci add column if not exists data_iscrizione timestamptz not null default now();
alter table public.soci add column if not exists legacy_payer_id text;
alter table public.soci add column if not exists numero_tessera   text;
alter table public.soci add column if not exists note             text;

comment on column public.soci.saldo is 'Colonna generata: sempre totale - acconto. Non scrivibile.';
comment on column public.soci.payer_id is 'Capofamiglia che paga per questo socio. NULL = socio indipendente.';
comment on column public.soci.legacy_id is 'ID della riga nel Google Sheet 1.x (colonna 24). Solo tracciabilità.';
comment on column public.soci.legacy_payer_id is 'ID del pagante nel Google Sheet 1.x (colonna 26). Traccia: la fonte di verità è payer_id.';
comment on column public.soci.data_iscrizione is 'Data di iscrizione alla stagione: è questa a decidere in che stagione ricade il socio.';

create index if not exists soci_cognome_nome_idx  on public.soci (cognome, nome);
create index if not exists soci_codice_fiscale_idx on public.soci (codice_fiscale);
create index if not exists soci_payer_id_idx      on public.soci (payer_id);
create index if not exists soci_data_iscrizione_idx on public.soci (data_iscrizione);

-- un socio non può pagare per se stesso tramite payer_id
alter table public.soci drop constraint if exists soci_payer_not_self;
alter table public.soci add constraint soci_payer_not_self check (payer_id is null or payer_id <> id);

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

drop trigger if exists soci_set_updated_at on public.soci;
create trigger soci_set_updated_at
  before update on public.soci
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Stagione
--
-- Stessa regola della 1.x: la stagione parte il 1° settembre. Se siamo a
-- settembre o dopo, parte quest'anno; altrimenti l'anno scorso.
-- ---------------------------------------------------------------------------

create or replace function public.stagione_corrente()
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

comment on function public.stagione_corrente is 'Inizio della stagione corrente (1 settembre). Equivale al calcolo seasonStart della 1.x.';

-- ---------------------------------------------------------------------------
-- Vista: nuclei familiari (ex getAdminData di Admin.gs)
--
-- Un "nucleo" è un socio senza payer_id più tutti quelli che lo indicano come
-- pagante. Totale, acconto e saldo sono aggregati sul nucleo. Sostituisce sia
-- l'aggregazione JS lato server della 1.x sia la colonna 27 del foglio.
-- ---------------------------------------------------------------------------

create or replace view public.nuclei_familiari as
with capofamiglia as (
  select * from public.soci where payer_id is null
)
select
  c.id                                        as payer_id,
  c.cognome,
  c.nome,
  c.codice_fiscale,
  c.numero_polizza,
  c.numero_tessera,
  c.data_iscrizione,
  c.totale                                    as totale_capofamiglia,
  c.acconto                                   as acconto_capofamiglia,
  c.saldo                                     as saldo_capofamiglia,
  count(d.id)                                 as numero_familiari,
  c.totale  + coalesce(sum(d.totale),  0)     as totale_nucleo,
  c.acconto + coalesce(sum(d.acconto), 0)     as acconto_nucleo,
  c.saldo   + coalesce(sum(d.saldo),   0)     as saldo_nucleo
from capofamiglia c
left join public.soci d on d.payer_id = c.id
group by c.id, c.cognome, c.nome, c.codice_fiscale, c.numero_polizza,
         c.numero_tessera, c.data_iscrizione, c.totale, c.acconto, c.saldo;

comment on view public.nuclei_familiari is 'Aggregazione per nucleo familiare. Sostituisce getAdminData() e la colonna TOTALE FAMILIARI A CARICO.';

-- ---------------------------------------------------------------------------
-- Vista: riepilogo stagione (ex getRiepilogo di Riepilogo.gs)
-- ---------------------------------------------------------------------------

create or replace view public.riepilogo_stagione as
select
  count(*)                                  as totale_soci,
  coalesce(sum(totale),  0)                 as totale_teorico,
  coalesce(sum(acconto), 0)                 as totale_incassato,
  coalesce(sum(saldo),   0)                 as da_incassare
from public.soci
where data_iscrizione >= public.stagione_corrente();

comment on view public.riepilogo_stagione is 'KPI della stagione corrente. Sostituisce i totali calcolati in getRiepilogo().';

-- Conteggi per tipologia, arricchiti con il prezzo di listino.
create or replace view public.riepilogo_tessere as
select
  s.tipologia_tessera            as nome,
  count(*)                       as conteggio,
  p.prezzo                       as prezzo,
  count(*) * coalesce(p.prezzo, 0) as totale
from public.soci s
left join public.prezzi p
  on p.categoria = 'TESSERA' and p.nome = s.tipologia_tessera
where s.data_iscrizione >= public.stagione_corrente()
  and s.tipologia_tessera is not null
  and upper(s.tipologia_tessera) <> 'NO'
group by s.tipologia_tessera, p.prezzo;

create or replace view public.riepilogo_abbonamenti as
select tipo_abbonamento as nome, count(*) as conteggio
from public.soci
where data_iscrizione >= public.stagione_corrente()
  and tipo_abbonamento is not null
  and upper(tipo_abbonamento) <> 'NO'
group by tipo_abbonamento;

create or replace view public.riepilogo_corsi as
select tipologia_corso as nome, count(*) as conteggio
from public.soci
where data_iscrizione >= public.stagione_corrente()
  and tipologia_corso is not null
  and upper(tipologia_corso) <> 'NO'
group by tipologia_corso;

-- Le partenze sono liste separate da virgola come nella 1.x: vengono esplose.
create or replace view public.riepilogo_partenze as
select 'SABATO' as giorno, trim(luogo) as luogo, count(*) as conteggio
from public.soci, unnest(string_to_array(partenze_sabato, ',')) as luogo
where data_iscrizione >= public.stagione_corrente()
  and partenze_sabato is not null
  and upper(partenze_sabato) <> 'NO'
  and trim(luogo) <> ''
group by trim(luogo)
union all
select 'DOMENICA' as giorno, trim(luogo) as luogo, count(*) as conteggio
from public.soci, unnest(string_to_array(partenza_domenica, ',')) as luogo
where data_iscrizione >= public.stagione_corrente()
  and partenza_domenica is not null
  and upper(partenza_domenica) <> 'NO'
  and trim(luogo) <> ''
group by trim(luogo);

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

alter table public.soci     enable row level security;
alter table public.prezzi   enable row level security;
alter table public.partenze enable row level security;

drop policy if exists soci_select on public.soci;
drop policy if exists soci_insert on public.soci;
drop policy if exists soci_update on public.soci;
drop policy if exists soci_delete on public.soci;

create policy soci_select on public.soci
  for select to authenticated using (true);

create policy soci_insert on public.soci
  for insert to authenticated with check (true);

create policy soci_update on public.soci
  for update to authenticated using (true) with check (true);

-- La cancellazione resta esclusa: si archivia, non si cancella. Se serve
-- davvero, si fa dalla dashboard Supabase con l'utente service_role.

drop policy if exists prezzi_select on public.prezzi;
drop policy if exists prezzi_write  on public.prezzi;
create policy prezzi_select on public.prezzi
  for select to authenticated using (true);
create policy prezzi_write on public.prezzi
  for all to authenticated using (true) with check (true);

drop policy if exists partenze_select on public.partenze;
drop policy if exists partenze_write  on public.partenze;
create policy partenze_select on public.partenze
  for select to authenticated using (true);
create policy partenze_write on public.partenze
  for all to authenticated using (true) with check (true);

-- Le viste ereditano la RLS delle tabelle sottostanti (security invoker).
alter view public.nuclei_familiari      set (security_invoker = true);
alter view public.riepilogo_stagione    set (security_invoker = true);
alter view public.riepilogo_tessere     set (security_invoker = true);
alter view public.riepilogo_abbonamenti set (security_invoker = true);
alter view public.riepilogo_corsi       set (security_invoker = true);
alter view public.riepilogo_partenze    set (security_invoker = true);

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
     where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'soci'
  ) then
    alter publication supabase_realtime add table public.soci;
  end if;
end $$;
