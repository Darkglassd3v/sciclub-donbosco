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
-- Qui il vecchio contenuto viene prima copiato in soci_storico e solo dopo
-- azzerato, nella stessa transazione: la stagione chiusa resta consultabile e
-- un errore non lascia i dati a metà.
--
-- Cosa viene azzerato: polizza, tessera, tipologia tessera, agevolazione
-- famiglia, abbonamento, corso, partenze, totale, acconto, capofamiglia
-- (payer_id), note e data di iscrizione.
-- Cosa resta: nome, cognome, nascita, codice fiscale, residenza, telefono,
-- email, legacy_id.
-- ---------------------------------------------------------------------------

-- Inizio della stagione (1° settembre) a cui appartiene un istante qualsiasi.
-- stagione_corrente() diventa il caso particolare "adesso".
create or replace function public.stagione_di(quando timestamptz)
returns timestamptz
language sql
immutable
as $$
  select case
    when extract(month from quando) >= 9
      then make_timestamptz(extract(year from quando)::int,     9, 1, 0, 0, 0)
    else   make_timestamptz(extract(year from quando)::int - 1, 9, 1, 0, 0, 0)
  end;
$$;

comment on function public.stagione_di is 'Il 1° settembre della stagione in cui cade il timestamp passato.';

create or replace function public.stagione_corrente()
returns timestamptz
language sql
stable
as $$
  select public.stagione_di(now());
$$;

-- Dopo la chiusura un socio non è iscritto a nessuna stagione finché non lo si
-- risalva dal form: data_iscrizione deve poter essere vuota. Le viste del
-- riepilogo filtrano con `>= stagione_corrente()`, che scarta già i NULL.
alter table public.soci alter column data_iscrizione drop not null;

create table if not exists public.soci_storico (
  id              uuid primary key default gen_random_uuid(),
  archiviato_il   timestamptz not null default now(),

  -- 1° settembre della stagione archiviata: è la chiave con cui si rilegge
  -- "com'era andata" un anno preciso.
  stagione        timestamptz not null,

  -- Il socio è ancora in anagrafica: qui si tiene solo il riferimento più
  -- cognome e nome, perché una riga di storico deve restare leggibile anche se
  -- l'anagrafica viene poi corretta.
  socio_id        uuid not null references public.soci (id) on delete cascade,
  cognome         text not null,
  nome            text not null,

  numero_polizza        text,
  numero_tessera        text,
  tipologia_tessera     text,
  agevolazioni_famiglia text,
  tipo_abbonamento      text,
  tipologia_corso       text,
  partenze_sabato       text,
  partenza_domenica     text,
  totale                numeric(10, 2) not null default 0,
  acconto               numeric(10, 2) not null default 0,
  payer_id              uuid,
  note                  text,
  data_iscrizione       timestamptz
);

create index if not exists soci_storico_stagione_idx on public.soci_storico (stagione);
create index if not exists soci_storico_socio_idx    on public.soci_storico (socio_id);

comment on table public.soci_storico is 'Fotografia dei dati di stagione prima di ogni chiusura. Sola lettura: ci scrive solo chiudi_stagione().';

-- Quante righe verrebbero toccate da una chiusura, per stagione. Serve al
-- pannello per dire in anticipo cosa sta per succedere.
create or replace view public.stagioni_aperte as
select
  public.stagione_di(coalesce(data_iscrizione, now())) as stagione,
  count(*)                    as soci,
  coalesce(sum(totale),  0)   as totale,
  coalesce(sum(acconto), 0)   as incassato,
  coalesce(sum(saldo),   0)   as da_incassare
from public.soci
where data_iscrizione is not null
   or numero_polizza is not null or numero_tessera is not null
   or tipologia_tessera is not null or agevolazioni_famiglia is not null
   or tipo_abbonamento is not null or tipologia_corso is not null
   or partenze_sabato is not null or partenza_domenica is not null
   or payer_id is not null or totale <> 0 or acconto <> 0
group by 1
order by 1 desc;

alter view public.stagioni_aperte set (security_invoker = true);

comment on view public.stagioni_aperte is 'La stagione in corso: righe di soci che portano ancora dati di stagione. Dopo una chiusura è vuota finché non si iscrive qualcuno.';

-- Le stagioni già chiuse, lette dall'archivio. Senza questa vista chiudere la
-- stagione sembrava cancellarla: i dati c'erano ancora in soci_storico, ma la
-- pagina non aveva niente da mostrare e la tabella restava vuota.
create or replace view public.stagioni_chiuse as
select
  stagione,
  count(*)                                as soci,
  coalesce(sum(totale),  0)               as totale,
  coalesce(sum(acconto), 0)               as incassato,
  coalesce(sum(totale - acconto), 0)      as da_incassare,
  max(archiviato_il)                      as chiusa_il
from public.soci_storico
group by stagione
order by stagione desc;

alter view public.stagioni_chiuse set (security_invoker = true);

comment on view public.stagioni_chiuse is 'Riepilogo delle stagioni archiviate: soci, quote, incassato e da incassare com''erano alla chiusura.';

/**
 * Archivia e azzera i dati di stagione di tutti i soci.
 *
 * `conferma` deve valere esattamente 'CHIUDI STAGIONE': è l'ultimo ostacolo
 * prima di un'operazione che tocca tutte le righe, e obbliga chi la lancia a
 * scriverlo, non solo a cliccare.
 *
 * Restituisce quante righe sono state archiviate e azzerate.
 */
create or replace function public.chiudi_stagione(conferma text)
returns table (archiviati bigint, stagione_chiusa timestamptz)
language plpgsql
security invoker
as $$
declare
  quante bigint;
  quale  timestamptz;
begin
  if conferma is distinct from 'CHIUDI STAGIONE' then
    raise exception 'Conferma mancante: per chiudere la stagione serve la frase esatta CHIUDI STAGIONE.';
  end if;

  quale := public.stagione_corrente();

  -- Le righe da chiudere si decidono una volta sola e si tengono da parte:
  -- archiviazione e azzeramento devono lavorare esattamente sulle stesse, e
  -- ripetere il filtro due volte sarebbe due occasioni di scriverlo diverso.
  create temporary table da_chiudere on commit drop as
  select id from public.soci
   where data_iscrizione is not null
      or numero_polizza is not null or numero_tessera is not null
      or tipologia_tessera is not null or agevolazioni_famiglia is not null
      or tipo_abbonamento is not null or tipologia_corso is not null
      or partenze_sabato is not null or partenza_domenica is not null
      or payer_id is not null or totale <> 0 or acconto <> 0;

  select count(*) into quante from da_chiudere;

  insert into public.soci_storico (
    stagione, socio_id, cognome, nome,
    numero_polizza, numero_tessera, tipologia_tessera, agevolazioni_famiglia,
    tipo_abbonamento, tipologia_corso, partenze_sabato, partenza_domenica,
    totale, acconto, payer_id, note, data_iscrizione)
  select
    public.stagione_di(coalesce(d.data_iscrizione, now())),
    d.id, d.cognome, d.nome,
    d.numero_polizza, d.numero_tessera, d.tipologia_tessera, d.agevolazioni_famiglia,
    d.tipo_abbonamento, d.tipologia_corso, d.partenze_sabato, d.partenza_domenica,
    d.totale, d.acconto, d.payer_id, d.note, d.data_iscrizione
  from public.soci d
  join da_chiudere t on t.id = d.id;

  -- Un solo UPDATE, e con il WHERE: le anagrafiche non sono nominate, quindi
  -- non c'è modo che questa riga le tocchi. Il WHERE serve anche a Supabase,
  -- che rifiuta gli UPDATE senza (estensione safeupdate): un "azzera tutto"
  -- scritto per sbaglio non deve poter partire.
  update public.soci set
    numero_polizza        = null,
    numero_tessera        = null,
    tipologia_tessera     = null,
    agevolazioni_famiglia = null,
    tipo_abbonamento      = null,
    tipologia_corso       = null,
    partenze_sabato       = null,
    partenza_domenica     = null,
    totale                = 0,
    acconto               = 0,
    payer_id              = null,
    note                  = null,
    data_iscrizione       = null
  where id in (select id from da_chiudere);

  return query select quante, quale;
end;
$$;

comment on function public.chiudi_stagione is 'Archivia in soci_storico e azzera i dati di stagione di tutti i soci. Conserva le anagrafiche.';

alter table public.soci_storico enable row level security;

drop policy if exists soci_storico_select on public.soci_storico;
drop policy if exists soci_storico_insert on public.soci_storico;

-- Lo storico si legge e si scrive solo passando da chiudi_stagione(), che gira
-- come l'utente collegato: serve quindi il permesso di inserire, ma non quelli
-- di modificare o cancellare. Una stagione archiviata non si ritocca.
create policy soci_storico_select on public.soci_storico
  for select to authenticated using (true);

create policy soci_storico_insert on public.soci_storico
  for insert to authenticated with check (true);

-- ---------------------------------------------------------------------------
-- Saldo di un nucleo familiare
--
-- L'incasso avviene per nucleo familiare: il capofamiglia salda l'intero
-- importo dovuto dal nucleo. La funzione sta sul database perché le righe del
-- nucleo devono cambiare in un'unica transazione: aggiornandole una alla volta
-- dal browser, una connessione interrotta lascerebbe il nucleo saldato a metà.
--
-- Chi ha già pagato più del dovuto non viene toccato (`saldo > 0`): un acconto
-- in eccesso è un caso da sistemare a mano, non da azzerare in silenzio.
-- ---------------------------------------------------------------------------

create or replace function public.salda_nucleo(capofamiglia uuid)
returns table (soci_saldati bigint, importo numeric)
language plpgsql
security invoker
as $$
declare
  quanti bigint;
  quanto numeric(10, 2);
begin
  select count(*), coalesce(sum(saldo), 0)
    into quanti, quanto
    from public.soci
   where (id = capofamiglia or payer_id = capofamiglia)
     and saldo > 0;

  if quanti = 0 then
    return query select 0::bigint, 0::numeric;
    return;
  end if;

  update public.soci
     set acconto = totale
   where (id = capofamiglia or payer_id = capofamiglia)
     and saldo > 0;

  return query select quanti, quanto;
end;
$$;

comment on function public.salda_nucleo is 'Porta a zero il saldo del capofamiglia e dei suoi familiari a carico. Restituisce quante righe e quanto è stato incassato.';

-- ---------------------------------------------------------------------------
-- Abbonamenti a viaggi
--
-- Il listino vende "Abbonamento 5 viaggi SABATO / DOMENICA / MARTEDÌ / JOLLY",
-- ma l'abbonamento era finora solo un valore testuale nella riga del socio,
-- senza alcun conteggio delle gite effettuate.
--
-- Numero di gite e giorno di validità sono proprietà del listino, non del
-- socio: stanno qui, accanto al prezzo. Il socio continua a puntare al listino
-- con `tipo_abbonamento`.
--
-- JOLLY vale qualunque giorno: è un giorno come gli altri in tabella, e sono
-- le query a decidere se includerlo.
-- ---------------------------------------------------------------------------

alter table public.prezzi add column if not exists viaggi int;
alter table public.prezzi add column if not exists giorno text;

alter table public.prezzi drop constraint if exists prezzi_giorno_valido;
alter table public.prezzi add constraint prezzi_giorno_valido
  check (giorno is null or giorno in ('SABATO', 'DOMENICA', 'MARTEDI', 'JOLLY'));

alter table public.prezzi drop constraint if exists prezzi_viaggi_positivi;
alter table public.prezzi add constraint prezzi_viaggi_positivi
  check (viaggi is null or viaggi > 0);

comment on column public.prezzi.viaggi is 'Quante gite comprende l''abbonamento. NULL per tutto ciò che non è un abbonamento a viaggi.';
comment on column public.prezzi.giorno is 'Giorno dell''abbonamento. JOLLY = utilizzabile in qualsiasi giorno.';

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
create or replace function public.prezzi_deduci_abbonamento()
returns trigger
language plpgsql
as $$
begin
  if new.categoria = 'ABBONAMENTO' and new.viaggi is null and new.giorno is null then
    new.viaggi := nullif(substring(new.nome from '(\d+)\s*[vV]iagg'), '')::int;
    new.giorno := case
      when upper(new.nome) like '%SABATO%'   then 'SABATO'
      when upper(new.nome) like '%DOMENICA%' then 'DOMENICA'
      when upper(new.nome) like '%MARTED%'   then 'MARTEDI'
      when upper(new.nome) like '%JOLLY%'    then 'JOLLY'
    end;

    -- Un abbonamento senza numero di viaggi (es. il corso di presciistica)
    -- non è un abbonamento a gite: resta senza giorno.
    if new.viaggi is null then
      new.giorno := null;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists prezzi_deduci_abbonamento on public.prezzi;
create trigger prezzi_deduci_abbonamento
  before insert or update on public.prezzi
  for each row execute function public.prezzi_deduci_abbonamento();

-- Le righe già in tabella (database creato prima di questa aggiunta) passano
-- dal trigger con un aggiornamento a vuoto.
update public.prezzi set nome = nome
 where categoria = 'ABBONAMENTO' and viaggi is null and giorno is null;

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

create table if not exists public.gite_usate (
  id            uuid primary key default gen_random_uuid(),
  socio_id      uuid not null references public.soci (id) on delete cascade,

  -- Fissata alla registrazione: se una gita viene segnata a settembre inoltrato
  -- resta nella stagione in cui è stata fatta.
  stagione      timestamptz not null default public.stagione_corrente(),

  data_gita     date not null default current_date,
  registrato_il timestamptz not null default now()
);

-- Prima una riga poteva valere più gite e portarsi dietro i nomi di chi era
-- salito: adesso vale una gita e basta, e le colonne vanno tolte anche dai
-- database creati con la versione precedente.
alter table public.gite_usate drop column if exists quante;
alter table public.gite_usate drop column if exists partecipanti;
alter table public.gite_usate drop column if exists nota;

create index if not exists gite_usate_socio_idx    on public.gite_usate (socio_id);
create index if not exists gite_usate_stagione_idx on public.gite_usate (stagione);

comment on table public.gite_usate is 'Registro delle gite scalate dagli abbonamenti: una riga per gita. Ci si scrive solo con usa_gite().';

-- Stato di ogni abbonamento della stagione: quante gite comprende, quante ne
-- restano, e i contatti per chiamare chi non si è ancora visto.
create or replace view public.abbonamenti_gite as
select
  s.id                                as socio_id,
  s.cognome,
  s.nome,
  s.telefono,
  s.email,
  s.payer_id,
  p.nome                              as abbonamento,
  p.giorno,
  p.viaggi                            as viaggi_totali,
  coalesce(u.usate, 0)::int           as viaggi_usati,
  (p.viaggi - coalesce(u.usate, 0))::int as viaggi_residui
from public.soci s
join public.prezzi p
  on  p.categoria = 'ABBONAMENTO'
  and p.nome      = s.tipo_abbonamento
  and p.viaggi is not null
left join (
  select socio_id, count(*) as usate
    from public.gite_usate
   where stagione = public.stagione_corrente()
   group by socio_id
) u on u.socio_id = s.id
where s.data_iscrizione >= public.stagione_corrente();

alter view public.abbonamenti_gite set (security_invoker = true);

comment on view public.abbonamenti_gite is 'Abbonamenti a viaggi della stagione corrente con gite fatte e residue.';

/**
 * Scala una gita dall'abbonamento di un socio.
 *
 * Il controllo sul residuo sta qui e non nella pagina: due telefoni che
 * segnano la stessa gita nello stesso momento non possono far scendere il
 * contatore sotto zero.
 */
-- La firma è cambiata (prima accettava numero di gite, data e partecipanti):
-- `create or replace` da solo lascerebbe in giro le vecchie versioni come
-- funzioni sovrapposte, e la chiamata diventerebbe ambigua.
drop function if exists public.usa_gite(uuid, int, date, text, text);
drop function if exists public.usa_gite(uuid, int, date);

create or replace function public.usa_gite(socio uuid)
returns table (viaggi_usati int, viaggi_residui int)
language plpgsql
security invoker
as $$
declare
  residui int;
begin
  -- FOR UPDATE sulla riga del socio: chi arriva secondo aspetta e rilegge il
  -- residuo aggiornato invece di scalare sullo stesso conteggio.
  perform 1 from public.soci where id = socio for update;

  select a.viaggi_residui into residui
    from public.abbonamenti_gite a
   where a.socio_id = socio;

  if residui is null then
    raise exception 'Questo socio non ha un abbonamento a viaggi in questa stagione.';
  end if;

  if residui < 1 then
    raise exception 'Abbonamento esaurito: non restano gite da scalare.';
  end if;

  insert into public.gite_usate (socio_id) values (socio);

  return query
    select a.viaggi_usati, a.viaggi_residui
      from public.abbonamenti_gite a
     where a.socio_id = socio;
end;
$$;

comment on function public.usa_gite is 'Scala una gita dall''abbonamento del socio, con la data di oggi.';

/**
 * Annulla una registrazione sbagliata. Si cancella una riga precisa, non
 * "l'ultima": chi corregge deve vedere cosa sta togliendo.
 */
create or replace function public.annulla_gita(gita uuid)
returns table (viaggi_usati int, viaggi_residui int)
language plpgsql
security invoker
as $$
declare
  socio uuid;
begin
  delete from public.gite_usate where id = gita returning socio_id into socio;
  if socio is null then
    raise exception 'Questa registrazione non esiste più.';
  end if;

  return query
    select a.viaggi_usati, a.viaggi_residui
      from public.abbonamenti_gite a
     where a.socio_id = socio;
end;
$$;

comment on function public.annulla_gita is 'Cancella una gita registrata per errore e restituisce il nuovo residuo.';

alter table public.gite_usate enable row level security;

drop policy if exists gite_usate_select on public.gite_usate;
drop policy if exists gite_usate_insert on public.gite_usate;
drop policy if exists gite_usate_delete on public.gite_usate;

-- Si scrive e si corregge solo passando dalle due funzioni, che girano come
-- l'utente collegato. Manca apposta l'update: una gita sbagliata si annulla e
-- si riscrive, non si ritocca.
create policy gite_usate_select on public.gite_usate
  for select to authenticated using (true);

create policy gite_usate_insert on public.gite_usate
  for insert to authenticated with check (true);

create policy gite_usate_delete on public.gite_usate
  for delete to authenticated using (true);
