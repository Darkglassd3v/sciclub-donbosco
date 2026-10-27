// Soci (index.html): le risposte in ritardo non mescolano schede e ricerche.
// - Si apre il socio A e subito B; gli abbonamenti di A arrivano per ultimi:
//   la scheda deve restare tutta di B.
// - Si scrive "RO" e poi "ROSSI MA"; la risposta di "RO" arriva per ultima:
//   l'elenco deve essere quello di "ROSSI MA", anche nella ricerca del pagante.
const MEMBERS = {
  A: { id: "A", last_name: "ALFA", first_name: "ANNA", updated_at: "1", enrolled_at: "2026-10-01", paid: 0, total: 0 },
  B: { id: "B", last_name: "BETA", first_name: "BRUNO", updated_at: "1", enrolled_at: "2026-10-01", paid: 0, total: 0 },
};
const theValue = (r, column) => (r.filtri.find((f) => f[0] === "eq" && f[1] === column) || [])[2];
const searchText = (r) => r.filtri.filter((f) => f[0] === "or").map((f) => f[1]).join(" ");
const isSearch = (t, r) => t === "members" && !theValue(r, "id") && !theValue(r, "payer_id");

FAKE.risposta = (t, r) => {
  if (t === "members" && theValue(r, "id")) return [MEMBERS[theValue(r, "id")]];
  if (t === "members" && theValue(r, "payer_id")) return [];
  if (t === "pass_status") {
    const chi = theValue(r, "member_id");
    return [{ pass_id: "p" + chi, pass_type: "ABBONAMENTO DI " + chi, trips_used: 0, trips_total: 5, trips_left: 5, price: 100, day: "DOMENICA" }];
  }
  if (isSearch(t, r)) {
    return searchText(r).includes("%MA%") ? [{ id: "B", last_name: "ROSSI", first_name: "MARIO" }]
                                       : [{ id: "X", last_name: "ROMANO", first_name: "VECCHIO" }];
  }
  return [];
};
FAKE.ritardo = (t, r) => {
  if (t === "pass_status" && theValue(r, "member_id") === "A") return 600;
  if (isSearch(t, r)) return searchText(r).includes("%MA%") ? 30 : 500;
  return 20;
};

const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
const outcome = (real, detail) => (real ? "ok" : `NO(${String(detail).trim().replace(/\s+/g, " ")})`);

window.addEventListener("load", () => setTimeout(async () => {
  loadMember("A");
  setTimeout(() => loadMember("B"), 5);
  await wait(1500);
  const passList = el("elencoAbbonamenti").textContent;
  const recordCard = el("f_id").value === "B" && openedMember && openedMember.id === "B"
    && passList.includes("DI B") && !passList.includes("DI A");

  const write = async (field) => {
    el(field).value = "RO";
    el(field).dispatchEvent(new Event("input"));
    await wait(10);
    el(field).value = "ROSSI MA";
    el(field).dispatchEvent(new Event("input"));
    await wait(1000);
  };
  await write("searchInput");
  const members = el("searchResults").textContent;
  await write("f_payerDisplay");
  const payers = el("payerResults").textContent;
  const right = (listItems) => listItems.includes("MARIO") && !listItems.includes("VECCHIO");

  document.title = `RISULTATO scheda=${outcome(recordCard, `${el("f_id").value},${openedMember && openedMember.id},${passList}`)}`
    + ` ricerca=${outcome(right(members), members)} pagante=${outcome(right(payers), payers)}`;
}, 500));
