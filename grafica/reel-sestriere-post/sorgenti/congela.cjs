#!/usr/bin/env node
// Rifà index.html: disegna la story vera del Dream Weekend con web/social-templates.js in Chrome headless, ne
// congela il risultato (il testo è già adattato da fit(), che misura e quindi non si può eseguire mentre si esporta
// il video) e ci aggiunge i tempi con cui i pezzi del post compaiono uno dopo l'altro.
// Se il post cambia si aggiornano EVENT e CONTACTS, si lancia `node sorgenti/congela.cjs` e si esporta di nuovo.
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const CHROME = process.env.CHROME || "google-chrome";
const DURATION = 14;

// La riga di social_events del post (id 0d8e762f-d78f-4940-81b3-723b51bb0e37) al 4/11/2026, con la foto come file.
const EVENT = {
  kind: "weekend", title: "Sestriere", hook: "DREAM WEEKEND - POSTI LIMITATI",
  subtitle: "• Mezza pensione in camera doppia\n• Con o senza skipass Vialattea\n• Prezzi ridotti per ragazzi e bambini",
  place: "*Hotel Fronte Piste, Sestriere*", event_date: "2026-12-11", end_date: "2026-12-13", deadline: null,
  prices: [], show_price: true, facts: [], stops: [], photo: "assets/sestriere.jpg", photo_x: 38, photo_y: 45, photo_zoom: null,
  contacts: ["cesare", "beppe", "domenico"],
};
const CONTACTS = [
  { id: "cesare", name: "Cesare", phone: "3485171707", hours: null },
  { id: "beppe", name: "Beppe", phone: "3393291015", hours: null },
  { id: "domenico", name: "Domenico", phone: "3895794663", hours: null },
];
// Colore «Eventi e weekend» salvato nelle impostazioni (social_settings.event_color).
const EVENT_COLOR = "#147A45";

// Nei Reels didascalia e nome coprono più del fondo che nelle story, e la colonna dei pulsanti copre il bordo destro.
const REEL_SAFE = { bottom: 1510, right: 960 };
// La colonna sta qualche pixel più dentro: fit() tollera che l'ultima riga sporga di poco.
const REEL_CSS = `.cv.nuovo.sk.story { --giu: ${1920 - REEL_SAFE.bottom - 44 + 10}px; }
.cv.nuovo.sk.story .col { right: ${1080 - REEL_SAFE.right + 15}px; }`;

const FONT_FACES = fs.readFileSync(path.join(ROOT, "assets/font/barlow.css"), "utf8")
  .replace(/url\(([^)"]+)\)/g, 'url("assets/font/$1")')
  // Il foglio del generatore lo nomina per il carosello: qui non si vede, ma il controllo di HyperFrames lo pretende.
  + '\n@font-face { font-family: "Barlow Condensed"; font-weight: 800; src: url("assets/font-condensed/barlow-condensed-800.woff2") format("woff2"); }';

const drawPage = `<!doctype html><meta charset="utf-8"><style>${FONT_FACES}</style><style>${REEL_CSS}</style><body>
<script src="${path.relative(ROOT, path.resolve(ROOT, "../../web/social-templates.js"))}"></script>
<script>
SOCIAL.logoTondo = "assets/logo-ufficiale-blu-tondo.svg";
setEventColor(${JSON.stringify(EVENT_COLOR)});
setContacts(${JSON.stringify(CONTACTS)});
const box = document.createElement("div");
box.id = "post";
box.innerHTML = drawPost(postTemplate(${JSON.stringify(EVENT)}, "story"));
document.body.append(box, document.createComment("fine-post"));
Promise.all(["500 40px Barlow", "600 40px Barlow", "800 40px Barlow", "italic 800 40px Barlow"].map((f) => document.fonts.load(f)))
  .then(() => document.fonts.ready)
  .then(() => {
    const overflows = fit(box);
    const edges = [...box.querySelectorAll(".col *")].map((el) => el.getBoundingClientRect());
    box.dataset.misure = JSON.stringify({ overflows, scale: getComputedStyle(box.querySelector(".testo")).getPropertyValue("--s"),
      bottom: Math.max(...edges.map((r) => r.bottom)), right: Math.max(...edges.map((r) => r.right)) });
  });
</script>`;

const tempPage = path.join(ROOT, ".congela.html");
fs.writeFileSync(tempPage, drawPage);
let dump;
try {
  dump = execFileSync(CHROME, ["--headless=new", "--disable-gpu", "--no-sandbox", "--allow-file-access-from-files",
    "--window-size=1080,1920", "--virtual-time-budget=8000", "--dump-dom", `file://${tempPage}`],
    { encoding: "utf8", maxBuffer: 1 << 26, stdio: ["ignore", "pipe", "ignore"] });
} finally {
  fs.unlinkSync(tempPage);
}

const styleOf = (id) => dump.match(new RegExp(`<style id="${id}">([\\s\\S]*?)</style>`))[1];
const frozen = dump.match(/<div id="post"[^>]*>([\s\S]*?)<\/div>\s*<!--fine-post-->/)[1];
const measures = JSON.parse(dump.match(/data-misure="([^"]+)"/)[1].replace(/&quot;/g, '"'));

// Controllo prima di scrivere: tutti i dati del post ci sono, nessun prezzo, niente sotto le zone coperte dei Reels.
const required = ["DREAM WEEKEND - POSTI LIMITATI", "Sestriere", "11–13", "dicembre", "2 notti", "Mezza pensione in camera doppia",
  "Con o senza skipass Vialattea", "Prezzi ridotti per ragazzi e bambini", "Hotel Fronte Piste, Sestriere",
  "sciclubdonboscoasti@gmail.com", "3485171707", "3393291015", "3895794663"];
for (const text of required) if (!frozen.includes(text)) throw new Error(`Manca dal post: ${text}`);
if (/€/.test(frozen)) throw new Error("Nel post c'è un prezzo");
if (measures.overflows) throw new Error(`Il testo non ci sta: ${JSON.stringify(measures)}`);
if (measures.bottom > REEL_SAFE.bottom || measures.right > REEL_SAFE.right) throw new Error(`Testo nelle zone coperte: ${JSON.stringify(measures)}`);

const timeline = `const tl = gsap.timeline({ paused: true });
      // Foto, piani e logo ci sono dal primo fotogramma; il resto del post si aggiunge pezzo per pezzo, senza che
      // niente se ne vada, nell'ordine in cui si legge.
      const add = (target, at) => tl.fromTo(target, { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: "power2.out" }, at);
      tl.fromTo(".tessera", { y: -760 }, { y: 0, duration: 0.55, ease: "power3.out" }, 0.2);
      add(".gancio", 0.8);
      add(".tit", 1.5);
      add(".elenco li:nth-child(1)", 2.5);
      add(".elenco li:nth-child(2)", 3.5);
      add(".elenco li:nth-child(3)", 4.5);
      add(".dove", 5.5);
      add([".isc > svg", ".isc > div"], 6.6);
      add(".tel > svg", 7.7);
      add(".tel > span:nth-of-type(1)", 7.7);
      add(".tel > span:nth-of-type(2)", 8.1);
      add(".tel > span:nth-of-type(3)", 8.5);
      // Il post completo resta fermo fino alla fine, per il tempo di leggere i telefoni.
      window.__timelines["main"] = tl;`;

const page = `<!doctype html>
<!-- Generato da sorgenti/congela.cjs: non modificare a mano, le modifiche si perderebbero. -->
<html lang="it">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>
${FONT_FACES}
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: 1080px; height: 1920px; overflow: hidden; background: #06396a; }
      #root { position: relative; width: 100%; height: 100%; overflow: hidden; }
${styleOf("stile-social")}
${styleOf("stile-social-nuovi")}
${REEL_CSS}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${DURATION}" data-width="1080" data-height="1920">
      ${frozen.trim()}
    </div>
    <script>
      ${timeline}
    </script>
  </body>
</html>
`;
fs.writeFileSync(path.join(ROOT, "index.html"), page);
console.log("index.html scritto", measures);
