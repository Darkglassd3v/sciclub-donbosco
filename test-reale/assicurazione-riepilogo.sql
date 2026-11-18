-- I tesserati della stagione (card_holder(), come la pagina Elenco soci) divisi fra assicurati (in una lista
-- inviata), da assicurare (con un'assicurazione, non ancora in lista) e senza assicurazione.
with t as (select m.insurance_list_id, public.member_insurance(m) as tipo
             from public.members m where m.enrolled_at is not null and public.card_holder(m))
select json_build_object('tesserati', (select count(*) from t),
  'assicurati', (select count(*) from t where insurance_list_id is not null),
  'da_assicurare', (select count(*) from t where insurance_list_id is null and tipo is not null),
  'senza', (select count(*) from t where insurance_list_id is null and tipo is null));
