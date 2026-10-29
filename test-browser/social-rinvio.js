// Social (social.html): gita o evento rimandato (richiesta del 29/10).
// - «Rimandato»: no / causa neve / causa maltempo / altro motivo (scritto a mano); con il rinvio la nuova data.
// - Il motivo a mano si vede solo con «altro»; nuova data e motivo solo con un rinvio.
// - Si salva in postponed_reason (neve, maltempo, il testo; vuoto = senza motivo) e postponed_to.
// - Riaperto, il form torna come era; nelle campagne non c'è; Duplica non copia il rinvio.
const REQ = [];
const post = (extra) => ({ kind: "gita", event_date: "2027-01-10", title: "Cervinia", subtitle: null, hook: null,
  stops: [], prices: [], show_price: true, facts: [], contacts: [], course: false, published_at: null, caption: null,
  card_stop: null, deadline: null, sponsor_id: null, ...extra });
FAKE.risposta = (t, r) => {
  REQ.push([t, r.colonne]);
  if (t === "sponsors") return [{ id: "S1", name: "Prova", level: "Sponsor", color_dark: "#14202E", color_light: "#FFFFFF", color_accent: "#FCCF02" }];
  if (t === "social_events") return r.colonne === "photo" ? [{ photo: null }] : [];
  return [];
};
window.addEventListener("load", () => setTimeout(async () => { try {
  const r = [];
  const test = (nome, passed, why) => r.push(`${nome}=${passed ? "ok" : `NO(${why})`}`);
  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const visible = (id) => !!el(id) && !el(id).closest("[hidden]");
  const choose = (value) => { el("fRinvio").value = value; el("fRinvio").dispatchEvent(new Event("change", { bubbles: true })); };

  const list = REQ.find(([t, c]) => t === "social_events" && c && c.startsWith("id,"));
  test("colonne", !!list && /postponed_reason/.test(list[1]) && /postponed_to/.test(list[1]), list ? list[1].slice(-60) : "lista non letta");

  await doOpen(post({}));
  await wait(100);
  test("campo", visible("fRinvio") && el("fRinvio").value === "" && !visible("fRinvioData") && !visible("fRinvioMotivo"),
    `${visible("fRinvio")} «${el("fRinvio")?.value}» data ${visible("fRinvioData")} motivo ${visible("fRinvioMotivo")}`);
  test("nonRimandata", daForm().postponed_reason === null && daForm().postponed_to === null, JSON.stringify([daForm().postponed_reason, daForm().postponed_to]));

  choose("neve");
  test("neve", visible("fRinvioData") && !visible("fRinvioMotivo") && daForm().postponed_reason === "neve", `${visible("fRinvioData")} ${visible("fRinvioMotivo")} ${daForm().postponed_reason}`);
  choose("altro");
  el("fRinvioMotivo").value = "per lo sciopero dei pullman";
  el("fRinvioData").value = "2027-01-17";
  test("altro", visible("fRinvioMotivo") && daForm().postponed_reason === "per lo sciopero dei pullman" && daForm().postponed_to === "2027-01-17",
    `${visible("fRinvioMotivo")} ${daForm().postponed_reason} ${daForm().postponed_to}`);
  el("fRinvioMotivo").value = "";
  test("senzaMotivo", daForm().postponed_reason === "", JSON.stringify(daForm().postponed_reason));
  choose("");
  test("tolto", daForm().postponed_reason === null && daForm().postponed_to === null, JSON.stringify([daForm().postponed_reason, daForm().postponed_to]));

  await doOpen(post({ id: "P1", postponed_reason: "per lo sciopero", postponed_to: "2027-01-24" }));
  await wait(100);
  test("riaperta", el("fRinvio").value === "altro" && el("fRinvioMotivo").value === "per lo sciopero" && el("fRinvioData").value === "2027-01-24",
    `${el("fRinvio").value} ${el("fRinvioMotivo").value} ${el("fRinvioData").value}`);
  test("disegno", /timbro/.test(document.getElementById("editor").innerHTML), "timbro non disegnato");
  duplicate();
  await wait(100);
  test("duplicaSenzaRinvio", el("fRinvio").value === "" && daForm().postponed_reason === null, `${el("fRinvio").value} ${daForm().postponed_reason}`);

  await doOpen(post({ kind: "sponsor", sponsor_id: "S1", title: "Campagna", postponed_reason: "neve" }));
  await wait(100);
  test("campagna", !visible("fRinvio") && daForm().postponed_reason === null, `${visible("fRinvio")} ${daForm().postponed_reason}`);
  document.title = "RISULTATO " + r.join(" ");
} catch (e) { document.title = `RISULTATO eccezione=NO(${String(e?.message || e).slice(0, 120)})`; } }, 800));
