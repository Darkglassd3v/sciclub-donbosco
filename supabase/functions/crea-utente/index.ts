// Crea un account Supabase Auth con email e password, senza mandare niente.
//
// È il "Add user > Create new user" della dashboard, non il "Send invitation":
// auth.admin.createUser() con email_confirm non spedisce nessun messaggio e
// segna la mail come già confermata, quindi la persona entra subito. Quella
// che manda l'invito è un'altra funzione (inviteUserByEmail), che qui non
// serve e non si usa.
//
// Perché una Edge Function e non la pagina: l'Admin API vuole la chiave
// service_role, che scavalca tutte le regole di sicurezza del database. La
// documentazione Supabase è esplicita — "should only be called on a server and
// you should never expose your service_role key in the browser" — e web/ è un
// sito statico pubblico, dove qualunque chiave è leggibile da chiunque. Qui la
// chiave resta sul server e non arriva mai al browser.
//
// Da pubblicare una volta sola (vedi docs/ACCOUNT.md):
//   supabase functions deploy crea-utente
//
// SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY le mette Supabase da sé
// nell'ambiente della funzione: non vanno impostate né committate.
//
// Dalla 2.5 crea solo l'account, senza ruolo (cioè senza accesso): il ruolo
// glielo dà subito dopo la pagina Utenti con restore_account(). Così un ruolo
// nuovo non richiede di ripubblicare la funzione. Il campo `ruolo` che le
// pagine mandano ancora (serviva alle versioni fino alla 2.4) viene ignorato.

import { createClient } from "jsr:@supabase/supabase-js@2";

// La pagina sta su un dominio diverso dal progetto Supabase, quindi il browser
// manda prima una OPTIONS: senza queste intestazioni la chiamata vera non parte.
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function risposta(corpo: unknown, stato = 200) {
  return new Response(JSON.stringify(corpo), {
    status: stato,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (richiesta) => {
  if (richiesta.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (richiesta.method !== "POST") return risposta({ errore: "Metodo non ammesso." }, 405);

  const amministratore = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  try {
    // Chi sta chiamando. La funzione gira con la service_role, quindi il
    // controllo su chi ha diritto di creare account va fatto qui a mano: senza,
    // basterebbe un utente qualsiasi loggato per fabbricarsi un superadmin.
    const autorizzazione = richiesta.headers.get("Authorization") ?? "";
    const gettone = autorizzazione.replace(/^Bearer\s+/i, "");
    if (!gettone) return risposta({ errore: "Sessione mancante: rifai il login." }, 401);

    const { data: chiamante, error: erroreUtente } = await amministratore.auth.getUser(gettone);
    if (erroreUtente || !chiamante?.user) {
      return risposta({ errore: "Sessione non valida: rifai il login." }, 401);
    }

    const { data: profilo } = await amministratore
      .from("profiles").select("role").eq("user_id", chiamante.user.id).maybeSingle();
    if (!profilo || profilo.role !== "superadmin") {
      return risposta({ errore: "Solo un superadmin può creare account." }, 403);
    }

    const corpo = await richiesta.json().catch(() => ({}));
    const email = String(corpo.email ?? "").trim().toLowerCase();
    const password = String(corpo.password ?? "");

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return risposta({ errore: `Email non valida: ${email}` }, 400);
    }
    if (password.length < 8) {
      return risposta({ errore: "La password deve avere almeno 8 caratteri." }, 400);
    }

    // email_confirm: la mail risulta confermata senza che nessuno debba
    // cliccare niente, ed è ciò che rende l'account utilizzabile subito.
    const { data: creato, error: erroreCreazione } = await amministratore.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (erroreCreazione) {
      const gia = /already|exist|registered/i.test(erroreCreazione.message);
      return risposta(
        { errore: gia ? "Esiste già un account con questa email." : erroreCreazione.message },
        gia ? 409 : 400,
      );
    }

    return risposta({ user_id: creato.user.id, email });
  } catch (errore) {
    return risposta({ errore: String((errore as Error)?.message ?? errore) }, 500);
  }
});
