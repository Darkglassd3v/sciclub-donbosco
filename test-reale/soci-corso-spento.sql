-- Un socio iscritto con un corso, e il corso tolto dal listino (spento).
with m as (select id, course_type, total from public.members
            where enrolled_at is not null and course_type is not null and upper(course_type) <> 'NO' and not total_manual
            order by last_name, first_name limit 1),
     spento as (update public.prices set active = false
                 where category = 'CORSO' and name = (select course_type from m) returning name)
select json_build_object('id', (select id from m), 'course_type', (select course_type from m),
                         'total', (select total from m), 'spento', (select name from spento));
