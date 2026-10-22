-- Un'entrata del Bilancio della stagione dopo: il Riepilogo della stagione aperta non la conta.
with e as (insert into public.ledger_entries (season, entry_date, kind, category, description, quantity, unit_price)
           values (public.current_season() + interval '1 year', current_date, 'ENTRATA', 'PROVA ALTRA STAGIONE', 'prova', 1, 999)
           returning category)
select json_build_object('voce', (select category from e));
