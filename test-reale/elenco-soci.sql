-- Tesserati della stagione (card_holder(), come la pagina) e il primo numero di tessera libero.
with t as (select m.card_number from public.members m where m.enrolled_at is not null and public.card_holder(m)),
     n as (select card_number::int v from t where card_number ~ '^[0-9]+$'),
     liberi as (select g from generate_series(1, (select coalesce(max(v), 0) from n)) g where g not in (select v from n))
select json_build_object('soci', (select count(*) from t), 'liberi', (select min(g)::text from liberi));
