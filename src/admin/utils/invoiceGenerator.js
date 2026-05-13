import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Swal from "sweetalert2";
import { registerCalibri } from "../../../fonts/calibri.js";

const LOGO_BASE64 =
  "data:image/png;base64,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";

const numberToWordsBg = (amount) => {
  const ones = [
    "",
    "един",
    "два",
    "три",
    "четири",
    "пет",
    "шест",
    "седем",
    "осем",
    "девет",
  ];
  const teens = [
    "десет",
    "единадесет",
    "дванадесет",
    "тринадесет",
    "четиринадесет",
    "петнадесет",
    "шестнадесет",
    "седемнадесет",
    "осемнадесет",
    "деветнадесет",
  ];
  const tens = [
    "",
    "десет",
    "двадесет",
    "тридесет",
    "четиридесет",
    "петдесет",
    "шестдесет",
    "седемдесет",
    "осемдесет",
    "деветдесет",
  ];
  const hundreds = [
    "",
    "сто",
    "двеста",
    "триста",
    "четиристотин",
    "петстотин",
    "шестстотин",
    "седемстотин",
    "осемстотин",
    "деветстотин",
  ];

  let lv = Math.floor(amount);
  let st = Math.round((amount - lv) * 100);

  const getCentsInWords = (cents) => {
    if (cents === 0) return "нула";
    if (cents < 10) return ones[cents];
    if (cents >= 10 && cents < 20) return teens[cents - 10];
    const t = Math.floor(cents / 10);
    const o = cents % 10;
    return tens[t] + (o > 0 ? " и " + ones[o] : "");
  };

  let centsWords = getCentsInWords(st);

  if (lv === 0) return `нула евро и ${centsWords} цента.`;

  let words = [];
  let h = Math.floor(lv / 100) % 10;
  let t = Math.floor(lv / 10) % 10;
  let o = lv % 10;
  let th = Math.floor(lv / 1000) % 10;

  if (th > 0)
    words.push(
      th === 1 ? "хиляда" : th === 2 ? "две хиляди" : ones[th] + " хиляди",
    );
  if (h > 0) words.push(hundreds[h]);

  if (t === 1) {
    words.push(teens[o]);
  } else {
    if (t > 1) words.push(tens[t]);
    if (o > 0) {
      let oWord = o === 1 ? "едно" : o === 2 ? "две" : ones[o];
      words.push((t > 0 || h > 0 || th > 0 ? "и " : "") + oWord);
    }
  }

  let result = words.join(" ").replace("и и", "и");
  return `${result} евро и ${centsWords} цента.`;
};

export const generatePdfDocument = async ({
  group,
  selectedBuilding,
  selectedMonth,
  selectedYear,
  monthLabel,
  supabase,
  formatObjectName,
  formatDualCurrency,
}) => {
  const client = group.rows[0]?.users;
  if (!client) return;

  const isCompany = !!client.company_name;
  const clientDisplayName = isCompany
    ? client.company_name
    : `${client.first_name} ${client.last_name}`;

  const documentTitle = isCompany ? "ФАКТУРА" : "ПРОФОРМА";

  const buildingInfo = selectedBuilding
    ? selectedBuilding.label
    : "Не е избрана сграда";

  let invoiceTotal = 0;
  const invoiceRows = [];
  let rowIndex = 1;

  group.rows.forEach((fee) => {
    const objName = formatObjectName(fee.type, fee.object_number);

    const mngFee = Number(fee.management_fee || 0);
    const currentMonthDue = Number(fee.current_month_due || 0);
    const restoredExpenses = currentMonthDue - mngFee;

    if (mngFee > 0) {
      invoiceRows.push([
        rowIndex++,
        `Абонаментна такса - ${objName}`,
        "бр.",
        "1",
        formatDualCurrency(mngFee, selectedYear),
        formatDualCurrency(mngFee, selectedYear),
      ]);
      invoiceTotal += mngFee;
    }

    if (restoredExpenses > 0) {
      invoiceRows.push([
        rowIndex++,
        `Възстановени разходи ${objName}`,
        "бр.",
        "1",
        formatDualCurrency(restoredExpenses, selectedYear),
        formatDualCurrency(restoredExpenses, selectedYear),
      ]);
      invoiceTotal += restoredExpenses;
    }
  });

  if (invoiceTotal <= 0) {
    Swal.fire("Информация", "Няма начислени суми за този период.", "info");
    return;
  }

  Swal.fire({
    title: "Обработка на документа...",
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });

  try {
    const { data: existingInvoice, error: checkError } = await supabase
      .from("invoices")
      .select("invoice_number, created_at, line_items")
      .eq("client_id", client.id)
      .eq("month", selectedMonth)
      .eq("year", selectedYear)
      .maybeSingle();

    if (checkError) throw checkError;

    let invoiceNumber;
    let invoiceDate;
    let finalInvoiceRows = invoiceRows;

    if (existingInvoice) {
      invoiceNumber = existingInvoice.invoice_number;
      invoiceDate = new Date(existingInvoice.created_at).toLocaleDateString(
        "bg-BG",
      );
      if (existingInvoice.line_items)
        finalInvoiceRows = existingInvoice.line_items;
    } else {
      const docType = isCompany ? "invoice" : "proforma";

      const { data: newNumber, error: seqError } = await supabase.rpc(
        "get_next_document_number",
        { doc_type: docType },
      );

      if (seqError) throw seqError;

      invoiceNumber = newNumber;
      invoiceDate = new Date().toLocaleDateString("bg-BG");

      const { error: insertError } = await supabase.from("invoices").insert({
        invoice_number: invoiceNumber,
        client_id: client.id,
        month: selectedMonth,
        year: selectedYear,
        total_amount: invoiceTotal,
        line_items: finalInvoiceRows,
      });

      if (insertError) throw insertError;
    }

    const doc = new jsPDF();
    registerCalibri(doc);

    doc.setTextColor(0, 0, 0);
    if (LOGO_BASE64 && LOGO_BASE64 !== "Сложи Тук") {
      try {
        const getImageProps = (base64) => {
          return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = base64;
            img.onload = () =>
              resolve({ width: img.width, height: img.height });
            img.onerror = (err) => reject(err);
          });
        };
        const props = await getImageProps(LOGO_BASE64);
        const maxLogoWidth = 45;
        const ratio = props.height / props.width;
        doc.addImage(
          LOGO_BASE64,
          "PNG",
          14,
          12,
          maxLogoWidth,
          maxLogoWidth * ratio,
        );
      } catch (imgError) {
        console.error("Грешка при логото:", imgError);
      }
    }

    doc.setFontSize(22);
    doc.setFont("Calibri", "bold");
    doc.text(documentTitle, 105, 22, { align: "center" });
    doc.setFontSize(10);
    doc.setFont("Calibri", "normal");
    doc.text("(Оригинал)", 105, 27, { align: "center" });

    doc.setFontSize(11);
    doc.setFont("Calibri", "bold");
    doc.text(`№: ${invoiceNumber}`, 105, 36, { align: "center" });
    doc.text(`от: ${invoiceDate}`, 105, 41, { align: "center" });

    doc.setLineWidth(0.3);
    doc.setDrawColor(0, 0, 0);

    doc.rect(14, 48, 88, 55);
    doc.setFontSize(10);
    doc.setFont("Calibri", "bold");
    doc.text("ДОСТАВЧИК:", 16, 53);
    doc.setFont("Calibri", "normal");

    doc.text("Име на фирмата: Профи Дом-Русе ЕООД", 16, 59);
    doc.text("Адрес: гр.Русе, ул. Петър Берон № 15, вх. 1, ет. 2", 16, 64, {
      maxWidth: 84,
    });
    doc.text("ДДС №: ", 16, 69);
    doc.text("ЕИК/ЕГН: 206 808 574", 16, 74);
    doc.text("IBAN: BG 46 UBBS 8002 1029 7087 50", 16, 79);
    doc.text("BIC: UBBSBGSF", 16, 84);
    doc.text("Банка: ОББ АД", 16, 89);
    doc.text("МОЛ: Калоян Миланов", 16, 94);

    doc.rect(108, 48, 88, 55);
    doc.setFont("Calibri", "bold");
    doc.text("ПОЛУЧАТЕЛ:", 110, 53);
    doc.setFont("Calibri", "normal");
    doc.text(`Име: ${clientDisplayName}`, 110, 59, { maxWidth: 84 });

    if (isCompany) {
      doc.text(`ЕИК: ${client.company_eik || "-"}`, 110, 64);
      doc.text(
        `ДДС №: ${client.company_eik ? "BG" + client.company_eik : "-"}`,
        110,
        69,
      );
      doc.text(`МОЛ: ${client.company_mol || "-"}`, 110, 74);
      doc.text(`Адрес: ${client.company_address || "-"}`, 110, 79, {
        maxWidth: 84,
      });
    } else {
      doc.text(`Тип: Физическо лице`, 110, 64);
    }

    doc.setFont("Calibri", "bold");
    doc.text("Относно обект:", 14, 109);
    doc.setFont("Calibri", "normal");
    doc.text(buildingInfo, 43, 109);
    doc.text(`Отчетен период: ${monthLabel} ${selectedYear} г.`, 14, 114);

    autoTable(doc, {
      startY: 118,
      head: [
        [
          "№",
          "Наименование на стоките и услугите",
          "Мярка",
          "Кол.",
          "Ед. цена",
          "Стойност",
        ],
      ],
      body: finalInvoiceRows,
      theme: "grid",
      styles: {
        font: "Calibri",
        fontSize: 9,
        lineColor: [0, 0, 0],
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: [230, 230, 230],
        textColor: [0, 0, 0],
        fontStyle: "bold",
        halign: "center",
      },
      columnStyles: {
        0: { halign: "center", cellWidth: 10 },
        2: { halign: "center", cellWidth: 15 },
        3: { halign: "center", cellWidth: 12 },
        4: { halign: "right" },
        5: { halign: "right" },
      },
    });

    let finalY = doc.lastAutoTable?.finalY || 118;
    const pageHeight = doc.internal.pageSize.height;

    if (finalY + 65 > pageHeight) {
      doc.addPage();
      finalY = 20;
    }

    const baseAmount = invoiceTotal;
    const vatAmount = 0;

    doc.rect(100, finalY + 5, 96, 26);
    doc.setFontSize(10);
    doc.text(`Данъчна основа:`, 102, finalY + 11);
    doc.text(
      `${formatDualCurrency(baseAmount, selectedYear)}`,
      194,
      finalY + 11,
      { align: "right" },
    );

    doc.text(`ДДС (0%):`, 102, finalY + 18);
    doc.text(
      `${formatDualCurrency(vatAmount, selectedYear)}`,
      194,
      finalY + 18,
      { align: "right" },
    );

    doc.line(100, finalY + 22, 196, finalY + 22);

    doc.setFontSize(11);
    doc.setFont("Calibri", "bold");
    doc.text(`Всичко за плащане:`, 102, finalY + 28);
    doc.text(
      `${formatDualCurrency(invoiceTotal, selectedYear)}`,
      194,
      finalY + 28,
      { align: "right" },
    );

    doc.setFontSize(10);
    doc.setFont("Calibri", "normal");

    doc.text(`Словом: ${numberToWordsBg(invoiceTotal)}`, 14, finalY + 11, {
      maxWidth: 84,
    });

    const signY = finalY + 50;
    doc.line(14, signY, 70, signY);
    doc.text("Получател", 32, signY + 5);
    doc.setFontSize(8);
    doc.text("(подпис)", 35, signY + 9);

    doc.setFontSize(10);
    doc.line(126, signY, 196, signY);
    doc.text("Съставил: Калоян Миланов", 126, signY - 2);
    doc.setFontSize(8);
    doc.text("(подпис и печат)", 150, signY + 5);

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);

      doc.setTextColor(100, 100, 100);
      doc.setFontSize(10);
      doc.setFont("Calibri", "normal");
      doc.text(
        `Генерирано автоматично чрез системата на Профи Дом-Русе. Страница ${i} от ${pageCount}`,
        105,
        pageHeight - 10,
        { align: "center" },
      );

      try {
        doc.setGState(new doc.GState({ opacity: 0.12 }));
        doc.setFont("Calibri", "bold");
        doc.setFontSize(20);
        doc.setTextColor(150, 150, 150);
        const watermarkLine = Array(45).fill("ОРИГИНАЛ").join("    ");
        for (let y = -200; y < 800; y += 20) {
          doc.text(watermarkLine, -50, y, { angle: 45 });
        }
        doc.setGState(new doc.GState({ opacity: 1.0 }));
      } catch (e) {
        console.error("Watermark error", e);
      }
    }

    Swal.close();

    const fileNameSuffix = isCompany ? "Фактура" : "Проформа";
    doc.save(
      `${fileNameSuffix}_${clientDisplayName.replace(/\s+/g, "_")}_${monthLabel}_${selectedYear}.pdf`,
    );
  } catch (error) {
    Swal.close();
    console.error(error);
    Swal.fire("Грешка", "Проблем при генериране на PDF.", "error");
  }
};
