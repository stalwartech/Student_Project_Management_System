const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");

// rows: array of flat objects. Returns a CSV string.
const toCSV = (rows) => {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(","));
  }
  return lines.join("\n");
};

// rows: array of flat objects. Streams an .xlsx workbook to res.
const streamExcel = async (res, { title, rows, filename }) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(title);

  if (rows.length) {
    sheet.columns = Object.keys(rows[0]).map((key) => ({ header: key, key, width: 22 }));
    sheet.addRows(rows);
    sheet.getRow(1).font = { bold: true };
  }

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}.xlsx"`);
  await workbook.xlsx.write(res);
  res.end();
};

// rows: array of flat objects. Streams a simple tabular PDF to res.
const streamPDF = (res, { title, rows, filename }) => {
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}.pdf"`);

  const doc = new PDFDocument({ margin: 30, size: "A4", layout: "landscape" });
  doc.pipe(res);

  doc.fontSize(16).text(title, { align: "center" });
  doc.moveDown();

  if (rows.length) {
    const headers = Object.keys(rows[0]);
    doc.fontSize(9).font("Helvetica-Bold");
    doc.text(headers.join("   |   "));
    doc.moveDown(0.5);
    doc.font("Helvetica");

    rows.forEach((row) => {
      const line = headers.map((h) => String(row[h] ?? "")).join("   |   ");
      doc.text(line);
    });
  } else {
    doc.fontSize(11).text("No data available for this report.");
  }

  doc.end();
};

module.exports = { toCSV, streamExcel, streamPDF };
