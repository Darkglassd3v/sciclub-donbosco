-- Una lista BASE già mandata con 1200 soci: più delle 1000 righe che Supabase dà a richiesta.
with lista as (insert into public.insurance_lists (kind, number)
                 select 'BASE', coalesce(max(number), 0) + 1 from public.insurance_lists
                  where kind = 'BASE' and season = public.current_season()
               returning id, number),
     soci as (update public.members set insurance_list_id = (select id from lista)
               where id in (select id from public.members order by id limit 1200) returning id)
select json_build_object('id', (select id from lista), 'soci', (select count(*) from soci));
