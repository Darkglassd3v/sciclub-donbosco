// La scritta «Caricamento…», regola di tutto il sito (richiesta del 3/11).
// - Finché i dati non arrivano, l'elenco dei post e i riassunti delle Impostazioni dicono «Caricamento…»: prima
//   dicevano «Nessun post da fare» e «Nessuno sponsor», e sembrava che fosse sparito tutto.
// - Arrivati i dati, la scritta lascia il posto all'elenco.
// - Ogni richiesta al database che dura più di 400 ms mostra l'etichetta «Caricamento…»; una più breve no.
const POSTS = [{ id: "P1", kind: "gita", event_date: "2027-01-17", title: "Sestriere", subtitle: null, hook: null, stops: [["6:30", "Asti"]],
  prices: [], show_price: true, facts: [], contacts: [], course: false, published_at: null, caption: null, card_stop: null, deadline: null, sponsor_id: null }];
history.replaceState(null, "", "#impostazioni");
FAKE.ritardo = (t) => (["social_events", "sponsors", "social_contacts", "trip_days"].includes(t) ? 1500 : 20);
FAKE.risposta = (t, r) => {
  if (t === "social_events") return r.colonne === "photo" ? [{ photo: null }] : POSTS;
  if (t === "sponsors") return [{ id: "S1", name: "Sponsor Prova", level: "Oro", color_dark: "#14202E", color_light: "#FFFFFF", color_accent: "#FCCF02" }];
  if (t === "social_contacts") return [{ id: "C1", name: "Cesare", phone: "333", hours: null, is_default: true, position: 0 }];
  return [];
};
const r = [];
window.addEventListener("load", () => setTimeout(async () => { try {
  const test = (nome, passed, why) => r.push(`${nome}=${passed ? "ok" : `NO(${why})`}`);
  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const text = (id) => el(id).textContent.trim();
  const waiting = () => /Caricamento…/.test(text("elencoPost")) && !/Nessun/.test(text("elencoPost"));

  // I dati non sono ancora arrivati (la pagina è aperta da un istante).
  test("sponsorInAttesa", /Caricamento…/.test(text("riassuntoSponsor")) && !/Nessuno/.test(text("riassuntoSponsor")), text("riassuntoSponsor"));
  test("contattiInAttesa", /Caricamento…/.test(text("riassuntoContatti")) && !/vuota/.test(text("riassuntoContatti")), text("riassuntoContatti"));
  test("giorniInAttesa", /Caricamento…/.test(text("riassuntoGiorni")), text("riassuntoGiorni"));
  history.replaceState(null, "", "#post");
  window.dispatchEvent(new HashChangeEvent("hashchange"));
  test("postInAttesa", waiting(), text("elencoPost"));

  await wait(2200);
  test("postArrivati", /Sestriere/.test(text("elencoPost")) && !/Caricamento/.test(text("elencoPost")), text("elencoPost"));
  test("sponsorArrivati", /Sponsor Prova/.test(text("riassuntoSponsor")) && !/Caricamento/.test(text("riassuntoSponsor")), text("riassuntoSponsor"));

  // L'etichetta: la fetch finta risponde dopo i millisecondi scritti nell'indirizzo.
  window.fetch = (u) => new Promise((ok) => setTimeout(() => ok(new Response("{}")), Number(String(u).split("=")[1])));
  const label = () => el("caricamento") && !el("caricamento").hidden;
  const slow = fetchWithWaiting("x?ms=1000");
  await wait(150);
  test("etichettaNonSubito", !label(), "visibile dopo 150 ms");
  await wait(450);
  test("etichetta", label() && text("caricamento") === "Caricamento…" && el("caricamento").getAttribute("role") === "status", el("caricamento")?.outerHTML);
  await slow;
  await wait(50);
  test("etichettaSparita", !label(), "ancora visibile");
  const fast = fetchWithWaiting("x?ms=100");
  await wait(600);
  await fast;
  test("rapidaSenzaEtichetta", !label(), "visibile per una richiesta breve");
  document.title = "RISULTATO " + r.join(" ");
} catch (e) { document.title = `RISULTATO ${r.join(" ")} eccezione=NO(${String(e?.message || e).slice(0, 160)})`; } }, 300));
