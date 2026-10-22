-- Ambiente come su Supabase, prima di ripristinare la copia dello schema public
-- (avvia.sh): i ruoli che usa PostgREST, lo schema auth con auth.users (solo id
-- ed email, l'unico pezzo che le tabelle di public citano) e auth.uid() letta
-- dal token, come fa Supabase. pgcrypto nello schema extensions (reset_password).
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create role authenticator login noinherit password 'prova-locale';
grant anon, authenticated, service_role to authenticator;

create schema auth;
create table auth.users (
  id uuid primary key default gen_random_uuid(),
  email text,
  encrypted_password text,
  created_at timestamptz default now()
);
create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(coalesce(current_setting('request.jwt.claim.sub', true),
                         current_setting('request.jwt.claims', true)::jsonb ->> 'sub'), '')::uuid;
$$;
create or replace function auth.role() returns text language sql stable as $$
  select coalesce(current_setting('request.jwt.claim.role', true),
                  current_setting('request.jwt.claims', true)::jsonb ->> 'role');
$$;
grant usage on schema auth to anon, authenticated, service_role;
grant execute on all functions in schema auth to anon, authenticated, service_role;

create schema extensions;
create extension pgcrypto schema extensions;
grant usage on schema extensions to anon, authenticated, service_role;
