const { chromium } = require(process.env.G + "/playwright");
const fs = require("fs");
const D = process.argv[2], L = 1080, w = 840;
(async () => {
  const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  const p = await b.newPage({ viewport: { width: L, height: L } });
  const svg = fs.readFileSync(D + "/logo_sciclubdonbosco.svg", "utf8").replace("<svg ", `<svg width="${w}" `);
  // Bianco, logo al centro con margine: WhatsApp ritaglia la foto in un cerchio.
  await p.setContent(`<body style="margin:0;width:${L}px;height:${L}px;background:#fff;display:flex;align-items:center;justify-content:center">${svg}</body>`);
  await p.screenshot({ path: D + "/logo_sciclubdonbosco_quadrato.jpg", type: "jpeg", quality: 95 });
  // Anteprima col ritaglio a cerchio, per controllo.
  await p.setContent(`<body style="margin:0;width:${L}px;height:${L}px;background:#ECE5DD;display:flex;align-items:center;justify-content:center"><div style="width:${L}px;height:${L}px;border-radius:50%;overflow:hidden;background:#fff;display:flex;align-items:center;justify-content:center">${svg}</div></body>`);
  await p.screenshot({ path: D + "/anteprima_cerchio.png" });
  await b.close();
})();
