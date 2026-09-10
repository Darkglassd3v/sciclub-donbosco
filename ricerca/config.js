// Stessa configurazione di web/config.js: il sito di ricerca punta allo stesso
// progetto Supabase. Non sono segreti (la chiave anon è pensata per il browser
// e senza login le policy RLS non lasciano leggere nulla), ma restano due file
// perché i due siti si pubblicano separatamente.
window.SUPABASE_CONFIG = {
  url: "https://rkuuthpauuohilbzmdnn.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrdXV0aHBhdXVvaGlsYnptZG5uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwMzQwNzEsImV4cCI6MjEwNDYxMDA3MX0.XhZAfLiuc4xssSac6wsEMdMXPZlSHlxZae0NjaQ4Ffc",
};
