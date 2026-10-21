// Soci (index.html): le risposte in ritardo non mescolano schede e ricerche.
// - Si apre il socio A e subito B; gli abbonamenti di A arrivano per ultimi:
//   la scheda deve restare tutta di B.
// - Si scrive "RO" e poi "ROSSI MA"; la risposta di "RO" arriva per ultima:
//   l'elenco deve essere quello di "ROSSI MA", anche nella ricerca del pagante.
const SOCI = {
  A: { id: "A", last_name: "ALFA", first_name: "ANNA", updated_at: "1", enrolled_at: "2026-10-01", paid: 0, total: 0 },
  B: { id: "B", last_name: "BETA", first_name: "BRUNO", updated_at: "1", enrolled_at: "2026-10-01", paid: 0, total: 0 },
};
const valore = (r, colonna) => (r.filtri.find((f) => f[0] === "eq" && f[1] === colonna) || [])[2];
const ricerca = (r) => r.filtri.filter((f) => f[0] === "or").map((f) => f[1]).join(" ");
const eRicerca = (t, r) => t === "members" && !valore(r, "id") && !valore(r, "payer_id");

FINTO.risposta = (t, r) => {
  if (t === "members" && valore(r, "id")) return [SOCI[valore(r, "id")]];
  if (t === "members" && valore(r, "payer_id")) return [];
  if (t === "pass_status") {
    const chi = valore(r, "member_id");
    return [{ pass_id: "p" + chi, pass_type: "ABBONAMENTO DI " + chi, trips_used: 0, trips_total: 5, trips_left: 5, price: 100, day: "DOMENICA" }];
  }
  if (eRicerca(t, r)) {
    return ricerca(r).includes("%MA%") ? [{ id: "B", last_name: "ROSSI", first_name: "MARIO" }]
                                       : [{ id: "X", last_name: "ROMANO", first_name: "VECCHIO" }];
  }
  return [];
};
FINTO.ritardo = (t, r) => {
  if (t === "pass_status" && valore(r, "member_id") === "A") return 600;
  if (eRicerca(t, r)) return ricerca(r).includes("%MA%") ? 30 : 500;
  return 20;
};

const aspetta = (ms) => new Promise((ok) => setTimeout(ok, ms));
const esito = (vero, dettaglio) => (vero ? "ok" : `NO(${String(dettaglio).trim().replace(/\s+/g, " ")})`);

window.addEventListener("load", () => setTimeout(async () => {
  caricaSocio("A");
  setTimeout(() => caricaSocio("B"), 5);
  await aspetta(1500);
  const abbonamenti = el("elencoAbbonamenti").textContent;
  const scheda = el("f_id").value === "B" && socioAperto && socioAperto.id === "B"
    && abbonamenti.includes("DI B") && !abbonamenti.includes("DI A");

  const scrivi = async (campo) => {
    el(campo).value = "RO";
    el(campo).dispatchEvent(new Event("input"));
    await aspetta(10);
    el(campo).value = "ROSSI MA";
    el(campo).dispatchEvent(new Event("input"));
    await aspetta(1000);
  };
  await scrivi("searchInput");
  const soci = el("searchResults").textContent;
  await scrivi("f_payerDisplay");
  const paganti = el("payerResults").textContent;
  const giusto = (lista) => lista.includes("MARIO") && !lista.includes("VECCHIO");

  document.title = `RISULTATO scheda=${esito(scheda, `${el("f_id").value},${socioAperto && socioAperto.id},${abbonamenti}`)}`
    + ` ricerca=${esito(giusto(soci), soci)} pagante=${esito(giusto(paganti), paganti)}`;
}, 500));
