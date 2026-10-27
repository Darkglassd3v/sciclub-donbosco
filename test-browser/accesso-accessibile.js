// Accesso (login.html) accessibile: è la sola pagina che si vede prima di entrare, e la prova
// sulla copia del database (test-reale/accessibilita.js) non la vede (con la sessione si entra).
// - ogni campo ha l'etichetta collegata (for=): il lettore di schermo legge «Email»;
// - il testo ha contrasto almeno 4,5:1 col fondo, 3:1 se grande (WCAG 1.4.3): il grigio di
//   Bulma (#7a7a7a) sul bianco fa 4,29.
{
  // my_access in errore: la pagina resta sull'accesso invece di entrare con la sessione finta.
  FAKE.errore = (t) => (t === "rpc:my_access" ? { message: "prova", code: "PGRST001" } : null);
  window.addEventListener("load", () => setTimeout(() => {
    const r = [];
    const fields = [...document.querySelectorAll("input, select, textarea")].filter((c) => c.type !== "hidden");
    const withoutName = fields.filter((c) => !(c.labels?.length || c.getAttribute("aria-label")?.trim()));
    r.push(`campiConNome=${withoutName.length ? `NO(${withoutName.map((c) => "#" + c.id).join(" ")})` : "ok"}`);

    const rgb = (s) => s.match(/[\d.]+/g).map(Number);
    const luce = ([R, G, B]) => {
      const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
      return 0.2126 * f(R) + 0.7152 * f(G) + 0.0722 * f(B);
    };
    const bg = (x) => {
      for (; x; x = x.parentElement) { const c = rgb(getComputedStyle(x).backgroundColor); if (c.length < 4 || c[3] > 0) return c; }
      return [255, 255, 255];
    };
    const little = [];
    for (const x of document.querySelectorAll("body *")) {
      if (!x.getClientRects().length || ![...x.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
      const s = getComputedStyle(x);
      const a = luce(rgb(s.color)), b = luce(bg(x));
      const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      const big = parseFloat(s.fontSize) >= 24 || (parseFloat(s.fontSize) >= 18.66 && Number(s.fontWeight) >= 700);
      if (ratio < (big ? 3 : 4.5)) little.push(`${x.tagName.toLowerCase()}${[...x.classList].map((c) => "." + c).join("")} ${ratio.toFixed(2)}`);
    }
    r.push(`contrasto=${little.length ? `NO(${little.join(" / ")})` : "ok"}`);
    document.title = "RISULTATO " + r.join(" ");
  }, 800));
}
