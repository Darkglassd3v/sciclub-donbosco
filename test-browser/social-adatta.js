// Social, grafica K: più testo non fa mai crescere il titolo (bug del 3/11: con una riga in più nei dettagli
// «Sestriere» passava da 109 a 114 px). Prima si libera la riga vuota riservata al titolo, poi si stringe tutto.
FAKE.risposta = () => [];
const r = [];
window.addEventListener("load", () => setTimeout(async () => { try {
  const test = (nome, passed, why) => r.push(`${nome}=${passed ? "ok" : `NO(${why})`}`);
  setContacts([{ id: "1", name: "Cesare", phone: "3485171707" }, { id: "2", name: "Beppe", phone: "3393291015" }, { id: "3", name: "Domenico", phone: "3895794663" }]);
  const box = document.createElement("div");
  box.style.cssText = "position:absolute;left:-10000px;top:0";
  document.body.append(box);
  await document.fonts.ready;
  const measure = (ev, fmt) => {
    box.innerHTML = drawPost(postTemplate(ev, fmt));
    fit(box);
    const s = Number(box.querySelector(".testo").style.getPropertyValue("--s") || 1), cede = box.querySelector("[data-cede]");
    const title = box.querySelector(".tit [data-righe]");
    const oneLine = title.offsetHeight < parseFloat(getComputedStyle(title).lineHeight) * 1.5;
    return { size: parseFloat(getComputedStyle(title).fontSize), s, emptyRow: oneLine && cede.style.minHeight !== "0px" };
  };
  const line = "Mezza pensione e skipass";
  const cases = [
    ["weekend", { kind: "weekend", hook: "DREAM WEEKEND", title: "Sestriere", event_date: "2026-12-11", end_date: "2026-12-13", place: "Hotel Fronte Piste, Sestriere" }],
    ["gita", { kind: "gita", title: "Sestriere", event_date: "2027-01-17", stops: [["6:30", "Asti"], ["6:45", "Moncalvo"]], prices: [[null, "€ 52"]], deadline: "2027-01-12" }],
    ["evento", { kind: "evento", title: "Cena sociale", event_date: "2027-04-10", event_time: "20:00", place: "Asti", prices: [["Soci", "€ 30"]] }],
  ];
  for (const [kind, ev] of cases) for (const fmt of ["post", "story"]) for (const contacts of [["1"], ["1", "2", "3"]]) {
    let before = null;
    const seen = [];
    for (let n = 0; n <= 6; n++) {
      const m = measure({ ...ev, contacts, subtitle: Array(n).fill(line).join("\n") }, fmt);
      seen.push(`${n}:${Math.round(m.size)}${m.emptyRow ? "v" : ""}`);
      if (before && m.size > before.size + .5) { test(`${kind}-${fmt}-${contacts.length}tel`, false, `il titolo cresce aggiungendo righe ${seen.join(" ")}`); before = null; break; }
      if (m.s < 1 && m.emptyRow) { test(`${kind}-${fmt}-${contacts.length}tel`, false, `rimpicciolisce con la riga vuota ${seen.join(" ")}`); before = null; break; }
      before = m;
    }
    if (before) test(`${kind}-${fmt}-${contacts.length}tel`, true, "");
  }
  document.title = "RISULTATO " + r.join(" ");
} catch (e) { document.title = `RISULTATO ${r.join(" ")} eccezione=NO(${String(e?.message || e).slice(0, 160)})`; } }, 300));
