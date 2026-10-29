// Assicurazione (assicurazione.html): le liste in Excel per l'assicurazione col carattere più grande
// (Calibri 14 invece dell'11 di Excel) e le righe più alte; date sempre nel loro formato, nessun altro stile.
const BOOKS = [];
const letters = (c) => String.fromCharCode(65 + c);
window.XLSX = { utils: {
  aoa_to_sheet: (rows, options = {}) => {
    const sheet = {};
    rows.forEach((row, r) => row.forEach((v, c) => {
      const cell = { v, t: v instanceof Date ? "d" : typeof v === "number" ? "n" : "s" };
      if (v instanceof Date && options.dateNF) cell.z = options.dateNF;
      sheet[letters(c) + (r + 1)] = cell;
    }));
    return sheet;
  },
  decode_cell: (a) => ({ c: a.charCodeAt(0) - 65, r: Number(a.slice(1)) - 1 }),
  book_new: () => ({}), book_append_sheet: (book, sheet) => BOOKS.push(sheet) }, writeFile() {} };
window.addEventListener("load", () => setTimeout(async () => { try {
  await excelList({ nome: "Base", colonna: "Polizza" }, 7, "2026-11-01",
    [{ last_name: "ROSSI", first_name: "ANNA", birth_date: "1980-05-02", tax_code: "rssnna80e42a479x" }]);
  const sheet = BOOKS[BOOKS.length - 1] || {};
  const cells = Object.entries(sheet).filter(([a]) => a[0] !== "!");
  const small = cells.filter(([, c]) => c.s?.font?.sz !== 14).map(([a]) => a);
  const dates = cells.filter(([, c]) => c.t === "d");
  document.title = "RISULTATO"
    + ` carattere14=${cells.length && !small.length ? "ok" : `NO(${small.length} celle senza 14: ${small.slice(0, 4)})`}`
    + ` date=${dates.length && dates.every(([, c]) => c.s?.numFmt === "dd/mm/yyyy") ? "ok" : "NO(formato delle date perso)"}`
    + ` righe=${(sheet["!rows"] || []).length === 2 && sheet["!rows"].every((x) => x.hpt >= 20) ? "ok" : "NO(righe non alzate)"}`
    + ` senzaColori=${cells.every(([, c]) => !c.s?.fill && !c.s?.font?.bold) ? "ok" : "NO(stili in più)"}`;
} catch (e) { document.title = `RISULTATO eccezione=NO(${String(e?.message || e).slice(0, 120)})`; } }, 600));
