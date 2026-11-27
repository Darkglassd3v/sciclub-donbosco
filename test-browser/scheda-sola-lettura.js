// Soci (index.html): chi non ha «Registra soci» (permesso soci) ma vede l'Elenco soci apre la scheda in sola
// lettura (27/11/2026). Prima la pagina lo rimandava alla sua pagina d'arrivo: il tesoriere toccava un nome
// nell'Elenco, vedeva comparire la scheda e veniva buttato fuori.
// - Arrivato con index.html?socio=<id>, resta sulla pagina e vede i dati del socio.
// - Tutti i campi sono spenti; «Salva», «Elimina» e «Rimuovi dalla stagione» non si possono usare.
// - Un avviso dice che la scheda è in sola lettura.
// - Non chiede al database il prossimo numero tessera e non scrive niente.
{
  const ID = "11111111-2222-3333-4444-555555555555";
  // Prima degli script della pagina: l'indirizzo è quello che arriva dall'Elenco soci.
  history.replaceState(null, "", `${location.pathname}?socio=${ID}`);
  FAKE.rpc.my_access = [{ email: "tesoriere@sciclub.it", role: "tesoriere", real_role: "tesoriere", change_password: false,
    permissions: ["elenco", "riepilogo"] }];
  const writes = [];
  const rpcs = [];
  FAKE.risposta = (t, r) => {
    if (r.filtri.some((f) => ["insert", "update", "upsert", "delete"].includes(f[0]))) writes.push(t);
    if (t === "members" && r.filtri.some((f) => f[0] === "eq" && f[1] === "id" && f[2] === ID))
      return [{ id: ID, last_name: "ROSSI", first_name: "MARIO", updated_at: "1", enrolled_at: "2026-10-01", paid: 0, total: 0 }];
    return [];
  };
  FAKE.errore = (t) => { if (t.startsWith("rpc:") && t !== "rpc:my_access") rpcs.push(t.slice(4)); return null; };
  window.addEventListener("load", () => setTimeout(() => {
    const r = [];
    const test = (nome, passed, why) => r.push(`${nome}=${passed ? "ok" : `NO(${why})`}`);
    const usable = (id) => { const b = el(id); return Boolean(b && !b.hidden && !b.disabled && !b.closest("[hidden], fieldset:disabled")); };
    test("restaSullaPagina", /index\.html$/.test(location.pathname) || /prova-/.test(location.pathname), location.href);
    test("datiDelSocio", el("f_cognome")?.value === "ROSSI", `cognome «${el("f_cognome")?.value}»`);
    test("campiSpenti", el("f_cognome")?.disabled || Boolean(el("f_cognome")?.closest("fieldset:disabled")), "cognome modificabile");
    test("senzaSalva", !usable("btnSalva"), "Salva usabile");
    test("senzaElimina", !usable("btnElimina") && !usable("btnTogli"), "Elimina o Rimuovi usabili");
    const notice = el("avvisoSolaLettura");
    test("avviso", Boolean(notice && !notice.hidden && /sola lettura/i.test(notice.textContent)), notice ? notice.textContent : "manca");
    test("senzaNumeroTessera", !rpcs.includes("next_card_number"), rpcs.join(","));
    test("nienteScritto", writes.length === 0, writes.join(","));
    document.title = "RISULTATO " + r.join(" ");
  }, 1500));
}
