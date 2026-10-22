-- Dopo il ripristino della copia (avvia.sh): i permessi che Supabase dà da sé
-- (il dump è senza privilegi: la sicurezza la fa la RLS, come in produzione) e
-- gli account delle prove, uno per ruolo, senza cambio password in sospeso.
grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema public to authenticated, service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;
grant execute on all functions in schema public to authenticated, service_role;

insert into auth.users (id, email) values
  ('70000000-0000-0000-0000-000000000001', 'prova-superadmin@locale'),
  ('70000000-0000-0000-0000-000000000002', 'prova-admin@locale'),
  ('70000000-0000-0000-0000-000000000003', 'prova-tesoriere@locale'),
  ('70000000-0000-0000-0000-000000000004', 'prova-assicurazione@locale'),
  ('70000000-0000-0000-0000-000000000005', 'prova-gite@locale'),
  ('70000000-0000-0000-0000-000000000006', 'prova-social@locale');
insert into public.profiles (user_id, email, role) values
  ('70000000-0000-0000-0000-000000000001', 'prova-superadmin@locale', 'superadmin'),
  ('70000000-0000-0000-0000-000000000002', 'prova-admin@locale', 'admin'),
  ('70000000-0000-0000-0000-000000000003', 'prova-tesoriere@locale', 'tesoriere'),
  ('70000000-0000-0000-0000-000000000004', 'prova-assicurazione@locale', 'assicurazione'),
  ('70000000-0000-0000-0000-000000000005', 'prova-gite@locale', 'gite'),
  ('70000000-0000-0000-0000-000000000006', 'prova-social@locale', 'social');
delete from public.pending_password_changes where user_id::text like '70000000-%';

notify pgrst, 'reload schema';
