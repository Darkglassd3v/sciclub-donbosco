// Social (social.html): il carosello (richiesta del 2/11).
// - Accanto a Post e Story, tre pagine 1080×1350: copertina, post con la linguetta «Scorri», finale «Seguici».
// - Il bollino della copertina si scrive nel post (carousel_badge), vuoto = «Novità»; si salva e si rilegge.
// - Nessun testo del carosello supera lo spazio, nemmeno con un bollino lungo.
// - Le campagne sponsor non hanno né il carosello né il campo del bollino.
// - Il campo del bollino è l'ultimo del form: vale solo per la copertina del carosello.
const WRITES = [];
const REQ = [];
const post = (extra) => ({ kind: "gita", event_date: "2027-01-17", title: "Sestriere", subtitle: null, hook: null,
  stops: [["6:30", "Asti"]], prices: [], show_price: true, facts: [], contacts: [], course: false, published_at: null, caption: null,
  card_stop: null, deadline: null, sponsor_id: null, ...extra });
FAKE.risposta = (t, r) => {
  REQ.push([t, r.colonne]);
  const writing = r.filtri.find((f) => ["insert", "update", "upsert", "delete"].includes(f[0]));
  if (writing) { WRITES.push([t, writing[0], writing[1]]); return { id: "P1", ...post({}) }; }
  if (t === "social_contacts") return [{ id: "C1", name: "Cesare", phone: "348 517 1707", hours: null, is_default: false, position: 0 },
    { id: "C2", name: "Domenico", phone: "389 579 4663", hours: "dopo le 18", is_default: false, position: 1 }];
  if (t === "sponsors") return [{ id: "S1", name: "Prova", level: "Sponsor", color_dark: "#14202E", color_light: "#FFFFFF", color_accent: "#FCCF02" }];
  if (t === "social_events") return r.colonne === "photo" ? [{ photo: null }] : [];
  return [];
};
window.addEventListener("load", () => setTimeout(async () => { try {
  const r = [];
  const test = (nome, passed, why) => r.push(`${nome}=${passed ? "ok" : `NO(${why})`}`);
  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const visible = (id) => !!el(id) && !el(id).closest("[hidden]");
  const buttons = (id) => [...el(id).querySelectorAll("button")].map((b) => b.textContent);
  const cover = () => el("anteprime").querySelectorAll(".cv")[2]?.outerHTML || "";
  const type = (value) => { el("fBollino").value = value; el("fBollino").dispatchEvent(new Event("input", { bubbles: true })); };

  const list = REQ.find(([t, c]) => t === "social_events" && c && c.startsWith("id,"));
  test("colonne", !!list && /carousel_badge/.test(list[1]), list ? list[1].slice(-40) : "lista non letta");

  await doOpen(post({ id: "P1", carousel_badge: "Nuova gita" }));
  await wait(800);
  test("campo", visible("fBollino") && el("fBollino").value === "Nuova gita", `${visible("fBollino")} «${el("fBollino")?.value}»`);
  // Il bollino sta solo nella copertina del carosello: ultimo dei campi del post.
  const fields = [...el("campiPost").children].filter((c) => c.dataset.campo && !c.closest("[hidden]") && !c.hidden);
  test("ultimo", fields.at(-1)?.dataset.campo === "bollino", fields.map((c) => c.dataset.campo).join(","));
  test("formati", buttons("formati").join(",") === "Post,Story,Carosello 1,Carosello 2,Carosello 3", buttons("formati").join(","));
  test("scarica", buttons("scarica").slice(2).join(",") === "Scarica il carosello 1/3,Scarica il carosello 2/3,Scarica il carosello 3/3", buttons("scarica").join(","));
  test("pagine", [...el("anteprime").querySelectorAll(".cv")].slice(2).every((c) => c.style.height === "1350px") && /Nuova gita/.test(cover()),
    cover().slice(0, 80));
  test("file", postFormats(daForm())[4].file === "2027-01-17-sestriere-carosello-3.png", postFormats(daForm())[4].file);
  test("staDentro", el("sbordaTutti").hidden, el("sbordaTutti").textContent);

  // Con i telefoni la riga delle iscrizioni arriva fino in fondo a destra: non deve finire sotto la linguetta.
  await doOpen(post({ id: "P1", contacts: ["C1", "C2"] }));
  await wait(800);
  const page2 = el("anteprime").querySelectorAll(".cv")[3];
  const tab = page2.querySelector(".scorri").getBoundingClientRect();
  const crossing = [...page2.querySelectorAll(".isc span, .isc b, .isc div")].filter((x) => {
    const b = x.getBoundingClientRect();
    return b.right > tab.left && b.left < tab.right && b.bottom > tab.top && b.top < tab.bottom;
  });
  test("telefoniLiberi", !crossing.length, crossing.map((x) => x.textContent.slice(0, 30)).join(" | "));
  test("telefoniStaDentro", el("sbordaTutti").hidden, el("sbordaTutti").textContent);

  type("");
  await wait(300);
  test("novita", /Novità/.test(cover()) && daForm().carousel_badge === null, `${daForm().carousel_badge} ${cover().slice(0, 80)}`);
  type("Iscrizioni aperte a tutti");
  await wait(800);
  test("lungoStaDentro", el("sbordaTutti").hidden, el("sbordaTutti").textContent);

  type("  Ultimi posti ");
  await wait(200);
  const before = WRITES.length;
  await save();
  await wait(400);
  const row = WRITES.slice(before).find(([t, op]) => t === "social_events" && (op === "update" || op === "insert"));
  test("salva", !!row && row[2].carousel_badge === "Ultimi posti", row ? JSON.stringify(row[2].carousel_badge) : "niente salvato");

  await doOpen(post({ kind: "sponsor", sponsor_id: "S1", title: "Campagna", carousel_badge: "Novità" }));
  await wait(300);
  test("campagna", !visible("fBollino") && !buttons("formati").some((b) => b.startsWith("Carosello")) && daForm().carousel_badge === null,
    `${visible("fBollino")} ${buttons("formati").join(",")} ${daForm().carousel_badge}`);
  document.title = "RISULTATO " + r.join(" ");
} catch (e) { document.title = `RISULTATO eccezione=NO(${String(e?.message || e).slice(0, 120)})`; } }, 800));
