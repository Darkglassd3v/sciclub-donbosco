-- Un socio iscritto con un abbonamento a gite (0 gite) e il totale che lo comprende.
with s as (select id from public.members m
            where enrolled_at is not null and public.card_holder(m) and not total_manual and (pass_type is null or pass_type = 'NO')
            order by last_name desc, id limit 1),
     v as (select name, price from public.prices where category = 'ABBONAMENTO' and trips is not null and active order by name limit 1),
     a as (insert into public.member_passes (member_id, pass_type, client_id)
           select (select id from s), (select name from v), gen_random_uuid() returning id),
     t as (update public.members set total = total + (select price from v) where id = (select id from s) returning total)
select json_build_object('id', (select id from s), 'pass', (select id from a), 'total', (select total from t));
