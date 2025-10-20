import { Document, Packer, Paragraph, TextRun, AlignmentType } from "docx";
import { saveAs } from "file-saver";

function bgFormat(dateString) {
  const d = new Date(dateString);
  const date = d.toLocaleDateString("bg-BG").replace(" г.", "г.");
  const weekday = d.toLocaleDateString("bg-BG", { weekday: "long" });
  const weekdayUpper = weekday.toUpperCase();
  const time = `${String(d.getHours()).padStart(2, "0")}.${String(
    d.getMinutes()
  ).padStart(2, "0")}`;
  const monthName = d.toLocaleDateString("bg-BG", { month: "long" });
  const yearShort = d.getFullYear().toString().slice(-2);
  return { date, weekday, weekdayUpper, time, monthName, yearShort };
}

function P(
  text,
  {
    align = "left",
    bold = false,
    underline = false,
    size = 24,
    before = 0,
    addTab = false,
    bullet = false,
  } = {}
) {
  let alignment;
  if (align === "center") alignment = AlignmentType.CENTER;
  else if (align === "right") alignment = AlignmentType.RIGHT;
  else if (align === "justify") alignment = AlignmentType.JUSTIFIED;
  else alignment = AlignmentType.LEFT;

  const runs = [];

  if (addTab) runs.push(new TextRun({ text: "\t" }));

  runs.push(
    new TextRun({
      text,
      font: "Calibri",
      size,
      bold,
      underline,
    })
  );

  return new Paragraph({
    alignment,
    spacing: { before, after: 120, line: 300 },
    bullet: bullet ? { level: 0 } : undefined,
    tabStops: [{ type: "left", position: 720 }],
    children: runs,
  });
}

export async function generateDOCX(event) {
  const subject = event.subject?.toLowerCase() || "";
  const { date, weekday, weekdayUpper, time, monthName, yearShort } = bgFormat(
    event.completion_date
  );
  const addr = `${event.building?.name || ""}, ${
    event.building?.address || ""
  }`;
  let content = [];

  if (subject.includes("такси") || subject.includes("вноска")) {
    content = [
      P("СЪОБЩЕНИЕ", {
        align: "center",
        bold: true,
        size: 144,
        underline: true,
        before: 0,
      }),
      P("На вниманието на живущите на адрес:", {
        bold: true,
        size: 48,
        underline: true,
        align: "center",
      }),
      P(addr, { bold: true, size: 48, underline: true, align: "center" }),
      P(`Таксите за месец ${monthName} ${yearShort}г. ще се събират  на:`, {
        bold: true,
        size: 48,
        underline: true,
        align: "center",
      }),
      P(`${date}/${weekday}/ от ${time} часа`, {
        bold: true,
        size: 48,
        underline: true,
        align: "center",
      }),
      P(
        "Уважаеми клиенти, искам да Ви напомня, че Вашите задължения към етажната собственост може да платите и по банков път.",
        {
          bold: true,
          size: 48,
          underline: true,
          align: "justify",
          addTab: true,
        }
      ),
      P("При плащане по банков път,\u00A0моля да посочите:", {
        bold: true,
        size: 48,
        underline: true,
        align: "justify",
        addTab: true,
      }),
      P("Получател: „Профи Дом – Русе“ЕООД", {
        bold: true,
        size: 48,
        underline: true,
        bullet: true,
      }),
      P("IBAN: BG46 UBBS 8002 1029 7087 50", {
        bold: true,
        size: 48,
        underline: true,
        bullet: true,
      }),
      P("Основание: административен адрес на сградата, номер на апартамент", {
        bold: true,
        size: 48,
        underline: true,
        bullet: true,
      }),
      P(""),
      P("Председател на УС:", { bold: true, size: 48, underline: true }),
      P("Калоян Миланов - 0898563392", {
        bold: true,
        size: 48,
        underline: true,
      }),
    ];
  } else if (subject.includes("общо събрание")) {
    const line = 240;
    const size = 24;

    content = [
      P("ПОКАНА", {
        align: "center",
        bold: true,
        underline: true,
        size: 36,
        line,
      }),

      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { line },
        children: [
          new TextRun({
            text: "ЗА ОБЩО СЪБРАНИЕ, СЪГЛАСНО ЧЛ. 13 ОТ ЗУЕС",
            bold: true,
            underline: true,
            size,
          }),
          new TextRun({
            text: "ПРЕДСЕДАТЕЛЯТ НА УПРАВИТЕЛНИЯ СЪВЕТ",
            bold: true,
            underline: true,
            size,
            break: 1,
          }),
          new TextRun({
            text: "НА ЕТАЖНА СОБСТВЕНОСТ НА АДРЕС:",
            bold: true,
            underline: true,
            size,
            break: 1,
          }),
          new TextRun({
            text: `${addr.toUpperCase()}`,
            bold: true,
            underline: true,
            size,
            break: 1,
          }),
          new TextRun({
            text: "ВИ УВЕДОМЯВА, ЧЕ",
            bold: true,
            underline: true,
            size,
            break: 1,
          }),
          new TextRun({
            text: `НА ${date}/${weekdayUpper}/ ОТ ${time} ч. НА ПАРТЕРА НА`,
            bold: true,
            underline: true,
            size,
            break: 1,
          }),
          new TextRun({
            text: "ЖИЛИЩНАТА ЧАСТ НА СГРАДАТА",
            bold: true,
            underline: true,
            size,
            break: 1,
          }),
          new TextRun({
            text: "ЩЕ СЕ ПРОВЕДЕ ОБЩО СЪБРАНИЕ НА ЕТАЖНАТА СОБСТВЕНОСТ ПРИ СЛЕДНИЯ",
            bold: true,
            underline: true,
            size,
            break: 1,
          }),
          new TextRun({
            text: "ДНЕВЕН РЕД:",
            bold: true,
            underline: true,
            size,
            break: 1,
          }),
        ],
      }),

      P("1. ТЕКУЩИ ВЪПРОСИ.", {
        bold: true,
        size,
        line,
        underline: true,
        align: "left",
      }),

      P(""),
      P(""),
      P(""),

      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { before: 0, after: 0, line },
        children: [
          new TextRun({
            text: "ПРЕДСЕДАТЕЛ НА УПРАВИТЕЛНИЯ СЪВЕТ:",
            size,
          }),
          new TextRun({
            text: "„ПРОФИ ДОМ - РУСЕ“ ЕООД",
            size,
            break: 1,
          }),
          new TextRun({
            text: "КАЛОЯН ГЕОРГИЕВ МИЛАНОВ",
            size,
            break: 1,
          }),
        ],
      }),

      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { before: 0, after: 0, line },
        children: [new TextRun({ text: "ЗАБЕЛЕЖКА:", bold: true, size: 22 })],
      }),

      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { before: 0, after: 0, line },
        children: [
          new TextRun({ text: "\t" }),
          new TextRun({
            text: "Чл. 13 от ЗУЕС",
            bold: true,
            size: 22,
          }),
          new TextRun({
            text: " (1) (Изм. - ДВ, бр. 57 от 2011 г.) Общото събрание се свиква чрез покана, подписана от лицата, които свикват общото събрание, която се поставя на видно и общодостъпно място на входа на сградата не по-късно от 7 дни преди датата на събранието, а в неотложни случаи - не по-късно от 24 часа. Датата и часът задължително се отбелязват върху поканата от лицата, които свикват общото събрание, за което се съставя протокол.",
            size: 22,
          }),
        ],
      }),

      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { before: 0, after: 0, line },
        children: [
          new TextRun({ text: "\t" }),
          new TextRun({
            text: "Чл. 15 от ЗУЕС",
            bold: true,
            size: 22,
            addTab: true,
          }),
          new TextRun({
            text: " (1) (Доп. - ДВ, бр. 57 от 2011 г.) Общото събрание се провежда, ако присъстват лично или чрез представители собственици на най-малко 51 на сто идеални части от общите части на етажната собственост, с изключение на случаите по чл. 17, ал. 2, т. 1 - 4.",
            size: 22,
          }),
        ],
      }),

      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { before: 0, after: 0, line },
        children: [
          new TextRun({
            text: "\t(2) (Изм. - ДВ, бр. 57 от 2011 г.) Ако събранието не може да се проведе в посочения в поканата час поради липса на кворум по ал. 1, събранието се отлага с един час, провежда се по предварително обявения дневен ред и се смята за законно, ако на него са представени не по-малко от 26 на сто идеални части от общите части на етажната собственост.",
            size: 22,
            break: 1,
          }),
        ],
      }),

      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { before: 0, after: 0, line },
        children: [
          new TextRun({
            text: "\t(3) (Нова - ДВ, бр. 57 от 2011 г.) Когато в случаите по ал. 2 липсва изискуемият кворум, събранието се провежда на следващия ден, а ако той е почивен или официален празник, в следващия работен ден, в часа и на мястото, посочени в поканата по чл. 13, ал. 1 за свикване на общото събрание. Ако липсва необходимият кворум по ал. 1, събранието се провежда по предварително обявения дневен ред и се смята за законно, колкото и идеални части от общите части на етажната собственост да са представени.",
            size: 22,
            break: 1,
          }),
        ],
      }),
    ];
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 540, bottom: 540, left: 720, right: 720 },
          },
        },
        children: content,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Съобщение_${event.subject}_${event.building.name}.docx`);
}

export async function generatePDF(event) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const { registerCalibri } = await import("../../../fonts/calibri.js");
  // Register fonts on the document instance to avoid vFS context issues
  registerCalibri(doc);
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 60;
  let y = 80;

  const subject = event.subject?.toLowerCase() || "";
  const { date, weekday, weekdayUpper, time, monthName, yearShort } = bgFormat(
    event.completion_date
  );
  const addr = `${event.building?.name || ""}, ${
    event.building?.address || ""
  }`;

  // 🧩 Хелпери
  const addText = (text, options = {}) => {
    const {
      bold = false,
      underline = false,
      underlineWidth = 1,
      align = "left",
      size = 12,
      lineGap = 18,
    } = options;

    doc.setFont("Calibri", bold ? "bold" : "normal");
    doc.setFontSize(size);

    const x =
      align === "center"
        ? pageWidth / 2
        : align === "right"
        ? pageWidth - margin
        : margin;

    const splitText = doc.splitTextToSize(text, pageWidth - margin * 2);
    doc.text(splitText, x, y, { align, maxWidth: pageWidth - margin * 2 });

    // Подчертаване
    if (underline) {
      const lineWidth = doc.getTextWidth(text);
      let startX =
        align === "center"
          ? pageWidth / 2 - lineWidth / 2
          : align === "right"
          ? pageWidth - margin - lineWidth
          : margin;

      doc.setLineWidth(underlineWidth); // ✅ дебелина
      doc.line(startX, y + 3, startX + lineWidth, y + 3);
      doc.setLineWidth(0.2);
    }

    y += lineGap * splitText.length;
  };

  const addBullets = (items) => {
    doc.setFont("Calibri", "bold");
    doc.setFontSize(12);
    const x = margin + 10;
    items.forEach((item) => {
      doc.text(`– ${item}`, x, y, { maxWidth: pageWidth - margin * 2 });
      y += 18;
    });
  };

  // 🟩 === СЪОБЩЕНИЕ ===
  if (subject.includes("такси") || subject.includes("вноска")) {
    addText("СЪОБЩЕНИЕ", {
      bold: true,
      underline: true,
      underlineWidth: 3,
      size: 72,
      align: "center",
      lineGap: 30,
    });
    addText("На вниманието на живущите на адрес:", {
      bold: true,
      underline: true,
      align: "center",
      size: 14,
    });
    addText(addr, { bold: true, underline: true, align: "center", size: 14 });
    addText(`Таксите за месец ${monthName} ${yearShort}г. ще се събират на:`, {
      bold: true,
      underline: true,
      align: "center",
      size: 14,
    });
    addText(`${date}/${weekdayUpper}/ от ${time} часа`, {
      bold: true,
      underline: true,
      align: "center",
      size: 14,
      lineGap: 30,
    });

    addText(
      "Уважаеми клиенти, искам да Ви напомня, че Вашите задължения към етажната собственост може да платите и по банков път.",
      { bold: true, underline: true, align: "justify", size: 12, lineGap: 20 }
    );
    addText("При плащане по банков път, моля да посочите:", {
      bold: true,
      underline: true,
      align: "justify",
      size: 12,
      lineGap: 20,
    });

    addBullets([
      "Получател: „Профи Дом – Русе“ЕООД",
      "IBAN: BG46 UBBS 8002 1029 7087 50",
      "Основание: административен адрес на сградата, номер на апартамент",
    ]);

    y += 30;
    addText("Председател на УС:", { bold: true, underline: true, size: 12 });
    addText("Калоян Миланов - 0898563392", {
      bold: true,
      underline: true,
      size: 12,
    });
  }

  // 🟥 === ПОКАНА ===
  else if (subject.includes("общо събрание")) {
    addText("ПОКАНА", {
      bold: true,
      underline: true,
      size: 20,
      align: "center",
      lineGap: 30,
    });
    addText("ЗА ОБЩО СЪБРАНИЕ, СЪГЛАСНО ЧЛ. 13 ОТ ЗУЕС", {
      bold: true,
      underline: true,
      align: "center",
      size: 13,
      lineGap: 20,
    });

    addText(
      `ПРЕДСЕДАТЕЛЯТ НА УПРАВИТЕЛНИЯ СЪВЕТ НА ЕТАЖНА СОБСТВЕНОСТ НА АДРЕС:`,
      {
        bold: true,
        underline: true,
        align: "center",
        size: 13,
      }
    );
    addText(addr.toUpperCase(), {
      bold: true,
      underline: true,
      align: "center",
      size: 13,
    });
    addText("ВИ УВЕДОМЯВА, ЧЕ", {
      bold: true,
      underline: true,
      align: "center",
      size: 13,
    });
    addText(
      `НА ${date}/${weekdayUpper}/ ОТ ${time} ч. НА ПАРТЕРА НА ЖИЛИЩНАТА ЧАСТ НА СГРАДАТА`,
      {
        bold: true,
        underline: true,
        align: "center",
        size: 13,
        lineGap: 20,
      }
    );

    addText("ДНЕВЕН РЕД:", {
      bold: true,
      underline: true,
      align: "center",
      size: 13,
    });
    addText("1. ТЕКУЩИ ВЪПРОСИ.", {
      bold: true,
      underline: true,
      align: "left",
      size: 13,
      lineGap: 25,
    });

    addText("ПРЕДСЕДАТЕЛ НА УПРАВИТЕЛНИЯ СЪВЕТ:", {
      bold: true,
      size: 13,
      lineGap: 18,
    });
    addText("„ПРОФИ ДОМ - РУСЕ“ ЕООД", { bold: true, size: 13 });
    addText("КАЛОЯН ГЕОРГИЕВ МИЛАНОВ", { bold: true, size: 13, lineGap: 20 });

    addText("ЗАБЕЛЕЖКА:", {
      bold: true,
      underline: true,
      size: 12,
      lineGap: 16,
    });
    addText(
      "Чл. 13 от ЗУЕС (1)  (Изм. - ДВ, бр. 57 от 2011 г.) Общото събрание се свиква чрез покана, подписана от лицата, които свикват общото събрание, която се поставя на видно и общодостъпно място на входа на сградата не по-късно от 7 дни преди датата на събранието, а в неотложни случаи - не по-късно от 24 часа. Датата и часът задължително се отбелязват върху поканата от лицата, които свикват общото събрание, за което се съставя протокол.",
      { size: 11, align: "justify", lineGap: 14 }
    );
    addText(
      "Чл. 15 от ЗУЕС (1) (Доп. - ДВ, бр. 57 от 2011 г.) Общото събрание се провежда, ако присъстват лично или чрез представители собственици на най-малко 51 на сто идеални части от общите части на етажната собственост, с изключение на случаите по чл. 17, ал. 2, т. 1 - 4.",
      { size: 11, align: "justify", lineGap: 14 }
    );
  }

  // 📄 Записваме PDF файла
  doc.save(`Съобщение_${event.subject}_${event.building.name}.pdf`);
}
