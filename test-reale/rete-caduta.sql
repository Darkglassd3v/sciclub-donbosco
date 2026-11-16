-- La persona nuova della serata del 25/11: ruolo Social con il solo permesso «soci» (Gestione > Ruoli).
delete from public.role_grants where role = 'social';
insert into public.role_grants (role, permission) values ('social', 'soci');
select json_build_object('tessera', (select name from public.prices where category = 'TESSERA' and active and min_role = 'utente' order by name limit 1));
