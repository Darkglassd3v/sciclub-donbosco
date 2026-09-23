#!/usr/bin/env bash
#
# Prova ruoli, RLS e trigger di schema.sql su un Postgres usa-e-getta.
#
#   ./supabase/test_ruoli.sh
#
# Serve docker. Il container viene creato e distrutto ad ogni esecuzione.
#
# Perché esiste: le policy di profiles si chiamano fra loro (has_role legge
# profiles, e la policy di profiles chiama has_role). Provare le funzioni come
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

psql_ <<'SQL'
-- Dati di prova -------------------------------------------------------------
insert into public.prices (category, name, price, min_role) values
  ('ABBONAMENTO', 'PROVA 10 VIAGGI SABATO', 200, 'utente'),
  ('TESSERA', 'PROVA TESSERA ORDINARIA', 35, 'utente'),
  ('TESSERA', 'PROVA TESSERA DIRETTIVO', 0, 'admin')
on conflict (category, name) do update set min_role = excluded.min_role;

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'utente@test'),
  ('22222222-2222-2222-2222-222222222222', 'super@test'),
  ('33333333-3333-3333-3333-333333333333', 'kiosk@test'),
  ('44444444-4444-4444-4444-444444444444', 'admin@test'),
  ('55555555-5555-5555-5555-555555555555', 'ospite@test');

-- Il trigger on_auth_user_created ha creato le righe profiles al posto nostro.
do $$ begin
  assert (select count(*) from public.profiles) = 5, 'il trigger non ha creato i profiles';
  assert (select role from public.profiles where email = 'utente@test') = 'ospite',
         'il ruolo di partenza non è ospite';
end $$;

update public.profiles set role = 'superadmin' where email = 'super@test';
update public.profiles set role = 'kiosk'      where email = 'kiosk@test';
update public.profiles set role = 'admin'      where email = 'admin@test';
update public.profiles set role = 'utente'     where email = 'utente@test';
-- ospite@test resta com'è nato: è il caso di chi si registra da solo.

insert into public.members (id, last_name, first_name, enrolled_at)
values ('99999999-9999-9999-9999-999999999999', 'ROSSI', 'MARIO', now());

-- Da qui in giù si prova come utente normale, con la RLS accesa -------------
set role authenticated;

-- Gerarchia ospite < kiosk < utente < admin < superadmin, letta sotto RLS: se
-- current_role() torna a essere security invoker, qui va in ricorsione.
do $$
declare
  atteso boolean;
begin
  perform set_config('test.uid', '55555555-5555-5555-5555-555555555555', false);
  assert not public.has_role('kiosk'), 'ospite non deve poter fare niente';
  perform set_config('test.uid', '33333333-3333-3333-3333-333333333333', false);
  assert public.has_role('kiosk') and not public.has_role('utente'), 'kiosk sbagliato';
  perform set_config('test.uid', '11111111-1111-1111-1111-111111111111', false);
  assert public.has_role('utente') and not public.has_role('admin'), 'utente sbagliato';
  perform set_config('test.uid', '44444444-4444-4444-4444-444444444444', false);
  assert public.has_role('admin') and not public.has_role('superadmin'), 'admin sbagliato';
  perform set_config('test.uid', '22222222-2222-2222-2222-222222222222', false);
  assert public.has_role('superadmin'), 'superadmin sbagliato';
  perform set_config('test.uid', '', false);
  assert not public.has_role('kiosk'), 'senza profilo deve sempre dire di no';
end $$;

-- profiles: ognuno vede la propria riga, il superadmin le vede tutte.
do $$ begin
  perform set_config('test.uid', '11111111-1111-1111-1111-111111111111', false);
  assert (select count(*) from public.profiles) = 1, 'un utente vede righe profiles non sue';
  perform set_config('test.uid', '22222222-2222-2222-2222-222222222222', false);
  assert (select count(*) from public.profiles) = 5, 'il superadmin non vede tutti i profiles';
end $$;

-- Un account appena registrato non deve vedere niente: è tutta la ragione per
-- cui il ruolo di partenza è 'ospite' e non 'utente'. La chiave anon sta in
-- chiaro in config.js, quindi registrarsi da soli lo può fare chiunque.
do $$ begin
  perform set_config('test.uid', '55555555-5555-5555-5555-555555555555', false);
  assert (select count(*) from public.members) = 0, 'un ospite vede i soci';
  assert (select count(*) from public.kiosk_search(array['rossi', 'mario'])) = 0, 'un ospite usa la ricerca kiosk';
  assert (select count(*) from public.prices) = 0, 'un ospite vede il listino';
  assert (select count(*) from public.profiles) = 1, 'un ospite vede profili non suoi';
end $$;

-- Solo il superadmin cambia i ruoli altrui.
do $$
declare quante int;
begin
  perform set_config('test.uid', '11111111-1111-1111-1111-111111111111', false);
  with x as (update public.profiles set role = 'superadmin' where email = 'kiosk@test' returning 1)
  select count(*) into quante from x;
  assert quante = 0, 'un utente ha potuto cambiare il ruolo di un altro';

  perform set_config('test.uid', '22222222-2222-2222-2222-222222222222', false);
  with x as (update public.profiles set role = 'kiosk' where email = 'kiosk@test' returning 1)
  select count(*) into quante from x;
  assert quante = 1, 'il superadmin non ha potuto cambiare un ruolo';
end $$;

-- Il kiosk non vede members, ma trova sé stesso con nome e cognome interi.
-- Le regole della pagina valgono anche chiamando l'API a mano: con una
-- parola sola, con le prime lettere o con i jolly del like non esce niente.
do $$ begin
  perform set_config('test.uid', '33333333-3333-3333-3333-333333333333', false);
  assert (select count(*) from public.members) = 0, 'il kiosk vede la tabella members';
  assert (select count(*) from public.kiosk_search(array['rossi', 'mario'])) = 1, 'il kiosk non trova il socio';
  assert (select count(*) from public.kiosk_search(array['MARIO', 'Rossi'])) = 1, 'la ricerca kiosk distingue le maiuscole';
  assert (select count(*) from public.kiosk_search(array['rossi'])) = 0, 'il kiosk cerca con una parola sola';
  assert (select count(*) from public.kiosk_search(array['rossi', 'rossi'])) = 0, 'il kiosk aggira le due parole ripetendone una';
  assert (select count(*) from public.kiosk_search(array['ros', 'mar'])) = 0, 'il kiosk cerca per prefisso';
  assert (select count(*) from public.kiosk_search(array['%', '%'])) = 0, 'il kiosk usa i jolly del like';
  assert (select count(*) from public.kiosk_search(array['r_ssi', 'mario'])) = 0, 'il kiosk usa il jolly _';
  assert (select count(*) from public.kiosk_search(null)) = 0, 'il kiosk cerca senza parole';
end $$;

-- Il listino lo scrive solo il superadmin.
do $$
declare quante int;
begin
  perform set_config('test.uid', '44444444-4444-4444-4444-444444444444', false);
  with x as (update public.prices set price = 999 where name = 'PROVA 10 VIAGGI SABATO' returning 1)
  select count(*) into quante from x;
  assert quante = 0, 'un admin ha potuto modificare il listino';
end $$;

-- Trigger check_card_type_role: il filtro min_role non è solo lato pagina.
do $$ begin
  perform set_config('test.uid', '11111111-1111-1111-1111-111111111111', false);

  update public.members set card_type = 'PROVA TESSERA ORDINARIA', pass_type = 'PROVA 10 VIAGGI SABATO'
   where id = '99999999-9999-9999-9999-999999999999';
  assert (select card_type from public.members where id = '99999999-9999-9999-9999-999999999999')
         = 'PROVA TESSERA ORDINARIA', 'un utente non ha potuto assegnare una tessera normale';

  begin
    update public.members set card_type = 'PROVA TESSERA DIRETTIVO'
     where id = '99999999-9999-9999-9999-999999999999';
    raise exception 'ASSERZIONE: un utente ha potuto assegnare una tessera riservata';
  exception when others then
    if sqlerrm like 'ASSERZIONE:%' then raise; end if;
  end;

  begin
    insert into public.members (last_name, first_name, card_type)
    values ('VERDI', 'LUIGI', 'PROVA TESSERA DIRETTIVO');
    raise exception 'ASSERZIONE: un utente ha potuto iscrivere un socio con una tessera riservata';
  exception when others then
    if sqlerrm like 'ASSERZIONE:%' then raise; end if;
  end;

  -- Salvare un altro campo non deve inciampare nel controllo.
  update public.members set phone = '333' where id = '99999999-9999-9999-9999-999999999999';

  -- Basta admin: la tessera del direttivo la vede e la assegna il direttivo.
  perform set_config('test.uid', '44444444-4444-4444-4444-444444444444', false);
  update public.members set card_type = 'PROVA TESSERA DIRETTIVO'
   where id = '99999999-9999-9999-9999-999999999999';
  assert (select card_type from public.members where id = '99999999-9999-9999-9999-999999999999')
         = 'PROVA TESSERA DIRETTIVO', 'un admin non ha potuto assegnare la tessera riservata';
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

-- Amministrazione è solo del superadmin: un admin non scrive lo storico,
-- quindi close_season() gli fallisce prima di azzerare qualunque cosa.
do $$ begin
  perform set_config('test.uid', '44444444-4444-4444-4444-444444444444', false);
  begin
    insert into public.season_history (season, members, total, collected, outstanding)
    values ('2001-09-01', 1, 0, 0, 0);
    raise exception 'ASSERZIONE: un admin ha potuto scrivere lo storico stagioni';
  exception when others then
    if sqlerrm like 'ASSERZIONE:%' then raise; end if;
  end;
  assert (select count(*) from public.season_history) = 0, 'un admin legge lo storico stagioni';
end $$;

-- Bilancio (ledger_entries, season_accounts): solo admin in su. L'admin
-- scrive per primo, così "utente non vede niente" non passa per tabella vuota.
do $$
declare quante int;
begin
  perform set_config('test.uid', '44444444-4444-4444-4444-444444444444', false);
  insert into public.ledger_entries (kind, category, quantity, unit_price)
  values ('USCITA', 'PROVA PULLMAN', 2, 150);
  assert (select amount from public.ledger_entries where category = 'PROVA PULLMAN') = 300,
         'un admin non legge il movimento appena inserito';
  insert into public.season_accounts (season, bank_opening) values ('2001-09-01', 1000);
  assert (select count(*) from public.season_accounts) = 1, 'un admin non legge il saldo iniziale';
end $$;

do $$
declare
  chi text;
  quante int;
begin
  foreach chi in array array['11111111-1111-1111-1111-111111111111',   -- utente
                             '55555555-5555-5555-5555-555555555555'] loop -- ospite
    perform set_config('test.uid', chi, false);
    assert (select count(*) from public.ledger_entries) = 0, 'un non admin legge i movimenti';
    assert (select count(*) from public.season_accounts) = 0, 'un non admin legge il saldo iniziale';

    with x as (delete from public.ledger_entries returning 1) select count(*) into quante from x;
    assert quante = 0, 'un non admin ha cancellato un movimento';

    begin
      insert into public.ledger_entries (kind, category, quantity, unit_price)
      values ('ENTRATA', 'PROVA ABUSIVA', 1, 10);
      raise exception 'ASSERZIONE: un non admin ha inserito un movimento';
    exception when others then
      if sqlerrm like 'ASSERZIONE:%' then raise; end if;
    end;

    begin
      insert into public.season_accounts (season, bank_opening) values ('2002-09-01', 1);
      raise exception 'ASSERZIONE: un non admin ha scritto il saldo iniziale';
    exception when others then
      if sqlerrm like 'ASSERZIONE:%' then raise; end if;
    end;
  end loop;

  -- L'admin cancella il suo movimento: il database torna com'era.
  perform set_config('test.uid', '44444444-4444-4444-4444-444444444444', false);
  with x as (delete from public.ledger_entries where category = 'PROVA PULLMAN' returning 1)
  select count(*) into quante from x;
  assert quante = 1, 'un admin non ha potuto cancellare un movimento';
  assert (select count(*) from public.ledger_entries) = 0, 'movimenti rimasti dopo la pulizia';
end $$;

-- Rimozione dal pannello Utenti: la fa solo il superadmin, e chi resta senza
-- riga profiles resta senza accessi, anche se il suo account Auth esiste
-- ancora (cancellarlo davvero vorrebbe la service_role).
do $$
declare quante int;
begin
  perform set_config('test.uid', '44444444-4444-4444-4444-444444444444', false);
  with x as (delete from public.profiles where email = 'kiosk@test' returning 1)
  select count(*) into quante from x;
  assert quante = 0, 'un admin ha potuto rimuovere un utente';

  perform set_config('test.uid', '22222222-2222-2222-2222-222222222222', false);
  with x as (delete from public.profiles where email = 'kiosk@test' returning 1)
  select count(*) into quante from x;
  assert quante = 1, 'il superadmin non ha potuto rimuovere un utente';

  perform set_config('test.uid', '33333333-3333-3333-3333-333333333333', false);
  assert not public.has_role('kiosk'), 'un utente rimosso ha ancora un ruolo';
  assert (select count(*) from public.kiosk_search(array['rossi', 'mario'])) = 0,
         'un utente rimosso usa ancora la ricerca kiosk';
end $$;

reset role;
-- season_accounts non ha policy di delete: la riga di prova la toglie postgres.
delete from public.season_accounts where season = '2001-09-01';
SQL

# Una gita segnata prima della 2.4, quando l'abbonamento era una colonna del
# socio: dopo lo schema deve essere attaccata all'abbonamento spostato.
# Il trigger legge le gite da "N viaggi" scritto minuscolo, come nel listino
# vero: la voce di prova in maiuscolo va completata a mano.
psql_ -c "update public.prices set trips = 10, day = 'SABATO' where name = 'PROVA 10 VIAGGI SABATO';"
psql_ -c "insert into public.trip_uses (member_id) values ('99999999-9999-9999-9999-999999999999');"

# Lo script rieseguito non deve rimettere in gioco chi è stato rimosso: il
# backfill una tantum vede ancora il suo account in auth.users, e senza il
# "where not exists" gli ridarebbe una riga profiles per giunta da admin.
# Due volte: lo spostamento degli abbonamenti non deve raddoppiarli.
psql_ < "$QUI/schema.sql" >/dev/null
psql_ < "$QUI/schema.sql" >/dev/null

psql_ <<'SQL'
do $$ begin
  assert (select count(*) from public.profiles where email = 'kiosk@test') = 0,
         'schema.sql ha resuscitato un utente rimosso';
  assert (select role from public.profiles where email = 'ospite@test') = 'ospite',
         'schema.sql ha promosso ad admin un account già esistente';

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
insert into auth.users (id, email) values ('66666666-6666-6666-6666-666666666666', 'assic@test');
update public.profiles set role = 'assicurazione' where email = 'assic@test';

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

-- Il kiosk era stato rimosso qui sopra: l'account Auth c'è ancora, la riga
-- profiles no. Il superadmin lo vede fra gli account senza accesso e glielo
-- ridà; nessun altro può farlo.
do $$ begin
  perform set_config('test.uid', '44444444-4444-4444-4444-444444444444', false);   -- admin
  assert (select count(*) from public.accounts_without_role()) = 0, 'un admin vede gli account rimossi';
  begin
    perform public.restore_account('33333333-3333-3333-3333-333333333333', 'superadmin');
    raise exception 'ASSERZIONE: un admin ha ridato l''accesso a un account';
  exception when others then
    if sqlerrm like 'ASSERZIONE:%' then raise; end if;
  end;

  perform set_config('test.uid', '22222222-2222-2222-2222-222222222222', false);
  assert (select count(*) from public.accounts_without_role() where email = 'kiosk@test') = 1,
         'il superadmin non vede l''account rimosso';
  begin
    perform public.restore_account('33333333-3333-3333-3333-333333333333', 'capo');
    raise exception 'ASSERZIONE: ridato l''accesso con un ruolo inesistente';
  exception when others then
    if sqlerrm like 'ASSERZIONE:%' then raise; end if;
  end;
  perform public.restore_account('33333333-3333-3333-3333-333333333333', 'kiosk');
  assert (select count(*) from public.accounts_without_role()) = 0, 'account ancora senza accesso dopo il ripristino';
  assert (select role from public.profiles where email = 'kiosk@test') = 'kiosk', 'ruolo sbagliato dopo il ripristino';
  -- Ripetuto su un account che ha già un ruolo: lo cambia, non si rompe.
  perform public.restore_account('33333333-3333-3333-3333-333333333333', 'kiosk');

  perform set_config('test.uid', '33333333-3333-3333-3333-333333333333', false);
  assert public.has_role('kiosk'), 'l''account ripristinato non ha il suo ruolo';
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
  assert (select count(*) from auth.users where email = 'utente@test') = 1, 'eliminato l''account sbagliato';
end $$;
set role authenticated;

-- Numero tessera: il successivo del più alto numerico, e mai due uguali.
do $$ begin
  perform set_config('test.uid', '11111111-1111-1111-1111-111111111111', false);
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
  assert public.has_role('assicurazione'), 'assicurazione non riconosciuta';
  assert not public.has_role('kiosk'), 'assicurazione usa i permessi del kiosk';
  assert not public.has_role('utente'), 'assicurazione ha i permessi di un utente';
  assert (select count(*) from public.members) = 0, 'assicurazione legge la tabella members';
  assert (select count(*) from public.member_passes) = 0, 'assicurazione legge gli abbonamenti';
  assert (select count(*) from public.prices) = 0, 'assicurazione legge il listino';
  assert (select count(*) from public.trip_uses) = 0, 'assicurazione legge le gite';
  assert (select count(*) from public.kiosk_search(array['bianchi', 'anna'])) = 0, 'assicurazione usa la ricerca del tablet';

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
  perform set_config('test.uid', '11111111-1111-1111-1111-111111111111', false);
  assert (select tax_code from public.members where id = 'aaaaaaaa-0000-0000-0000-000000000001') = 'BNCNNA80A41F205X',
         'il codice fiscale non è stato scritto ripulito';
  assert (select policy_number from public.members where id = 'aaaaaaaa-0000-0000-0000-000000000001') = 'POL-2',
         'la polizza non è stata scritta';
  assert (select total from public.members where id = 'aaaaaaaa-0000-0000-0000-000000000001') = 35,
         'set_insurance ha toccato altro';
  -- Un utente fa quello che fa l'assicurazione.
  assert (select count(*) from public.insurance_members()) = 1, 'un utente non vede l''elenco da assicurare';
end $$;

do $$
declare chi text;
begin
  foreach chi in array array['55555555-5555-5555-5555-555555555555',     -- ospite
                             '33333333-3333-3333-3333-333333333333'] loop -- kiosk
    perform set_config('test.uid', chi, false);
    assert (select count(*) from public.insurance_members()) = 0, 'ospite o kiosk vedono i tesserati';
    assert (select count(*) from public.insurance_search('bianchi')) = 0, 'ospite o kiosk cercano i tesserati';
    begin
      perform public.set_insurance('aaaaaaaa-0000-0000-0000-000000000002', 'X', 'POL-ABUSIVA');
      raise exception 'ASSERZIONE: ospite o kiosk hanno scritto una polizza';
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

  -- L'ospite non vede e non vende abbonamenti.
  perform set_config('test.uid', '55555555-5555-5555-5555-555555555555', false);
  assert (select count(*) from public.member_passes) = 0, 'un ospite vede gli abbonamenti';
  begin
    perform public.add_pass(anna, 'Prova 5 viaggi JOLLY', false, gen_random_uuid());
    raise exception 'ASSERZIONE: un ospite ha venduto un abbonamento';
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
  update public.members set payer_id = luca where id = elio;

  foreach chi in array array['11111111-1111-1111-1111-111111111111',     -- utente
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
