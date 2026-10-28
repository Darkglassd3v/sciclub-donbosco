// Social (social.html): le campagne degli sponsor (docs/PIANO_CAMPAGNE.md).
// - Menu: voce «Campagne» (social.html#campagne) col conteggio delle campagne da fare;
//   «Post» conta solo gite ed eventi.
// - #campagne mostra solo i post degli sponsor, filtrabili per sponsor; #post tutti gli altri.
// - Aprire una campagna da #post porta a #campagne; «+ Nuova campagna» apre una campagna.
// - Immagine dello sponsor: il campo c'è nelle campagne, ridotta a 1920 px (non 1080) e senza i
//   comandi per spostarla (resta intera); i contatti no. Nei formati nessun testo le sta sopra.
// - File dei PNG: due campagne dello stesso sponsor non hanno lo stesso nome.
// - Inserzione Meta: campi salvati col post, contatore oltre il limite, parametri URL,
//   promemoria 18+ per gli sponsor di alcolici.
// - Spese (permesso bilancio): totali dei movimenti collegati; «Registra spesa» scrive in
//   ledger_entries col collegamento alla campagna, dopo la conferma.
const WRITES = [];
const LEDGER = [
  { kind: "USCITA", amount: 50 }, { kind: "USCITA", amount: 30 }, { kind: "ENTRATA", amount: 40 },
];
const SPONSORS = [
  { id: "S1", name: "SANTERO", level: "Main sponsor", url: "https://santero.it", handle: null, logo: null, logo_dark: null,
    color_dark: "#0B3D2E", color_light: "#F4E9D0", color_accent: "#E6AC34", alcohol: true },
  { id: "S2", name: "AUTO", level: "Sponsor", url: "https://auto.example", handle: null, logo: null, logo_dark: null,
    color_dark: "#14202E", color_light: "#FFFFFF", color_accent: "#1C69D4", alcohol: false },
];
const base = { subtitle: null, hook: null, stops: [], prices: [], show_price: true, facts: [], contacts: [], course: false,
  published_at: null, caption: null, card_stop: null, deadline: null, sponsor_id: null, story_title: null, cta: null,
  ad_text: null, ad_headline: null, ad_description: null, ad_cta: null };
const POSTS = [
  { ...base, id: "G1", kind: "gita", event_date: "2026-12-13", title: "Sestriere", hook: "Gita a" },
  { ...base, id: "E1", kind: "cena", event_date: "2026-12-20", title: "Cena sociale" },
  { ...base, id: "P1", kind: "sponsor", event_date: "2026-12-01", title: "Brindisi", sponsor_id: "S1" },
  { ...base, id: "P2", kind: "sponsor", event_date: "2026-11-01", title: "Vecchia", sponsor_id: "S2", published_at: "2026-11-02T10:00:00Z" },
  { ...base, id: "P3", kind: "sponsor", event_date: "2026-12-05", title: "Auto nuova", sponsor_id: "S2" },
];
FAKE.risposta = (t, r) => {
  const writing = r.filtri.find((f) => ["insert", "update", "upsert", "delete"].includes(f[0]));
  if (writing) { WRITES.push([t, writing[0], writing[1], r.filtri]); return t === "social_events" ? { ...POSTS[2], ...writing[1] } : [{ id: "L9" }]; }
  if (t === "social_events") return r.colonne === "photo" ? [{ photo: null }] : POSTS.map((p) => ({ ...p }));
  if (t === "sponsors") return SPONSORS;
  if (t === "ledger_entries") return r.filtri.some((f) => f[0] === "eq" && f[1] === "social_event_id" && f[2] === "P1") ? LEDGER : [];
  return [];
};

let step = "inizio";
window.addEventListener("load", () => setTimeout(async () => { try {
  const r = [];
  const test = (nome, passed, why) => r.push(`${nome}=${passed ? "ok" : `NO(${why})`}`);
  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const shown = () => [...el("elencoPost").querySelectorAll("button[data-id]")].map((b) => b.dataset.id).join(",");
  const visible = (x) => !!x && !x.closest("[hidden]") && x.getClientRects().length > 0;
  const go = async (hash) => { location.hash = hash; await wait(150); };

  step = "menu";
  const link = document.querySelector('.barra-voci a[href="social.html#campagne"]');
  test("voceMenu", !!link, "nessuna voce social.html#campagne");
  test("contaCampagne", el("contaCampagne")?.textContent === "2 da fare", `«${el("contaCampagne")?.textContent}»`);
  test("contaPost", el("contaDaFare").textContent === "2 da fare", `«${el("contaDaFare").textContent}»`);

  step = "elenchi";
  await go("#campagne");
  test("soloCampagne", shown() === "P1,P3", shown());
  test("titolo", el("titoloSezione").textContent === "Campagne", el("titoloSezione").textContent);
  el("filtroSponsor").value = "S2";
  el("filtroSponsor").dispatchEvent(new Event("change", { bubbles: true }));
  await wait(50);
  test("filtro", shown() === "P3", shown());
  el("filtroSponsor").value = "";
  el("filtroSponsor").dispatchEvent(new Event("change", { bubbles: true }));
  await go("#post");
  test("postSenzaCampagne", shown() === "G1,E1", shown());
  test("filtroSoloCampagne", !visible(el("filtroSponsor")), "filtro visibile in Post");

  step = "apri";
  await doOpen(posts.find((p) => p.id === "P1"));
  await wait(300);
  test("apreInCampagne", location.hash === "#campagne", location.hash);
  test("campoImmagine", visible(el("fFoto")), "campo immagine nascosto");
  test("senzaContatti", !visible(el("fContatti")), "contatti visibili");

  step = "immagine";
  const c = document.createElement("canvas");
  c.width = 3000; c.height = 1000;
  c.getContext("2d").fillRect(0, 0, 3000, 1000);
  const blob = await new Promise((ok) => c.toBlob(ok, "image/jpeg"));
  const dt = new DataTransfer();
  dt.items.add(new File([blob], "auto.jpg", { type: "image/jpeg" }));
  el("fFoto").files = dt.files;
  // La riduzione vera (FileReader, decodifica) va in tempo reale e il tempo virtuale di
  // Chrome headless la scavalca: si guarda a quanti pixel la pagina la chiede, poi
  // l'immagine si mette già pronta.
  let asked = null;
  const realShrink = shrinkImage;
  window.shrinkImage = (file, maximum, typeName) => { asked = maximum; return new Promise(() => {}); };
  el("fFoto").dispatchEvent(new Event("change", { bubbles: true }));
  window.shrinkImage = realShrink;
  test("immagine1920", asked === 1920, `chiesta a ${asked} px`);
  picture = c.toDataURL("image/jpeg", .5);
  changed();
  test("senzaSposta", !visible(el("posFoto")), "comandi per spostare l'immagine visibili");
  test("posizioneVuota", daForm().photo_x === null && daForm().photo_zoom === null, JSON.stringify([daForm().photo_x, daForm().photo_zoom]));
  await wait(500);
  const covered = [...el("anteprime").querySelectorAll(".cv")].filter((cv) => cv.querySelector(".foto-sponsor")).map((cv) => {
    const box = cv.querySelector(".foto-sponsor").getBoundingClientRect();
    const over = [...cv.querySelectorAll("*")].filter((x) => x !== cv && !x.contains(cv.querySelector(".foto-sponsor"))
      && [...x.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())).filter((x) => {
      const b = x.getBoundingClientRect();
      return b.right > box.left + 1 && b.left < box.right - 1 && b.bottom > box.top + 1 && b.top < box.bottom - 1;
    });
    return over.map((x) => x.textContent.trim().slice(0, 20));
  });
  test("formatiImmagine", covered.length === 3, `${covered.length} formati con l'immagine`);
  test("immagineScoperta", covered.every((o) => !o.length), JSON.stringify(covered.flat()).slice(0, 80));
  const files = [postFormats({ ...daForm(), title: "Brindisi" }), postFormats({ ...daForm(), title: "Auto nuova" })].map((l) => l[0]?.file);
  test("nomiFile", files[0] && files[0] !== files[1], JSON.stringify(files));

  step = "meta";
  el("fAdText").value = "x".repeat(130);
  el("fAdText").dispatchEvent(new Event("input", { bubbles: true }));
  el("fAdHeadline").value = "Titolo";
  el("fAdHeadline").dispatchEvent(new Event("input", { bubbles: true }));
  await wait(50);
  const counter = document.querySelector('[data-conta-per="fAdText"]');
  test("contatore", counter?.textContent.includes("130/125") && counter.classList.contains("oltre"), counter ? `«${counter.textContent}» ${counter.className}` : "manca");
  const f = daForm();
  test("campiMeta", f.ad_text === "x".repeat(130) && f.ad_headline === "Titolo" && f.ad_description === null, JSON.stringify([f.ad_text?.length, f.ad_headline, f.ad_description]));
  test("parametri", el("parametriInserzione").textContent.includes("utm_source={{site_source_name}}&utm_medium=paid_social"), el("parametriInserzione").textContent.slice(0, 60));
  test("alcol18", visible(el("avvisoAlcolMeta")), "promemoria 18+ nascosto per uno sponsor di alcolici");

  step = "spese";
  test("speseVisibili", visible(el("speseCampagna")), "riquadro spese nascosto");
  const totals = el("totaleSpese").textContent.replace(/\s+/g, " ");
  test("totali", totals.includes("Speso € 80,00") && totals.includes("Rimborsato € 40,00") && totals.includes("Netto € 40,00"), totals.slice(0, 80));
  el("btnRegistraSpesa").click();
  await wait(100);
  test("finestraSpesa", el("dlgSpesa").open, "finestra non aperta");
  el("spData").value = "2026-12-03";
  el("spImporto").value = "25,50";
  el("spTipo").value = "USCITA";
  const before = WRITES.length;
  el("spSalva").click();
  await wait(100);
  test("chiedeConferma", WRITES.length === before && document.querySelector("dialog.finestra-domanda[open]"), "scritto senza conferma");
  document.querySelector("dialog.finestra-domanda[open] [data-si]")?.click();
  await wait(400);
  const ins = WRITES.slice(before).find(([t, op]) => t === "ledger_entries" && op === "insert");
  const row = ins && ins[2];
  test("movimento", row && row.kind === "USCITA" && row.category === "Pubblicità Meta" && row.unit_price === 25.5
    && row.quantity === 1 && row.entry_date === "2026-12-03" && row.social_event_id === "P1" && /Brindisi/.test(row.description),
    JSON.stringify(row || null).slice(0, 120));

  step = "nuova";
  savedOne = signature();
  await go("#campagne");
  el("btnNuovaCampagna").click();
  await wait(300);
  test("nuovaCampagna", el("fTipo").value === "sponsor" && !isOpen.id, `${el("fTipo").value} ${isOpen && isOpen.id}`);
  test("nuovaSenzaSpese", !visible(el("speseCampagna")), "spese su una campagna non salvata");
  document.title = "RISULTATO " + r.join(" ");
} catch (e) { document.title = `RISULTATO eccezione=NO(${step}: ${String(e?.message || e).slice(0, 120)} ${String(e?.stack || "").split("\n")[1]?.trim().slice(0, 80)})`; } }, 400));
