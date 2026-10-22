// Client Supabase finto, al posto di supabase-js nelle prove in Chrome (esegui.sh).
// Ogni richiesta risponde con window.FINTO.risposta(tabella, richiesta) dopo
// window.FINTO.ritardo(tabella, richiesta) millisecondi: la prova decide cosa
// torna e in che ordine arriva, che è proprio quello che il database vero non
// garantisce. richiesta.filtri sono le chiamate fatte ([nome, ...argomenti]),
// richiesta.colonne quelle chieste con select(). Le funzioni del database
// (rpc) sono richieste su "rpc:<nome>": rispondono con FINTO.rpc[nome] se c'è,
// se no con FINTO.risposta; i parametri sono in richiesta.parametri.
// FINTO.errore(tabella, richiesta), se dà qualcosa, è l'errore della risposta.
// L'accesso: FINTO.email è l'email della sessione (null: senza); le chiamate di
// auth (signInWithPassword, updateUser, signOut) finiscono in FINTO.auth. Le
// callback del realtime (channel().on()) stanno in FINTO.realtime: la prova le chiama.
window.FINTO = {
  ritardo: () => 20,
  risposta: () => [],
  rpc: {
    my_access: [{ email: "prova@sciclub.it", role: "superadmin", real_role: "superadmin", change_password: false,
      permissions: ["soci", "pagamenti", "riepilogo", "storico", "bilancio", "cerca", "gite", "stampe", "polizze", "social", "gestione"] }],
    next_card_number: 100,
  },
  email: "prova@sciclub.it",
  auth: [],
  realtime: [],
};

function Richiesta(tabella) {
  this.tabella = tabella;
  this.filtri = [];
  this.colonne = "*";
  this.singola = false;
}
for (const nome of ["eq", "neq", "or", "ilike", "like", "not", "in", "is", "gte", "lte", "order", "limit", "range",
                    "insert", "update", "upsert", "delete"]) {
  Richiesta.prototype[nome] = function (...argomenti) { this.filtri.push([nome, ...argomenti]); return this; };
}
Richiesta.prototype.select = function (colonne) { if (colonne) this.colonne = colonne; return this; };
Richiesta.prototype.single = function () { this.singola = true; return this; };
// Come supabase-js: la richiesta parte quando la si aspetta (await o then).
Richiesta.prototype.then = function (ok, ko) {
  return new Promise((fine) => setTimeout(() => {
    const rpc = this.tabella.startsWith("rpc:") ? this.tabella.slice(4) : null;
    let data = rpc && rpc in window.FINTO.rpc ? window.FINTO.rpc[rpc] : window.FINTO.risposta(this.tabella, this);
    if (this.singola) data = Array.isArray(data) ? data[0] : data;
    const error = window.FINTO.errore?.(this.tabella, this) || null;
    fine({ data: error ? null : data, error });
  }, window.FINTO.ritardo(this.tabella, this))).then(ok, ko);
};

window.supabase = {
  createClient: () => ({
    auth: {
      getSession: async () => ({ data: { session: { user: { id: "prova", email: window.FINTO.email ?? undefined } } } }),
      onAuthStateChange() {},
      signOut: async (opzioni) => { window.FINTO.auth.push(["signOut", opzioni || {}]); return {}; },
      signInWithPassword: async (dati) => { window.FINTO.auth.push(["signIn", dati]); return { error: null }; },
      updateUser: async (dati) => { window.FINTO.auth.push(["updateUser", dati]); return { error: null }; },
    },
    from: (tabella) => new Richiesta(tabella),
    // Come supabase-js: una richiesta, con .range() per tutteLeRighe().
    rpc: (nome, parametri) => Object.assign(new Richiesta("rpc:" + nome), { parametri }),
    channel: () => ({ on(tipo, filtro, callback) { window.FINTO.realtime.push(callback); return this; }, subscribe() { return this; } }),
    removeChannel() {},
  }),
};
