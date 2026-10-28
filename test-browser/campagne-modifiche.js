// Social (social.html): campagne, i casi della review del 28/10.
// - Sponsor senza indirizzo: «Copia il sito» spento (copierebbe la frase dell'avviso).
// - Duplica una campagna: l'immagine dello sponsor resta (per le gite la foto si toglie).
// - Eliminare una campagna o uno sponsor: la domanda dice che le spese restano in Bilancio.
// - Immagine scelta e poi aperto un altro post prima che sia pronta: non finisce nell'altro.
const SPONSORS = [{ id: "S1", name: "AUTO", level: "Sponsor", url: null, handle: null, logo: null, logo_dark: null,
  color_dark: "#14202E", color_light: "#FFFFFF", color_accent: "#1C69D4", alcohol: false }];
const base = { subtitle: null, hook: null, stops: [], prices: [], show_price: true, facts: [], contacts: [], course: false,
  published_at: null, caption: null, card_stop: null, deadline: null, sponsor_id: null, story_title: null, cta: null,
  ad_text: null, ad_headline: null, ad_description: null, ad_cta: null };
const POSTS = [
  { ...base, id: "P1", kind: "sponsor", event_date: "2026-12-01", title: "Auto nuova", sponsor_id: "S1" },
  { ...base, id: "G1", kind: "gita", event_date: "2026-12-13", title: "Sestriere", hook: "Gita a" },
];
const PHOTO = "data:image/jpeg;base64,AAAA";
FAKE.risposta = (t, r) => {
  if (t === "social_events") return r.colonne === "photo" ? [{ photo: r.filtri.some((f) => f[2] === "P1") ? PHOTO : null }] : POSTS.map((p) => ({ ...p }));
  if (t === "sponsors") return SPONSORS;
  return [];
};
let step = "inizio";
window.addEventListener("load", () => setTimeout(async () => { try {
  const r = [];
  const test = (nome, passed, why) => r.push(`${nome}=${passed ? "ok" : `NO(${why})`}`);
  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const question = () => document.querySelector("dialog.finestra-domanda[open]");
  const cancel = () => question()?.querySelector("[data-no]")?.click();

  step = "sito"; await doOpen(posts.find((p) => p.id === "P1"));
  await wait(200);
  test("copiaSitoSpento", document.querySelector('[data-copia="sitoInserzione"]').disabled
    && !document.querySelector('[data-copia="parametriInserzione"]').disabled, "pulsanti «Copia» sbagliati senza indirizzo");

  step = "elimina"; el("btnElimina").click();
  await wait(100);
  test("eliminaCampagna", /restano in Bilancio/.test(question()?.textContent || ""), (question()?.textContent || "nessuna domanda").replace(/\s+/g, " ").trim().slice(0, 80));
  cancel();
  el("sScegli").value = "S1";
  askDeleteSponsor();
  await wait(100);
  test("eliminaSponsor", /restano in Bilancio/.test(question()?.textContent || ""), (question()?.textContent || "nessuna domanda").replace(/\s+/g, " ").trim().slice(0, 80));
  cancel();
  await wait(100);

  step = "duplica"; duplicate();
  await wait(200);
  test("duplicaImmagine", picture === PHOTO && !isOpen.id, `foto ${String(picture).slice(0, 20)}, id ${isOpen.id}`);

  step = "fotoTardi"; savedOne = signature();
  let finish;
  const realShrink = shrinkImage;
  window.shrinkImage = () => new Promise((ok) => { finish = ok; });
  const dt = new DataTransfer();
  dt.items.add(new File([new Blob(["x"])], "a.jpg", { type: "image/jpeg" }));
  el("fFoto").files = dt.files;
  el("fFoto").dispatchEvent(new Event("change", { bubbles: true }));
  window.shrinkImage = realShrink;
  await doOpen(posts.find((p) => p.id === "G1"));
  await wait(100);
  finish("data:image/jpeg;base64,BBBB");
  await wait(100);
  test("fotoNelPostGiusto", picture !== "data:image/jpeg;base64,BBBB" && !modified(), `foto ${String(picture).slice(0, 30)}`);
  document.title = "RISULTATO " + r.join(" ");
} catch (e) { document.title = `RISULTATO eccezione=NO(${step}: ${String(e?.message || e).slice(0, 120)} ${String(e?.stack || "").split("\n")[1]?.trim().slice(0, 80)})`; } }, 400));
