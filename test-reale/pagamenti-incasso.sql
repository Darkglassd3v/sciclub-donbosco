-- Due nuclei da incassare: A (c'è già) e B, un capofamiglia saldato a cui si toglie il versato.
with a as (select head_id from public.households
            where enrolled_at is not null and household_balance > 0 order by last_name limit 1),
     b as (select m.id from public.members m join public.households h on h.head_id = m.id
            where m.enrolled_at is not null and h.household_balance = 0 and h.dependents_count = 0 and m.total > 0
              and m.id <> (select head_id from a) order by m.last_name limit 1),
     u as (update public.members set paid = 0 where id = (select id from b) returning id)
select json_build_object('a', (select head_id from a), 'b', (select id from u));
