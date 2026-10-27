// PAGINA: index.html admin.html assicurazione.html bilancio.html gestione.html impostazioni.html password.html riepilogo.html social.html stagione.html stampe.html utenti.html ricerca/index.html ricerca/gite.html
// Lo stile della 3.0 (27/10/2026, l'immagine di riferimento dell'utente: Material), uguale in
// tutte le pagine, sul computer:
// - menu: una colonna a sinistra, alta quanto lo schermo, larga 220-280 px, con le voci una sotto
//   l'altra (mai due voci sulla stessa riga);
// - pulsanti: rettangoli con gli angoli di 4 px, alti almeno 40 px, scritta in maiuscolo (le
//   pillole tonde e i rettangoli da 8 px di prima convivevano nella stessa pagina);
// - schede: angoli di al massimo 8 px e un'ombra (elevazione), come le card dell'immagine.
{
  window.addEventListener("load", () => setTimeout(() => {
    const r = [];
    const prova = (nome, sbagliati) => {
      const tutti = [...new Set(sbagliati)];
      r.push(`${nome}=${tutti.length ? `NO(${tutti.slice(0, 4).join(" / ")}${tutti.length > 4 ? ` e altri ${tutti.length - 4}` : ""})` : "ok"}`);
    };
    const descr = (x) => (x.id ? `#${x.id}` : x.tagName.toLowerCase() + [...x.classList].slice(0, 2).map((c) => "." + c).join(""))
      + (x.textContent.trim() ? ` «${x.textContent.trim().replace(/\s+/g, " ").slice(0, 20)}»` : "");
    const visibile = (x) => x.getClientRects().length && getComputedStyle(x).visibility !== "hidden" && !x.closest(".is-sr-only, .fuori");
    const H = innerHeight;

    const barra = document.querySelector(".barra"), voci = [...document.querySelectorAll(".barra-voci > *")].filter(visibile);
    const b = barra ? barra.getBoundingClientRect() : null;
    const righe = new Set(voci.map((x) => Math.round(x.getBoundingClientRect().top)));
    prova("menu", !b ? ["senza barra"] : [
      ...(b.left > 1 || b.height < H - 2 ? [`barra a ${Math.round(b.left)},${Math.round(b.top)} alta ${Math.round(b.height)} su ${H}`] : []),
      ...(b.width < 220 || b.width > 280 ? [`larga ${Math.round(b.width)}`] : []),
      ...(righe.size < voci.length ? [`${voci.length} voci su ${righe.size} righe`] : []),
    ]);

    const pulsanti = [...document.querySelectorAll("button, .button, a.button, input[type=submit], input[type=button], [role=button]")]
      .filter((x) => visibile(x) && !x.closest(".barra"));
    prova("pulsanti", pulsanti.filter((x) => {
      const s = getComputedStyle(x);
      return s.borderTopLeftRadius !== "4px" || x.getBoundingClientRect().height < 40 || (x.textContent.trim() && s.textTransform !== "uppercase");
    }).map((x) => { const s = getComputedStyle(x); return `${descr(x)} raggio ${s.borderTopLeftRadius} ${Math.round(x.getBoundingClientRect().height)}px ${s.textTransform}`; }));

    const schede = [...document.querySelectorAll(".riquadro, .box, .card")].filter(visibile);
    prova("schede", schede.filter((x) => { const s = getComputedStyle(x); return parseFloat(s.borderTopLeftRadius) > 8 || s.boxShadow === "none"; })
      .map((x) => `${descr(x).split(" ")[0]} raggio ${getComputedStyle(x).borderTopLeftRadius}`));

    document.title = "RISULTATO " + r.join(" ");
  }, 5000));
}
