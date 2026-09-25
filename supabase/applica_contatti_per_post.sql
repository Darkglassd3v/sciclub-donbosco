-- Solo la parte nuova di schema.sql (contatti scelti per singolo post), da
-- incollare una volta nell'SQL Editor di Supabase.
begin;

alter table public.social_contacts add column if not exists is_default boolean not null default false;
comment on table public.social_contacts is 'Rubrica dei contatti per info e iscrizioni nei post social: nome, telefono e orari facoltativi.';

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

-- I contatti già in rubrica diventano quelli proposti nei post nuovi, e
-- finiscono sui post non ancora pubblicati che non ne hanno: fino a oggi
-- valevano per tutti i post.
update public.social_contacts set is_default = true
  where not exists (select 1 from public.social_contacts where is_default);
update public.social_events e
   set contacts = array(select c.id from public.social_contacts c order by c.position)
 where e.published_at is null and e.kind <> 'sponsor' and e.contacts = '{}';

commit;
