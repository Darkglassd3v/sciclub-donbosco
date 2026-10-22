-- Un tesserato senza abbonamento iscritto il 21 agosto (per il database è nella
-- stagione aperta), e un altro tesserato con un abbonamento e due gite: una di
-- questa stagione, una della stagione dopo (non va contata).
with g as (select id, last_name from public.members m
            where enrolled_at is not null and public.card_holder(m) and (pass_type is null or pass_type = 'NO')
            order by last_name, id limit 1),
     mg as (update public.members set enrolled_at = make_timestamptz(extract(year from public.current_season())::int, 8, 21, 10, 0, 0)
             where id = (select id from g) returning id, last_name),
     p as (select id from public.members m
            where enrolled_at is not null and public.card_holder(m) and id <> (select id from g)
            order by last_name desc, id limit 1),
     abb as (insert into public.member_passes (member_id, pass_type, client_id)
             select (select id from p), name, gen_random_uuid() from public.prices
              where category = 'ABBONAMENTO' and trips is not null and active order by name limit 1
             returning id, member_id),
     gite as (insert into public.trip_uses (member_id, pass_id, season, client_id)
              select member_id, id, s, gen_random_uuid() from abb,
                     unnest(array[public.current_season(), public.current_season() + interval '1 year']) s
              returning season)
select json_build_object('idSenza', (select id from mg), 'cognome', (select last_name from mg),
                         'idPass', (select member_id from abb), 'gite', (select count(*) from gite where season = public.current_season()));
