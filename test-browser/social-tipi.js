// Social (social.html): i tipi di post (richiesta del 2/11).
// - «+ Nuovo post» propone tre tipi: Gita, Evento (i corsi, le cene, le gare e i servizi di prima) e
//   Weekend e settimane bianche; il tipo non si cambia più nel form.
// - Evento e weekend scelgono il giorno nel calendario della gita; l'evento può restare senza giorno
//   (un secondo clic lo toglie) e non cambia colore col giorno.
// - Il weekend sceglie il primo e l'ultimo giorno; non ha prezzi, informazioni né ora.
// - Gli eventi hanno un colore loro, salvato in Impostazioni (social_settings, event_color).
// - L'anteprima c'è sempre; finché manca qualcosa i pulsanti per scaricare sono spenti e dicono cosa manca.
// - I tipi del menu stanno nella colonna dell'elenco, anche «Weekend e settimane bianche» (a 1400 px andava sopra il form).
// - Nel calendario di eventi e weekend i giorni di gita non hanno il loro colore: il giorno scelto (o il periodo) ha
//   quello degli eventi; il pallino segna le gite già salvate.
const WRITES = [], REQ = [];
FAKE.risposta = (t, r) => {
  REQ.push([t, r.colonne]);
  const writing = r.filtri.find((f) => ["insert", "update", "upsert", "delete"].includes(f[0]));
  if (writing) { WRITES.push([t, writing[0], writing[1]]); return t === "social_events" ? { id: "P1", ...writing[1] } : []; }
  if (t === "social_settings") return [{ key: "event_color", value: "#5B2A86" }];
  if (t === "trip_days") return [{ weekday: 2, color: "#B3261E" }, { weekday: 6, color: "#084C8D" }, { weekday: 0, color: "#FCCF02" }];
  if (t === "social_events") return r.colonne === "photo" ? [{ photo: null }] : [];
  return [];
};
const r = [];
window.addEventListener("load", () => setTimeout(async () => { try {
  const test = (nome, passed, why) => r.push(`${nome}=${passed ? "ok" : `NO(${why})`}`);
  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const visible = (id) => !!el(id) && !el(id).closest("[hidden]");
  const fields = () => [...el("campiPost").children].filter((c) => c.dataset.campo && !c.hidden).map((c) => c.dataset.campo).join(",");
  const day = (iso) => el("calGita").querySelector(`[data-giorno="${iso}"]`);
  const click = async (iso) => { day(iso).click(); await wait(200); };
  const card = () => el("anteprime").querySelector(".cv .tessera");
  const off = () => [...el("scarica").querySelectorAll("button")].every((b) => b.disabled);

  // L'elenco legge anche l'ultimo giorno: riaperto dall'elenco, un weekend non lo perde.
  const list = REQ.find(([t, c]) => t === "social_events" && c && c.startsWith("id,"));
  test("colonne", !!list && /(^|,)end_date(,|$)/.test(list[1]), list ? list[1].slice(-60) : "lista non letta");
  const types = [...document.querySelectorAll("[data-nuovo]")].filter((b) => b.dataset.nuovo !== "sponsor")
    .map((b) => `${b.dataset.nuovo}:${b.textContent.trim()}`).join(",");
  test("menu", types === "gita:Gita,evento:Evento,weekend:Weekend e settimane bianche", types);
  el("menuNuovo").open = true;
  const column = el("menuNuovo").getBoundingClientRect();
  const outside = [...el("menuNuovo").querySelectorAll("[data-nuovo]")].filter((b) => b.getBoundingClientRect().right > column.right + 1 || b.scrollWidth > b.clientWidth + 1);
  test("menuNellaColonna", !outside.length, outside.map((b) => `${b.textContent.trim()} ${Math.round(b.getBoundingClientRect().right)}>${Math.round(column.right)}`).join(" | "));
  el("menuNuovo").open = false;
  test("coloreCaricato", categoryName("evento").c === "#5B2A86" && el("coloreEventi")?.value === "#5b2a86", `${categoryName("evento").c} ${el("coloreEventi")?.value}`);

  document.querySelector('[data-nuovo="evento"]').click();
  await wait(400);
  test("eventoCampi", fields() === "giorno,ora,rinvio,gancio,titolo,sottotesto,dove,info,prezzi,scadenza,bollino"
    && !visible("fTipo") && visible("calGita") && !visible("fData"), `${fields()} tipo ${visible("fTipo")} data ${visible("fData")}`);
  test("anteprimaVuota", el("anteprime").querySelectorAll(".cv").length === 5 && off() && visible("senzaAnteprima")
    && /titolo/.test(el("senzaAnteprima").textContent), `${el("anteprime").querySelectorAll(".cv").length} spenti ${off()} «${el("senzaAnteprima").textContent}»`);

  await doOpen({ kind: "evento", title: "Cena sociale", event_date: "2027-01-20" });
  await wait(300);
  test("eventoGiorno", daForm().event_date === "2027-01-20" && day("2027-01-20")?.getAttribute("aria-pressed") === "true"
    && card()?.getAttribute("style")?.includes("#5B2A86"), `${daForm().event_date} ${card()?.getAttribute("style")}`);
  test("pronto", !off() && !visible("senzaAnteprima"), `spenti ${off()}`);
  const tinted = (iso) => (day(iso)?.getAttribute("style") || "").replace(/\s/g, "").toUpperCase();
  test("calendarioEvento", !el("calGita").querySelector(".di-gita") && tinted("2027-01-20").includes("BACKGROUND:#5B2A86") && !tinted("2027-01-12"),
    `gita colorata ${!!el("calGita").querySelector(".di-gita")} scelto «${tinted("2027-01-20")}» martedì «${tinted("2027-01-12")}»`);
  await click("2027-01-12");
  test("martedi", daForm().event_date === "2027-01-12" && card()?.getAttribute("style")?.includes("#5B2A86"), `${daForm().event_date} ${card()?.getAttribute("style")}`);
  await click("2027-01-12");
  test("senzaGiorno", daForm().event_date === null && !card() && !off(), `${daForm().event_date} tessera ${!!card()}`);

  await click("2027-01-20");  // di nuovo com'era aperto: aprire il weekend non chiede di abbandonare le modifiche
  await doOpen({ kind: "weekend", title: "Dream Weekend al Sestriere", event_date: "2026-12-11", end_date: null, place: "Hotel Fronte Piste" });
  await wait(300);
  test("weekendCampi", fields() === "giorno,rinvio,gancio,titolo,sottotesto,dove,scadenza,bollino" && off()
    && /date/.test(el("senzaAnteprima").textContent), `${fields()} spenti ${off()} «${el("senzaAnteprima").textContent}»`);
  await click("2026-12-13");
  test("weekendPeriodo", daForm().event_date === "2026-12-11" && daForm().end_date === "2026-12-13" && day("2026-12-12")?.classList.contains("nel-periodo")
    && /11–13/.test(card()?.textContent || "") && !off() && ["2026-12-11", "2026-12-12", "2026-12-13"].every((d) => tinted(d).includes("BACKGROUND:#5B2A86")), `${daForm().event_date} ${daForm().end_date} ${card()?.textContent.replace(/\s+/g, " ")}`);
  test("testataPeriodo", /da venerdì 11 a domenica 13 dicembre/.test(el("occhielloPost").textContent), el("occhielloPost").textContent);
  await click("2026-12-05");
  test("weekendDaCapo", daForm().event_date === "2026-12-05" && daForm().end_date === null && off(), `${daForm().event_date} ${daForm().end_date}`);
  await click("2026-12-06");
  const before = WRITES.length;
  await save();
  await wait(300);
  const row = (WRITES.slice(before).find(([t]) => t === "social_events") || [])[2] || {};
  test("weekendSalvato", row.kind === "weekend" && row.event_date === "2026-12-05" && row.end_date === "2026-12-06"
    && JSON.stringify(row.prices) === "[]" && JSON.stringify(row.facts) === "[]" && row.place === "Hotel Fronte Piste" && row.event_time === null,
    JSON.stringify(row).slice(0, 200));

  // Il periodo sta dentro la tessera, col suo margine: «20–22» arrivava sul bordo.
  await doOpen({ kind: "weekend", title: "Largo", event_date: "2026-12-20", end_date: "2026-12-22" });
  await wait(500);
  // Il periodo sta dentro la tessera, col suo margine: «20–22» arrivava sul bordo.
  const periodo = el("anteprime").querySelector(".cv .tessera .periodo"), range = document.createRange();
  range.selectNodeContents(periodo);
  const scale = el("anteprime").querySelector(".cv").getBoundingClientRect().width / 1080;
  const free = (card().getBoundingClientRect().right - range.getBoundingClientRect().right) / scale;
  test("periodoDentro", free >= 24, `${Math.round(free)} px dal bordo`);

  el("coloreEventi").value = "#c2410c";
  el("coloreEventi").dispatchEvent(new Event("input", { bubbles: true }));
  const beforeS = WRITES.length;
  await saveDays();
  await wait(200);
  const setting = WRITES.slice(beforeS).find(([t, op]) => t === "social_settings" && op === "upsert");
  test("coloreSalvato", !!setting && JSON.stringify(setting[2]) === '{"key":"event_color","value":"#C2410C"}' && categoryName("evento").c === "#C2410C",
    setting ? JSON.stringify(setting[2]) : "non salvato");
  // Il conteggio accanto a «Campagne» sta su una riga, dentro la voce del menu.
  const count = document.querySelector(".barra-voci .conta");
  if (count) {
    count.textContent = "22 da fare";
    const row = count.parentElement.getBoundingClientRect(), box = count.getBoundingClientRect();
    test("contaUnaRiga", getComputedStyle(count).whiteSpace === "nowrap" && box.right <= row.right + 1, `${getComputedStyle(count).whiteSpace} ${Math.round(box.right)}>${Math.round(row.right)}`);
  } else test("contaUnaRiga", false, "conteggio non trovato");

  // Tema scuro: il pulsante col fuoco, come «Annulla» appena aperta una conferma, resta leggibile.
  document.documentElement.dataset.tema = "scuro";
  const cancel = document.createElement("button"), sampleText = document.createElement("span");
  cancel.className = "button is-medium is-focused";  // la stessa regola di Bulma di :focus, che in headless non scatta
  cancel.textContent = "Annulla";
  sampleText.style.color = "var(--testo)";
  document.body.append(cancel, sampleText);
  cancel.focus();
  await wait(400);
  test("annullaScuro", getComputedStyle(cancel).color === getComputedStyle(sampleText).color, `${getComputedStyle(cancel).color} invece di ${getComputedStyle(sampleText).color}`);
  document.title = "RISULTATO " + r.join(" ");
} catch (e) { document.title = `RISULTATO ${r.join(" ")} eccezione=NO(${String(e?.message || e).slice(0, 160)})`; } }, 800));
