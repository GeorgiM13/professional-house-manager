function generateMessage(event) {
  const subject = event.subject?.toLowerCase() || "";
  const date = new Date(event.completion_date).toLocaleDateString("bg-BG");
  const time = new Date(event.completion_date).toLocaleTimeString("bg-BG", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const address = `${event.building?.name || ""}, ${event.building?.address || ""}`;

  let message = "";

  if (subject.includes("общо събрание")) {
    message = `
Уважаеми съседи,

На ${date} от ${time} ще се проведе ОБЩО СЪБРАНИЕ на собствениците в сградата ${address}.

Дневният ред включва:
${event.description || "Обсъждане на текущи въпроси, касаещи сградата."}

Присъствието Ви е важно за вземане на решения, които касаят всички собственици.
`;
  } else if (subject.includes("такса") || subject.includes("вноска")) {
    message = `
Уважаеми съседи,

Напомняме Ви, че до ${date} следва да бъдат внесени дължимите месечни такси за сградата ${address}.

${event.description || "Моля, извършете плащането при домоуправителя или по банков път."}

Благодарим Ви за съдействието и коректността!
`;
  } else {
    message = `
Уважаеми съседи,

На ${date} от ${time} ще се проведе ${event.subject.toLowerCase()} в сградата ${address}.

${event.description ? `Описание: ${event.description}` : ""}

Настоящото съобщение е генерирано автоматично от системата на домоуправителя.
`;
  }

  return message.trim();
}

export async function generatePDF(event) {
  const { jsPDF } = await import("jspdf");
  const message = generateMessage(event);
  const doc = new jsPDF();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("СЪОБЩЕНИЕ", 105, 20, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  const splitText = doc.splitTextToSize(message, 180);
  doc.text(splitText, 15, 40);

  doc.save(`Съобщение_${event.subject}.pdf`);
}

export async function generateDOCX(event) {
  const { Document, Packer, Paragraph, TextRun } = await import("docx");
  const { saveAs } = await import("file-saver");
  const message = generateMessage(event);

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            children: [new TextRun({ text: "СЪОБЩЕНИЕ", bold: true, size: 32 })],
            alignment: "center",
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            children: [new TextRun({ text: message, size: 24 })],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Съобщение_${event.subject}.docx`);
}
