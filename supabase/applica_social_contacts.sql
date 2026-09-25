-- Solo la parte nuova di schema.sql (tabella social_contacts), da incollare
-- nell'SQL Editor di Supabase. Si può rilanciare: non tocca i dati.
begin;

-- Contatti per info e iscrizioni: nome e telefono, e se serve quando
-- chiamare ("dopo le 18"). Stanno in fondo a ogni post e story e nel testo da
-- incollare, nell'ordine di position. Si cambiano dalla pagina, riquadro
-- "Contatti nei post". Nessuna riga di partenza: rilanciare lo schema non deve
-- rimettere un contatto tolto, e i numeri finti non devono finire in un post.
-- Come i colori, non si salvano sul post: cambiarli cambia anche i post non
-- ancora pubblicati.
create table if not exists public.social_contacts (
  id       uuid primary key default gen_random_uuid(),
  position smallint not null default 0,
  name     text not null,
  phone    text not null,
  hours    text
);

alter table public.social_contacts drop constraint if exists social_contacts_filled;
alter table public.social_contacts add constraint social_contacts_filled
  check (btrim(name) <> '' and btrim(phone) <> '');

comment on table public.social_contacts is 'Contatti per info e iscrizioni nei post social: nome, telefono e orari facoltativi.';

alter table public.social_contacts enable row level security;
drop policy if exists social_contacts_all on public.social_contacts;
create policy social_contacts_all on public.social_contacts
  for all to authenticated using ((select public.can('social'))) with check ((select public.can('social')));
grant select, insert, update, delete on public.social_contacts to authenticated;

commit;
