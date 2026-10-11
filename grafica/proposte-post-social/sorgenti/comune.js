// Formato dal frammento dell'indirizzo: #post (1080×1350) o #story (1080×1920).
// Con "-verifica" (es. #story-verifica) scrive nel titolo della pagina i
// problemi trovati: testo sotto il corpo minimo (34 px nel post, 44 nella
// story), fuori dalla tela, nelle fasce coperte della story, riquadri che
// tagliano il contenuto. Lo legge rendi.sh con --dump-dom.
const [formato, verifica] = (location.hash.slice(1) || "post").split("-");
document.documentElement.className = formato;

/* Fiocchi di neve, come fiocchi() di web/social-templates.js: generatore a
 * seme fisso, sempre gli stessi fiocchi negli stessi punti. */
const FIOCCO = '<path d="M11 2h2v4l2-2 1.4 1.4L13 8.8V11h2.2l3.4-3.4L20 9l-2 2h4v2h-4l2 2-1.4 1.4-3.4-3.4H13v2.2l3.4 3.4L15 20l-2-2v4h-2v-4l-2 2-1.4-1.4 3.4-3.4V13H8.8l-3.4 3.4L4 15l2-2H2v-2h4L4 9l1.4-1.4L8.8 11H11V8.8L7.6 5.4 9 4l2 2V2Z"/>';
document.querySelectorAll("[data-neve]").forEach((el) => {
  const w = el.offsetWidth, h = el.offsetHeight, opacita = Number(el.dataset.neve || .32), colore = el.dataset.colore || "#fff";
  let x = 7, out = "";
  const caso = () => (x = (x * 9301 + 49297) % 233280) / 233280;
  for (let i = Math.round(w * h / 42000); i > 0; i--) {
    const px = Math.round(30 + caso() * 60);
    out += `<svg style="position:absolute;left:${Math.round(caso() * w)}px;top:${Math.round(caso() * h)}px;opacity:${(opacita * (.5 + caso() / 2)).toFixed(2)};transform:rotate(${Math.round(caso() * 60)}deg)" width="${px}" height="${px}" viewBox="0 0 24 24" fill="${colore}">${FIOCCO}</svg>`;
  }
  el.innerHTML = out;
});

if (verifica) document.fonts.ready.then(() => {
  const story = formato === "story", min = story ? 44 : 34, H = story ? 1920 : 1350, problemi = [];
  const testi = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (testi.nextNode()) {
    const t = testi.currentNode, el = t.parentElement;
    if (!t.textContent.trim() || el.closest("script,style,[data-decoro]")) continue;
    const r = document.createRange(); r.selectNodeContents(t);
    const b = r.getBoundingClientRect(), nome = t.textContent.trim().slice(0, 28);
    if (parseFloat(getComputedStyle(el).fontSize) < min) problemi.push(`corpo ${getComputedStyle(el).fontSize}: ${nome}`);
    if (b.left < 0 || b.right > 1080 || b.top < 0 || b.bottom > H) problemi.push(`fuori tela: ${nome}`);
    if (story && (b.top < 250 || b.bottom > 1920 - 340)) problemi.push(`fascia coperta: ${nome}`);
  }
  document.querySelectorAll("body *").forEach((el) => {
    if (getComputedStyle(el).overflow !== "hidden" || el.matches(".cv,[data-decoro]")) return;
    if (el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1) problemi.push(`taglia: ${el.className} (${el.scrollWidth}×${el.scrollHeight} in ${el.clientWidth}×${el.clientHeight})`);
  });
  document.title = "VERIFICA " + JSON.stringify(problemi);
});
