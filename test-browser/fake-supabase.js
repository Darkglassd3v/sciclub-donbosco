// Client Supabase finto, al posto di supabase-js nelle prove in Chrome (esegui.sh).
// Ogni richiesta risponde con window.FINTO.risposta(tabella, richiesta) dopo
// window.FINTO.ritardo(tabella, richiesta) millisecondi: la prova decide cosa
// torna e in che ordine arriva, che è proprio quello che il database vero non
// garantisce. richiesta.filtri sono le chiamate fatte ([nome, ...argomenti]),
// richiesta.colonne quelle chieste con select().
window.FINTO = {
  ritardo: () => 20,
  risposta: () => [],
  rpc: {
    my_access: [{ email: "prova@sciclub.it", role: "superadmin", real_role: "superadmin", change_password: false,
      permissions: ["soci", "pagamenti", "riepilogo", "storico", "bilancio", "cerca", "gite", "stampe", "polizze", "social", "gestione"] }],
    next_card_number: 100,
  },
};

function Richiesta(tabella) {
  this.tabella = tabella;
  this.filtri = [];
  this.colonne = "*";
  this.singola = false;
}
for (const nome of ["eq", "neq", "or", "ilike", "like", "not", "in", "is", "gte", "lte", "order", "limit",
                    "insert", "update", "upsert", "delete"]) {
  Richiesta.prototype[nome] = function (...argomenti) { this.filtri.push([nome, ...argomenti]); return this; };
}
Richiesta.prototype.select = function (colonne) { if (colonne) this.colonne = colonne; return this; };
Richiesta.prototype.single = function () { this.singola = true; return this; };
// Come supabase-js: la richiesta parte quando la si aspetta (await o then).
Richiesta.prototype.then = function (ok, ko) {
  return new Promise((fine) => setTimeout(() => {
    let data = window.FINTO.risposta(this.tabella, this);
    if (this.singola) data = Array.isArray(data) ? data[0] : data;
    fine({ data, error: null });
  }, window.FINTO.ritardo(this.tabella, this))).then(ok, ko);
};

window.supabase = {
  createClient: () => ({
    auth: {
      getSession: async () => ({ data: { session: { user: { id: "prova" } } } }),
      onAuthStateChange() {},
      signOut: async () => ({}),
    },
    from: (tabella) => new Richiesta(tabella),
    rpc: async (nome) => ({ data: window.FINTO.rpc[nome] ?? null, error: null }),
    channel: () => ({ on() { return this; }, subscribe() { return this; } }),
    removeChannel() {},
  }),
};
