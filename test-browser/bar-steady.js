// Bar and side menu stay still while a page opens: before shared.js runs (the browser
// may paint there) they are already as they end up, with the database answering late as
// over the network. What they need before my_access answers (who is logged in, the bar
// height, the page name on the phone) comes from the previous page or from the HTML, so
// going from page to page the bar does not flicker.
// This script replaces supabase-js, right before shared.js: its first snapshot is taken
// there. The first load fills the browser memory like any page; the reload is measured.
{
  FAKE.ritardo = () => 300;
  const shown = (x) => {
    const b = x.getBoundingClientRect();
    return b.width > 0 && b.right > 0 && b.left < innerWidth && getComputedStyle(x).visibility !== "hidden";
  };
  const snap = () => [...document.querySelectorAll(".barra, .barra-dentro > *, .barra-azioni > *, .barra-voci > *")]
    .filter(shown)
    .map((x) => {
      const b = x.getBoundingClientRect();
      return `${(typeof x.className === "string" && x.className.split(" ")[0]) || x.tagName.toLowerCase()}`
        + `${x.dataset.permesso ? `(${x.dataset.permesso})` : ""}:${Math.round(b.left)},${Math.round(b.top)},${Math.round(b.width)}x${Math.round(b.height)}`
        + (x.classList.contains("barra-pagina") ? `«${x.textContent.trim()}»` : "");
    });
  if (!sessionStorage.getItem("bar-steady")) {
    window.addEventListener("load", () => setTimeout(() => {
      sessionStorage.setItem("bar-steady", "1");
      location.reload();
    }, 1200));
  } else {
    const first = snap();
    // Going to another page, bar and menu stay still and only the content changes: the
    // page opts into the cross-document view transition and names bar and menu, once each
    // (a name used twice makes the browser skip the transition).
    const transition = () => {
      // Browsers without cross-document view transitions (Firefox 158) drop the rule:
      // there pages change as before, with bar and menu already steady (above).
      if (typeof CSSViewTransitionRule === "undefined") return "n/a";
      const rule = [...document.styleSheets].some((sheet) => {
        try { return [...sheet.cssRules].some((r) => /^@view-transition\b/.test(r.cssText) && /navigation:\s*auto/.test(r.cssText)); }
        catch (e) { return false; }   // cross-origin sheet (Bulma)
      });
      const names = [...document.querySelectorAll("*")].map((x) => getComputedStyle(x).viewTransitionName).filter((n) => n && n !== "none");
      const once = (n) => names.filter((x) => x === n).length === 1;
      const wrong = [!rule && "no @view-transition", !once("barra") && "barra", !once("menu") && "menu",
        new Set(names).size !== names.length && `doubles ${names.join(",")}`].filter(Boolean);
      return wrong.length ? `NO(${wrong.join(" ")})` : "ok";
    };
    window.addEventListener("load", () => setTimeout(() => {
      const last = snap();
      const changed = [...last.filter((x) => !first.includes(x)), ...first.filter((x) => !last.includes(x)).map((x) => `gone:${x}`)];
      document.title = `RISULTATO steady=${changed.length ? `NO(${changed.join(" ")})` : "ok"} transition=${transition()}`;
    }, 1500));
  }
}
