// Configurazione Supabase.
//
// Questi due valori NON sono segreti: la chiave "anon" è pensata per stare nel
// browser ed è visibile a chiunque apra il sorgente della pagina. La sicurezza
// vera è nelle policy RLS definite in supabase/schema.sql, che senza un utente
// autenticato non lasciano leggere né scrivere nulla.
//
// NON inserire qui la chiave "service_role": quella scavalca la RLS e va usata
// solo dalla dashboard Supabase o da script eseguiti fuori dal browser.
//
// Dove trovarli nella dashboard Supabase:
//   url     -> Project Settings > Data API > Project URL
//   anonKey -> Project Settings > API Keys > scheda "Legacy anon, service_role"
//
// Le nuove chiavi "sb_publishable_..." richiedono una versione di supabase-js
// più recente di quella caricata dalle pagine: restare sulla chiave anon JWT.

window.SUPABASE_CONFIG = {
  url: "https://rkuuthpauuohilbzmdnn.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrdXV0aHBhdXVvaGlsYnptZG5uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwMzQwNzEsImV4cCI6MjEwNDYxMDA3MX0.XhZAfLiuc4xssSac6wsEMdMXPZlSHlxZae0NjaQ4Ffc",
};
