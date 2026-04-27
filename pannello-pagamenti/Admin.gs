function doGet(e) {
  return HtmlService.createTemplateFromFile('AdminIndex').evaluate()
      .setTitle('Admin - Gestione Incassi')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getAdminData() {
  const ss = SpreadsheetApp.openById("1z41N7ofw3bJK9n8f9w2DJgIgMoXW0WLfY8Xs10MnbzQ");
  const sheet = ss.getSheetByName("Risposte del modulo 1");
  const data = sheet.getDataRange().getValues();

  const now = new Date();
  const seasonStart = (now.getMonth() >= 8)
    ? new Date(now.getFullYear(), 8, 1)
    : new Date(now.getFullYear() - 1, 8, 1);

  const allMembers = [];

  // 1. Estrazione dati con filtro: Saldo > 0 OPPURE Polizza Mancante
  for (let i = 1; i < data.length; i++) {
    const r = data[i];
    const timestamp = r[0];
    const policy = r[1] ? r[1].toString().trim() : "";
    const balance = parseFloat(r[22]) || 0;

    const isCurrentSeason = timestamp && (new Date(timestamp) >= seasonStart);

    if (isCurrentSeason && (balance > 0 || policy === "")) {
      const member = {
        row: i + 2, // +2 perché sheet è 1-indexed e salta l'header
        id: r[23] ? r[23].toString().trim() : "",           // Colonna 24 (X) - UUID
        lastName: r[2],
        firstName: r[3],
        taxCode: r[6] ? r[6].toString().toUpperCase().trim() : "",
        membership: r[14],
        course: r[19],
        total: parseFloat(r[20]) || 0,
        deposit: parseFloat(r[21]) || 0,
        balance: balance,
        policy: policy,
        cardNumber: r[24] ? r[24].toString() : "",          // Colonna 25 (Y)
        paymentId: r[25] ? r[25].toString().trim() : ""     // Colonna 26 (Z) - ID PAGANTE
      };
      allMembers.push(member);
    }
  }

  // 2. Costruzione Unità di Pagamento usando ID invece di CF
  const units = [];
  const processedRows = new Set();

  // Prima passata: Identifica i paganti "indipendenti" (senza paymentId)
  allMembers.forEach(m => {
    if (!m.paymentId) {
      // Questo è un capofamiglia o un singolo
      const dependents = allMembers.filter(d =>
        d.paymentId === m.id && d.row !== m.row
      );

      const familyTotal = dependents.reduce((sum, d) => sum + d.total, 0);
      const familyDeposit = dependents.reduce((sum, d) => sum + d.deposit, 0);
      const familyBalance = dependents.reduce((sum, d) => sum + d.balance, 0);

      units.push({
        payer: m,
        dependents: dependents,
        unitTotal: m.total + familyTotal,
        unitDeposit: m.deposit + familyDeposit,
        unitBalance: m.balance + familyBalance
      });

      processedRows.add(m.row);
      dependents.forEach(d => processedRows.add(d.row));
    }
  });

  // Seconda passata: Aggiungi chi è rimasto fuori (casi orfani)
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

  // Ordina per cognome del pagante
  units.sort((a, b) => a.payer.lastName.localeCompare(b.payer.lastName));

  return units;
}

function updateAdminMember(rowId, deposit, policy) {
  const ss = SpreadsheetApp.openById("1z41N7ofw3bJK9n8f9w2DJgIgMoXW0WLfY8Xs10MnbzQ");
  const sheet = ss.getSheetByName("Risposte del modulo 1");

  // Aggiorna polizza e acconto
  sheet.getRange(rowId, 2).setValue(policy);  // Colonna B
  sheet.getRange(rowId, 22).setValue(parseFloat(deposit));  // Colonna V (deposit)

  // Ricalcola il saldo
  const total = parseFloat(sheet.getRange(rowId, 21).getValue()) || 0;  // Colonna U (total)
  const newBalance = total - parseFloat(deposit);
  sheet.getRange(rowId, 23).setValue(newBalance);  // Colonna W (balance)

  return "OK";
}