// Social (social.html): un post aperto prima che arrivi la rubrica dei contatti.
// Quando la rubrica arriva il post si rifà con i suoi contatti spuntati, senza
// chiedere «modifiche non salvate» (non ce ne sono).
const POST = {
  id: "P1", kind: "gita", event_date: "2026-12-13", title: "Sestriere", subtitle: null, hook: "Gita a",
  stops: [["6:30", "Asti"]], prices: [[null, "€ 50"]], show_price: true, facts: [], contacts: ["C1"],
  course: false, published_at: null, caption: null, card_stop: null, deadline: null,
};

FAKE.risposta = (t, r) => {
  if (t === "social_events") return r.colonne === "photo" ? [{ photo: null }] : [{ ...POST }];
  if (t === "social_contacts") return [{ id: "C1", name: "Cesare", phone: "333 1234567", hours: null, is_default: true }];
  return [];
};
FAKE.ritardo = (t) => (t === "social_contacts" ? 800 : 20);

window.addEventListener("load", () => setTimeout(async () => {
  await doOpen(posts[0]);
  await new Promise((ok) => setTimeout(ok, 2000));
  const question = document.querySelector("dialog.finestra-domanda[open]");
  const tick = el("fContatti").querySelector("input:checked");
  document.title = `RISULTATO domanda=${question ? `NO(${question.textContent.trim().slice(0, 60)})` : "ok"}`
    + ` contatto=${tick && tick.value === "C1" ? "ok" : "NO(nessun contatto spuntato)"}`
    + ` modificato=${modified() ? "NO(risulta modificato)" : "ok"}`;
}, 200));
