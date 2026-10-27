// Apre una pagina in Chrome headless a tempo reale e stampa il titolo quando la
// prova lo scrive («RISULTATO …»). Con le richieste di rete vere il tempo
// virtuale di --dump-dom (test-browser/esegui.sh) a volte chiude la pagina a
// metà: qui si guida Chrome dal protocollo DevTools (WebSocket di Node 22).
// Gli errori della pagina vanno su stderr.
//
//   node chrome.js <chrome> <url> [larghezza] [attesa massima in ms] [foto.png]
// Una larghezza sotto i 500 px è un telefono simulato (390: alto 844).
// Con foto.png, appena c'è il risultato salva la pagina intera (le foto di avvia.sh, FOTO=1).
const { spawn } = require("child_process");
const fs = require("fs");
const [chrome, url, widthPx = "1280", waiting = "90000", picture] = process.argv.slice(2);
const port = 9300 + (process.pid % 600);
const proc = spawn(chrome, ["--headless=new", "--disable-gpu", "--no-sandbox", `--remote-debugging-port=${port}`,
  `--window-size=${widthPx},1000`, `--user-data-dir=/tmp/chrome-prova-${process.pid}`, "about:blank"], { stdio: "ignore" });
const fine = (text, codeValue = 0) => { if (text) console.log(text); proc.kill(); process.exit(codeValue); };
setTimeout(() => fine("", 1), Number(waiting) + 15000);

(async () => {
  let pages;
  for (let i = 0; i < 100 && !pages; i++) {
    try { pages = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); } catch { await new Promise((ok) => setTimeout(ok, 100)); }
  }
  const page = pages?.find((p) => p.type === "page");
  if (!page) fine("", 1);
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let n = 0;
  const pending = new Map();
  const dispatch = (method, params = {}) => new Promise((ok) => { const id = ++n; pending.set(id, ok); ws.send(JSON.stringify({ id, method, params: params })); });
  ws.onmessage = ({ data }) => {
    const m = JSON.parse(data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
    if (m.method === "Runtime.exceptionThrown") console.error("eccezione:", m.params.exceptionDetails?.exception?.description?.split("\n")[0]);
    if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error")
      console.error("console:", m.params.args.map((a) => a.value ?? a.description).join(" ").slice(0, 300));
  };
  await new Promise((ok) => (ws.onopen = ok));
  await dispatch("Runtime.enable");
  // Sotto i 500 px (il minimo della finestra di Chrome headless) si simula il telefono: 390 è un
  // iPhone, con la pagina che si comporta come su un telefono vero (mobile: true).
  if (Number(widthPx) < 500) {
    await dispatch("Emulation.setDeviceMetricsOverride", { width: Number(widthPx), height: 844, deviceScaleFactor: 1, mobile: true });
  }
  await dispatch("Page.navigate", { url });
  const start = Date.now();
  while (Date.now() - start < Number(waiting)) {
    await new Promise((ok) => setTimeout(ok, 500));
    const r = await dispatch("Runtime.evaluate", { expression: "document.title" });
    const titleText = r?.result?.value || "";
    if (titleText.startsWith("RISULTATO ")) {
      if (picture) {
        const sizes = await dispatch("Page.getLayoutMetrics");
        const alto = Math.min(Math.ceil(sizes?.cssContentSize?.height || 1000), 12000);
        const shot = await dispatch("Page.captureScreenshot", { format: "png", captureBeyondViewport: true,
          clip: { x: 0, y: 0, width: Number(widthPx), height: alto, scale: 1 } });
        if (shot?.data) fs.writeFileSync(picture, Buffer.from(shot.data, "base64"));
      }
      fine(titleText);
    }
  }
  const r = await dispatch("Runtime.evaluate", { expression: "document.title + ' @ ' + location.pathname" });
  fine(`SCADUTA ${r?.result?.value || ""}`, 1);
})();
