// PAGINA: index.html admin.html assicurazione.html bilancio.html gestione.html impostazioni.html password.html riepilogo.html social.html stagione.html stampe.html utenti.html ricerca/index.html ricerca/gite.html
// Il tema scuro della 3.0 (richiesta del 27/10/2026), coi dati veri, su ogni pagina:
// - contrasto: ogni testo visibile si legge sul suo fondo, almeno 4,5:1 (3:1 se grande), come
//   chiede WCAG 1.4.3; il blu del club come testo sul fondo scuro, per esempio, non si legge;
// - chiari: nessuna superficie grande resta bianca o chiarissima (Bulma ne ha molte: riquadri,
//   campi, tabelle), a parte le immagini e le anteprime dei post.
{
  document.documentElement.dataset.tema = "scuro";
  window.addEventListener("load", () => setTimeout(() => {
    const r = [];
    const test = (nome, wrongOnes) => {
      const all = [...new Set(wrongOnes)];
      r.push(`${nome}=${all.length ? `NO(${all.slice(0, 4).join(" / ")}${all.length > 4 ? ` e altri ${all.length - 4}` : ""})` : "ok"}`);
    };
    const descr = (x) => (x.id ? `#${x.id}` : x.tagName.toLowerCase() + [...x.classList].slice(0, 2).map((c) => "." + c).join(""));
    const rgb = (s) => (s.match(/[\d.]+/g) || [0, 0, 0, 0]).map(Number);
    const luce = ([R, G, B]) => {
      const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
      return 0.2126 * f(R) + 0.7152 * f(G) + 0.0722 * f(B);
    };
    const bg = (x) => {
      for (; x; x = x.parentElement) { const c = rgb(getComputedStyle(x).backgroundColor); if (c.length < 4 || c[3] > 0.5) return c; }
      return rgb(getComputedStyle(document.documentElement).backgroundColor);
    };
    const visible = (x) => x.getClientRects().length && getComputedStyle(x).visibility !== "hidden" && !x.closest(".is-sr-only, .fuori, canvas, .anteprima");
    const elements = [...document.querySelectorAll("body *")].filter(visible);

    const little = [];
    for (const x of elements) {
      if (![...x.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
      if (x.closest("button:disabled, .button[disabled], input:disabled, select:disabled, [aria-disabled=true]")) continue;   // i comandi spenti possono essere tenui
      const s = getComputedStyle(x);
      const a = luce(rgb(s.color)), b = luce(bg(x));
      const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      const big = parseFloat(s.fontSize) >= 24 || (parseFloat(s.fontSize) >= 18.66 && Number(s.fontWeight) >= 700);
      if (ratio < (big ? 3 : 4.5)) little.push(`${descr(x)} «${x.textContent.trim().slice(0, 14)}» ${ratio.toFixed(1)}`);
    }
    test("contrasto", little);

    test("chiari", elements.filter((x) => {
      const c = rgb(getComputedStyle(x).backgroundColor);
      if (c.length >= 4 && c[3] < 0.5) return false;
      const b = x.getBoundingClientRect();
      // Chiaro e quasi grigio (bianco, le tinte chiarissime delle sezioni); i colori pieni del club (il giallo della domenica) no.
      const grey = Math.max(c[0], c[1], c[2]) - Math.min(c[0], c[1], c[2]) < 40;
      return b.width * b.height > 4000 && (luce(c) > 0.8 || (luce(c) > 0.6 && grey)) && !x.closest("img, svg, .barra-voci [aria-current]");
    }).map((x) => `${descr(x)} ${getComputedStyle(x).backgroundColor}`));

    document.title = "RISULTATO " + r.join(" ");
  }, 5000));
}
