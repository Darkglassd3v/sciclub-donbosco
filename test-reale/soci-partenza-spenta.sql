-- Un socio iscritto con una partenza del sabato, e quella partenza spenta in Impostazioni.
with m as (select id, saturday_departure from public.members
            where enrolled_at is not null and saturday_departure is not null
            order by last_name, first_name limit 1),
     spenta as (update public.departures set active = false
                 where day = 'SABATO' and place = split_part((select saturday_departure from m), ',', 1) returning place)
select json_build_object('id', (select id from m), 'saturday_departure', (select saturday_departure from m),
                         'spenta', (select place from spenta));
