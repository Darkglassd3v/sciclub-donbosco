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
    const policy = r[1] ? r[1].toString().trim() : "";
    const balance = parseFloat(r[22]) || 0;
    const isCurrentSeason = timestamp && (new Date(timestamp) >= seasonStart);

    if (isCurrentSeason && (balance > 0 || policy === "")) {
      const member = {
        row: i + 1,
        id: r[23] ? r[23].toString().trim() : "",
        lastName: r[2],
        firstName: r[3],
        taxCode: r[6] ? r[6].toString().toUpperCase().trim() : "",
        membership: r[14],
        course: r[19],
        total: parseFloat(r[20]) || 0,
        familyTotal: parseFloat(r[26]) || 0, // Colonna AA (27esima, indice 26)
        deposit: parseFloat(r[21]) || 0,
        balance: balance,
        policy: policy,
        cardNumber: r[24] ? r[24].toString() : "",
        paymentId: r[25] ? r[25].toString().trim() : ""
      };
      allMembers.push(member);
    }
  }

  const units = [];
  const processedRows = new Set();

  allMembers.forEach(m => {
    if (!m.paymentId) {
      const dependents = allMembers.filter(d => d.paymentId === m.id || d.paymentId === m.taxCode);

      // LOGICA RICHIESTA: Totale Pagante = Totale Personale + Totale Familiari
      const unitTotalCombined = m.total + m.familyTotal;
      const unitBalanceCalculated = unitTotalCombined - m.deposit;

      units.push({
        payer: m,
        dependents: dependents,
        unitTotal: unitTotalCombined,
        unitDeposit: m.deposit,
        unitBalance: unitBalanceCalculated
      });

      processedRows.add(m.row);
      dependents.forEach(d => processedRows.add(d.row));
    }
  });

  allMembers.forEach(m => {
    if (!processedRows.has(m.row)) {
      units.push({
        payer: m,
        dependents: [],
        unitTotal: m.total,
        unitDeposit: m.deposit,
        unitBalance: m.balance,
        isOrphan: true
      });
    }
  });

  units.sort((a, b) => a.payer.lastName.localeCompare(b.payer.lastName));
  return units;
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