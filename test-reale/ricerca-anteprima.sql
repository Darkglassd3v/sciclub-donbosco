-- Quanti soci trova «bianco matt» (ogni parola in cognome, nome o codice fiscale) e quanti hanno la data di nascita.
select json_build_object('trovati', count(*), 'conData', count(birth_date))
  from (select birth_date from public.members
         where (last_name ilike '%bianco%' or first_name ilike '%bianco%' or tax_code ilike '%bianco%')
           and (last_name ilike '%matt%' or first_name ilike '%matt%' or tax_code ilike '%matt%')
         limit 8) x;
