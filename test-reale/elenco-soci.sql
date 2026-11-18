-- Tesserati della stagione (card_holder(), come la pagina), il primo numero di tessera libero, quanti sono a carico
-- di un altro e quanti capofamiglia di un tesserato non sono tesserati loro.
with t as (select m.id, m.card_number, m.payer_id from public.members m where m.enrolled_at is not null and public.card_holder(m)),
     n as (select card_number::int v from t where card_number ~ '^[0-9]+$'),
     liberi as (select g from generate_series(1, (select coalesce(max(v), 0) from n)) g where g not in (select v from n))
select json_build_object('soci', (select count(*) from t), 'liberi', (select min(g)::text from liberi),
  'familiari', (select count(*) from t where payer_id is not null),
  'capiFuori', (select count(distinct payer_id) from t where payer_id is not null and payer_id not in (select id from t)));
