-- Le tessere rimesse in ordine in Impostazioni (colonna Ordine), come il 23/10 in
-- produzione: l'ordine della copia è un altro, così la prova vede se Soci lo segue.
with nuovo(name, pos) as (values ('TESSERA DIRETTIVO', 1), ('TESSERA SCONTATA - REALE MUTUA NEVE', 2),
                                 ('TESSERA SCONTATA - NO ASSICURAZIONE', 3), ('SOLO TESSERA - NO ASSICURAZIONE', 4),
                                 ('TESSERA ORDINARIA - REALE MUTUA NEVE', 5), ('TESSERA ORDINARIA - REALE TOTAL SPORT', 6)),
     fatto as (update public.prices p set position = n.pos from nuovo n
                where p.category = 'TESSERA' and p.name = n.name returning p.name, p.position)
select json_build_object('tessere', (select json_agg(name order by position) from fatto));
