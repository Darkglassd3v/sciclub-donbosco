const SS_ID = "1z41N7ofw3bJK9n8f9w2DJgIgMoXW0WLfY8Xs10MnbzQ";

function doGet() {
  return HtmlService.createTemplateFromFile('RiepilogoIndex').evaluate()
    .setTitle('Riepilogo Sci Club Don Bosco 2026')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getRiepilogo() {
  const ss = SpreadsheetApp.openById(SS_ID);
  const now = new Date();
  const seasonStart = (now.getMonth() >= 8)
    ? new Date(now.getFullYear(), 8, 1)
    : new Date(now.getFullYear() - 1, 8, 1);

  const rows = ss.getSheetByName("SOCI").getDataRange().getValues().slice(1).filter(r => {
    if (!r[2]) return false;
    const ts = r[0];
    return ts && (new Date(ts) >= seasonStart);
  });

  const tessere = {};
  const abbonamenti = {};
  const corsi = {};
  const giteSabato = {};
  const giteDomenica = {};
  let totalTeor = 0, totalInc = 0, totalSoci = 0;

  rows.forEach(r => {
    const membership   = (r[14] || "").toString().trim();
    const subscription = (r[16] || "").toString().trim();
    const sunday       = (r[17] || "").toString().trim();
    const saturday     = (r[18] || "").toString().trim();
    const course       = (r[19] || "").toString().trim();
    const total        = parseFloat(r[20]) || 0;
    const deposit      = parseFloat(r[21]) || 0;

    totalSoci++;
    totalTeor += total;
    totalInc  += deposit;

    if (membership && membership.toLowerCase() !== "no") {
      tessere[membership] = (tessere[membership] || { count: 0 });
      tessere[membership].count++;
    }

    if (subscription && subscription.toLowerCase() !== "no") {
      abbonamenti[subscription] = (abbonamenti[subscription] || 0) + 1;
    }

    if (course && course.toLowerCase() !== "no") {
      corsi[course] = (corsi[course] || 0) + 1;
    }

    if (saturday && saturday.toLowerCase() !== "no") {
      saturday.split(',').forEach(l => {
        const luogo = l.trim();
        if (luogo) giteSabato[luogo] = (giteSabato[luogo] || 0) + 1;
      });
    }

    if (sunday && sunday.toLowerCase() !== "no") {
      sunday.split(',').forEach(l => {
        const luogo = l.trim();
        if (luogo) giteDomenica[luogo] = (giteDomenica[luogo] || 0) + 1;
      });
    }
  });

  // Arricchisci tessere con prezzi dal foglio PREZZI
  const priceRows = ss.getSheetByName("PREZZI").getDataRange().getValues().slice(1);
  priceRows.forEach(p => {
    const cat  = (p[0] || "").toUpperCase();
    const name = (p[1] || "").toString().trim();
    const price = parseFloat(p[2]) || 0;
    if (cat === "TESSERA" && tessere[name]) {
      tessere[name].price = price;
      tessere[name].total = tessere[name].count * price;
    }
  });

  return {
    totalSoci,
    totalTeor,
    totalInc,
    daIncassare: totalTeor - totalInc,
    tessere,
    abbonamenti,
    corsi,
    giteSabato,
    giteDomenica,
    lastUpdate: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm")
  };
}
