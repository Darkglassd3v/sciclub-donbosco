-- Un cognome di un tesserato senza abbonamento, per una ricerca con risultati.
select json_build_object('cognome', (select last_name from public.members m
  where enrolled_at is not null and public.card_holder(m) and (pass_type is null or pass_type = 'NO') order by last_name limit 1));
