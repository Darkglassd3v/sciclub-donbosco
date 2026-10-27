// Social (social.html): il prezzo di un post è in euro interi o con i 50 centesimi.
// - «€ 12,30» non si salva: la riga del prezzo ha il bordo rosso.
// - «€ 12,50» e «€ 1.200» (migliaia) si salvano.
const POST = {
  id: "P1", kind: "gita", event_date: "2026-12-13", title: "Sestriere", subtitle: null, hook: "Gita a",
  stops: [["6:30", "Asti"]], prices: [[null, "€ 12,30"]], show_price: true, facts: [], contacts: [],
  course: false, published_at: null, caption: null, card_stop: null, deadline: null,
};
const TEXTS = [];
FAKE.risposta = (t, r) => {
  if (t === "social_events" && r.filtri.some((f) => f[0] === "update")) { TEXTS.push(r.filtri.find((f) => f[0] === "update")[1]); return { ...POST }; }
  if (t === "social_events") return r.colonne === "photo" ? [{ photo: null }] : [{ ...POST }];
  return [];
};

window.addEventListener("load", () => setTimeout(async () => {
  const r = [];
  const test = (nome, real, why) => r.push(`${nome}=${real ? "ok" : `NO(${why})`}`);
  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  await doOpen(posts[0]);
  await wait(300);
  const priceValue = () => [...el("fPrezzi").querySelectorAll("input.input")][1];

  await save();
  await wait(300);
  test("centesimiNo", priceValue().classList.contains("campo-errore") && !TEXTS.length,
    `bordato ${priceValue().classList.contains("campo-errore")}, salvati ${TEXTS.length}`);

  for (const [nome, theValue] of [["cinquantaSi", "€ 12,50"], ["migliaiaSi", "€ 1.200"]]) {
    priceValue().value = theValue;
    priceValue().dispatchEvent(new Event("input", { bubbles: true }));
    const before = TEXTS.length;
    await save();
    await wait(300);
    test(nome, TEXTS.length === before + 1, `«${theValue}» non salvato`);
  }
  document.title = "RISULTATO " + r.join(" ");
}, 200));
