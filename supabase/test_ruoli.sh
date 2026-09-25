#!/usr/bin/env bash
#
# Prova ruoli, RLS e trigger di schema.sql su un Postgres usa-e-getta.
#
#   ./supabase/test_ruoli.sh
#
# Serve docker. Il container viene creato e distrutto ad ogni esecuzione.
#
# Perché esiste: le policy di profiles si chiamano fra loro (can() legge
# profiles, e la policy di profiles chiama can()). Provare le funzioni come
# superuser postgres non basta a scoprirlo, perché il superuser salta la RLS:
# la prima versione di current_role() passava tutti i controlli fatti così e
# andava in ricorsione infinita al primo utente vero. Qui si prova sempre
# dentro il ruolo `authenticated`, come fa Supabase.
set -euo pipefail

CONTENITORE="scdb-test-ruoli-$$"
QUI="$(cd "$(dirname "$0")" && pwd)"

docker rm -f "$CONTENITORE" >/dev/null 2>&1 || true
docker run -d --name "$CONTENITORE" -e POSTGRES_PASSWORD=test postgres:16 >/dev/null
trap 'docker rm -f "$CONTENITORE" >/dev/null 2>&1 || true' EXIT

for _ in $(seq 1 30); do
  docker exec "$CONTENITORE" pg_isready -U postgres >/dev/null 2>&1 && break
  sleep 1
done

psql_() { docker exec -i -e PGOPTIONS="-c client_min_messages=warning" "$CONTENITORE" psql -U postgres -v ON_ERROR_STOP=1 -q "$@"; }

# Finto ambiente Supabase: schema auth, auth.uid() presa da una variabile di
# sessione, ruolo authenticated.
psql_ <<'SQL'
create schema if not exists auth;
create table if not exists auth.users (id uuid primary key default gen_random_uuid(), email text);
create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('test.uid', true), '')::uuid;
$$;
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated; end if;
end $$;
grant usage on schema auth, public to authenticated;
SQL

# Due volte: schema.sql deve restare rieseguibile senza errori.
psql_ < "$QUI/schema.sql" >/dev/null
psql_ < "$QUI/schema.sql" >/dev/null

psql_ <<'SQL'
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
grant execute on all functions in schema public to authenticated;
SQL

# ---------------------------------------------------------------------------
# Dalla scala della 2.4 ai ruoli della 2.5: un database con i ruoli vecchi,
# rilanciato lo schema, deve trovarsi utente → admin e ospite/kiosk senza
# accesso. Si finge il database di prima togliendo il vincolo sui ruoli.
# ---------------------------------------------------------------------------
psql_ <<'SQL'
insert into auth.users (id, email) values
  ('a0000000-0000-0000-0000-000000000001', 'vecchio-utente@test'),
  ('a0000000-0000-0000-0000-000000000002', 'vecchio-ospite@test'),
  ('a0000000-0000-0000-0000-000000000003', 'vecchio-kiosk@test');
alter table public.profiles drop constraint profiles_role_valid;
insert into public.profiles (user_id, email, role) values
  ('a0000000-0000-0000-0000-000000000001', 'vecchio-utente@test', 'utente'),
  ('a0000000-0000-0000-0000-000000000002', 'vecchio-ospite@test', 'ospite'),
  ('a0000000-0000-0000-0000-000000000003', 'vecchio-kiosk@test', 'kiosk');
SQL
psql_ < "$QUI/schema.sql" >/dev/null
psql_ <<'SQL'
do $$ begin
  assert (select role from public.profiles where email = 'vecchio-utente@test') = 'admin',
         'il volontario (utente) della 2.4 non è diventato admin';
  assert (select count(*) from public.profiles where email in ('vecchio-ospite@test', 'vecchio-kiosk@test')) = 0,
         'ospite e kiosk della 2.4 hanno ancora un ruolo';
end $$;
delete from auth.users where email like 'vecchio-%';
SQL

psql_ <<'SQL'
-- Dati di prova -------------------------------------------------------------
insert into public.prices (category, name, price, min_role) values
  ('ABBONAMENTO', 'PROVA 10 VIAGGI SABATO', 200, 'utente'),
  ('TESSERA', 'PROVA TESSERA ORDINARIA', 35, 'utente'),
  ('TESSERA', 'PROVA TESSERA DIRETTIVO', 0, 'admin'),
  ('TESSERA', 'PROVA TESSERA PRESIDENTE', 0, 'superadmin')
on conflict (category, name) do update set min_role = excluded.min_role;
-- Il trigger legge le gite da "N viaggi" scritto minuscolo, come nel listino
-- vero: la voce di prova in maiuscolo va completata a mano.
update public.prices set trips = 10, day = 'SABATO' where name = 'PROVA 10 VIAGGI SABATO';
insert into public.departures (day, place) values ('SABATO', 'PROVA ASTI');

-- Un account nuovo nasce senza riga profiles, cioè senza accesso: le righe
-- dei ruoli le scrive il pannello Utenti (restore_account), qui postgres.
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'gite@test'),
  ('22222222-2222-2222-2222-222222222222', 'super@test'),
  ('33333333-3333-3333-3333-333333333333', 'tesoriere@test'),
  ('44444444-4444-4444-4444-444444444444', 'admin@test'),
  ('55555555-5555-5555-5555-555555555555', 'senza@test'),
  ('66666666-6666-6666-6666-666666666666', 'assic@test'),
  ('88888888-8888-8888-8888-888888888888', 'social@test');

do $$ begin
  assert (select count(*) from public.profiles) = 0, 'un account nuovo è nato con un ruolo';
end $$;

insert into public.profiles (user_id, email, role) values
  ('11111111-1111-1111-1111-111111111111', 'gite@test',      'gite'),
  ('22222222-2222-2222-2222-222222222222', 'super@test',     'superadmin'),
  ('33333333-3333-3333-3333-333333333333', 'tesoriere@test', 'tesoriere'),
  ('44444444-4444-4444-4444-444444444444', 'admin@test',     'admin'),
  ('66666666-6666-6666-6666-666666666666', 'assic@test',     'assicurazione'),
  ('88888888-8888-8888-8888-888888888888', 'social@test',    'social');
-- senza@test resta senza riga: è il caso di chi si registra da solo.

insert into public.members (id, last_name, first_name, enrolled_at)
values ('99999999-9999-9999-9999-999999999999', 'ROSSI', 'MARIO', now());

-- Un tesserato con un abbonamento e una gita, perché ogni tabella della
-- matrice qui sotto abbia almeno una riga da leggere. La chiusura della
-- stagione più avanti lo toglie dalla stagione come tutti.
do $$ begin perform set_config('test.uid', '22222222-2222-2222-2222-222222222222', false); end $$;
insert into public.members (id, last_name, first_name, enrolled_at, card_type)
values ('bbbbbbbb-0000-0000-0000-000000000001', 'PROVA', 'MATRICE', now(), 'PROVA TESSERA ORDINARIA');
insert into public.member_passes (member_id, pass_type)
values ('bbbbbbbb-0000-0000-0000-000000000001', 'PROVA 10 VIAGGI SABATO');
insert into public.trip_uses (member_id, pass_id)
select member_id, id from public.member_passes where member_id = 'bbbbbbbb-0000-0000-0000-000000000001';
insert into public.ledger_entries (kind, category, quantity, unit_price) values ('ENTRATA', 'PROVA MATRICE', 1, 1);
-- Una stagione chiusa l'anno scorso: la stagione aperta resta quella del
-- calendario (current_season() è quella dopo l'ultima chiusa).
insert into public.season_history (season, members) values (public.season_of(now()) - interval '1 year', 0);
insert into public.sponsors (id, name, alcohol) values ('cccccccc-5555-0000-0000-000000000001', 'PROVA SPONSOR', true);
insert into public.social_events (kind, title, sponsor_id) values ('sponsor', 'PROVA CAMPAGNA', 'cccccccc-5555-0000-0000-000000000001');
insert into public.social_contacts (name, phone) values ('PROVA CONTATTO', '333 000 0000');

-- Una prova della matrice: `leggi` è riuscita se trova almeno una riga,
-- `scrivi` se non dà errore e tocca almeno una riga (la RLS che nega una
-- scrittura non dà errore: la fa su zero righe). Ogni prova viene annullata
-- alla fine, così l'ordine non conta e i dati restano quelli di sopra.
create or replace function public.test_prova(chi uuid, tipo text, comando text)
returns boolean
language plpgsql
as $$
declare
  n bigint;
  esito boolean := false;
begin
  perform set_config('test.uid', coalesce(chi::text, ''), true);
  begin
    if tipo = 'leggi' then
      execute format('select count(*) from (%s) x', comando) into n;
    else
      execute comando;
      get diagnostics n = row_count;
    end if;
    esito := n > 0;
    raise exception 'ANNULLA';
  exception when others then
    if sqlerrm <> 'ANNULLA' then esito := false; end if;
  end;
  return esito;
end;
$$;

set role authenticated;

-- ---------------------------------------------------------------------------
-- Matrice ruoli × permessi: chi può fare cosa, provato davvero sotto RLS.
-- Colonne: superadmin, admin, tesoriere, assicurazione, gite, social, senza
-- ruolo. È la specifica di role_permissions() in schema.sql: se cambia una,
-- cambia l'altra.
-- ---------------------------------------------------------------------------
do $$
declare
  chi constant uuid[] := array[
    '22222222-2222-2222-2222-222222222222',  -- superadmin
    '44444444-4444-4444-4444-444444444444',  -- admin
    '33333333-3333-3333-3333-333333333333',  -- tesoriere
    '66666666-6666-6666-6666-666666666666',  -- assicurazione
    '11111111-1111-1111-1111-111111111111',  -- gite
    '88888888-8888-8888-8888-888888888888',  -- social
    '55555555-5555-5555-5555-555555555555']; -- senza ruolo
  nomi constant text[] := array['superadmin', 'admin', 'tesoriere', 'assicurazione', 'gite', 'social', 'senza ruolo'];
  m constant text := '''bbbbbbbb-0000-0000-0000-000000000001''';
  prova record;
  i int;
  errori text := '';
begin
  for prova in select * from (values
    ('leggi',  'select 1 from public.members',                                   'SSSxSxx'),
    ('leggi',  'select 1 from public.prices',                                    'SSSxSxx'),
    ('leggi',  'select 1 from public.departures',                                'SSxxxSx'),
    ('leggi',  'select 1 from public.member_passes',                             'SSSxSxx'),
    ('leggi',  'select 1 from public.trip_uses',                                 'SSSxSxx'),
    ('leggi',  'select 1 from public.ledger_entries',                            'SxSxxxx'),
    ('leggi',  'select 1 from public.season_history',                            'SxSxxxx'),
    ('leggi',  'select 1 from public.profiles where user_id <> auth.uid()',      'Sxxxxxx'),
    ('leggi',  'select 1 from public.accounts_without_role()',                   'Sxxxxxx'),
    ('leggi',  'select 1 from public.insurance_members()',                       'SxxSxxx'),
    ('leggi',  'select 1 from public.social_events',                             'SxxxxSx'),
    ('leggi',  'select 1 from public.sponsors',                                  'SxxxxSx'),
    ('leggi',  'select 1 from public.trip_days',                                 'SxxxxSx'),
    ('scrivi', 'update public.trip_days set color = ''#147A45'' where weekday = 5', 'SxxxxSx'),
    ('leggi',  'select 1 from public.social_contacts',                           'SxxxxSx'),
    ('scrivi', 'insert into public.social_contacts (name, phone) values (''PROVA'', ''333 000 0000'')', 'SxxxxSx'),
    ('scrivi', 'insert into public.social_events (kind, title, event_date) values (''gita'', ''PROVA'', current_date)', 'SxxxxSx'),
    ('scrivi', 'update public.sponsors set color_accent = ''#E6AC34''',          'SxxxxSx'),
    ('scrivi', 'insert into public.members (last_name, first_name) values (''PROVA'', ''NUOVO'')', 'SSxxxxx'),
    ('scrivi', 'update public.members set phone = ''1'' where id = ' || m,       'SSxxxxx'),
    ('scrivi', 'update public.members set policy_number = ''POL-M'' where id = ' || m, 'Sxxxxxx'),
    ('scrivi', 'select public.set_insurance(' || m || ', ''X'', ''POL-M'')',       'SxxSxxx'),
    ('scrivi', 'select public.settle_household(' || m || ')',                     'SSSxxxx'),
    ('scrivi', 'select public.add_pass(' || m || ', ''PROVA 10 VIAGGI SABATO'', false, gen_random_uuid())', 'SSxxSxx'),
    ('scrivi', 'select * from public.use_trip(' || m || ', gen_random_uuid(), null)', 'SSxxSxx'),
    ('scrivi', 'insert into public.member_passes (member_id, pass_type) values (' || m || ', ''PROVA 10 VIAGGI SABATO'')', 'SSxxxxx'),
    ('scrivi', 'insert into public.trip_uses (member_id) values (' || m || ')',   'xxxxxxx'),
    ('scrivi', 'insert into public.ledger_entries (kind, category, quantity, unit_price) values (''USCITA'', ''PROVA'', 1, 1)', 'SxSxxxx'),
    ('scrivi', 'update public.prices set price = price',                          'Sxxxxxx'),
    ('scrivi', 'update public.departures set place = place',                      'Sxxxxxx'),
    ('scrivi', 'insert into public.season_history (season, members) values (''1991-09-01'', 0)', 'Sxxxxxx'),
    ('scrivi', 'update public.profiles set role = role',                          'Sxxxxxx')
  ) as t(tipo, comando, atteso) loop
    for i in 1..7 loop
      if public.test_prova(chi[i], prova.tipo, prova.comando) <> (substr(prova.atteso, i, 1) = 'S') then
        errori := errori || format(E'\n  %s %s: %s', nomi[i],
          case when substr(prova.atteso, i, 1) = 'S' then 'NON può' else 'PUÒ' end, prova.comando);
      end if;
    end loop;
  end loop;
  if errori <> '' then
    raise exception 'Matrice dei permessi sbagliata:%', errori;
  end if;
end $$;

-- my_access(): quello che le pagine leggono per disegnare barra e contenuto.
do $$ begin
  perform set_config('test.uid', '33333333-3333-3333-3333-333333333333', false);
  assert (select role from public.my_access()) = 'tesoriere', 'my_access: ruolo sbagliato';
  assert (select permissions from public.my_access()) = array['pagamenti', 'riepilogo', 'storico', 'bilancio'],
         'my_access: permessi del tesoriere sbagliati';
  perform set_config('test.uid', '55555555-5555-5555-5555-555555555555', false);
  assert (select count(*) from public.my_access()) = 0, 'my_access: chi non ha ruolo riceve qualcosa';
  assert not public.can('soci', 'gite', 'polizze', 'social', 'gestione'), 'senza ruolo deve sempre dire di no';
  perform set_config('test.uid', '', false);
  assert not public.can('soci'), 'senza login deve sempre dire di no';
end $$;

-- ---------------------------------------------------------------------------
-- "Vedi come": il superadmin guarda il sito come un altro ruolo, e il
-- database lo tratta davvero da quel ruolo. Tornare sé stessi funziona
-- sempre; nessun altro può usarlo.
-- ---------------------------------------------------------------------------
do $$
declare quante int;
begin
  perform set_config('test.uid', '22222222-2222-2222-2222-222222222222', false);
  perform public.set_view_as('tesoriere');
  assert (select role from public.my_access()) = 'tesoriere', 'vedi come: il ruolo non è cambiato';
  assert (select real_role from public.my_access()) = 'superadmin', 'vedi come: perso il ruolo vero';
  assert not public.can('soci'), 'vedi come tesoriere: può ancora modificare i soci';
  assert public.can('bilancio'), 'vedi come tesoriere: non vede il bilancio';
  assert not public.test_prova('22222222-2222-2222-2222-222222222222', 'scrivi',
    'insert into public.members (last_name, first_name) values (''PROVA'', ''VEDICOME'')'),
    'vedi come tesoriere: la RLS lo lascia iscrivere un socio';
  assert (select count(*) from public.profiles) = 1, 'vedi come tesoriere: vede gli account degli altri';

  -- Anche da un ruolo che non può niente, si torna indietro.
  perform public.set_view_as('social');
  assert not public.can('gestione'), 'vedi come social: ha ancora gestione';
  perform public.set_view_as(null);
  assert public.can('gestione'), 'tornato superadmin ma senza gestione';
  assert (select role from public.my_access()) = 'superadmin', 'tornato superadmin ma il ruolo dice altro';

  begin
    perform public.set_view_as('capo');
    raise exception 'ASSERZIONE: vedi come un ruolo inesistente';
  exception when others then
    if sqlerrm like 'ASSERZIONE:%' then raise; end if;
  end;

  perform set_config('test.uid', '44444444-4444-4444-4444-444444444444', false);
  begin
    perform public.set_view_as('tesoriere');
    raise exception 'ASSERZIONE: un admin ha usato vedi come';
  exception when others then
    if sqlerrm like 'ASSERZIONE:%' then raise; end if;
  end;
  with x as (update public.profiles set view_as = 'tesoriere', role = 'superadmin'
              where user_id = auth.uid() returning 1)
  select count(*) into quante from x;
  assert quante = 0, 'un admin ha cambiato il proprio ruolo o vedi come';
  assert (select role from public.my_access()) = 'admin', 'l''admin è diventato qualcos''altro';
end $$;

-- Chi smette di essere superadmin smette anche di vedere come.
reset role;
do $$ begin
  update public.profiles set view_as = 'gite' where email = 'super@test';
  update public.profiles set role = 'admin' where email = 'super@test';
  assert (select view_as from public.profiles where email = 'super@test') is null,
         'un superadmin retrocesso continua a vedere come un altro ruolo';
  update public.profiles set role = 'superadmin' where email = 'super@test';
end $$;
set role authenticated;

-- Solo il superadmin cambia i ruoli altrui.
do $$
declare quante int;
begin
  perform set_config('test.uid', '44444444-4444-4444-4444-444444444444', false);
  with x as (update public.profiles set role = 'superadmin' where email = 'social@test' returning 1)
  select count(*) into quante from x;
  assert quante = 0, 'un admin ha potuto cambiare il ruolo di un altro';

  perform set_config('test.uid', '22222222-2222-2222-2222-222222222222', false);
  with x as (update public.profiles set role = 'social' where email = 'social@test' returning 1)
  select count(*) into quante from x;
  assert quante = 1, 'il superadmin non ha potuto cambiare un ruolo';
end $$;

-- Trigger check_card_type_role: il filtro min_role non è solo lato pagina.
-- 'admin' = admin e superadmin, 'superadmin' = solo superadmin.
do $$ begin
  perform set_config('test.uid', '44444444-4444-4444-4444-444444444444', false);

  update public.members set card_type = 'PROVA TESSERA ORDINARIA', pass_type = 'PROVA 10 VIAGGI SABATO'
   where id = '99999999-9999-9999-9999-999999999999';
  assert (select card_type from public.members where id = '99999999-9999-9999-9999-999999999999')
         = 'PROVA TESSERA ORDINARIA', 'un admin non ha potuto assegnare una tessera normale';

  begin
    update public.members set card_type = 'PROVA TESSERA PRESIDENTE'
     where id = '99999999-9999-9999-9999-999999999999';
    raise exception 'ASSERZIONE: un admin ha potuto assegnare una tessera del superadmin';
  exception when others then
    if sqlerrm like 'ASSERZIONE:%' then raise; end if;
  end;

  begin
    insert into public.members (last_name, first_name, card_type)
    values ('VERDI', 'LUIGI', 'PROVA TESSERA PRESIDENTE');
    raise exception 'ASSERZIONE: un admin ha potuto iscrivere un socio con una tessera del superadmin';
  exception when others then
    if sqlerrm like 'ASSERZIONE:%' then raise; end if;
  end;

  -- Salvare un altro campo non deve inciampare nel controllo.
  update public.members set phone = '333' where id = '99999999-9999-9999-9999-999999999999';

  -- La tessera del direttivo la assegna l'admin.
  update public.members set card_type = 'PROVA TESSERA DIRETTIVO'
   where id = '99999999-9999-9999-9999-999999999999';
  assert (select card_type from public.members where id = '99999999-9999-9999-9999-999999999999')
         = 'PROVA TESSERA DIRETTIVO', 'un admin non ha potuto assegnare la tessera riservata';

  -- Il numero di polizza lo rimanda indietro uguale il form Soci: passa.
  update public.members set policy_number = policy_number, phone = '334'
   where id = '99999999-9999-9999-9999-999999999999';
end $$;

-- Il livello di visibilità vale solo per le tessere: un abbonamento riservato
-- lo rifiuta il database, non solo il pannello Impostazioni. Da superadmin,
-- così a dire di no è il vincolo e non la RLS del listino.
do $$ begin
  perform set_config('test.uid', '22222222-2222-2222-2222-222222222222', false);
  update public.prices set min_role = 'admin' where name = 'PROVA 10 VIAGGI SABATO';
  raise exception 'ASSERZIONE: un abbonamento è diventato riservato';
exception when others then
  if sqlerrm like 'ASSERZIONE:%' then raise; end if;
end $$;

-- Amministrazione è solo del superadmin: il tesoriere legge lo storico ma
-- non lo scrive, quindi close_season() gli fallisce prima di azzerare.
do $$ begin
  perform set_config('test.uid', '33333333-3333-3333-3333-333333333333', false);
  begin
    perform public.close_season('CHIUDI STAGIONE');
    raise exception 'ASSERZIONE: il tesoriere ha chiuso la stagione';
  exception when others then
    if sqlerrm like 'ASSERZIONE:%' then raise; end if;
  end;
  assert (select enrolled_at from public.members where id = '99999999-9999-9999-9999-999999999999') is not null,
         'una chiusura rifiutata ha azzerato i soci';
end $$;

-- Rimozione dal pannello Utenti: la fa solo il superadmin, e chi resta senza
-- riga profiles resta senza accessi, anche se il suo account Auth esiste
-- ancora (cancellarlo davvero vorrebbe la service_role).
do $$
declare quante int;
begin
  perform set_config('test.uid', '44444444-4444-4444-4444-444444444444', false);
  with x as (delete from public.profiles where email = 'social@test' returning 1)
  select count(*) into quante from x;
  assert quante = 0, 'un admin ha potuto rimuovere un utente';

  perform set_config('test.uid', '22222222-2222-2222-2222-222222222222', false);
  with x as (delete from public.profiles where email = 'social@test' returning 1)
  select count(*) into quante from x;
  assert quante = 1, 'il superadmin non ha potuto rimuovere un utente';

  perform set_config('test.uid', '88888888-8888-8888-8888-888888888888', false);
  assert not public.can('social'), 'un utente rimosso ha ancora i suoi permessi';
end $$;

-- Una campagna vuole il suo sponsor, e un post normale non ne ha. (L'account
-- social qui sopra è appena stato rimosso: si prova da superadmin.)
do $$ begin
  perform set_config('test.uid', '22222222-2222-2222-2222-222222222222', false);
  begin
    insert into public.social_events (kind, title) values ('sponsor', 'SENZA SPONSOR');
    raise exception 'ASSERZIONE: campagna senza sponsor';
  exception when check_violation then null;
  end;
  begin
    update public.sponsors set color_dark = 'marrone';
    raise exception 'ASSERZIONE: colore non esadecimale accettato';
  exception when check_violation then null;
  end;
  -- Un contatto tolto dalla rubrica esce dai post che lo avevano, gli altri restano.
  insert into public.social_contacts (id, name, phone) values
    ('dddddddd-0000-0000-0000-000000000001', 'VIA', '1'), ('dddddddd-0000-0000-0000-000000000002', 'RESTA', '2');
  insert into public.social_events (kind, title, contacts) values ('corso', 'PROVA CONTATTI',
    array['dddddddd-0000-0000-0000-000000000001', 'dddddddd-0000-0000-0000-000000000002']::uuid[]);
  delete from public.social_contacts where id = 'dddddddd-0000-0000-0000-000000000001';
  assert (select contacts from public.social_events where title = 'PROVA CONTATTI')
         = array['dddddddd-0000-0000-0000-000000000002']::uuid[], 'il contatto tolto è rimasto sul post';
  begin
    insert into public.social_contacts (name, phone) values ('Marco', '  ');
    raise exception 'ASSERZIONE: contatto senza telefono accettato';
  exception when check_violation then null;
  end;

  -- Eliminare uno sponsor porta via le sue campagne (anche una già
  -- pubblicata), e solo quelle; chi non ha il permesso social non elimina.
  insert into public.sponsors (id, name) values ('cccccccc-5555-0000-0000-000000000002', 'PROVA DA TOGLIERE');
  insert into public.social_events (kind, title, sponsor_id, published_at) values
    ('sponsor', 'CAMPAGNA 1', 'cccccccc-5555-0000-0000-000000000002', now()),
    ('sponsor', 'CAMPAGNA 2', 'cccccccc-5555-0000-0000-000000000002', null);
  insert into public.social_events (kind, title, event_date) values ('gita', 'GITA CHE RESTA', current_date);

  perform set_config('test.uid', '44444444-4444-4444-4444-444444444444', false);   -- admin
  delete from public.sponsors where id = 'cccccccc-5555-0000-0000-000000000002';
  perform set_config('test.uid', '22222222-2222-2222-2222-222222222222', false);
  assert (select count(*) from public.social_events where sponsor_id = 'cccccccc-5555-0000-0000-000000000002') = 2,
         'un admin ha eliminato uno sponsor e le sue campagne';

  delete from public.sponsors where id = 'cccccccc-5555-0000-0000-000000000002';
  assert (select count(*) from public.sponsors where id = 'cccccccc-5555-0000-0000-000000000002') = 0, 'sponsor non eliminato';
  assert (select count(*) from public.social_events where title in ('CAMPAGNA 1', 'CAMPAGNA 2')) = 0,
         'le campagne dello sponsor eliminato sono rimaste';
  assert (select count(*) from public.social_events where title = 'GITA CHE RESTA') = 1, 'eliminato un post che non c''entrava';
  assert (select count(*) from public.social_events where sponsor_id = 'cccccccc-5555-0000-0000-000000000001') = 1,
         'eliminata la campagna di un altro sponsor';
end $$;

reset role;
delete from public.ledger_entries where category = 'PROVA MATRICE';
delete from public.social_events;
delete from public.sponsors;
delete from public.season_history where season = public.season_of(now()) - interval '1 year';
drop function public.test_prova(uuid, text, text);
SQL

# Una gita segnata prima della 2.4, quando l'abbonamento era una colonna del
# socio: dopo lo schema deve essere attaccata all'abbonamento spostato.
# Il trigger legge le gite da "N viaggi" scritto minuscolo, come nel listino
# vero: la voce di prova in maiuscolo va completata a mano.
psql_ -c "update public.prices set trips = 10, day = 'SABATO' where name = 'PROVA 10 VIAGGI SABATO';"
psql_ -c "insert into public.trip_uses (member_id) values ('99999999-9999-9999-9999-999999999999');"
# Giorni delle gite cambiati dalla pagina: il martedì tolto, il sabato giallo.
psql_ -c "update public.trip_days set color = case weekday when 2 then null when 6 then '#FCCF02' else color end;"
# Contatti scritti dalla pagina: lo schema rieseguito non li tocca e non ne aggiunge.
psql_ -c "delete from public.social_contacts; insert into public.social_contacts (name, phone, hours) values ('Segreteria', '011 123 4567', 'dopo le 18');"

# Lo script rieseguito non deve rimettere in gioco chi è stato rimosso: il
# backfill una tantum vede ancora il suo account in auth.users, e senza il
# "where not exists" gli ridarebbe una riga profiles per giunta da admin.
# Due volte: lo spostamento degli abbonamenti non deve raddoppiarli.
psql_ < "$QUI/schema.sql" >/dev/null
psql_ < "$QUI/schema.sql" >/dev/null

psql_ <<'SQL'
do $$ begin
  assert (select count(*) from public.profiles where email = 'social@test') = 0,
         'schema.sql ha resuscitato un utente rimosso';
  assert (select count(*) from public.profiles where email = 'senza@test') = 0,
         'schema.sql ha dato un ruolo a un account che non lo aveva';
  assert (select count(*) from public.trip_days) = 7, 'trip_days non ha una riga per giorno';
  assert (select color from public.trip_days where weekday = 2) is null, 'schema.sql ha rimesso il martedì tolto';
  assert (select color from public.trip_days where weekday = 6) = '#FCCF02', 'schema.sql ha rimesso il colore di prima al sabato';
  assert (select count(*) from public.social_contacts) = 1, 'schema.sql ha cambiato i contatti dei post';
  assert (select hours from public.social_contacts) = 'dopo le 18', 'schema.sql ha perso gli orari del contatto';

  -- L'abbonamento scritto nella vecchia colonna è diventato una riga, una sola.
  assert (select count(*) from public.member_passes
           where member_id = '99999999-9999-9999-9999-999999999999') = 1,
         'lo spostamento degli abbonamenti non ha creato una riga sola';
  assert (select count(*) from public.trip_uses
           where member_id = '99999999-9999-9999-9999-999999999999' and pass_id is null) = 0,
         'la gita di prima non è stata attaccata all''abbonamento';
  assert (select trips_used from public.trip_passes
           where member_id = '99999999-9999-9999-9999-999999999999') = 1,
         'la gita di prima non conta più';
end $$;
SQL

# La stagione aperta la decide l'ultima chiusura, non il calendario. Si
# finge una stagione 2030 già chiusa: la stagione aperta diventa la 2031 in
# qualunque giorno giri il test, ed è proprio il caso "oggi il calendario dice
# un'altra cosa" che una chiusura in ritardo produce davvero.
psql_ <<'SQL'
do $$ begin
  assert public.current_season() = public.season_of(now()),
         'senza stagioni chiuse la stagione aperta non è quella del calendario';
end $$;

insert into public.season_history (season, members, bank_closing) values ('2030-09-01', 0, 500);
update public.members set paid = 50 where id = '99999999-9999-9999-9999-999999999999';

set role authenticated;
do $$
declare chiusa timestamptz;
begin
  -- L'admin non legge season_history, ma la stagione aperta la vede giusta.
  perform set_config('test.uid', '44444444-4444-4444-4444-444444444444', false);
  assert (select count(*) from public.season_history) = 0, 'un admin legge lo storico stagioni';
  assert public.current_season() = '2030-09-01'::timestamptz + interval '1 year',
         'per l''admin la stagione aperta non segue l''ultima chiusura';

  -- Il bilancio è del tesoriere.
  perform set_config('test.uid', '33333333-3333-3333-3333-333333333333', false);

  insert into public.ledger_entries (kind, category, quantity, unit_price)
  values ('ENTRATA', 'PROVA SPONSOR', 1, 200);
  assert (select season from public.ledger_entries where category = 'PROVA SPONSOR') = '2031-09-01',
         'un movimento nuovo non va nella stagione aperta';

  -- Il socio si è iscritto "oggi", prima del 2031: conta lo stesso, perché
  -- dopo una chiusura chi ha enrolled_at è iscritto alla stagione aperta.
  assert (select season from public.season_balance) = '2031-09-01', 'il bilancio non è della stagione aperta';
  assert (select members_collected from public.season_balance) = 50, 'il bilancio perde le quote dei soci';
  assert (select bank_opening from public.season_balance) = 500, 'il saldo proposto non è la chiusura precedente';
  assert (select bank_current from public.season_balance) = 750, 'saldo banca attuale sbagliato';
  assert (select count(*) from public.open_season) = 1, 'la stagione aperta è spezzata in più righe';
  assert (select season from public.open_season) = '2031-09-01', 'open_season ha l''etichetta sbagliata';

  -- La chiusura archivia con l'etichetta della stagione aperta, non con
  -- quella del calendario.
  perform set_config('test.uid', '22222222-2222-2222-2222-222222222222', false);
  select season_closed into chiusa from public.close_season('CHIUDI STAGIONE');
  assert chiusa = '2031-09-01', 'la chiusura ha usato l''etichetta del calendario';
  assert (select bank_closing from public.season_history where season = '2031-09-01') = 750,
         'saldo di chiusura sbagliato';
  assert public.current_season() = '2032-09-01', 'dopo la chiusura la stagione aperta non avanza';
  assert (select count(*) from public.open_season) = 0, 'dopo la chiusura resta una stagione aperta';
  assert (select members_collected from public.season_balance) = 0, 'dopo la chiusura restano quote nel bilancio';
end $$;

reset role;
delete from public.ledger_entries where category = 'PROVA SPONSOR';
delete from public.season_breakdown where season >= '2030-09-01';
delete from public.season_history where season >= '2030-09-01';
SQL

# ---------------------------------------------------------------------------
# 2.4: numero tessera, ruolo assicurazione, più abbonamenti per socio,
# socio tolto dalla stagione
# ---------------------------------------------------------------------------
psql_ <<'SQL'
insert into public.prices (category, name, price) values
  ('ABBONAMENTO', 'Prova 5 viaggi DOMENICA', 100),
  ('ABBONAMENTO', 'Prova 5 viaggi JOLLY', 100)
on conflict (category, name) do nothing;

-- Due tesserati della stagione e un iscritto senza tessera, che
-- all'assicurazione non va mandato. Il controllo sulle tessere vuole
-- qualcuno collegato anche per postgres: si finge il superadmin.
do $$ begin perform set_config('test.uid', '22222222-2222-2222-2222-222222222222', false); end $$;
insert into public.members (id, last_name, first_name, enrolled_at, card_type, card_number, tax_code, total, paid) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'BIANCHI', 'ANNA', now(), 'PROVA TESSERA ORDINARIA', '21',  'XXX', 35, 0),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'VERDI',   'LUCA', now(), 'PROVA TESSERA ORDINARIA', 'A-7', null,  35, 35),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'NERI',    'ELIO', now(), null,                      null,  null,  0,  0);

set role authenticated;

-- L'account social era stato rimosso qui sopra: l'account Auth c'è ancora,
-- la riga profiles no. Il superadmin lo vede fra gli account senza accesso e
-- glielo ridà; nessun altro può farlo.
do $$ begin
  perform set_config('test.uid', '44444444-4444-4444-4444-444444444444', false);   -- admin
  assert (select count(*) from public.accounts_without_role()) = 0, 'un admin vede gli account rimossi';
  begin
    perform public.restore_account('88888888-8888-8888-8888-888888888888', 'superadmin');
    raise exception 'ASSERZIONE: un admin ha ridato l''accesso a un account';
  exception when others then
    if sqlerrm like 'ASSERZIONE:%' then raise; end if;
  end;

  perform set_config('test.uid', '22222222-2222-2222-2222-222222222222', false);
  assert (select count(*) from public.accounts_without_role() where email = 'social@test') = 1,
         'il superadmin non vede l''account rimosso';
  begin
    perform public.restore_account('88888888-8888-8888-8888-888888888888', 'capo');
    raise exception 'ASSERZIONE: ridato l''accesso con un ruolo inesistente';
  exception when others then
    if sqlerrm like 'ASSERZIONE:%' then raise; end if;
  end;
  perform public.restore_account('88888888-8888-8888-8888-888888888888', 'social');
  assert (select count(*) from public.accounts_without_role() where email = 'social@test') = 0,
         'account ancora senza accesso dopo il ripristino';
  assert (select role from public.profiles where email = 'social@test') = 'social', 'ruolo sbagliato dopo il ripristino';
  -- Ripetuto su un account che ha già un ruolo: lo cambia, non si rompe.
  perform public.restore_account('88888888-8888-8888-8888-888888888888', 'social');

  perform set_config('test.uid', '88888888-8888-8888-8888-888888888888', false);
  assert public.can('social'), 'l''account ripristinato non ha il suo ruolo';
end $$;

-- Eliminare per sempre: solo il superadmin, e solo un account già rimosso.
reset role;
insert into auth.users (id, email) values ('77777777-7777-7777-7777-777777777777', 'da-eliminare@test');
delete from public.profiles where user_id = '77777777-7777-7777-7777-777777777777';
set role authenticated;
do $$ begin
  perform set_config('test.uid', '44444444-4444-4444-4444-444444444444', false);   -- admin
  begin
    perform public.delete_account('77777777-7777-7777-7777-777777777777');
    raise exception 'ASSERZIONE: un admin ha eliminato un account';
  exception when others then
    if sqlerrm like 'ASSERZIONE:%' then raise; end if;
  end;

  perform set_config('test.uid', '22222222-2222-2222-2222-222222222222', false);
  -- Un account con un ruolo non si elimina: prima va rimosso.
  begin
    perform public.delete_account('11111111-1111-1111-1111-111111111111');
    raise exception 'ASSERZIONE: eliminato un account ancora attivo';
  exception when others then
    if sqlerrm like 'ASSERZIONE:%' then raise; end if;
    assert sqlerrm like '%prima premi Rimuovi%', 'errore inatteso: ' || sqlerrm;
  end;
  begin
    perform public.delete_account('22222222-2222-2222-2222-222222222222');
    raise exception 'ASSERZIONE: il superadmin ha eliminato sé stesso';
  exception when others then
    if sqlerrm like 'ASSERZIONE:%' then raise; end if;
  end;

  perform public.delete_account('77777777-7777-7777-7777-777777777777');
  assert (select count(*) from public.accounts_without_role() where email = 'da-eliminare@test') = 0,
         'account eliminato ancora in elenco';
  begin
    perform public.delete_account('77777777-7777-7777-7777-777777777777');
    raise exception 'ASSERZIONE: eliminato due volte';
  exception when others then
    if sqlerrm like 'ASSERZIONE:%' then raise; end if;
    assert sqlerrm like 'Account non trovato%', 'errore inatteso: ' || sqlerrm;
  end;
end $$;
reset role;
do $$ begin
  assert (select count(*) from auth.users where email = 'da-eliminare@test') = 0, 'l''account Auth è rimasto';
  assert (select count(*) from auth.users where email = 'gite@test') = 1, 'eliminato l''account sbagliato';
end $$;
set role authenticated;

-- Numero tessera: il successivo del più alto numerico, e mai due uguali.
do $$ begin
  perform set_config('test.uid', '44444444-4444-4444-4444-444444444444', false);
  assert public.next_card_number() = 22, 'numero tessera proposto sbagliato (atteso 22: 21 più uno, A-7 non conta)';
  begin
    update public.members set card_number = '21' where id = 'aaaaaaaa-0000-0000-0000-000000000002';
    raise exception 'ASSERZIONE: due soci con lo stesso numero tessera';
  exception when unique_violation then null;
  end;
end $$;

-- Assicurazione: vede e scrive solo quello che le serve.
do $$
declare quante int;
begin
  perform set_config('test.uid', '66666666-6666-6666-6666-666666666666', false);
  assert public.can('polizze'), 'assicurazione non riconosciuta';
  assert not public.can('soci', 'gite', 'riepilogo'), 'assicurazione ha i permessi di chi gestisce i soci';
  assert (select count(*) from public.members) = 0, 'assicurazione legge la tabella members';
  assert (select count(*) from public.member_passes) = 0, 'assicurazione legge gli abbonamenti';
  assert (select count(*) from public.prices) = 0, 'assicurazione legge il listino';
  assert (select count(*) from public.trip_uses) = 0, 'assicurazione legge le gite';

  assert (select count(*) from public.insurance_members()) = 2, 'da assicurare: attesi i due tesserati';
  perform public.set_insurance('aaaaaaaa-0000-0000-0000-000000000001', ' bnc nna 80a41 f205x ', 'POL-1');
  assert (select count(*) from public.insurance_members()) = 1, 'con la polizza il socio resta da assicurare';
  -- Il socio assicurato si ritrova con la ricerca, che però non dà l'elenco intero.
  assert (select count(*) from public.insurance_search('bianchi')) = 1, 'la ricerca non trova un assicurato';
  assert (select count(*) from public.insurance_search('POL-1')) = 1, 'la ricerca per polizza non trova niente';
  assert (select count(*) from public.insurance_search('anna bianchi')) = 1, 'la ricerca a due parole non trova niente';
  assert (select count(*) from public.insurance_search('')) = 0, 'la ricerca vuota restituisce soci';
  assert (select count(*) from public.insurance_search('%')) = 0, 'la ricerca usa i jolly del like';
  assert (select count(*) from public.insurance_search('elio')) = 0, 'la ricerca trova chi non ha la tessera';
  begin
    perform public.insurance_members(false);
    raise exception 'ASSERZIONE: esiste ancora l''elenco completo per l''assicurazione';
  exception when others then
    if sqlerrm like 'ASSERZIONE:%' then raise; end if;
  end;

  -- Correzione di una polizza sbagliata: il socio già assicurato si ritrova
  -- fra tutti i tesserati e si riscrive.
  perform public.set_insurance('aaaaaaaa-0000-0000-0000-000000000001', 'BNCNNA80A41F205X', 'POL-2');
  assert (select policy_number from public.insurance_search('bianchi')) = 'POL-2', 'polizza non corretta';

  -- Solo codice fiscale: resta da assicurare.
  perform public.set_insurance('aaaaaaaa-0000-0000-0000-000000000002', 'VRDLCU90A01F205Z', '  ');
  assert (select count(*) from public.insurance_members()) = 1, 'una polizza vuota ha tolto il socio dall''elenco';

  -- La RLS lo tiene fuori da members: niente quote cambiate a mano.
  with x as (update public.members set total = 0 returning 1) select count(*) into quante from x;
  assert quante = 0, 'assicurazione ha cambiato le quote';

  -- Chi non è iscritto alla stagione non si tocca.
  begin
    perform public.set_insurance('99999999-9999-9999-9999-999999999999', 'X', 'POL-FUORI');
    raise exception 'ASSERZIONE: polizza scritta a un socio non iscritto';
  exception when others then
    if sqlerrm like 'ASSERZIONE:%' then raise; end if;
  end;

  -- E non toglie nessuno dalla stagione.
  begin
    perform public.remove_from_season('aaaaaaaa-0000-0000-0000-000000000001');
    raise exception 'ASSERZIONE: assicurazione ha tolto un socio dalla stagione';
  exception when others then
    if sqlerrm like 'ASSERZIONE:%' then raise; end if;
  end;
end $$;

do $$ begin
  perform set_config('test.uid', '44444444-4444-4444-4444-444444444444', false);
  assert (select tax_code from public.members where id = 'aaaaaaaa-0000-0000-0000-000000000001') = 'BNCNNA80A41F205X',
         'il codice fiscale non è stato scritto ripulito';
  assert (select policy_number from public.members where id = 'aaaaaaaa-0000-0000-0000-000000000001') = 'POL-2',
         'la polizza non è stata scritta';
  assert (select total from public.members where id = 'aaaaaaaa-0000-0000-0000-000000000001') = 35,
         'set_insurance ha toccato altro';
  -- Dalla 2.5 le polizze sono solo dell'assicurazione: l'admin legge i soci
  -- ma non l'elenco da assicurare, e non scrive polizze.
  assert (select count(*) from public.insurance_members()) = 0, 'un admin vede l''elenco da assicurare';
  begin
    perform public.set_insurance('aaaaaaaa-0000-0000-0000-000000000002', 'X', 'POL-ADMIN');
    raise exception 'ASSERZIONE: un admin ha scritto una polizza';
  exception when others then
    if sqlerrm like 'ASSERZIONE:%' then raise; end if;
  end;
  begin
    update public.members set policy_number = 'POL-ADMIN' where id = 'aaaaaaaa-0000-0000-0000-000000000002';
    raise exception 'ASSERZIONE: un admin ha scritto una polizza dal form Soci';
  exception when others then
    if sqlerrm like 'ASSERZIONE:%' then raise; end if;
    assert sqlerrm like '%solo l''assicurazione%', 'errore inatteso: ' || sqlerrm;
  end;
end $$;

do $$
declare chi text;
begin
  foreach chi in array array['55555555-5555-5555-5555-555555555555',     -- senza ruolo
                             '11111111-1111-1111-1111-111111111111',     -- gite
                             '88888888-8888-8888-8888-888888888888'] loop -- social
    perform set_config('test.uid', chi, false);
    assert (select count(*) from public.insurance_members()) = 0, 'senza permesso polizze vede i tesserati';
    assert (select count(*) from public.insurance_search('bianchi')) = 0, 'senza permesso polizze cerca i tesserati';
    begin
      perform public.set_insurance('aaaaaaaa-0000-0000-0000-000000000002', 'X', 'POL-ABUSIVA');
      raise exception 'ASSERZIONE: senza permesso polizze ha scritto una polizza';
    exception when others then
      if sqlerrm like 'ASSERZIONE:%' then raise; end if;
    end;
  end loop;
end $$;

-- La ricerca dell'assicurazione si ferma a 20 risultati.
reset role;
do $$ begin perform set_config('test.uid', '22222222-2222-2222-2222-222222222222', false); end $$;
insert into public.members (last_name, first_name, enrolled_at, card_type)
select 'MOLTI', 'NOME' || i, now(), 'PROVA TESSERA ORDINARIA' from generate_series(1, 25) i;
set role authenticated;
do $$ begin
  perform set_config('test.uid', '66666666-6666-6666-6666-666666666666', false);
  assert (select count(*) from public.insurance_search('molti')) = 20, 'la ricerca non si ferma a 20 risultati';
end $$;

-- Più abbonamenti per socio.
do $$
declare
  anna constant uuid := 'aaaaaaaa-0000-0000-0000-000000000001';
  i int;
begin
  perform set_config('test.uid', '11111111-1111-1111-1111-111111111111', false);

  -- add_pass: ripetibile, e il prezzo finisce nel totale (e nell'acconto se pagato).
  perform public.add_pass(anna, 'Prova 5 viaggi DOMENICA', true, 'cccccccc-0000-0000-0000-000000000001');
  perform public.add_pass(anna, 'Prova 5 viaggi DOMENICA', true, 'cccccccc-0000-0000-0000-000000000001');
  assert (select count(*) from public.member_passes where member_id = anna) = 1, 'add_pass ripetuto ha venduto due abbonamenti';
  assert (select total from public.members where id = anna) = 135, 'add_pass non ha sommato il prezzo al totale';
  assert (select paid from public.members where id = anna) = 100, 'add_pass pagato non ha sommato l''acconto';

  perform public.add_pass(anna, 'Prova 5 viaggi JOLLY', false, 'cccccccc-0000-0000-0000-000000000002');
  assert (select total from public.members where id = anna) = 235, 'secondo abbonamento non sommato';
  assert (select paid from public.members where id = anna) = 100, 'abbonamento da pagare finito nell''acconto';
  assert (select pass_type from public.members where id = anna) = 'Prova 5 viaggi DOMENICA + Prova 5 viaggi JOLLY',
         'riassunto pass_type sbagliato';
  assert (select trips_total from public.trip_passes where member_id = anna) = 10, 'le gite di due abbonamenti non si sommano';
  assert (select passes from public.trip_passes where member_id = anna) = 2, 'trip_passes non conta gli abbonamenti';

  -- Ordine di scelta: il giorno scelto, poi JOLLY, poi il più vecchio.
  perform public.use_trip(anna, 'dddddddd-0000-0000-0000-000000000001', 'DOMENICA');
  assert (select trips_used from public.pass_status where member_id = anna and pass_type = 'Prova 5 viaggi DOMENICA') = 1,
         'la gita di domenica non è stata scalata dall''abbonamento della domenica';
  perform public.use_trip(anna, 'dddddddd-0000-0000-0000-000000000002', 'SABATO');
  assert (select trips_used from public.pass_status where member_id = anna and pass_type = 'Prova 5 viaggi JOLLY') = 1,
         'senza abbonamento del sabato la gita non è stata scalata dal jolly';
  perform public.use_trip(anna, 'dddddddd-0000-0000-0000-000000000002', 'SABATO');
  assert (select count(*) from public.trip_uses where member_id = anna) = 2, 'un ritentativo ha scalato una seconda gita';

  -- Chiamata della versione precedente (senza giorno): il più vecchio.
  perform public.use_trip(anna, 'dddddddd-0000-0000-0000-000000000003');
  assert (select trips_used from public.pass_status where member_id = anna and pass_type = 'Prova 5 viaggi DOMENICA') = 2,
         'senza giorno la gita non è stata scalata dall''abbonamento più vecchio';

  -- Finiti tutti e due, si rifiuta.
  for i in 1..7 loop
    perform public.use_trip(anna, gen_random_uuid(), 'DOMENICA');
  end loop;
  assert (select trips_left from public.trip_passes where member_id = anna) = 0, 'residuo sbagliato dopo dieci gite';
  begin
    perform public.use_trip(anna, gen_random_uuid(), 'DOMENICA');
    raise exception 'ASSERZIONE: scalata una gita da abbonamenti esauriti';
  exception when others then
    if sqlerrm like 'ASSERZIONE:%' then raise; end if;
    assert sqlerrm like 'Abbonamento esaurito%', 'errore inatteso: ' || sqlerrm;
  end;

  begin
    perform public.use_trip('aaaaaaaa-0000-0000-0000-000000000002', gen_random_uuid(), null);
    raise exception 'ASSERZIONE: scalata una gita a chi non ha abbonamenti';
  exception when others then
    if sqlerrm like 'ASSERZIONE:%' then raise; end if;
    assert sqlerrm like 'Questo socio non ha un abbonamento%', 'errore inatteso: ' || sqlerrm;
  end;

  -- Un abbonamento con gite non si toglie; uno senza sì, e il riassunto segue.
  -- Toglierli e rimetterli è del form Soci (permesso soci).
  perform set_config('test.uid', '44444444-4444-4444-4444-444444444444', false);
  begin
    delete from public.member_passes where member_id = anna and pass_type = 'Prova 5 viaggi JOLLY';
    raise exception 'ASSERZIONE: tolto un abbonamento con gite già fatte';
  exception when foreign_key_violation then null;
  end;
  insert into public.member_passes (member_id, pass_type) values (anna, 'Prova 5 viaggi DOMENICA');
  assert (select pass_type from public.members where id = anna) = 'Prova 5 viaggi DOMENICA ×2 + Prova 5 viaggi JOLLY',
         'riassunto pass_type sbagliato con due abbonamenti uguali';
  delete from public.member_passes
   where id = (select pass_id from public.pass_status
                where member_id = anna and trips_used = 0);
  assert (select count(*) from public.member_passes where member_id = anna) = 2, 'abbonamento senza gite non tolto';

  assert (select count from public.pass_counts where name = 'Prova 5 viaggi DOMENICA') = 1, 'Riepilogo: abbonamenti venduti sbagliati';

  -- Chi non ha un ruolo non vede e non vende abbonamenti.
  perform set_config('test.uid', '55555555-5555-5555-5555-555555555555', false);
  assert (select count(*) from public.member_passes) = 0, 'senza ruolo vede gli abbonamenti';
  begin
    perform public.add_pass(anna, 'Prova 5 viaggi JOLLY', false, gen_random_uuid());
    raise exception 'ASSERZIONE: senza ruolo ha venduto un abbonamento';
  exception when others then
    if sqlerrm like 'ASSERZIONE:%' then raise; end if;
  end;
end $$;

-- Togliere dalla stagione un socio tesserato per sbaglio: solo il superadmin,
-- e non se paga per dei familiari o ha gite segnate.
do $$
declare
  luca constant uuid := 'aaaaaaaa-0000-0000-0000-000000000002';
  elio constant uuid := 'aaaaaaaa-0000-0000-0000-000000000003';
  chi  text;
  gita uuid;
begin
  perform set_config('test.uid', '11111111-1111-1111-1111-111111111111', false);
  perform public.add_pass(luca, 'Prova 5 viaggi JOLLY', true, gen_random_uuid());
  perform public.use_trip(luca, 'eeeeeeee-0000-0000-0000-000000000001', 'JOLLY');
  perform set_config('test.uid', '44444444-4444-4444-4444-444444444444', false);
  update public.members set payer_id = luca where id = elio;

  foreach chi in array array['11111111-1111-1111-1111-111111111111',     -- gite
                             '33333333-3333-3333-3333-333333333333',     -- tesoriere
                             '44444444-4444-4444-4444-444444444444'] loop -- admin
    perform set_config('test.uid', chi, false);
    begin
      perform public.remove_from_season(luca);
      raise exception 'ASSERZIONE: un non superadmin ha tolto un socio dalla stagione';
    exception when others then
      if sqlerrm like 'ASSERZIONE:%' then raise; end if;
      assert sqlerrm like 'Solo il superadmin%', 'errore inatteso: ' || sqlerrm;
    end;
  end loop;

  perform set_config('test.uid', '22222222-2222-2222-2222-222222222222', false);
  begin
    perform public.remove_from_season(luca);
    raise exception 'ASSERZIONE: tolto un capofamiglia con familiari a carico';
  exception when others then
    if sqlerrm like 'ASSERZIONE:%' then raise; end if;
    assert sqlerrm like '%paga per dei familiari%', 'errore inatteso: ' || sqlerrm;
  end;

  update public.members set payer_id = null where id = elio;
  begin
    perform public.remove_from_season(luca);
    raise exception 'ASSERZIONE: tolto un socio con gite segnate';
  exception when others then
    if sqlerrm like 'ASSERZIONE:%' then raise; end if;
    assert sqlerrm like '%gite segnate%', 'errore inatteso: ' || sqlerrm;
  end;

  select id into gita from public.trip_uses where client_id = 'eeeeeeee-0000-0000-0000-000000000001';
  perform public.cancel_trip(gita);
  perform public.remove_from_season(luca);

  assert (select enrolled_at from public.members where id = luca) is null, 'il socio è ancora iscritto';
  assert (select card_type is null and card_number is null and total = 0 and paid = 0 and pass_type is null
            from public.members where id = luca), 'dati di stagione non azzerati';
  assert (select last_name from public.members where id = luca) = 'VERDI', 'l''anagrafica è stata toccata';
  assert (select tax_code from public.members where id = luca) = 'VRDLCU90A01F205Z', 'il codice fiscale è stato toccato';
  assert (select count(*) from public.member_passes where member_id = luca) = 0, 'abbonamenti rimasti';
  assert (select count(*) from public.insurance_search('verdi') where id = luca) = 0, 'ancora fra i tesserati della stagione';

  begin
    perform public.remove_from_season(luca);
    raise exception 'ASSERZIONE: tolto due volte';
  exception when others then
    if sqlerrm like 'ASSERZIONE:%' then raise; end if;
    assert sqlerrm like '%non è iscritto%', 'errore inatteso: ' || sqlerrm;
  end;
end $$;

-- La chiusura conta gli abbonamenti venduti e li toglie dalla stagione nuova.
do $$
declare chiusa timestamptz;
begin
  perform set_config('test.uid', '22222222-2222-2222-2222-222222222222', false);
  select season_closed into chiusa from public.close_season('CHIUDI STAGIONE');
  assert (select count from public.season_breakdown
           where season = chiusa and category = 'PASS' and label = 'Prova 5 viaggi DOMENICA') = 1,
         'chiusura: abbonamenti della domenica contati male';
  assert (select count from public.season_breakdown
           where season = chiusa and category = 'PASS' and label = 'Prova 5 viaggi JOLLY') = 1,
         'chiusura: abbonamenti jolly contati male';
  assert (select pass_type from public.members where id = 'aaaaaaaa-0000-0000-0000-000000000001') is null,
         'chiusura: riassunto abbonamento non azzerato';
  assert (select count(*) from public.trip_passes) = 0, 'chiusura: abbonamenti vecchi ancora nella stagione nuova';
  assert (select count(*) from public.member_passes) > 0, 'chiusura: gli abbonamenti venduti sono stati cancellati';
end $$;

reset role;
delete from public.season_breakdown;
delete from public.season_history;
SQL

echo "test ruoli: tutto a posto"
