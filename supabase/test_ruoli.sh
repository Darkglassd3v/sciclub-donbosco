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

CONTENITORE=scdb-test-ruoli
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
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

-- auth.users e auth.identities ridotte all'osso, ma con tutte le colonne che
-- crea_utente() scrive davvero: senza, la funzione non sarebbe provabile qui.
create table if not exists auth.users (
  instance_id            uuid,
  id                     uuid primary key default gen_random_uuid(),
  aud                    text,
  role                   text,
  email                  text unique,
  encrypted_password     text,
  email_confirmed_at     timestamptz,
  created_at             timestamptz,
  updated_at             timestamptz,
  raw_app_meta_data      jsonb,
  raw_user_meta_data     jsonb,
  confirmation_token     text,
  recovery_token         text,
  email_change           text,
  email_change_token_new text
);

create table if not exists auth.identities (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  provider_id     text not null,
  identity_data   jsonb not null,
  provider        text not null,
  last_sign_in_at timestamptz,
  created_at      timestamptz,
  updated_at      timestamptz,
  unique (provider, provider_id)
);
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

-- Solo perché il test possa controllare com'è venuto l'account: in Supabase
-- authenticated su auth.users non ha nessun permesso, ed è giusto così. La
-- creazione passa comunque da crea_utente(), che è security definer.
grant select on auth.users, auth.identities to authenticated;
grant usage on schema extensions to authenticated;
SQL

psql_ <<'SQL'
-- Dati di prova -------------------------------------------------------------
insert into public.prices (category, name, price, min_role) values
  ('ABBONAMENTO', 'PROVA 10 VIAGGI SABATO', 200, 'utente'),
  ('ABBONAMENTO', 'PROVA 10 VIAGGI DIRETTIVO', 0, 'superadmin')
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
  assert (select count(*) from public.members_kiosk_search) = 0, 'un ospite vede la vista kiosk';
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

-- Il kiosk non vede members, ma vede la vista a campi ridotti.
do $$ begin
  perform set_config('test.uid', '33333333-3333-3333-3333-333333333333', false);
  assert (select count(*) from public.members) = 0, 'il kiosk vede la tabella members';
  assert (select count(*) from public.members_kiosk_search) = 1, 'il kiosk non vede la vista ridotta';
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

-- Trigger check_pass_type_role: il filtro min_role non è solo lato pagina.
do $$ begin
  perform set_config('test.uid', '11111111-1111-1111-1111-111111111111', false);

  update public.members set pass_type = 'PROVA 10 VIAGGI SABATO'
   where id = '99999999-9999-9999-9999-999999999999';
  assert (select pass_type from public.members where id = '99999999-9999-9999-9999-999999999999')
         = 'PROVA 10 VIAGGI SABATO', 'un utente non ha potuto assegnare un abbonamento normale';

  begin
    update public.members set pass_type = 'PROVA 10 VIAGGI DIRETTIVO'
     where id = '99999999-9999-9999-9999-999999999999';
    raise exception 'ASSERZIONE: un utente ha potuto assegnare una voce riservata';
  exception when others then
    if sqlerrm like 'ASSERZIONE:%' then raise; end if;
  end;

  begin
    insert into public.members (last_name, first_name, pass_type)
    values ('VERDI', 'LUIGI', 'PROVA 10 VIAGGI DIRETTIVO');
    raise exception 'ASSERZIONE: un utente ha potuto iscrivere un socio con una voce riservata';
  exception when others then
    if sqlerrm like 'ASSERZIONE:%' then raise; end if;
  end;

  -- Salvare un altro campo non deve inciampare nel controllo.
  update public.members set phone = '333' where id = '99999999-9999-9999-9999-999999999999';

  perform set_config('test.uid', '22222222-2222-2222-2222-222222222222', false);
  update public.members set pass_type = 'PROVA 10 VIAGGI DIRETTIVO'
   where id = '99999999-9999-9999-9999-999999999999';
  assert (select pass_type from public.members where id = '99999999-9999-9999-9999-999999999999')
         = 'PROVA 10 VIAGGI DIRETTIVO', 'il superadmin non ha potuto assegnare la voce riservata';
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
  assert (select count(*) from public.members_kiosk_search) = 0,
         'un utente rimosso vede ancora la vista kiosk';
end $$;

-- crea_utente(): l'account nasce completo e pronto al login, senza che parta
-- nessuna mail e senza aprire le registrazioni a chiunque abbia la chiave anon.
do $$
declare
  creato uuid;
begin
  -- Ogni rifiuto va verificato sul messaggio, non sul solo fatto che qualcosa
  -- sia andato storto: con un "when others" muto basta un'email scritta male
  -- per far passare il controllo sbagliato e credere di essere protetti.

  -- Chi non è superadmin non lo può fare, anche se la funzione è definer.
  perform set_config('test.uid', '44444444-4444-4444-4444-444444444444', false);
  begin
    perform public.crea_utente('intruso@test.it', 'unapasswordlunga', 'superadmin');
    raise exception 'ASSERZIONE: un admin ha potuto creare un account';
  exception when others then
    if sqlerrm like 'ASSERZIONE:%' then raise; end if;
    assert sqlerrm like '%superadmin%', 'rifiutato, ma non per il ruolo: ' || sqlerrm;
  end;

  perform set_config('test.uid', '22222222-2222-2222-2222-222222222222', false);
  creato := public.crea_utente('  NUOVO@Test.it ', 'donbosco26!', 'admin');

  assert (select email from auth.users where id = creato) = 'nuovo@test.it',
         'email non normalizzata a minuscole senza spazi';
  assert (select email_confirmed_at from auth.users where id = creato) is not null,
         'account creato senza conferma: non potrebbe entrare';
  assert (select encrypted_password from auth.users where id = creato)
         = extensions.crypt('donbosco26!', (select encrypted_password from auth.users where id = creato)),
         'la password non verifica';
  assert (select count(*) from auth.identities where user_id = creato and provider = 'email') = 1,
         'manca la riga in auth.identities: il login con password verrebbe rifiutato';
  assert (select role from public.profiles where user_id = creato) = 'admin',
         'il ruolo scelto non è stato applicato';

  -- Stessa email due volte, ruolo inventato, password troppo corta: tutti no.
  begin
    perform public.crea_utente('nuovo@test.it', 'donbosco26!', 'utente');
    raise exception 'ASSERZIONE: ha accettato due account con la stessa email';
  exception when others then
    if sqlerrm like 'ASSERZIONE:%' then raise; end if;
    assert sqlerrm like '%Esiste già%', 'rifiutato, ma non per il doppione: ' || sqlerrm;
  end;

  begin
    perform public.crea_utente('altro@test.it', 'donbosco26!', 'padrone');
    raise exception 'ASSERZIONE: ha accettato un ruolo inventato';
  exception when others then
    if sqlerrm like 'ASSERZIONE:%' then raise; end if;
    assert sqlerrm like '%Ruolo non valido%', 'rifiutato, ma non per il ruolo: ' || sqlerrm;
  end;

  begin
    perform public.crea_utente('altro@test.it', 'corta', 'utente');
    raise exception 'ASSERZIONE: ha accettato una password di cinque caratteri';
  exception when others then
    if sqlerrm like 'ASSERZIONE:%' then raise; end if;
    assert sqlerrm like '%almeno 8 caratteri%', 'rifiutato, ma non per la password: ' || sqlerrm;
  end;

  begin
    perform public.crea_utente('senza-chiocciola', 'donbosco26!', 'utente');
    raise exception 'ASSERZIONE: ha accettato un indirizzo che non è una email';
  exception when others then
    if sqlerrm like 'ASSERZIONE:%' then raise; end if;
    assert sqlerrm like '%Email non valida%', 'rifiutato, ma non per l''email: ' || sqlerrm;
  end;

  -- Il nuovo account entra e vede quello che il suo ruolo permette.
  perform set_config('test.uid', creato::text, false);
  assert public.has_role('admin') and not public.has_role('superadmin'),
         'il nuovo account non ha i permessi del ruolo che gli è stato dato';
end $$;

reset role;
SQL

# Lo script rieseguito non deve rimettere in gioco chi è stato rimosso: il
# backfill una tantum vede ancora il suo account in auth.users, e senza il
# "where not exists" gli ridarebbe una riga profiles per giunta da admin.
psql_ < "$QUI/schema.sql" >/dev/null

psql_ <<'SQL'
do $$ begin
  assert (select count(*) from public.profiles where email = 'kiosk@test') = 0,
         'schema.sql ha resuscitato un utente rimosso';
  assert (select role from public.profiles where email = 'ospite@test') = 'ospite',
         'schema.sql ha promosso ad admin un account già esistente';
end $$;
SQL

echo "test ruoli: tutto a posto"
