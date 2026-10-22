-- Una tessera gratuita (prezzo 0) che qualcuno ha: nel Riepilogo il prezzo è € 0,00, non «—».
select json_build_object('gratis', (select c.name from public.card_counts c join public.prices p on p.category = 'TESSERA' and p.name = c.name
                                     where public.card_price(p) = 0 and c.count > 0 limit 1));
