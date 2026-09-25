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
  category    text not null check (category in ('TESSERA', 'FAMIGLIA', 'ABBONAMENTO', 'CORSO', 'PRESCIISTICA')),
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
-- stagione avviene in lettura: close_season() svuota enrolled_at, quindi chi
-- ce l'ha è iscritto alla stagione aperta (vedi current_season()).
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
  -- La presciistica è un corso in palestra che si aggiunge a tutto il resto:
  -- con una colonna sua non esclude l'abbonamento alle gite.
  preski_type       text,
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
alter table public.members add column if not exists preski_type     text;

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

-- Numero tessera: non ci possono essere due soci con lo stesso. close_season()
-- lo azzera per tutti, quindi "unico nella tabella" vuol dire "unico nella
-- stagione aperta": l'anno dopo i numeri ripartono. I NULL non si scontrano
-- fra loro, quindi chi non ha ancora un numero non dà fastidio.
--
-- Il form propone il numero da sé (next_card_number(), sotto): due operatori
-- che iscrivono nello stesso momento si vedono proporre lo stesso, e questo
-- vincolo fa fallire il secondo salvataggio invece di lasciare passare il
-- doppione. La pagina a quel punto propone il successivo.
alter table public.members drop constraint if exists members_card_number_key;
alter table public.members add constraint members_card_number_key unique (card_number);

-- Il numero da proporre: il più alto già dato, più uno. Non riempie i buchi
-- apposta: il direttivo si tiene i primi numeri (es. 1-20) ma si tessera più
-- tardi, e i soci partono dopo (21, 22, ...). Riempire i buchi darebbe a un
-- socio il numero riservato a un consigliere. Il primo socio della stagione
-- si numera a mano; da lì in poi la proposta va da sola.
--
-- I numeri scritti in altri formati (lettere, trattini) non contano: non
-- hanno un "successivo". Security invoker: legge solo quello che la RLS di
-- members lascia già vedere.
create or replace function public.next_card_number()
returns bigint
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(max(m.card_number::bigint), 0) + 1
    from public.members m
   where m.card_number ~ '^[0-9]{1,15}$';
$$;

comment on function public.next_card_number is 'Numero tessera da proporre: il più alto già dato (solo quelli numerici) più uno.';

-- ---------------------------------------------------------------------------
-- Stagione
--
-- Stessa regola della 1.x: la stagione parte il 1° settembre. Se siamo a
-- settembre o dopo, parte quest'anno; altrimenti l'anno scorso.
-- Qui serve solo alle viste che seguono: più sotto, dopo season_history,
-- current_season() diventa "la stagione aperta".
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
where enrolled_at is not null;

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
where m.enrolled_at is not null
  and m.card_type is not null
  and upper(m.card_type) <> 'NO'
group by m.card_type, p.price;

-- pass_counts sta più sotto, con gli abbonamenti dei soci (member_passes):
-- dalla 2.4 un socio può averne più di uno, e si contano gli abbonamenti
-- venduti, non le persone.

create or replace view public.course_counts as
select course_type as name, count(*) as count
from public.members
where enrolled_at is not null
  and course_type is not null
  and upper(course_type) <> 'NO'
group by course_type;

create or replace view public.preski_counts as
select preski_type as name, count(*) as count
from public.members
where enrolled_at is not null
  and preski_type is not null
  and upper(preski_type) <> 'NO'
group by preski_type;

-- Resoconto rapido del pannello amministrazione: tre numeri della stagione.
-- Incasso corsi = iscritti al corso x prezzo di listino (sabato o domenica
-- indifferente): paid e' un acconto unico per riga, quindi l'incassato per voce
-- non esiste. Tesserati = chi ha una tessera, "NO" vale come vuoto.
create or replace view public.admin_summary as
select
  (select coalesce(sum(p.price), 0)
     from public.members m
     join public.prices p on p.category = 'CORSO' and p.name = m.course_type
    where m.enrolled_at is not null)            as courses_income,
  (select coalesce(sum(paid), 0) from public.members
    where enrolled_at is not null)              as total_collected,
  (select count(*) from public.members
    where enrolled_at is not null
      and card_type is not null and upper(card_type) <> 'NO')  as card_holders;

-- Le partenze sono liste separate da virgola come nella 1.x: vengono esplose.
create or replace view public.departure_counts as
select 'SABATO' as day, trim(place) as place, count(*) as count
from public.members, unnest(string_to_array(saturday_departure, ',')) as place
where enrolled_at is not null
  and saturday_departure is not null
  and upper(saturday_departure) <> 'NO'
  and trim(place) <> ''
group by trim(place)
union all
select 'DOMENICA' as day, trim(place) as place, count(*) as count
from public.members, unnest(string_to_array(sunday_departure, ',')) as place
where enrolled_at is not null
  and sunday_departure is not null
  and upper(sunday_departure) <> 'NO'
  and trim(place) <> ''
group by trim(place);

-- ---------------------------------------------------------------------------
-- Ruoli e permessi
--
-- Fino alla 2.4 i ruoli erano una scala (ospite < kiosk < assicurazione <
-- utente < admin < superadmin) e ogni policy chiedeva "almeno il ruolo X".
-- Dalla 2.5 non regge più: il tesoriere vede il Bilancio e non modifica i
-- soci, l'admin modifica i soci e non vede il Bilancio. Nessuno dei due sta
-- "sopra" l'altro. Ogni ruolo ha quindi un elenco di permessi, scritto in un
-- punto solo (role_permissions), e le policy chiedono un permesso (can()).
--
--   superadmin    — tutto, più "vedi come" (view_as) per provare il sito con
--                   gli occhi di un altro ruolo.
--   admin         — soci (iscrizioni e modifiche), pagamenti, Riepilogo
--                   della stagione in corso, pannello gite, tessere riservate.
--   tesoriere     — pagamenti, Riepilogo con le stagioni chiuse, Bilancio.
--                   I soci li legge ma non li modifica.
--   assicurazione — solo codice fiscale e polizze dei tesserati, dalle
--                   funzioni insurance_*: non ha accesso alla tabella members.
--   gite          — a schermo "Utente": ricerca soci e pannello gite dal
--                   telefono (segna le gite, vende un abbonamento).
--   social        — pagina Social: post e campagne degli sponsor.
--
-- Permessi:
--   soci       members in scrittura, abbonamenti dal form Soci
--   pagamenti  pagina Pagamenti (settle_household)
--   riepilogo  pagina Riepilogo ed Excel dei tesserati
--   storico    stagioni chiuse (season_history, season_breakdown)
--   bilancio   movimenti e saldo banca
--   gite       ricerca soci e pannello gite (use_trip, cancel_trip, add_pass)
--   polizze    codice fiscale e numero di polizza (solo loro li cambiano)
--   social     post, campagne e sponsor
--   gestione   Amministrazione (chiusura stagione), Utenti, Impostazioni,
--              togliere un socio dalla stagione
--
-- Non esistono più 'ospite' e 'kiosk'. Un account senza riga in profiles non
-- può fare niente: è così che nasce un account nuovo (lo crea il pannello
-- Utenti, che subito dopo gli dà il ruolo scelto) ed è così che resta chi
-- viene rimosso. Chi si registrasse da solo con la chiave anon pubblica
-- otterrebbe un account cieco, in elenco fra quelli "senza accesso".
--
-- Il ruolo vive in profiles, non in auth.users, per poterlo leggere/scrivere
-- con RLS normali invece che con l'Admin API (che richiede service_role e non
-- va usata dal browser, vedi docs/ACCOUNT.md).
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  role       text not null,
  created_at timestamptz not null default now()
);

-- Il superadmin che guarda il sito come un altro ruolo: current_role()
-- risponde con questo, così policy, pagine e barra si comportano esattamente
-- come per quel ruolo. Vale solo se il ruolo vero è superadmin.
alter table public.profiles add column if not exists view_as text;
alter table public.profiles alter column role drop default;

-- Dalla scala della 2.4 ai ruoli della 2.5. Prima di rimettere il vincolo:
--   utente (volontario: iscrizioni e incassi) → admin, che fa le stesse cose;
--   ospite e kiosk → senza accesso (riga tolta), come un account rimosso.
-- Rieseguite non trovano più niente: il vincolo sotto non ammette quei ruoli.
alter table public.profiles drop constraint if exists profiles_role_valid;
alter table public.profiles drop constraint if exists profiles_view_as_valid;
update public.profiles set role = 'admin' where role = 'utente';
delete from public.profiles where role in ('ospite', 'kiosk');

alter table public.profiles add constraint profiles_role_valid
  check (role in ('gite', 'assicurazione', 'social', 'tesoriere', 'admin', 'superadmin'));
alter table public.profiles add constraint profiles_view_as_valid
  check (view_as in ('gite', 'assicurazione', 'social', 'tesoriere', 'admin'));

comment on table public.profiles is 'Un ruolo per utente Supabase Auth. Senza riga: nessun accesso (account nuovo o rimosso).';
comment on column public.profiles.view_as is 'Solo superadmin: il ruolo con cui sta guardando il sito ("vedi come"). NULL = sé stesso.';

-- Chi smette di essere superadmin smette anche di "vedere come".
create or replace function public.clear_view_as()
returns trigger
language plpgsql
as $$
begin
  if new.role <> 'superadmin' then
    new.view_as := null;
  end if;
  return new;
end;
$$;

drop trigger if exists clear_view_as on public.profiles;
create trigger clear_view_as
  before insert or update on public.profiles
  for each row execute function public.clear_view_as();

-- Fino alla 2.4 ogni account nuovo nasceva con una riga 'ospite'. Adesso
-- nasce senza riga: stesso effetto (non vede niente), un ruolo in meno.
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_profile();

-- Fotografia una tantum: chi ha già un account oggi è il direttivo, che ha
-- già accesso pieno. Non li retrocede al ruolo minimo dei nuovi login.
--
-- "where not exists" la limita alla primissima esecuzione, quando profiles è
-- ancora vuota. Senza, riguarderebbe anche chi è stato rimosso dal pannello
-- Utenti — la rimozione cancella la riga profiles, non l'account Auth — e un
-- rilancio dello script rimetterebbe in gioco come admin proprio le persone a
-- cui l'accesso era stato tolto.
insert into public.profiles (user_id, email, role)
select id, email, 'admin' from auth.users
where not exists (select 1 from public.profiles)
on conflict (user_id) do nothing;

-- Nessuno è superadmin subito dopo questa migration: va promosso a mano,
-- vedi docs/ACCOUNT.md ("Promuovere il primo superadmin").

-- Il ruolo con cui la richiesta va trattata: quello "visto come" per il
-- superadmin che lo ha scelto, altrimenti il ruolo vero. Null senza riga.
--
-- security definer NON e' opzionale qui: la policy profiles_select_all qui
-- sotto chiama can(), che chiama questa funzione, che rilegge profiles, che
-- rivaluta le policy... Con security invoker ogni lettura di un ruolo finisce
-- in ricorsione infinita ("stack depth limit exceeded") appena la RLS e'
-- attiva, cioe' per ogni utente reale (il test come superuser postgres non lo
-- vede: il superuser bypassa la RLS). Da definer la funzione gira come
-- proprietario della tabella e la RLS di profiles non si applica, quindi la
-- catena si ferma. Legge comunque solo la riga di auth.uid().
create or replace function public.current_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case when p.role = 'superadmin' and p.view_as is not null then p.view_as else p.role end
    from public.profiles p
   where p.user_id = auth.uid();
$$;

comment on function public.current_role is 'Ruolo con cui trattare la richiesta corrente ("vedi come" compreso), o null.';

-- I permessi di ogni ruolo: l'unico posto dove sono scritti. Li leggono
-- can() per le policy e my_access() per le pagine.
create or replace function public.role_permissions(role text)
returns text[]
language sql
immutable
as $$
  select case role
    when 'superadmin'    then array['soci', 'pagamenti', 'riepilogo', 'storico', 'bilancio',
                                    'gite', 'polizze', 'social', 'gestione']
    when 'admin'         then array['soci', 'pagamenti', 'riepilogo', 'gite']
    when 'tesoriere'     then array['pagamenti', 'riepilogo', 'storico', 'bilancio']
    when 'assicurazione' then array['polizze']
    when 'gite'          then array['gite']
    when 'social'        then array['social']
    else array[]::text[]
  end;
$$;

comment on function public.role_permissions is 'Permessi di un ruolo. Unico elenco: lo usano can() e my_access().';

-- true se chi ha fatto la richiesta ha almeno uno dei permessi passati.
-- Nelle policy va scritta dentro una select, `(select public.can('soci'))`:
-- così Postgres la calcola una volta per query e non per ognuna delle
-- migliaia di righe di members.
create or replace function public.can(variadic perms text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.role_permissions(public.current_role()) && perms, false);
$$;

comment on function public.can is 'true se il ruolo di chi chiama (vedi come compreso) ha almeno uno dei permessi.';

-- Quello che serve alle pagine per disegnare barra e contenuto: email, ruolo
-- con cui si sta guardando, ruolo vero e permessi. Una chiamata sola.
create or replace function public.my_access()
returns table (email text, role text, real_role text, permissions text[])
language sql
stable
security definer
set search_path = ''
as $$
  select p.email, public.current_role(), p.role, public.role_permissions(public.current_role())
    from public.profiles p
   where p.user_id = auth.uid();
$$;

comment on function public.my_access is 'Email, ruolo effettivo, ruolo vero e permessi di chi è collegato.';

-- "Vedi come": solo il superadmin, controllato sul ruolo VERO. Così tornare
-- sé stessi (null) funziona sempre, anche mentre si guarda come un ruolo che
-- non potrebbe fare niente.
create or replace function public.set_view_as(role text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select p.role from public.profiles p where p.user_id = auth.uid()) is distinct from 'superadmin' then
    raise exception 'Solo un superadmin può vedere il sito come un altro ruolo.';
  end if;
  update public.profiles p
     set view_as = nullif(set_view_as.role, 'superadmin')
   where p.user_id = auth.uid();
end;
$$;

comment on function public.set_view_as is 'Superadmin: guarda il sito come un altro ruolo (null o superadmin per tornare sé stesso).';

alter table public.profiles enable row level security;

drop policy if exists profiles_select_own        on public.profiles;
drop policy if exists profiles_select_superadmin on public.profiles;
drop policy if exists profiles_update_superadmin on public.profiles;
drop policy if exists profiles_delete_superadmin on public.profiles;
drop policy if exists profiles_select_all        on public.profiles;
drop policy if exists profiles_update            on public.profiles;
drop policy if exists profiles_delete            on public.profiles;

-- Ognuno legge la propria riga; chi ha il permesso gestione le legge e le
-- modifica tutte per gestire i ruoli altrui. L'insert passa solo da
-- restore_account(): niente policy insert, quindi è bloccato di default.
create policy profiles_select_own on public.profiles
  for select to authenticated using (user_id = auth.uid());

create policy profiles_select_all on public.profiles
  for select to authenticated using ((select public.can('gestione')));

create policy profiles_update on public.profiles
  for update to authenticated
  using ((select public.can('gestione')))
  with check ((select public.can('gestione')));

-- Rimuovere un utente dal pannello Utenti cancella la sua riga qui: senza
-- ruolo current_role() torna null e ogni policy lo nega, quindi l'accesso è
-- revocato anche se l'account Auth resta in piedi.
create policy profiles_delete on public.profiles
  for delete to authenticated using ((select public.can('gestione')));

-- Gli account senza riga profiles: quelli appena creati e quelli rimossi dal
-- pannello Utenti. Security definer perché auth.users non è leggibile dal
-- browser; entrambe rispondono solo a chi ha gestione e restituiscono solo id
-- ed email.
create or replace function public.accounts_without_role()
returns table (user_id uuid, email text)
language sql
stable
security definer
set search_path = ''
as $$
  select u.id, u.email::text
    from auth.users u
   where public.can('gestione')
     and not exists (select 1 from public.profiles p where p.user_id = u.id)
   order by u.email;
$$;

comment on function public.accounts_without_role is 'Account Auth senza riga profiles (nuovi o rimossi dal pannello Utenti). Solo superadmin.';

-- Dà l'accesso, con il ruolo scelto, a un account che non ce l'ha: appena
-- creato dal pannello Utenti, o rimosso in precedenza. Su un account che ha
-- già un ruolo lo cambia. Il ruolo lo controlla il vincolo profiles_role_valid.
create or replace function public.restore_account(user_id uuid, role text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.can('gestione') then
    raise exception 'Solo un superadmin può dare l''accesso a un account.';
  end if;

  insert into public.profiles (user_id, email, role)
  select u.id, u.email, restore_account.role
    from auth.users u
   where u.id = restore_account.user_id
  on conflict on constraint profiles_pkey do update set role = excluded.role;

  if not found then
    raise exception 'Account non trovato: ricarica la pagina.';
  end if;
end;
$$;

comment on function public.restore_account is 'Dà l''accesso con il ruolo scelto a un account senza ruolo (nuovo o rimosso). Solo superadmin.';

-- Elimina per sempre un account già rimosso. Gira come proprietario
-- (postgres), l'unico che può cancellare da auth.users: con l'account se ne
-- vanno a cascata sessioni, identità e la riga profiles.
--
-- Solo su un account già senza ruolo: prima Rimuovi, poi Elimina. Così un
-- clic sbagliato non cancella un account attivo, e il superadmin non può
-- eliminare sé stesso (la sua riga non si rimuove, vedi web/utenti.html).
create or replace function public.delete_account(user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.can('gestione') then
    raise exception 'Solo un superadmin può eliminare un account.';
  end if;

  if exists (select 1 from public.profiles p where p.user_id = delete_account.user_id) then
    raise exception 'Si elimina solo un account già rimosso: prima premi Rimuovi.';
  end if;

  delete from auth.users u where u.id = delete_account.user_id;
  if not found then
    raise exception 'Account non trovato: ricarica la pagina.';
  end if;
end;
$$;

comment on function public.delete_account is 'Elimina per sempre un account Auth già rimosso dal pannello Utenti (senza riga profiles). Solo superadmin.';

-- Supabase dà execute ad anon di default: senza login le funzioni non
-- farebbero comunque niente, ma la porta resta chiusa.
do $$
declare
  f text;
begin
  foreach f in array array[
    'public.can(text[])', 'public.my_access()', 'public.set_view_as(text)',
    'public.accounts_without_role()', 'public.restore_account(uuid, text)',
    'public.delete_account(uuid)'] loop
    execute format('revoke all on function %s from public', f);
    if exists (select 1 from pg_roles where rolname = 'anon') then
      execute format('revoke all on function %s from anon', f);
    end if;
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;

-- Chi può vedere/scegliere una voce di listino. Vale solo per
-- category='TESSERA' (es. "TESSERA DIRETTIVO" a min_role='admin'); le altre
-- categorie restano a 'utente', cioè visibili a chiunque possa vedere il
-- listino. Il vincolo prices_min_role_only_card lo impone: prima valeva per
-- gli abbonamenti, e un abbonamento rimasto riservato da allora torna a
-- 'utente' qui sotto invece di far fallire lo script.
--
-- I valori sono quelli della scala della 2.4 e restano per non riscrivere il
-- listino: 'utente' = chiunque iscriva soci, 'admin' = admin e superadmin,
-- 'superadmin' = solo superadmin. Li interpreta card_allowed().
alter table public.prices add column if not exists min_role text not null default 'utente';

alter table public.prices drop constraint if exists prices_min_role_valid;
alter table public.prices add constraint prices_min_role_valid
  check (min_role in ('utente', 'admin', 'superadmin'));

update public.prices set min_role = 'utente'
 where category <> 'TESSERA' and min_role <> 'utente';

alter table public.prices drop constraint if exists prices_min_role_only_card;
alter table public.prices add constraint prices_min_role_only_card
  check (category = 'TESSERA' or min_role = 'utente');

comment on column public.prices.min_role is 'Chi vede/sceglie questa voce (solo category=TESSERA): utente = tutti, admin = admin e superadmin, superadmin = solo superadmin.';

-- true se chi chiama può assegnare una tessera con quel min_role. La stessa
-- regola la ripete la pagina Soci (tesseraConsentita() in web/shared.js) per
-- non mostrare le voci che il database rifiuterebbe.
create or replace function public.card_allowed(min_role text)
returns boolean
language sql
stable
as $$
  select coalesce(min_role, 'utente') = 'utente'
      or public.current_role() = 'superadmin'
      or public.current_role() = min_role;
$$;

-- Il tablet in negozio (ruolo kiosk) non c'è più, e con lui la sua ricerca.
drop function if exists public.kiosk_search(text[]);
drop view if exists public.members_kiosk_search;

-- ---------------------------------------------------------------------------
-- Assicurazione
--
-- Ogni tesserato va assicurato. Chi se ne occupa manda all'assicurazione
-- l'elenco dei tesserati nuovi, riceve indietro i numeri di polizza e li
-- riporta qui; chi ha la polizza esce dall'elenco da mandare. close_season()
-- azzera le polizze, quindi a ogni stagione si riparte da tutti.
--
-- Il ruolo 'assicurazione' non ha policy su members: le sue sole porte sono
-- queste funzioni, che danno i campi che servono e
-- scrivono solo codice fiscale e polizza. Con una policy di update, invece,
-- potrebbe cambiare anche quote e acconti chiamando l'API a mano: la RLS
-- sceglie le righe, non le colonne.
-- ---------------------------------------------------------------------------

-- Fino al primo rilascio della 2.4 insurance_members(only_pending) dava, con
-- false, tutti i tesserati della stagione: l'assicurazione poteva scaricare
-- l'elenco completo dei soci chiamando l'API a mano. L'elenco completo è del
-- Riepilogo (permesso riepilogo, che legge members con la sua RLS); qui restano
-- chi è da assicurare e una ricerca con pochi risultati per le correzioni.
drop function if exists public.insurance_members(boolean);
-- Le colonne restituite cambieranno con il tracciato che chiede
-- l'assicurazione (TODO in web/shared.js): `create or replace` non può
-- cambiare le colonne di una funzione, quindi prima la si toglie.
drop function if exists public.insurance_members();

-- I tesserati della stagione aperta ancora senza polizza. "NO" come tessera
-- vale come nessuna tessera, come nel Riepilogo.
create or replace function public.insurance_members()
returns table (id uuid, last_name text, first_name text, birth_date date,
               birth_place text, birth_province text, tax_code text,
               address text, city text, province text, postal_code text,
               card_type text, card_number text, policy_number text)
language sql
stable
security definer
set search_path = ''
as $$
  select m.id, m.last_name, m.first_name, m.birth_date,
         m.birth_place, m.birth_province, m.tax_code,
         m.address, m.city, m.province, m.postal_code,
         m.card_type, m.card_number, m.policy_number
    from public.members m
   where public.can('polizze')
     and m.enrolled_at is not null
     and m.card_type is not null and upper(m.card_type) <> 'NO'
     and nullif(trim(m.policy_number), '') is null
   -- id in fondo: con omonimi l'ordine resta lo stesso fra una pagina e
   -- l'altra (la pagina legge a blocchi di 1000, vedi tutteLeRighe()).
   order by m.last_name, m.first_name, m.id;
$$;

comment on function public.insurance_members is 'Tesserati della stagione aperta ancora senza polizza, per l''assicurazione.';

-- Per correggere una polizza o un codice fiscale già salvati: cerca fra i
-- tesserati della stagione, anche quelli già assicurati. Ogni parola (almeno
-- due lettere) deve comparire in cognome, nome, codice fiscale, polizza o
-- numero tessera. Al massimo 20 risultati e nessun indirizzo: serve a
-- ritrovare una persona, non a scaricare l'elenco dei soci.
drop function if exists public.insurance_search(text);
create or replace function public.insurance_search(testo text)
returns table (id uuid, last_name text, first_name text, birth_date date,
               birth_place text, birth_province text, tax_code text,
               card_number text, policy_number text)
language sql
stable
security definer
set search_path = ''
as $$
  -- Toglie % e _, che nel like sotto farebbero da jolly.
  with parole as (
    select distinct p
      from unnest(string_to_array(upper(regexp_replace(coalesce(testo, ''), '[%_]', '', 'g')), ' ')) p
     where length(p) >= 2
  )
  select m.id, m.last_name, m.first_name, m.birth_date,
         m.birth_place, m.birth_province, m.tax_code,
         m.card_number, m.policy_number
    from public.members m
   where public.can('polizze')
     and (select count(*) from parole) > 0
     and m.enrolled_at is not null
     and m.card_type is not null and upper(m.card_type) <> 'NO'
     and not exists (
       select 1 from parole
        where upper(concat_ws(' ', m.last_name, m.first_name, m.tax_code, m.policy_number, m.card_number))
              not like '%' || parole.p || '%')
   order by m.last_name, m.first_name
   limit 20;
$$;

comment on function public.insurance_search is 'Ricerca fra i tesserati della stagione per correggere polizza o codice fiscale: al massimo 20 risultati, senza indirizzi.';

-- Scrive codice fiscale e polizza di un tesserato della stagione, e nient'altro.
-- Il codice fiscale si corregge qui perché è qui che lo si controlla prima di
-- spedirlo; la polizza vuota resta vuota (il socio resta da assicurare).
create or replace function public.set_insurance(member_id uuid, tax_code text, policy_number text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.can('polizze') then
    raise exception 'Non hai il permesso di modificare i dati dell''assicurazione.';
  end if;

  update public.members m set
    tax_code      = nullif(upper(regexp_replace(set_insurance.tax_code, '\s', '', 'g')), ''),
    policy_number = nullif(trim(set_insurance.policy_number), '')
   where m.id = set_insurance.member_id
     and m.enrolled_at is not null;

  if not found then
    raise exception 'Socio non trovato fra gli iscritti della stagione: ricarica la pagina.';
  end if;
end;
$$;

comment on function public.set_insurance is 'Scrive codice fiscale e numero di polizza di un iscritto della stagione. Solo con il permesso polizze.';

revoke all on function public.insurance_members() from public;
revoke all on function public.insurance_search(text) from public;
revoke all on function public.set_insurance(uuid, text, text) from public;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on function public.insurance_members() from anon;
    revoke all on function public.insurance_search(text) from anon;
    revoke all on function public.set_insurance(uuid, text, text) from anon;
  end if;
end $$;
grant execute on function public.insurance_members() to authenticated;
grant execute on function public.insurance_search(text) to authenticated;
grant execute on function public.set_insurance(uuid, text, text) to authenticated;

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
--
-- Dalla 2.1 le policy non sono più piatte (basta essere autenticati): ogni
-- tabella chiede il permesso giusto tramite can(), vedi la sezione Ruoli e
-- permessi qui sopra. Leggere i soci serve a chi li iscrive, a chi incassa,
-- al Riepilogo e al pannello gite; scriverli solo a chi ha il permesso soci.
-- ---------------------------------------------------------------------------

alter table public.members    enable row level security;
alter table public.prices     enable row level security;
alter table public.departures enable row level security;

drop policy if exists members_select on public.members;
drop policy if exists members_insert on public.members;
drop policy if exists members_update on public.members;
drop policy if exists members_delete on public.members;

create policy members_select on public.members
  for select to authenticated using ((select public.can('soci', 'pagamenti', 'riepilogo', 'gite')));

create policy members_insert on public.members
  for insert to authenticated with check ((select public.can('soci')));

create policy members_update on public.members
  for update to authenticated using ((select public.can('soci'))) with check ((select public.can('soci')));

-- La cancellazione resta esclusa: si archivia, non si cancella. Se serve
-- davvero, si fa dalla dashboard Supabase con l'utente service_role.

-- La RLS sopra basta a dire "chi può scrivere su members", ma non "quale
-- card_type può scrivere": min_role vive su prices, non su members, quindi
-- serve un controllo in più. Senza questo trigger, filtrare le opzioni
-- riservate solo nel form (web/index.html) sarebbe un controllo di sola
-- facciata: basterebbe chiamare l'API direttamente per assegnare comunque una
-- tessera come TESSERA DIRETTIVO.
--
-- Fino alla 2.2 il controllo era sugli abbonamenti (check_pass_type_role):
-- lo si toglie qui, così su un database esistente non ne restano due.
drop trigger if exists check_pass_type_role on public.members;
drop function if exists public.check_pass_type_role();

create or replace function public.check_card_type_role()
returns trigger
language plpgsql
as $$
declare
  cambiato  boolean;
  richiesto text;
begin
  cambiato := (tg_op = 'INSERT' and new.card_type is not null)
           or (tg_op = 'UPDATE' and new.card_type is distinct from old.card_type);
  if not cambiato or new.card_type is null then
    return new;
  end if;

  select min_role into richiesto
    from public.prices
   where category = 'TESSERA' and name = new.card_type;

  if richiesto is not null and not public.card_allowed(richiesto) then
    raise exception 'Non hai il permesso di assegnare la tessera "%".', new.card_type;
  end if;
  return new;
end;
$$;

drop trigger if exists check_card_type_role on public.members;
create trigger check_card_type_role
  before insert or update on public.members
  for each row execute function public.check_card_type_role();

-- Il numero di polizza lo scrive solo chi ha il permesso polizze
-- (assicurazione e superadmin): è il loro lavoro, e un numero cambiato per
-- sbaglio dal form Soci farebbe risultare assicurato chi non lo è. Il form
-- Soci lo rimanda indietro uguale a ogni salvataggio, e uguale passa.
--
-- Vale per le scritture fatte dalle pagine (ruolo authenticated). Le
-- funzioni security definer (set_insurance) girano come proprietario e
-- controllano il permesso da sé; un caricamento dall'SQL Editor gira come
-- postgres e non ha un utente collegato.
create or replace function public.check_policy_number()
returns trigger
language plpgsql
as $$
begin
  if current_user = 'authenticated'
     and new.policy_number is distinct from (case when tg_op = 'UPDATE' then old.policy_number end)
     and not public.can('polizze') then
    raise exception 'Il numero di polizza lo scrive solo l''assicurazione.';
  end if;
  return new;
end;
$$;

drop trigger if exists check_policy_number on public.members;
create trigger check_policy_number
  before insert or update on public.members
  for each row execute function public.check_policy_number();

drop policy if exists prices_select on public.prices;
drop policy if exists prices_write  on public.prices;
create policy prices_select on public.prices
  for select to authenticated using ((select public.can('soci', 'pagamenti', 'riepilogo', 'gite')));
create policy prices_write on public.prices
  for all to authenticated using ((select public.can('gestione'))) with check ((select public.can('gestione')));

drop policy if exists departures_select on public.departures;
drop policy if exists departures_write  on public.departures;
-- Le partenze servono al form Soci e, come luoghi da suggerire, ai post social.
create policy departures_select on public.departures
  for select to authenticated using ((select public.can('soci', 'social')));
create policy departures_write on public.departures
  for all to authenticated using ((select public.can('gestione'))) with check ((select public.can('gestione')));

-- Le viste ereditano la RLS delle tabelle sottostanti (security invoker).
alter view public.households      set (security_invoker = true);
alter view public.season_totals   set (security_invoker = true);
alter view public.card_counts     set (security_invoker = true);
alter view public.course_counts   set (security_invoker = true);
alter view public.preski_counts   set (security_invoker = true);
alter view public.departure_counts set (security_invoker = true);
alter view public.admin_summary    set (security_invoker = true);

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

-- Dopo la chiusura un socio non è iscritto a nessuna stagione finché non lo si
-- risalva dal form: enrolled_at deve poter essere vuota. Le viste del
-- riepilogo filtrano con `enrolled_at is not null`: dopo la chiusura restano
-- solo gli iscritti alla stagione aperta.
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

-- La stagione aperta: quella dopo l'ultima chiusa, o quella del calendario se
-- non se n'è mai chiusa una. Dalla 2.3 la stagione cambia quando il direttivo
-- la chiude, non il 1° settembre: una stagione chiusa a ottobre deve restare
-- aperta fino ad allora, con quote, movimenti e saldo banca al loro posto, e
-- la chiusura deve archiviarla con la sua etichetta e non con quella nuova.
--
-- Security definer perché season_history la legge solo il superadmin: senza,
-- all'admin la stagione tornerebbe quella del calendario. Restituisce solo
-- una data.
create or replace function public.current_season()
returns timestamptz
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select max(h.season) from public.season_history h) + interval '1 year',
    public.season_of(now()));
$$;

comment on function public.current_season is 'Inizio della stagione aperta: quella dopo l''ultima chiusa, altrimenti la stagione del calendario (1 settembre).';

-- I conteggi per tipologia di una stagione chiusa: poche decine di righe,
-- la stessa lettura del Riepilogo ma di un anno archiviato.
create table if not exists public.season_breakdown (
  season  timestamptz not null,
  category text not null check (category in ('CARD', 'PASS', 'COURSE', 'COURSE_INCOME', 'PRESKI', 'DEPARTURE')),
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

-- COURSE_INCOME: una riga sola, l'incasso dei corsi (iscritti x listino), che
-- il Riepilogo di una stagione chiusa mostra come riquadro e non come corso.
alter table public.season_breakdown drop constraint if exists season_breakdown_category_check;
alter table public.season_breakdown add constraint season_breakdown_category_check
  check (category in ('CARD', 'PASS', 'COURSE', 'COURSE_INCOME', 'PRESKI', 'DEPARTURE'));

comment on table public.season_breakdown is 'Conteggi per tipologia (tessere/abbonamenti/corsi/partenze) di una stagione chiusa. Scrive solo close_season().';

-- Il bilancio di una stagione chiusa. NULL = stagione chiusa prima che il
-- bilancio esistesse: dato non disponibile, non zero.
alter table public.season_history add column if not exists bank_opening numeric(10, 2);
alter table public.season_history add column if not exists other_income numeric(10, 2);
alter table public.season_history add column if not exists expenses     numeric(10, 2);
alter table public.season_history add column if not exists bank_closing numeric(10, 2);

-- Movimenti extra: entrate e uscite non legate alle quote dei soci (skipass,
-- pullman, maestri...). Non si azzerano alla chiusura: restano legati alla
-- loro stagione.
create table if not exists public.ledger_entries (
  id          uuid primary key default gen_random_uuid(),
  season      timestamptz not null default public.current_season(),
  entry_date  date not null default current_date,
  kind        text not null check (kind in ('ENTRATA', 'USCITA')),
  category    text not null,
  description text,
  quantity    numeric(10, 2) not null default 1 check (quantity > 0),
  unit_price  numeric(10, 2) not null check (unit_price >= 0),
  amount      numeric(10, 2) generated always as (quantity * unit_price) stored,
  created_by  uuid default auth.uid(),
  created_at  timestamptz not null default now()
);

create index if not exists ledger_entries_season_idx on public.ledger_entries (season);

comment on table public.ledger_entries is 'Movimenti extra (entrate/uscite) di una stagione, oltre alle quote dei soci.';

-- Il saldo in banca a inizio stagione, scritto a mano dal direttivo.
create table if not exists public.season_accounts (
  season       timestamptz primary key,
  bank_opening numeric(10, 2) not null default 0,
  updated_at   timestamptz not null default now()
);

drop trigger if exists season_accounts_set_updated_at on public.season_accounts;
create trigger season_accounts_set_updated_at
  before update on public.season_accounts
  for each row execute function public.set_updated_at();

comment on table public.season_accounts is 'Saldo banca a inizio stagione.';

-- Saldo di chiusura dell'ultima stagione chiusa prima di `before`. Security
-- definer apposta: lo storico lo legge solo il superadmin, ma il saldo da
-- proporre serve anche all'admin che compila il bilancio, e questa funzione
-- restituisce quel numero e nient'altro.
create or replace function public.previous_bank_closing(before timestamptz)
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select h.bank_closing from public.season_history h
   where h.season < before order by h.season desc limit 1;
$$;

revoke all on function public.previous_bank_closing(timestamptz) from public;
grant execute on function public.previous_bank_closing(timestamptz) to authenticated;

-- Il bilancio della stagione corrente, una riga. Senza saldo iniziale scritto
-- propone la chiusura della stagione precedente (bank_opening_set = false).
create or replace view public.season_balance as
with s as (
  select public.current_season() as season
), t as (
  select
    s.season,
    a.bank_opening as bank_opening_manual,
    public.previous_bank_closing(s.season) as bank_opening_prev,
    (select coalesce(sum(m.paid), 0) from public.members m
      where m.enrolled_at is not null) as members_collected,
    (select coalesce(sum(l.amount), 0) from public.ledger_entries l
      where l.season = s.season and l.kind = 'ENTRATA') as other_income,
    (select coalesce(sum(l.amount), 0) from public.ledger_entries l
      where l.season = s.season and l.kind = 'USCITA') as expenses
  from s
  left join public.season_accounts a on a.season = s.season
)
select
  season,
  coalesce(bank_opening_manual, bank_opening_prev, 0)                  as bank_opening,
  bank_opening_manual is not null                                      as bank_opening_set,
  members_collected,
  other_income,
  expenses,
  members_collected + other_income                                     as total_collected,
  coalesce(bank_opening_manual, bank_opening_prev, 0)
    + members_collected + other_income - expenses                      as bank_current
from t;

alter view public.season_balance set (security_invoker = true);

comment on view public.season_balance is 'Bilancio della stagione corrente: saldo iniziale, incassi soci, movimenti extra, saldo attuale.';

-- Quante righe verrebbero toccate da una chiusura, per stagione. Serve al
-- pannello per dire in anticipo cosa sta per succedere.
create or replace view public.open_season as
select
  public.current_season()     as season,
  count(*)                    as members,
  coalesce(sum(total), 0)     as total,
  coalesce(sum(paid),  0)     as collected,
  coalesce(sum(balance), 0)   as outstanding
from public.members
where enrolled_at is not null
   or policy_number is not null or card_number is not null
   or card_type is not null or family_discount is not null
   or pass_type is not null or course_type is not null or preski_type is not null
   or saturday_departure is not null or sunday_departure is not null
   or payer_id is not null or total <> 0 or paid <> 0
having count(*) > 0;

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
      or pass_type is not null or course_type is not null or preski_type is not null
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
    -- Gli abbonamenti venduti, non i soci che li hanno: dalla 2.4 uno stesso
    -- socio può comprarne più di uno. Le righe di member_passes non si
    -- azzerano (portano la stagione con sé, come trip_uses).
    select which, 'PASS', mp.pass_type, '', count(*), count(*) * p.price
    from public.member_passes mp
    join da_chiudere t on t.id = mp.member_id
    left join public.prices p on p.category = 'ABBONAMENTO' and p.name = mp.pass_type
    where mp.season = which
    group by mp.pass_type, p.price
    union all
    select which, 'COURSE', m.course_type, '', count(*), count(*) * p.price
    from public.members m
    join da_chiudere t on t.id = m.id
    left join public.prices p on p.category = 'CORSO' and p.name = m.course_type
    where m.course_type is not null and upper(m.course_type) <> 'NO'
    group by m.course_type, p.price
    union all
    select which, 'PRESKI', m.preski_type, '', count(*), count(*) * p.price
    from public.members m
    join da_chiudere t on t.id = m.id
    left join public.prices p on p.category = 'PRESCIISTICA' and p.name = m.preski_type
    where m.preski_type is not null and upper(m.preski_type) <> 'NO'
    group by m.preski_type, p.price
    union all
    select which, 'COURSE_INCOME', 'Incasso corsi', '', count(*), sum(p.price)
    from public.members m
    join da_chiudere t on t.id = m.id
    join public.prices p on p.category = 'CORSO' and p.name = m.course_type
    having count(*) > 0
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

    -- Il bilancio della stagione: si imposta (non si somma), perché movimenti
    -- e saldo iniziale non si azzerano e una seconda chiusura li rilegge
    -- interi. collected è già quello aggiornato dall'upsert qui sopra.
    update public.season_history h set
      bank_opening = b.bank_opening,
      other_income = b.other_income,
      expenses     = b.expenses,
      bank_closing = b.bank_opening + h.collected + b.other_income - b.expenses
    from (
      select
        coalesce(
          (select a.bank_opening from public.season_accounts a where a.season = which),
          (select p.bank_closing from public.season_history p
            where p.season < which order by p.season desc limit 1),
          0) as bank_opening,
        coalesce((select sum(l.amount) from public.ledger_entries l
                   where l.season = which and l.kind = 'ENTRATA'), 0) as other_income,
        coalesce((select sum(l.amount) from public.ledger_entries l
                   where l.season = which and l.kind = 'USCITA'), 0) as expenses
    ) b
    where h.season = which;

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
    preski_type        = null,
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

/**
 * Toglie dalla stagione aperta un socio tesserato per sbaglio: la chiusura
 * della stagione fatta per una persona sola, senza archiviare niente (non è
 * una stagione finita, è un'iscrizione che non doveva esserci).
 *
 * Azzera le stesse colonne di close_season() e cancella i suoi abbonamenti
 * della stagione; l'anagrafica resta. Riservata al superadmin: sparisce una
 * quota, e con lei l'eventuale acconto dal totale incassato.
 *
 * Si ferma, invece di decidere da sola, in due casi:
 *   - paga per dei familiari: quelle schede resterebbero legate a un
 *     capofamiglia non iscritto, e chi paga per loro va deciso a mano;
 *   - ha gite segnate: sono gite fatte davvero, non si cancellano di
 *     nascosto. Si annullano prima dal pannello gite, se erano sbagliate.
 */
create or replace function public.remove_from_season(member_id uuid)
returns void
language plpgsql
security invoker
as $$
begin
  if not public.can('gestione') then
    raise exception 'Solo il superadmin può togliere un socio dalla stagione.';
  end if;

  perform 1 from public.members m
   where m.id = remove_from_season.member_id and m.enrolled_at is not null
     for update;
  if not found then
    raise exception 'Questo socio non è iscritto alla stagione.';
  end if;

  if exists (select 1 from public.members d where d.payer_id = remove_from_season.member_id) then
    raise exception 'Questo socio paga per dei familiari: togli prima il pagante dalle loro schede.';
  end if;

  if exists (select 1 from public.trip_uses u
              where u.member_id = remove_from_season.member_id
                and u.season = public.current_season()) then
    raise exception 'Questo socio ha già delle gite segnate: se sono sbagliate, annullale prima dal pannello gite.';
  end if;

  delete from public.member_passes mp
   where mp.member_id = remove_from_season.member_id
     and mp.season = public.current_season();

  update public.members m set
    policy_number      = null,
    card_number        = null,
    card_type          = null,
    family_discount    = null,
    pass_type          = null,
    preski_type        = null,
    course_type        = null,
    saturday_departure = null,
    sunday_departure   = null,
    total              = 0,
    paid               = 0,
    payer_id           = null,
    notes              = null,
    enrolled_at        = null
  where m.id = remove_from_season.member_id;
end;
$$;

comment on function public.remove_from_season is 'Toglie un socio dalla stagione aperta (iscrizione sbagliata): azzera i dati di stagione, conserva l''anagrafica. Solo superadmin.';

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
-- non delete. Una stagione archiviata non si cancella. Chiudere la stagione è
-- riservato al superadmin, come la pagina Amministrazione che la lancia: senza
-- il permesso di scrivere lo storico close_season() fallisce prima di
-- azzerare, anche chiamata dall'API a mano.
-- Leggere lo storico: chi ha il permesso storico (tesoriere e superadmin),
-- per le stagioni chiuse nel Riepilogo.
create policy season_history_select on public.season_history
  for select to authenticated using ((select public.can('storico')));
create policy season_history_insert on public.season_history
  for insert to authenticated with check ((select public.can('gestione')));
create policy season_history_update on public.season_history
  for update to authenticated using ((select public.can('gestione'))) with check ((select public.can('gestione')));

create policy season_breakdown_select on public.season_breakdown
  for select to authenticated using ((select public.can('storico')));
create policy season_breakdown_insert on public.season_breakdown
  for insert to authenticated with check ((select public.can('gestione')));
create policy season_breakdown_update on public.season_breakdown
  for update to authenticated using ((select public.can('gestione'))) with check ((select public.can('gestione')));

alter table public.ledger_entries  enable row level security;
alter table public.season_accounts enable row level security;

drop policy if exists ledger_entries_select  on public.ledger_entries;
drop policy if exists ledger_entries_insert  on public.ledger_entries;
drop policy if exists ledger_entries_update  on public.ledger_entries;
drop policy if exists ledger_entries_delete  on public.ledger_entries;
drop policy if exists season_accounts_select on public.season_accounts;
drop policy if exists season_accounts_insert on public.season_accounts;
drop policy if exists season_accounts_update on public.season_accounts;

-- Il bilancio è di chi ha il permesso bilancio (tesoriere e superadmin):
-- movimenti liberi (un errore si corregge o si cancella), saldo iniziale
-- scrivibile ma non cancellabile.
create policy ledger_entries_select on public.ledger_entries
  for select to authenticated using ((select public.can('bilancio')));
create policy ledger_entries_insert on public.ledger_entries
  for insert to authenticated with check ((select public.can('bilancio')));
create policy ledger_entries_update on public.ledger_entries
  for update to authenticated using ((select public.can('bilancio'))) with check ((select public.can('bilancio')));
create policy ledger_entries_delete on public.ledger_entries
  for delete to authenticated using ((select public.can('bilancio')));

create policy season_accounts_select on public.season_accounts
  for select to authenticated using ((select public.can('bilancio')));
create policy season_accounts_insert on public.season_accounts
  for insert to authenticated with check ((select public.can('bilancio')));
create policy season_accounts_update on public.season_accounts
  for update to authenticated using ((select public.can('bilancio'))) with check ((select public.can('bilancio')));

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
--
-- Dalla 2.5 incassa anche il tesoriere, che non può modificare i soci: la
-- funzione gira come proprietario (security definer), controlla da sé il
-- permesso pagamenti e scrive soltanto l'acconto.
-- ---------------------------------------------------------------------------

create or replace function public.settle_household(head_id uuid)
returns table (members_settled bigint, amount numeric)
language plpgsql
security definer
set search_path = ''
as $$
declare
  how_many bigint;
  how_much numeric(10, 2);
begin
  if not public.can('pagamenti') then
    raise exception 'Non hai il permesso di registrare gli incassi.';
  end if;

  select count(*), coalesce(sum(m.balance), 0)
    into how_many, how_much
    from public.members m
   where (m.id = head_id or m.payer_id = head_id)
     and m.balance > 0;

  if how_many = 0 then
    return query select 0::bigint, 0::numeric;
    return;
  end if;

  update public.members m
     set paid = m.total
   where (m.id = head_id or m.payer_id = head_id)
     and m.balance > 0;

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
-- Abbonamenti dei soci
--
-- Fino alla 2.3 l'abbonamento era una colonna del socio (members.pass_type):
-- uno a testa. Ma chi finisce le cinque gite ne ricompra un altro, anche di
-- un giorno diverso (prima SABATO, poi JOLLY), e con una colonna sola il
-- secondo cancellava il primo insieme al conto delle gite fatte.
--
-- Qui una riga = un abbonamento comprato. Come trip_uses, le righe portano la
-- stagione con sé e non si cancellano alla chiusura: l'anno dopo non
-- compaiono più (si guarda solo la stagione aperta) ma restano consultabili.
--
-- members.pass_type resta, come riassunto scritto dal trigger qui sotto
-- ("Abbonamento 5 viaggi SABATO ×2 + ..."): lo leggono la ricerca del tablet,
-- il pannello Pagamenti e il sito di ricerca, che così non cambiano. Nessuno
-- lo scrive più a mano.
-- ---------------------------------------------------------------------------

create table if not exists public.member_passes (
  id          uuid primary key default gen_random_uuid(),
  member_id   uuid not null references public.members (id) on delete cascade,
  season      timestamptz not null default public.current_season(),
  -- Il nome della voce di listino (prices.name, categoria ABBONAMENTO): numero
  -- di gite e giorno stanno lì.
  pass_type   text not null,
  created_at  timestamptz not null default now(),
  -- Id del gesto, generato dalla pagina: rende ripetibile l'aggiunta (vedi
  -- add_pass() e il salvataggio del form Soci). NULL per le righe spostate
  -- dalla vecchia colonna.
  client_id   uuid
);

alter table public.member_passes drop constraint if exists member_passes_client_id_key;
alter table public.member_passes add constraint member_passes_client_id_key unique (client_id);

create index if not exists member_passes_member_idx on public.member_passes (member_id, season);

comment on table public.member_passes is 'Abbonamenti a viaggi comprati dai soci: una riga per abbonamento, con la sua stagione.';

-- Il riassunto in members.pass_type. Guarda solo la stagione aperta: un
-- abbonamento dell'anno scorso non deve far sembrare abbonato chi non lo è.
create or replace function public.sync_pass_type()
returns trigger
language plpgsql
as $$
declare
  chi uuid := coalesce(new.member_id, old.member_id);
begin
  update public.members m set pass_type = (
    select string_agg(t.pass_type || case when t.quanti > 1 then ' ×' || t.quanti else '' end,
                      ' + ' order by t.primo)
      from (select mp.pass_type, count(*) as quanti, min(mp.created_at) as primo
              from public.member_passes mp
             where mp.member_id = chi and mp.season = public.current_season()
             group by mp.pass_type) t)
   where m.id = chi;
  return null;
end;
$$;

drop trigger if exists sync_pass_type on public.member_passes;
create trigger sync_pass_type
  after insert or delete on public.member_passes
  for each row execute function public.sync_pass_type();

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

-- Da quale abbonamento è stata scalata la gita: con più abbonamenti per socio
-- il conto "fatte/restano" è per abbonamento. NULL per le gite delle stagioni
-- passate, segnate quando l'abbonamento era uno solo.
--
-- Senza "on delete": un abbonamento da cui sono già state scalate gite non si
-- può cancellare. Toglierlo farebbe sparire gite davvero fatte.
alter table public.trip_uses add column if not exists pass_id uuid references public.member_passes (id);
create index if not exists trip_uses_pass_idx on public.trip_uses (pass_id);

-- Ogni abbonamento della stagione aperta, con le sue gite fatte e residue.
-- La legge il form Soci (un riquadro per abbonamento) e use_trip() per
-- scegliere da quale scalare.
create or replace view public.pass_status as
select
  mp.id                                 as pass_id,
  mp.member_id,
  mp.pass_type,
  p.day,
  p.trips                               as trips_total,
  coalesce(u.used, 0)::int              as trips_used,
  (p.trips - coalesce(u.used, 0))::int  as trips_left,
  mp.created_at,
  -- Il prezzo di listino: il form Soci lo somma nel totale del socio.
  p.price
from public.member_passes mp
join public.prices p
  on  p.category = 'ABBONAMENTO'
  and p.name      = mp.pass_type
  and p.trips is not null
left join (
  select pass_id, count(*) as used
    from public.trip_uses
   where pass_id is not null
   group by pass_id
) u on u.pass_id = mp.id
where mp.season = public.current_season();

alter view public.pass_status set (security_invoker = true);

comment on view public.pass_status is 'Abbonamenti della stagione aperta, uno per riga, con gite fatte e residue.';

-- Una riga per socio, con le gite di tutti i suoi abbonamenti sommate: è
-- quello che il pannello gite mostra sul telefono (una scheda per persona).
-- `day` è il giorno del primo abbonamento, per le pagine rimaste alla
-- versione precedente; `days` li ha tutti, ed è quello che usa il filtro.
create or replace view public.trip_passes as
select
  m.id                                  as member_id,
  m.last_name,
  m.first_name,
  m.phone,
  m.email,
  m.payer_id,
  m.pass_type                           as pass_name,
  (array_agg(s.day order by s.created_at))[1] as day,
  sum(s.trips_total)::int               as trips_total,
  sum(s.trips_used)::int                as trips_used,
  sum(s.trips_left)::int                as trips_left,
  array_agg(distinct s.day)             as days,
  count(*)::int                         as passes
from public.members m
join public.pass_status s on s.member_id = m.id
where m.enrolled_at is not null
group by m.id, m.last_name, m.first_name, m.phone, m.email, m.payer_id, m.pass_type;

alter view public.trip_passes set (security_invoker = true);

comment on view public.trip_passes is 'Abbonamenti a viaggi della stagione corrente, sommati per socio, con gite fatte e residue.';

-- Riepilogo: abbonamenti venduti nella stagione aperta, per tipo.
create or replace view public.pass_counts as
select mp.pass_type as name, count(*) as count
from public.member_passes mp
where mp.season = public.current_season()
group by mp.pass_type;

alter view public.pass_counts set (security_invoker = true);

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
-- Dalla 2.4 c'è anche il giorno: con due versioni in piedi PostgREST non
-- saprebbe quale chiamare ("function is not unique").
drop function if exists public.use_trip(uuid, uuid);

-- client_id e day hanno un default perché una pagina già aperta sul
-- telefono, rimasta alla versione precedente, continua a chiamare con meno
-- argomenti — e le gite rimaste in coda senza linea partono comunque con il
-- formato di quando sono state segnate. Meglio che funzionino piuttosto che
-- rispondere "funzione non trovata" a chi sta caricando il pullman.
--
-- `day` è il giorno scelto nel pannello (SABATO, DOMENICA, MARTEDI, JOLLY),
-- o NULL con "tutti".
--
-- Dalla 2.5 girano come proprietario (security definer), come cancel_trip()
-- e add_pass(): chi segna le gite (permesso gite) legge i soci ma non li
-- modifica, e senza il permesso di modificarli il FOR UPDATE qui sotto non
-- troverebbe la riga da bloccare. Il permesso lo controllano da sé.
create or replace function public.use_trip(member_id uuid, client_id uuid default gen_random_uuid(), day text default null)
returns table (trips_used int, trips_left int)
language plpgsql
security definer
set search_path = ''
as $$
declare
  abbonamento uuid;
begin
  if not public.can('gite') then
    raise exception 'Non hai il permesso di segnare le gite.';
  end if;

  -- FOR UPDATE sulla riga del socio: chi arriva secondo aspetta e rilegge il
  -- residuo aggiornato invece di scalare sullo stesso conteggio. Serializza
  -- anche i ritentativi, che quindi trovano già scritta la pressione di prima.
  perform 1 from public.members m where m.id = use_trip.member_id for update;

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

  -- Da quale abbonamento scalare: prima quello del giorno scelto, poi il
  -- JOLLY (vale tutti i giorni), poi il più vecchio con gite libere.
  --
  -- Il giorno è una preferenza, non un divieto: quando si segna la gita il
  -- socio è già sul pullman, e rifiutarla lascerebbe una gita fatta senza
  -- traccia. Si rifiuta solo quando non resta niente in nessun abbonamento,
  -- come prima della 2.4.
  select s.pass_id into abbonamento
    from public.pass_status s
   where s.member_id = use_trip.member_id
     and s.trips_left > 0
   order by case
              when use_trip.day is null     then 0
              when s.day = use_trip.day     then 0
              when s.day = 'JOLLY'          then 1
              else 2
            end,
            s.created_at
   limit 1;

  if abbonamento is null then
    if exists (select 1 from public.pass_status s where s.member_id = use_trip.member_id) then
      raise exception 'Abbonamento esaurito: non restano gite da scalare.';
    end if;
    raise exception 'Questo socio non ha un abbonamento a viaggi in questa stagione.';
  end if;

  -- `on conflict` è la rete di sicurezza sotto al controllo qui sopra: due
  -- richieste con lo stesso id arrivate insieme non possono diventare due
  -- righe, qualunque cosa faccia il lock.
  insert into public.trip_uses (member_id, pass_id, client_id)
  values (use_trip.member_id, abbonamento, use_trip.client_id)
  on conflict on constraint trip_uses_client_id_key do nothing;

  return query
    select a.trips_used, a.trips_left
      from public.trip_passes a
     where a.member_id = use_trip.member_id;
end;
$$;

comment on function public.use_trip is 'Scala una gita da un abbonamento del socio (prima quello del giorno, poi JOLLY, poi il più vecchio), con la data di oggi. Ripetibile: la stessa client_id non scala due gite.';

/**
 * Annulla una registrazione sbagliata. Si cancella una riga precisa, non
 * "l'ultima": chi corregge deve vedere cosa sta togliendo.
 */
create or replace function public.cancel_trip(trip_id uuid)
returns table (trips_used int, trips_left int)
language plpgsql
security definer
set search_path = ''
as $$
declare
  who uuid;
begin
  if not public.can('gite') then
    raise exception 'Non hai il permesso di annullare le gite.';
  end if;

  delete from public.trip_uses u where u.id = trip_id returning u.member_id into who;
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

/**
 * Vende un abbonamento a un socio dal pannello gite: aggiunge la riga e
 * mette il prezzo di listino nel totale del socio (e nell'acconto, se
 * `paid`), tutto nella stessa transazione.
 *
 * Fino alla 2.3 il telefono scriveva da sé il nuovo totale, calcolato su
 * quello letto prima: una modifica fatta nel frattempo da un altro operatore
 * andava persa. Qui la somma la fa il database sul valore di quel momento.
 *
 * Ripetibile come use_trip(): la stessa client_id non vende due abbonamenti.
 *
 * Il form Soci non la usa: lì il totale lo ricalcola la pagina da tutte le
 * voci scelte, e le righe le scrive insieme al socio.
 */
create or replace function public.add_pass(member_id uuid, pass_type text, paid boolean default false,
                                           client_id uuid default gen_random_uuid())
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  prezzo numeric(10, 2);
begin
  if not public.can('gite') then
    raise exception 'Non hai il permesso di vendere abbonamenti.';
  end if;

  perform 1 from public.members m
   where m.id = add_pass.member_id and m.enrolled_at is not null
     for update;
  if not found then
    raise exception 'Socio non trovato fra gli iscritti della stagione.';
  end if;

  if exists (select 1 from public.member_passes mp where mp.client_id = add_pass.client_id) then
    return;
  end if;

  select p.price into prezzo
    from public.prices p
   where p.category = 'ABBONAMENTO' and p.name = add_pass.pass_type and p.trips is not null;
  if prezzo is null then
    raise exception 'L''abbonamento «%» non è nel listino.', add_pass.pass_type;
  end if;

  insert into public.member_passes (member_id, pass_type, client_id)
  values (add_pass.member_id, add_pass.pass_type, add_pass.client_id);

  update public.members m set
    total = m.total + prezzo,
    paid  = m.paid + case when add_pass.paid then prezzo else 0 end
   where m.id = add_pass.member_id;
end;
$$;

comment on function public.add_pass is 'Aggiunge un abbonamento a un socio e ne somma il prezzo al totale (e all''acconto se pagato). Ripetibile con la stessa client_id.';

alter table public.trip_uses enable row level security;

drop policy if exists trip_uses_select on public.trip_uses;
drop policy if exists trip_uses_insert on public.trip_uses;
drop policy if exists trip_uses_delete on public.trip_uses;

-- Si scrive e si corregge solo passando da use_trip() e cancel_trip(), che
-- controllano da sé il permesso gite: nessuna policy di scrittura. Leggono il
-- form Soci (gite fatte per abbonamento), il pannello gite e il Riepilogo.
create policy trip_uses_select on public.trip_uses
  for select to authenticated using ((select public.can('soci', 'gite', 'riepilogo')));

-- Abbonamenti dei soci: li scrive il form Soci (permesso soci), il pannello
-- gite passa da add_pass(). Niente update: un abbonamento sbagliato si toglie
-- e si rimette (e se ha già delle gite non si toglie, vedi trip_uses.pass_id).
alter table public.member_passes enable row level security;

drop policy if exists member_passes_select on public.member_passes;
drop policy if exists member_passes_insert on public.member_passes;
drop policy if exists member_passes_delete on public.member_passes;

create policy member_passes_select on public.member_passes
  for select to authenticated using ((select public.can('soci', 'gite', 'riepilogo')));
create policy member_passes_insert on public.member_passes
  for insert to authenticated with check ((select public.can('soci')));
create policy member_passes_delete on public.member_passes
  for delete to authenticated using ((select public.can('soci')));

-- ---------------------------------------------------------------------------
-- Presciistica: da abbonamento a voce a sé
--
-- Era una voce del listino fra gli ABBONAMENTO e finiva in pass_type: chi
-- aveva l'abbonamento alle gite non poteva avere anche la presciistica, e dal
-- pannello gite a chi aveva la presciistica non si poteva dare un
-- abbonamento. Ora ha categoria e colonna sue (preski_type).
--
-- Il check della categoria è scritto nel create table, che su un database
-- già esistente non viene rieseguito: qui si rimpiazza. Le due UPDATE
-- spostano quello che c'era; rieseguite non trovano più niente da spostare.
-- ---------------------------------------------------------------------------

alter table public.prices drop constraint if exists prices_category_check;
alter table public.prices add constraint prices_category_check
  check (category in ('TESSERA', 'FAMIGLIA', 'ABBONAMENTO', 'CORSO', 'PRESCIISTICA'));

update public.prices p set category = 'PRESCIISTICA'
 where p.category = 'ABBONAMENTO'
   and upper(p.name) like '%PRESCIISTIC%'
   and not exists (select 1 from public.prices q
                    where q.category = 'PRESCIISTICA' and q.name = p.name);

update public.members set preski_type = pass_type, pass_type = null
 where upper(pass_type) like '%PRESCIISTIC%';

-- ---------------------------------------------------------------------------
-- Abbonamenti: dalla colonna del socio alle righe di member_passes
--
-- Chi aveva già un abbonamento nella stagione aperta (members.pass_type,
-- scritto dalle pagine fino alla 2.3) riceve la sua riga, e le gite già
-- scalate vengono attaccate a quell'abbonamento. Rieseguito, non trova più
-- niente da spostare: chi ha già una riga nella stagione viene saltato, e le
-- gite con pass_id già scritto non si toccano.
--
-- Va rilanciato anche dopo un caricamento da Excel (generate_migration.py
-- scrive pass_type come nella 1.x): è così che quei soci ottengono le righe.
-- ---------------------------------------------------------------------------

insert into public.member_passes (member_id, pass_type, season, created_at)
select m.id, m.pass_type, public.current_season(), coalesce(m.enrolled_at, now())
  from public.members m
 where m.enrolled_at is not null
   and exists (select 1 from public.prices p
                where p.category = 'ABBONAMENTO' and p.name = m.pass_type and p.trips is not null)
   and not exists (select 1 from public.member_passes mp
                    where mp.member_id = m.id and mp.season = public.current_season());

update public.trip_uses u set pass_id = (
  select mp.id from public.member_passes mp
   where mp.member_id = u.member_id and mp.season = u.season
   order by mp.created_at
   limit 1)
 where u.pass_id is null
   and u.season = public.current_season();

-- ---------------------------------------------------------------------------
-- Social: post e campagne degli sponsor
--
-- La pagina web/social.html prepara immagini e testi da pubblicare a mano su
-- Instagram e Facebook (grafica "C · Skipass", disegni in
-- web/social-templates.js). Qui restano i dati di ogni post, così si
-- ritrovano, si correggono e si sa quali sono già usciti.
--
-- Una campagna sponsor è un post di tipo 'sponsor' legato a uno sponsor: il
-- marchio (logo, colori, se è un alcolico) sta in sponsors, i testi della
-- campagna nel post. Una tabella delle campagne servirà quando uno sponsor
-- ne avrà più d'una da tenere insieme; per ora un post = una campagna.
-- ---------------------------------------------------------------------------

create table if not exists public.sponsors (
  id           uuid primary key default gen_random_uuid(),
  name         text not null unique,
  -- A schermo nei post: "Main sponsor", "Sponsor", "Partner".
  level        text not null default 'Sponsor',
  url          text,
  -- Profilo Instagram, senza @.
  handle       text,
  -- Loghi come immagini dentro il database (data URL): restano sullo stesso
  -- dominio della pagina, e il PNG del post si genera nel browser senza che
  -- il browser lo blocchi come immagine di un altro sito. Uno per fondi
  -- chiari, uno (facoltativo) per fondi scuri.
  logo         text,
  logo_dark    text,
  -- I tre colori del marchio: fondo scuro, fondo chiaro, accento.
  color_dark   text not null default '#14202E',
  color_light  text not null default '#FFFFFF',
  color_accent text not null default '#FCCF02',
  -- Bevanda alcolica: ogni formato porta l'avvertenza di legge.
  alcohol      boolean not null default false,
  created_at   timestamptz not null default now()
);

alter table public.sponsors drop constraint if exists sponsors_colors_valid;
alter table public.sponsors add constraint sponsors_colors_valid check (
  color_dark ~ '^#[0-9A-Fa-f]{6}$' and color_light ~ '^#[0-9A-Fa-f]{6}$' and color_accent ~ '^#[0-9A-Fa-f]{6}$');

comment on table public.sponsors is 'Sponsor del club: marchio e colori per i post delle loro campagne.';

create table if not exists public.social_events (
  id           uuid primary key default gen_random_uuid(),
  kind         text not null,
  -- Il giorno dell'evento; per le gite decide anche il colore (martedì,
  -- sabato, domenica). Vuoto per corsi e servizi senza una data sola.
  event_date   date,
  -- Meta della gita, titolo dell'evento o titolo della campagna.
  title        text not null default '',
  subtitle     text,
  -- [["Adulti", "€ 25"], ["Ragazzi", "€ 15"]]; per una gita [[null, "€ 52"]].
  prices       jsonb not null default '[]',
  -- Il prezzo si può tenere fuori dal post (es. quando non è ancora deciso).
  show_price   boolean not null default true,
  -- [["6:30", "Asti"], ["6:45", "Moncalvo"]]
  stops        jsonb not null default '[]',
  -- [["Età", "5–12 anni"], ["Maestri", "Scuola sci FISI"]]
  facts        jsonb not null default '[]',
  deadline     date,
  course       boolean not null default false,
  -- Foto della meta, ridotta dalla pagina (data URL). Facoltativa.
  photo        text,
  -- Campagne: lo sponsor, il titolo della story e il testo del pulsante.
  sponsor_id   uuid references public.sponsors (id) on delete cascade,
  story_title  text,
  cta          text,
  -- Il testo da incollare sotto al post, proposto dalla pagina e modificabile.
  caption      text,
  published_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Eliminare uno sponsor elimina le sue campagne, nella stessa istruzione: la
-- pagina chiede prima conferma dicendo quante sono. Il primo schema della 2.5
-- le proteggeva (restrict) e lo sponsor non si poteva più togliere.
alter table public.social_events drop constraint if exists social_events_sponsor_id_fkey;
alter table public.social_events add constraint social_events_sponsor_id_fkey
  foreign key (sponsor_id) references public.sponsors (id) on delete cascade;

alter table public.social_events drop constraint if exists social_events_kind_valid;
alter table public.social_events add constraint social_events_kind_valid
  check (kind in ('gita', 'corso', 'cena', 'gara', 'servizi', 'sponsor'));
alter table public.social_events drop constraint if exists social_events_sponsor_needed;
alter table public.social_events add constraint social_events_sponsor_needed
  check ((kind = 'sponsor') = (sponsor_id is not null));

create index if not exists social_events_date_idx on public.social_events (event_date);

drop trigger if exists social_events_set_updated_at on public.social_events;
create trigger social_events_set_updated_at
  before update on public.social_events
  for each row execute function public.set_updated_at();

comment on table public.social_events is 'Post social del club (gite, eventi, campagne sponsor): dati, testo e data di pubblicazione.';

-- Giorni delle gite: il colore di una gita nei post viene dal suo giorno della
-- settimana, e quando si inserisce una gita il calendario della pagina mostra
-- questi giorni colorati (senza vietare gli altri). Si cambiano dalla pagina,
-- riquadro "Giorni e colori delle gite". Sempre sette righe, una per giorno:
-- colore vuoto = non è un giorno di gita. Così rilanciare lo schema non rimette
-- un giorno tolto dalla pagina. I colori di partenza sono quelli di sempre
-- (martedì rosso, sabato blu, domenica giallo), gli stessi degli abbonamenti.
-- Il colore non si salva sul post: cambiarlo ricolora anche le gite già
-- salvate, che è quello che si vuole finché non sono pubblicate (le
-- pubblicate sono già PNG).
create table if not exists public.trip_days (
  -- 0 = domenica … 6 = sabato, come getDay() di JavaScript.
  weekday smallint primary key,
  color   text
);

alter table public.trip_days drop constraint if exists trip_days_weekday_valid;
alter table public.trip_days add constraint trip_days_weekday_valid check (weekday between 0 and 6);
alter table public.trip_days drop constraint if exists trip_days_color_valid;
alter table public.trip_days add constraint trip_days_color_valid check (color ~ '^#[0-9A-Fa-f]{6}$');

insert into public.trip_days (weekday, color) values
  (0, '#FCCF02'), (1, null), (2, '#B3261E'), (3, null), (4, null), (5, null), (6, '#084C8D')
on conflict (weekday) do nothing;

comment on table public.trip_days is 'Giorni della settimana delle gite e il loro colore nei post social (colore vuoto = non è un giorno di gita).';

-- Rubrica dei contatti per info e iscrizioni: nome e telefono, e se serve
-- quando chiamare ("dopo le 18"). Si gestisce dalla pagina Social > Contatti;
-- ogni post sceglie i suoi (social_events.contacts), perché una gita e un
-- corso possono avere referenti diversi. is_default: già spuntato nei post
-- nuovi. Nessuna riga di partenza: rilanciare lo schema non deve rimettere un
-- contatto tolto, e i numeri finti non devono finire in un post. Il post tiene
-- l'id, non una copia: correggere un numero corregge anche i post non ancora
-- pubblicati.
create table if not exists public.social_contacts (
  id       uuid primary key default gen_random_uuid(),
  position smallint not null default 0,
  name     text not null,
  phone    text not null,
  hours    text
);
alter table public.social_contacts add column if not exists is_default boolean not null default false;

alter table public.social_contacts drop constraint if exists social_contacts_filled;
alter table public.social_contacts add constraint social_contacts_filled
  check (btrim(name) <> '' and btrim(phone) <> '');

comment on table public.social_contacts is 'Rubrica dei contatti per info e iscrizioni nei post social: nome, telefono e orari facoltativi.';

-- I contatti del post, nell'ordine in cui compaiono.
alter table public.social_events add column if not exists contacts uuid[] not null default '{}';
comment on column public.social_events.contacts is 'Contatti (social_contacts.id) in fondo al post, in ordine.';

-- Un contatto tolto dalla rubrica esce anche dai post che lo avevano.
create or replace function public.social_contacts_remove_from_posts()
returns trigger language plpgsql set search_path = public as $$
begin
  update public.social_events set contacts = array_remove(contacts, old.id) where old.id = any (contacts);
  return old;
end $$;

drop trigger if exists social_contacts_remove_from_posts on public.social_contacts;
create trigger social_contacts_remove_from_posts
  after delete on public.social_contacts
  for each row execute function public.social_contacts_remove_from_posts();

alter table public.sponsors      enable row level security;
alter table public.social_events enable row level security;
alter table public.trip_days     enable row level security;
alter table public.social_contacts enable row level security;

drop policy if exists sponsors_all      on public.sponsors;
drop policy if exists social_events_all on public.social_events;
drop policy if exists trip_days_all     on public.trip_days;
drop policy if exists social_contacts_all on public.social_contacts;

-- Tutto a chi ha il permesso social (social e superadmin), niente agli altri.
create policy sponsors_all on public.sponsors
  for all to authenticated using ((select public.can('social'))) with check ((select public.can('social')));
create policy social_events_all on public.social_events
  for all to authenticated using ((select public.can('social'))) with check ((select public.can('social')));
create policy trip_days_all on public.trip_days
  for all to authenticated using ((select public.can('social'))) with check ((select public.can('social')));
create policy social_contacts_all on public.social_contacts
  for all to authenticated using ((select public.can('social'))) with check ((select public.can('social')));

-- ---------------------------------------------------------------------------
-- has_role() della 2.4: la scala dei ruoli non c'è più, ogni policy e
-- funzione qui sopra usa can(). Si toglie in fondo, dopo che le policy che la
-- usavano sono state rifatte, altrimenti Postgres rifiuterebbe il drop.
-- ---------------------------------------------------------------------------
drop function if exists public.has_role(text);
