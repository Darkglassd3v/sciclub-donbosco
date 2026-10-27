-- Il numero tessera più alto dato, di chi è, e il prossimo da dare (lo stesso che propone Soci).
select json_build_object('numero', card_number, 'cognome', last_name, 'prossima', public.next_card_number())
  from public.members where card_number ~ '^[0-9]{1,15}$' order by card_number::bigint desc limit 1;
