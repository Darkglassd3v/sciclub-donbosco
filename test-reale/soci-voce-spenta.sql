-- Un socio iscritto con la tessera, e la sua tessera tolta dal listino (spenta):
-- succede quando una voce si disattiva a stagione cominciata.
with m as (select id, card_type, total from public.members
            where enrolled_at is not null and card_type is not null and not total_manual
            order by last_name, first_name limit 1),
     spenta as (update public.prices set active = false
                 where category = 'TESSERA' and name = (select card_type from m) returning name)
select json_build_object('id', (select id from m), 'card_type', (select card_type from m),
                         'total', (select total from m), 'spenta', (select name from spenta));
