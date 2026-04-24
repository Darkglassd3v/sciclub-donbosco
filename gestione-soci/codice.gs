function doGet() {
  return HtmlService.createTemplateFromFile('Index').evaluate()
      .setTitle('Sci Club Don Bosco Management')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getPrices() {
  const ss = SpreadsheetApp.openById("1z41N7ofw3bJK9n8f9w2DJgIgMoXW0WLfY8Xs10MnbzQ");
  const priceData = ss.getSheetByName("PREZZI").getDataRange().getValues();
  const prices = { TESSERA: [], FAMIGLIA: [], ABBONAMENTO: [], CORSO: [] };
  for (let i = 1; i < priceData.length; i++) {
    const cat = priceData[i][0].toUpperCase();
    if (prices[cat]) prices[cat].push({ name: priceData[i][1], price: priceData[i][2] });
  }
  return prices;
}

function getDepartures() {
  const ss = SpreadsheetApp.openById("1z41N7ofw3bJK9n8f9w2DJgIgMoXW0WLfY8Xs10MnbzQ");
  const sheet = ss.getSheetByName("PARTENZE");
  const data = sheet.getDataRange().getValues();

  // Organizziamo i dati in un oggetto con le chiavi SABATO e DOMENICA
  const departures = { SABATO: [], DOMENICA: [] };

  for (let i = 1; i < data.length; i++) {
    const giorno = data[i][0].toUpperCase(); // Colonna A: Giorno partenza
    const luogo = data[i][1];               // Colonna B: Luogo
    if (departures[giorno]) {
      departures[giorno].push(luogo);
    }
  }
  return departures;
}

function getMembers() {
  const ss = SpreadsheetApp.openById("1z41N7ofw3bJK9n8f9w2DJgIgMoXW0WLfY8Xs10MnbzQ");
  const memberData = ss.getSheetByName("SOCI").getDataRange().getValues();
  return memberData.slice(1).filter(r => r[2]).map((r, i) => ({
    row: i + 2,
    policy: r[1],
    lastName: r[2],
    firstName: r[3],
    birthPlace: r[4],
    birthProv: r[5],
    taxCode: r[6],
    birthDate: (function(val) {
      if (!val) return "";
      let d = (val instanceof Date) ? val : new Date(val);
      if (isNaN(d.getTime())) {
        const cleanVal = val.toString().replace(/\\/g, '/');
        const parts = cleanVal.split('/');
        if (parts.length === 3) {
          let year = parseInt(parts[2]);
          year = year < 30 ? 2000 + year : (year < 100 ? 1900 + year : year);
          return `${year}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
        }
        return val;
      }
      return Utilities.formatDate(d, "GMT+1", "yyyy-MM-dd");
    })(r[7]),
    address: r[8],
    city: r[9],
    prov: r[10],
    cap: r[11],
    phone: r[12].toString(),
    email: r[13],
    membership: r[14],
    family: r[15],
    subscription: r[16],
    sunday: r[17],
    saturday: r[18],
    course: r[19],
    total: r[20],
    deposit: r[21],
    balance: r[22],
    // r[23] = uid (colonna 24, non esposta al frontend)
    cardNumber: r[24] ? r[24].toString() : "",  // colonna 25 - NUOVO
    payerCode: r[25] ? r[25].toString() : ""    // colonna 26 - NUOVO
  }));
}

function saveMember(d) {
  const uid = Utilities.getUuid();
  const ss = SpreadsheetApp.openById("1z41N7ofw3bJK9n8f9w2DJgIgMoXW0WLfY8Xs10MnbzQ");
  const sheet = ss.getSheetByName("SOCI");

  const rowData = [
    new Date(),       // col 1
    d.policy,         // col 2
    d.lastName,       // col 3
    d.firstName,      // col 4
    d.birthPlace,     // col 5
    d.birthProv,      // col 6
    d.taxCode,        // col 7
    d.birthDate,      // col 8
    d.address,        // col 9
    d.city,           // col 10
    d.prov,           // col 11
    d.cap,            // col 12
    d.phone,          // col 13
    d.email,          // col 14
    d.membership,     // col 15
    d.family,         // col 16
    d.subscription,   // col 17
    d.sunday,         // col 18
    d.saturday,       // col 19
    d.course,         // col 20
    d.total,          // col 21
    d.deposit,        // col 22
    d.balance,        // col 23
    uid,              // col 24 - invariato (usato per link polizza)
    d.cardNumber,     // col 25 - NUOVO: numero tessera
    d.payerCode       // col 26 - NUOVO: codice fiscale del pagante (capofamiglia)
  ];

  if (d.row > 0) {
    sheet.getRange(parseInt(d.row), 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }

  if (d.sendEmail) {
    sendSummaryEmail(d, uid);
    return "✅ Socio " + d.lastName + " salvato e email inviata!";
  }

  return "✅ Modifiche salvate per " + d.lastName;
}

function sendSummaryEmail(d, uid) {
  const recipient = "federico.cossetta90@gmail.com";
  const webAppUrl = "https://script.google.com/macros/s/AKfycbw-H4oSUtVBMOa_Pe7g4Am-1cziCj2veLsvFk3RdUxQ_RuqYJsPhV7Skk9lZYLnDTYt/exec?id=" + uid;
  const whatsappUrl = `https://wa.me/${d.phone.replace(/\s+/g, '')}?text=${encodeURIComponent("Ciao " + d.firstName + ", iscrizione confermata!")}`;

  const htmlTable = `
    <div style="font-family: sans-serif; color: #333; max-width: 600px;">
      <h2 style="color: #1a73e8;">Riepilogo Iscrizione</h2>
      <table border="1" cellpadding="10" cellspacing="0" style="border-collapse: collapse; width: 100%; border: 1px solid #ddd;">
        <tr style="background: #f8f9fa;"><td><b>COGNOME</b></td><td>${d.lastName}</td></tr>
        <tr><td><b>NOME</b></td><td>${d.firstName}</td></tr>
        <tr style="background: #f8f9fa;"><td><b>CODICE FISCALE</b></td><td>${d.taxCode}</td></tr>
        <tr><td><b>DATA DI NASCITA</b></td><td>${d.birthDate}</td></tr>
        <tr style="background: #f8f9fa;"><td><b>TELEFONO</b></td><td>${d.phone}</td></tr>
        <tr><td><b>TESSERA</b></td><td>${d.membership}</td></tr>
        <tr style="background: #f8f9fa;"><td><b>NUMERO TESSERA</b></td><td>${d.cardNumber || "—"}</td></tr>
        <tr><td><b>TOTALE DOVUTO</b></td><td>${d.total} €</td></tr>
        <tr style="background: #f8f9fa;"><td><b>ACCONTO</b></td><td>${d.deposit} €</td></tr>
        <tr style="background: #fff3cd;"><td><b style="color: #d9534f;">SALDO</b></td><td style="font-weight: bold; color: #d9534f;">${d.balance} €</td></tr>
        ${d.payerCode ? `<tr style="background: #e8f5e9;"><td><b>PAGATO DA (CF)</b></td><td>${d.payerCode}</td></tr>` : ''}
      </table>
      <div style="margin-top: 25px;">
        <a href="${webAppUrl}" style="background-color: #1a73e8; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; margin-right: 10px;">INSERISCI POLIZZA</a>
        <a href="${whatsappUrl}" style="background-color: #25d366; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">INVITA SU WHATSAPP</a>
      </div>
    </div>`;

  MailApp.sendEmail({
    to: recipient,
    subject: "ISCRIZIONE SOCIO: " + d.lastName + " " + d.firstName,
    htmlBody: htmlTable
  });
}