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

  // Legge TUTTI i soci della stagione (non pre-filtra per balance),
  // così i familiari già pagati vengono trovati e contribuiscono saldo=0 all'unità.
  const allMembers = [];
  for (let i = 1; i < data.length; i++) {
    const r = data[i];
    if (!r[2]) continue;
    const timestamp = r[0];
    const isCurrentSeason = timestamp && (new Date(timestamp) >= seasonStart);
    if (!isCurrentSeason) continue;

    allMembers.push({
      row: i + 1,
      id: r[23] ? r[23].toString().trim() : "",
      lastName: r[2],
      firstName: r[3],
      taxCode: r[6] ? r[6].toString().toUpperCase().trim() : "",
      membership: r[14],
      facilitation: r[15],
      subscription: r[16],
      course: r[19],
      total: parseFloat(r[20]) || 0,
      deposit: parseFloat(r[21]) || 0,
      balance: parseFloat(r[22]) || 0,
      policy: r[1] ? r[1].toString().trim() : "",
      cardNumber: r[24] ? r[24].toString() : "",
      paymentId: r[25] ? r[25].toString().trim() : ""
    });
  }

  const units = [];
  const processedIds = new Set();
  let grandTotal = 0;

  allMembers.filter(m => !m.paymentId).forEach(m => {
    if (processedIds.has(m.id)) return;

    const dependents = allMembers.filter(d => d.paymentId === m.id);

    // Usa sempre total-deposit per evitare dati stale nel campo balance.
    const pBal = x => x.total - x.deposit;
    const unitBalance = pBal(m) + dependents.reduce((s, d) => s + pBal(d), 0);
    const unitTotal   = m.total  + dependents.reduce((s, d) => s + d.total,   0);
    const unitDeposit = m.deposit + dependents.reduce((s, d) => s + d.deposit, 0);

    if (unitBalance <= 0 && m.policy !== "") return;

    units.push({
      payer: m,
      dependents: dependents,
      unitTotal: unitTotal,
      unitDeposit: unitDeposit,
      unitBalance: unitBalance
    });
    grandTotal += unitBalance;
    processedIds.add(m.id);
    dependents.forEach(d => processedIds.add(d.id));
  });

  // Soci senza pagante (orfani)
  allMembers.forEach(m => {
    if (processedIds.has(m.id)) return;
    const orphanBalance = m.total - m.deposit;
    if (orphanBalance <= 0 && m.policy !== "") return;
    units.push({
      payer: m,
      dependents: [],
      unitTotal: m.total,
      unitDeposit: m.deposit,
      unitBalance: orphanBalance,
      isOrphan: true
    });
    grandTotal += orphanBalance;
    processedIds.add(m.id);
  });

  units.sort((a, b) => a.payer.lastName.localeCompare(b.payer.lastName));
  return {units,grandTotal};
}

function updateAdminMember(rowId, deposit, policy) {
  const ss = SpreadsheetApp.openById("1z41N7ofw3bJK9n8f9w2DJgIgMoXW0WLfY8Xs10MnbzQ");
  const sheet = ss.getSheetByName("SOCI");

  const newDeposit = parseFloat(deposit) || 0;
  // Legge il totale personale direttamente dal foglio (col 21, indice 20)
  const personalTotal = parseFloat(sheet.getRange(rowId, 21).getValue()) || 0;

  sheet.getRange(rowId, 2).setValue(policy);
  sheet.getRange(rowId, 22).setValue(newDeposit);
  sheet.getRange(rowId, 23).setValue(personalTotal - newDeposit);

  return "OK";
}