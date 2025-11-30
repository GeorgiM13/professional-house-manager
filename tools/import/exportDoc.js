import fs from "fs";
import { Document, Packer, Paragraph, Table, TableRow, TableCell } from "docx";

// 🛠️ Помощна функция за правилно парсване на CSV ред
// Разделя по запетая, но ИГНОРИРА запетаите вътре в кавички (напр. "Цар Асен, вх.А")
function parseCSVLine(text) {
  if (!text) return [];
  // Regex магия: хваща запетая, само ако след нея има четен брой кавички (т.е. е извън кавички)
  const parts = text.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
  
  // Изчистваме кавичките, ако има такива около стойността (напр. "Име" -> Име)
  return parts.map(val => val.trim().replace(/^"|"$/g, ''));
}

async function exportDoc() {
  const csvPath = "tools/import/output/users_preview.csv";
  if (!fs.existsSync(csvPath)) {
    console.error("❌ Не е намерен файлът:", csvPath);
    return;
  }

  const csv = fs.readFileSync(csvPath, "utf8");
  // Премахваме празните редове, за да не чупят логиката
  const [headerLine, ...lines] = csv.trim().split("\n").filter(l => l.trim() !== "");
  
  // Използваме новата функция за хедърите
  const headers = parseCSVLine(headerLine);

  // 🔍 Интересуващи ни колони
  const keepCols = ["Owner", "Email", "Username", "Password"];
  const indexes = keepCols
    .map((col) => headers.indexOf(col))
    .filter((i) => i >= 0);

  if (indexes.length === 0) {
    console.error("⚠️ Не са намерени нужните колони в CSV! Налични: ", headers);
    return;
  }

  // Използваме новата функция за всеки ред
  const rows = lines.map((line) => parseCSVLine(line));

  const seen = new Set();
  const uniqueRows = [];
  
  for (const cols of rows) {
    // Вече данните са подравнени правилно и indexes[1] ще сочи към Email, не към част от адреса
    const email = (cols[indexes[1]] || "").trim().toLowerCase(); 
    
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