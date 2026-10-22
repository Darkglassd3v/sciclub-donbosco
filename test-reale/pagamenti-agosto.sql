-- Un capofamiglia con un saldo da chiudere, iscritto il 20 agosto: per il database
-- è nella stagione aperta (enrolled_at pieno), anche se il calendario dice l'anno prima.
with h as (select head_id from public.households
            where enrolled_at is not null and household_balance <> 0 order by last_name limit 1),
     m as (update public.members set enrolled_at = make_timestamptz(extract(year from public.current_season())::int, 8, 20, 10, 0, 0)
            where id = (select head_id from h) returning id, last_name)
select json_build_object('id', (select id from m), 'cognome', (select last_name from m));
