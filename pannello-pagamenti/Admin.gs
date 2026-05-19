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

    // Saldo nucleo = saldo personale pagante + somma saldi familiari.
    // Se un familiare ha già pagato (balance=0) non incide sul totale da incassare.
    const unitBalance = m.balance + dependents.reduce((s, d) => s + d.balance, 0);
    const unitTotal   = m.total   + dependents.reduce((s, d) => s + d.total,   0);
    const unitDeposit = m.deposit + dependents.reduce((s, d) => s + d.deposit, 0);

    if (unitBalance <= 0 && m.policy !== "") return; // nucleo a posto, non mostrare

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
    if (m.balance <= 0 && m.policy !== "") return;
    units.push({
      payer: m,
      dependents: [],
      unitTotal: m.total,
      unitDeposit: m.deposit,
      unitBalance: m.balance,
      isOrphan: true
    });
    grandTotal += m.balance;
    processedIds.add(m.id);
  });

  units.sort((a, b) => a.payer.lastName.localeCompare(b.payer.lastName));
  return {units,grandTotal};
}

function updateAdminMember(rowId, deposit, policy, unitTotal) {
  const ss = SpreadsheetApp.openById("1z41N7ofw3bJK9n8f9w2DJgIgMoXW0WLfY8Xs10MnbzQ");
  const sheet = ss.getSheetByName("SOCI");

  const newDeposit = parseFloat(deposit);
  const totalCost = parseFloat(unitTotal);

  // Aggiorna polizza (Col B - indice 2) e acconto (Col V - indice 22)
  sheet.getRange(rowId, 2).setValue(policy);
  sheet.getRange(rowId, 22).setValue(newDeposit);

  // Ricalcola il saldo (Col W - indice 23)
  const newBalance = totalCost - newDeposit;
  sheet.getRange(rowId, 23).setValue(newBalance);

  return "OK";
}