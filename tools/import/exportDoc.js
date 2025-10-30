import fs from "fs";
import { Document, Packer, Paragraph, Table, TableRow, TableCell } from "docx";

async function exportDoc() {
  const csvPath = "tools/import/output/users_preview.csv";
  if (!fs.existsSync(csvPath)) {
    console.error("❌ Не е намерен файлът:", csvPath);
    return;
  }

  const csv = fs.readFileSync(csvPath, "utf8");
  const [headerLine, ...lines] = csv.trim().split("\n");
  const headers = headerLine.split(",");

  // 🔍 Интересуващи ни колони
  const keepCols = ["Owner", "Email", "Username", "Password"];
  const indexes = keepCols
    .map((col) => headers.indexOf(col))
    .filter((i) => i >= 0);

  if (indexes.length === 0) {
    console.error("⚠️ Не са намерени нужните колони в CSV!");
    return;
  }

  const rows = lines.map((line) => line.split(","));

  const seen = new Set();
  const uniqueRows = [];
  for (const cols of rows) {
    const email = (cols[indexes[1]] || "").trim().toLowerCase(); // Email колоната
    if (!seen.has(email) && email !== "") {
      seen.add(email);
      uniqueRows.push(cols);
    }
  }

  console.log(`🧾 Общо редове в CSV: ${rows.length}`);
  console.log(`✨ Уникални акаунти за DOCX: ${uniqueRows.length}`);
  // 🧱 Създаване на таблица
  const tableRows = [
    new TableRow({
      children: keepCols.map(
        (h) =>
          new TableCell({
            children: [new Paragraph({ text: h, bold: true })],
          })
      ),
    }),
    ...uniqueRows.map(
      (cols) =>
        new TableRow({
          children: indexes.map(
            (i) =>
              new TableCell({
                children: [new Paragraph(cols[i] || "")],
              })
          ),
        })
    ),
  ];

  // 📄 Генериране на документа
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            text: "📋 Данни за акаунти на собственици (уникални записи)",
            bold: true,
            spacing: { after: 200 },
          }),
          new Table({ rows: tableRows }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync("tools/import/output/users_preview.docx", buffer);
  console.log("✅ DOC файл създаден: tools/import/output/users_preview.docx");
}

exportDoc();
