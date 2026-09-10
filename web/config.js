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
// Compilare dopo aver creato il progetto su supabase.com:
//   Project Settings > API > Project URL / anon public key

window.SUPABASE_CONFIG = {
  url: "https://IL-TUO-PROGETTO.supabase.co",
  anonKey: "LA-TUA-CHIAVE-ANON",
};
