-- Iscrizioni di metà novembre: 400 soci in più iscritti (capofamiglia di sé stessi).
with t as (update public.members set enrolled_at = now()
            where id in (select id from public.members where enrolled_at is null and payer_id is null order by id limit 400)
            returning id)
select json_build_object('aggiunti', (select count(*) from t),
                         -- La vista nella stessa istruzione vede i dati di prima: più quelli aggiunti.
                         'nuclei', (select count(*) from public.households where enrolled_at is not null) + (select count(*) from t));
