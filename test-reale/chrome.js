// Apre una pagina in Chrome headless a tempo reale e stampa il titolo quando la
// prova lo scrive («RISULTATO …»). Con le richieste di rete vere il tempo
// virtuale di --dump-dom (test-browser/esegui.sh) a volte chiude la pagina a
// metà: qui si guida Chrome dal protocollo DevTools (WebSocket di Node 22).
// Gli errori della pagina vanno su stderr.
//
//   node chrome.js <chrome> <url> [larghezza] [attesa massima in ms]
const { spawn } = require("child_process");
const [chrome, url, larghezza = "1280", attesa = "90000"] = process.argv.slice(2);
const porta = 9300 + (process.pid % 600);
const proc = spawn(chrome, ["--headless=new", "--disable-gpu", "--no-sandbox", `--remote-debugging-port=${porta}`,
  `--window-size=${larghezza},1000`, `--user-data-dir=/tmp/chrome-prova-${process.pid}`, "about:blank"], { stdio: "ignore" });
const fine = (testo, codice = 0) => { if (testo) console.log(testo); proc.kill(); process.exit(codice); };
setTimeout(() => fine("", 1), Number(attesa) + 15000);

(async () => {
  let pagine;
  for (let i = 0; i < 100 && !pagine; i++) {
    try { pagine = await (await fetch(`http://127.0.0.1:${porta}/json/list`)).json(); } catch { await new Promise((ok) => setTimeout(ok, 100)); }
  }
  const pagina = pagine?.find((p) => p.type === "page");
  if (!pagina) fine("", 1);
  const ws = new WebSocket(pagina.webSocketDebuggerUrl);
  let n = 0;
  const attese = new Map();
  const manda = (method, params = {}) => new Promise((ok) => { const id = ++n; attese.set(id, ok); ws.send(JSON.stringify({ id, method, params })); });
  ws.onmessage = ({ data }) => {
    const m = JSON.parse(data);
    if (m.id && attese.has(m.id)) { attese.get(m.id)(m.result); attese.delete(m.id); }
    if (m.method === "Runtime.exceptionThrown") console.error("eccezione:", m.params.exceptionDetails?.exception?.description?.split("\n")[0]);
    if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error")
      console.error("console:", m.params.args.map((a) => a.value ?? a.description).join(" ").slice(0, 300));
  };
  await new Promise((ok) => (ws.onopen = ok));
  await manda("Runtime.enable");
  await manda("Page.navigate", { url });
  const inizio = Date.now();
  while (Date.now() - inizio < Number(attesa)) {
    await new Promise((ok) => setTimeout(ok, 500));
    const r = await manda("Runtime.evaluate", { expression: "document.title" });
    const titolo = r?.result?.value || "";
    if (titolo.startsWith("RISULTATO ")) fine(titolo);
  }
  const r = await manda("Runtime.evaluate", { expression: "document.title + ' @ ' + location.pathname" });
  fine(`SCADUTA ${r?.result?.value || ""}`, 1);
})();
