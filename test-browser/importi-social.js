// Social (social.html): il prezzo di un post è in euro interi o con i 50 centesimi.
// - «€ 12,30» non si salva: la riga del prezzo ha il bordo rosso.
// - «€ 12,50» e «€ 1.200» (migliaia) si salvano.
const POST = {
  id: "P1", kind: "gita", event_date: "2026-12-13", title: "Sestriere", subtitle: null, hook: "Gita a",
  stops: [["6:30", "Asti"]], prices: [[null, "€ 12,30"]], show_price: true, facts: [], contacts: [],
  course: false, published_at: null, caption: null, card_stop: null, deadline: null,
};
const SCRITTI = [];
FINTO.risposta = (t, r) => {
  if (t === "social_events" && r.filtri.some((f) => f[0] === "update")) { SCRITTI.push(r.filtri.find((f) => f[0] === "update")[1]); return { ...POST }; }
  if (t === "social_events") return r.colonne === "photo" ? [{ photo: null }] : [{ ...POST }];
  return [];
};

window.addEventListener("load", () => setTimeout(async () => {
  const r = [];
  const prova = (nome, vero, perche) => r.push(`${nome}=${vero ? "ok" : `NO(${perche})`}`);
  const aspetta = (ms) => new Promise((ok) => setTimeout(ok, ms));
  await apri(posts[0]);
  await aspetta(300);
  const prezzo = () => [...el("fPrezzi").querySelectorAll("input.input")][1];

  await salva();
  await aspetta(300);
  prova("centesimiNo", prezzo().classList.contains("campo-errore") && !SCRITTI.length,
    `bordato ${prezzo().classList.contains("campo-errore")}, salvati ${SCRITTI.length}`);

  for (const [nome, valore] of [["cinquantaSi", "€ 12,50"], ["migliaiaSi", "€ 1.200"]]) {
    prezzo().value = valore;
    prezzo().dispatchEvent(new Event("input", { bubbles: true }));
    const prima = SCRITTI.length;
    await salva();
    await aspetta(300);
    prova(nome, SCRITTI.length === prima + 1, `«${valore}» non salvato`);
  }
  document.title = "RISULTATO " + r.join(" ");
}, 200));
