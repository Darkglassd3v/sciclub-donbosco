-- Un cognome che c'è nella copia, per far partire una ricerca con risultati.
select json_build_object('cognome', (select last_name from public.members where enrolled_at is not null order by last_name limit 1));
