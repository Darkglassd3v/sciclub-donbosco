function doGet(e) {
  return HtmlService.createTemplateFromFile('AdminIndex').evaluate()
      .setTitle('Admin - Gestione Incassi')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getAdminData() {
  const ss = SpreadsheetApp.openById("1z41N7ofw3bJK9n8f9w2DJgIgMoXW0WLfY8Xs10MnbzQ");
  const sheet = ss.getSheetByName("SOCI");
  const data = sheet.getDataRange().getValues();
  const now = new Date();
  const seasonStart = (now.getMonth() >= 8)
    ? new Date(now.getFullYear(), 8, 1)
    : new Date(now.getFullYear() - 1, 8, 1);

  const allMembers = [];

  for (let i = 1; i < data.length; i++) {
    const r = data[i];
    const timestamp = r[0];
    const isCurrentSeason = timestamp && (new Date(timestamp) >= seasonStart);

    if (isCurrentSeason) {
      allMembers.push({
        row: i + 2,
        id: r[23] ? r[23].toString().trim() : "",
        lastName: r[2],
        firstName: r[3],
        membership: r[14],
        total: parseFloat(r[20]) || 0,
        deposit: parseFloat(r[21]) || 0,
        balance: parseFloat(r[22]) || 0,
        policy: r[1] ? r[1].toString().trim() : "",
        cardNumber: r[24] ? r[24].toString() : "",
        paymentId: r[25] ? r[25].toString().trim() : ""
      });
    }
  }

  const units = [];
  const processedRows = new Set();

  allMembers.forEach(m => {
    if (!m.paymentId) {
      const dependents = allMembers.filter(d => d.paymentId === m.id && d.row !== m.row);
      const familyTotal = dependents.reduce((sum, d) => sum + d.total, 0);
      const familyBalance = dependents.reduce((sum, d) => sum + d.balance, 0);

      units.push({
        payer: m,
        dependents: dependents,
        unitTotal: m.total + familyTotal,
        unitBalance: m.balance + familyBalance
      });
      processedRows.add(m.row);
      dependents.forEach(d => processedRows.add(d.row));
    }
  });

  allMembers.forEach(m => {
    if (!processedRows.has(m.row)) {
      units.push({ payer: m, dependents: [], unitTotal: m.total, unitBalance: m.balance });
    }
  });

  // Filtro: solo chi deve ancora pagare
  const filteredUnits = units.filter(u => u.unitBalance > 0);
  filteredUnits.sort((a, b) => a.payer.lastName.localeCompare(b.payer.lastName));

  // Calcolo Totale Generale da incassare
  const grandTotalBalance = filteredUnits.reduce((sum, u) => sum + u.unitBalance, 0);

  return {
    units: filteredUnits,
    stats: {
      totalToCollect: grandTotalBalance,
      pendingCount: filteredUnits.length
    }
  };
}

function updateAdminMember(rowId, deposit, policy, unitTotal) {
  const ss = SpreadsheetApp.openById("1z41N7ofw3bJK9n8f9w2DJgIgMoXW0WLfY8Xs10MnbzQ");
  const sheet = ss.getSheetByName("SOCI");
  const newDeposit = parseFloat(deposit);
  const totalCost = parseFloat(unitTotal);

  sheet.getRange(rowId, 2).setValue(policy);
  sheet.getRange(rowId, 22).setValue(newDeposit);
  sheet.getRange(rowId, 23).setValue(totalCost - newDeposit);

  return "OK";
}