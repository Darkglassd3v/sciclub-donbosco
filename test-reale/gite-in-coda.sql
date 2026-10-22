-- Un tesserato senza abbonamento e una voce di abbonamento a gite del listino.
with g as (select id, last_name, first_name from public.members m
            where enrolled_at is not null and public.card_holder(m) and (pass_type is null or pass_type = 'NO')
            order by last_name, id limit 1)
select json_build_object('id', (select id from g), 'cognome', (select last_name from g), 'nome', (select first_name from g),
  'voce', (select name from public.prices where category = 'ABBONAMENTO' and trips is not null and active order by name limit 1));
