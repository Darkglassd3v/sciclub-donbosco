// PAGINA: index.html admin.html assicurazione.html bilancio.html gestione.html impostazioni.html password.html riepilogo.html social.html stagione.html stampe.html utenti.html ricerca/index.html ricerca/gite.html
// Lo stile della 3.0 (27/10/2026, l'immagine di riferimento dell'utente: Material), uguale in
// tutte le pagine, sul computer:
// - menu: una colonna a sinistra, fino in fondo allo schermo, larga 220-280 px, con le voci una
//   sotto l'altra (mai due voci sulla stessa riga);
// - pulsanti: rettangoli con gli angoli di 4 px, alti almeno 40 px, scritta in maiuscolo (le
//   pillole tonde e i rettangoli da 8 px di prima convivevano nella stessa pagina);
// - schede: angoli di al massimo 8 px e un'ombra (elevazione), come le card dell'immagine.
{
  window.addEventListener("load", () => setTimeout(() => {
    const r = [];
    const test = (nome, wrongOnes) => {
      const all = [...new Set(wrongOnes)];
      r.push(`${nome}=${all.length ? `NO(${all.slice(0, 4).join(" / ")}${all.length > 4 ? ` e altri ${all.length - 4}` : ""})` : "ok"}`);
    };
    const descr = (x) => (x.id ? `#${x.id}` : x.tagName.toLowerCase() + [...x.classList].slice(0, 2).map((c) => "." + c).join(""))
      + (x.textContent.trim() ? ` «${x.textContent.trim().replace(/\s+/g, " ").slice(0, 20)}»` : "");
    const visible = (x) => x.getClientRects().length && getComputedStyle(x).visibility !== "hidden" && !x.closest(".is-sr-only, .fuori");
    const H = innerHeight;

    const menu = document.querySelector(".barra-voci");
    const items = menu ? [...menu.querySelectorAll(":scope > a, :scope > details > summary")].filter(visible) : [];
    const b = menu ? menu.getBoundingClientRect() : null;
    const rows = new Set(items.map((x) => Math.round(x.getBoundingClientRect().top)));
    // Le pagine prima dell'entrata (cambio della password) non hanno menu, apposta.
    if (document.querySelector(".barra")) test("menu", !b ? ["senza menu"] : [
      ...(b.left > 1 || b.bottom < H - 2 ? [`menu a ${Math.round(b.left)},${Math.round(b.top)} fino a ${Math.round(b.bottom)} su ${H}`] : []),
      ...(b.width < 220 || b.width > 280 ? [`largo ${Math.round(b.width)}`] : []),
      ...(rows.size < items.length ? [`${items.length} voci su ${rows.size} righe`] : []),
    ]);

    // Le righe dell'elenco dei post di Social sono voci di un elenco (titolo e data), non pulsanti d'azione.
    const theButtons = [...document.querySelectorAll("button, .button, a.button, input[type=submit], input[type=button], [role=button]")]
      .filter((x) => visible(x) && !x.closest(".barra, .elenco-post"));
    // Un pulsante attaccato a un campo (Calcola accanto al codice fiscale) ha gli angoli di 4px solo verso l'esterno.
    const radius = (s) => Math.max(...["TopLeft", "TopRight", "BottomLeft", "BottomRight"].map((a) => parseFloat(s[`border${a}Radius`])));
    test("pulsanti", theButtons.filter((x) => {
      const s = getComputedStyle(x);
      const r = x.closest(".has-addons") ? `${radius(s)}px` : s.borderTopLeftRadius;
      return r !== "4px" || x.getBoundingClientRect().height < 40 || (x.textContent.trim() && s.textTransform !== "uppercase");
    }).map((x) => { const s = getComputedStyle(x); return `${descr(x)} raggio ${s.borderTopLeftRadius} ${Math.round(x.getBoundingClientRect().height)}px ${s.textTransform}`; }));

    const recordCards = [...document.querySelectorAll(".riquadro, .box, .card")].filter(visible);
    test("schede", recordCards.filter((x) => { const s = getComputedStyle(x); return parseFloat(s.borderTopLeftRadius) > 8 || s.boxShadow === "none"; })
      .map((x) => `${descr(x).split(" ")[0]} raggio ${getComputedStyle(x).borderTopLeftRadius}`));

    document.title = "RISULTATO " + r.join(" ");
  }, 5000));
}
