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
    window.addEventListener("load", () => setTimeout(() => {
      const last = snap();
      const changed = [...last.filter((x) => !first.includes(x)), ...first.filter((x) => !last.includes(x)).map((x) => `gone:${x}`)];
      document.title = `RISULTATO steady=${changed.length ? `NO(${changed.join(" ")})` : "ok"}`;
    }, 1500));
  }
}
