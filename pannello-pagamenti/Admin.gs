function doGet(e) {
  return HtmlService.createTemplateFromFile('AdminIndex').evaluate()
      .setTitle('Admin - Pagamenti e Polizze')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getAdminData() {
  var ss = SpreadsheetApp.openById("1z41N7ofw3bJK9n8f9w2DJgIgMoXW0WLfY8Xs10MnbzQ");
  var sheet = ss.getSheetByName("SOCI");
  var data = sheet.getDataRange().getValues();

  var now = new Date();
  var currentYear = now.getFullYear();
  var currentMonth = now.getMonth(); // 0 è Gennaio, 8 è Settembre

  // Calcolo inizio stagione (Settembre dell'anno scorso o di quest'anno)
  var seasonStart;
  if (currentMonth >= 8) {
    seasonStart = new Date(currentYear, 8, 1);
  } else {
    seasonStart = new Date(currentYear - 1, 8, 1);
  }

  var filtered = [];

  // Partiamo da i=1 per saltare l'intestazione
  for (var i = 1; i < data.length; i++) {
    var r = data[i];
    var timestamp = r[0]; // Colonna A
    var policy = r[1];    // Colonna B

    var isCurrentSeason = timestamp && (new Date(timestamp) >= seasonStart);
    var hasNoPolicy = !policy || policy.toString().trim() === "";

    if (isCurrentSeason && hasNoPolicy) {
      filtered.push({
        row: i + 1, // La riga reale nel foglio (i=1 è riga 2)
        lastName: r[2],  // Colonna C
        firstName: r[3], // Colonna D
        total: r[20],    // Colonna U
        deposit: r[21],  // Colonna V
        balance: r[22]   // Colonna W
      });
    }
  }
  return filtered;
}

function updateAdminMember(row, deposit, policy) {
  var ss = SpreadsheetApp.openById("1z41N7ofw3bJK9n8f9w2DJgIgMoXW0WLfY8Xs10MnbzQ");
  var sheet = ss.getSheetByName("SOCI");

  // Aggiorna Polizza (Col B), Acconto (Col V) e Saldo (Col W)
  // Nota: getRange(riga, colonna)
  sheet.getRange(row, 2).setValue(policy); // Colonna B
  sheet.getRange(row, 22).setValue(deposit); // Colonna V

  // Forza il ricalcolo del saldo (Totale - Acconto)
  var total = sheet.getRange(row, 21).getValue(); // Colonna U
  sheet.getRange(row, 23).setValue(total - deposit); // Colonna W

  return "✅ Aggiornato: " + policy + " per riga " + row;
}