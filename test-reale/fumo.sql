-- Quello che Soci deve caricare: le voci attive del listino e le partenze attive.
select json_build_object(
  'voci', (select count(*) from public.prices where active),
  'partenze', (select count(*) from public.departures where active));
