// Social (social.html): gita o evento rimandato (richiesta del 29/10).
// - Due spunte (2/11): «Rimandato» e «Rimandato per maltempo»; con il rinvio la nuova data.
// - Si salva in postponed_reason (maltempo, o vuoto = senza motivo; null = si fa) e postponed_to; un motivo
//   dei post di prima (neve, scritto a mano) resta com'era se non si toccano le spunte.
// - Riaperto, il form torna come era; nelle campagne non c'è; Duplica non copia il rinvio.
const REQ = [];
// Calendario del mese: la gita al giorno in cui si fa davvero (review del 29/10). Rimandata con la
// nuova data, in quel mese; rimandata senza data, in nessuno.
const LIST = [
  { id: "A", kind: "gita", event_date: "2027-01-10", title: "Sestriere", course: false },
  { id: "B", kind: "gita", event_date: "2027-01-10", title: "Cervinia", course: false, postponed_reason: "neve", postponed_to: "2027-02-07" },
  { id: "C", kind: "gita", event_date: "2027-01-24", title: "Pila", course: false, postponed_reason: "maltempo", postponed_to: null },
];
const post = (extra) => ({ kind: "gita", event_date: "2027-01-10", title: "Cervinia", subtitle: null, hook: null,
  stops: [], prices: [], show_price: true, facts: [], contacts: [], course: false, published_at: null, caption: null,
  card_stop: null, deadline: null, sponsor_id: null, ...extra });
FAKE.risposta = (t, r) => {
  REQ.push([t, r.colonne]);
  if (t === "sponsors") return [{ id: "S1", name: "Prova", level: "Sponsor", color_dark: "#14202E", color_light: "#FFFFFF", color_accent: "#FCCF02" }];
  if (t === "social_events") return r.colonne === "photo" ? [{ photo: null }] : LIST;
  return [];
};
window.addEventListener("load", () => setTimeout(async () => { try {
  const r = [];
  const test = (nome, passed, why) => r.push(`${nome}=${passed ? "ok" : `NO(${why})`}`);
  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const visible = (id) => !!el(id) && !el(id).closest("[hidden]");
  const tick = (id, on) => { el(id).checked = on; el(id).dispatchEvent(new Event("change", { bubbles: true })); };
  await doOpen(post({}));
  await wait(100);
  test("campo", visible("fRinvio") && visible("fMaltempo") && el("fRinvio").type === "checkbox" && !el("fRinvio").checked && !el("fMaltempo").checked
    && !visible("fRinvioData") && !el("fRinvioMotivo"),
    `${visible("fRinvio")} ${el("fRinvio")?.type} ${el("fRinvio")?.checked} maltempo ${el("fMaltempo")?.checked} data ${visible("fRinvioData")} motivo ${!!el("fRinvioMotivo")}`);
  test("nonRimandata", daForm().postponed_reason === null && daForm().postponed_to === null, JSON.stringify([daForm().postponed_reason, daForm().postponed_to]));

  tick("fRinvio", true);
  test("rimandata", visible("fRinvioData") && daForm().postponed_reason === "", `${visible("fRinvioData")} ${JSON.stringify(daForm().postponed_reason)}`);
  el("fRinvioData").value = "2027-01-17";
  tick("fMaltempo", true);
  test("maltempo", daForm().postponed_reason === "maltempo" && el("fRinvio").checked && daForm().postponed_to === "2027-01-17",
    `${daForm().postponed_reason} ${el("fRinvio").checked} ${daForm().postponed_to}`);
  tick("fRinvio", false);
  test("tolto", !el("fMaltempo").checked && daForm().postponed_reason === null && daForm().postponed_to === null && !visible("fRinvioData"),
    `${el("fMaltempo").checked} ${JSON.stringify([daForm().postponed_reason, daForm().postponed_to])}`);
  // «Rimandato per maltempo» da solo vuol dire anche rimandato.
  tick("fMaltempo", true);
  test("soloMaltempo", el("fRinvio").checked && daForm().postponed_reason === "maltempo", `${el("fRinvio").checked} ${daForm().postponed_reason}`);
  tick("fMaltempo", false);
  test("senzaMaltempo", el("fRinvio").checked && daForm().postponed_reason === "", JSON.stringify(daForm().postponed_reason));

  await doOpen(post({ id: "P1", postponed_reason: "maltempo", postponed_to: "2027-01-24" }));
  await wait(100);
  test("riaperta", el("fRinvio").checked && el("fMaltempo").checked && el("fRinvioData").value === "2027-01-24",
    `${el("fRinvio").checked} ${el("fMaltempo").checked} ${el("fRinvioData").value}`);
  test("disegno", /timbro/.test(document.getElementById("editor").innerHTML), "timbro non disegnato");
  // Un motivo dei post di prima (neve, scritto a mano) resta com'era, se non si toccano le spunte.
  await doOpen(post({ id: "P2", postponed_reason: "per lo sciopero", postponed_to: null }));
  await wait(100);
  test("motivoDiPrima", el("fRinvio").checked && !el("fMaltempo").checked && daForm().postponed_reason === "per lo sciopero",
    `${el("fRinvio").checked} ${el("fMaltempo").checked} ${daForm().postponed_reason}`);
  duplicate();
  await wait(100);
  test("duplicaSenzaRinvio", !el("fRinvio").checked && daForm().postponed_reason === null, `${el("fRinvio").checked} ${daForm().postponed_reason}`);

  await doOpen(post({ kind: "sponsor", sponsor_id: "S1", title: "Campagna", postponed_reason: "neve" }));
  await wait(100);
  test("campagna", !visible("fRinvio") && daForm().postponed_reason === null, `${visible("fRinvio")} ${daForm().postponed_reason}`);
  document.title = "RISULTATO " + r.join(" ");
} catch (e) { document.title = `RISULTATO eccezione=NO(${String(e?.message || e).slice(0, 120)})`; } }, 800));
