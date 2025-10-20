import fs from "fs";
import { jsPDF } from "jspdf";

function convertFont(fontPath, fontName, style, outputFile) {
  const fontData = fs.readFileSync(fontPath).toString("base64");

  const js = `
  (function (jsPDFAPI) {
    jsPDFAPI.addFileToVFS("${fontName}-${style}.ttf", "${fontData}");
    jsPDFAPI.addFont("${fontName}-${style}.ttf", "${fontName}", "${style}");
  })(jsPDF.API);
  `;

  fs.appendFileSync(outputFile, js);
  console.log(`✅ Added ${fontName} (${style}) to ${outputFile}`);
}

// Генерираме normal и bold Calibri
convertFont("../fonts/CALIBRI.TTF", "Calibri", "normal", "../fonts/calibri.js");
convertFont("../fonts/CALIBRIB.TTF", "Calibri", "bold", "../fonts/calibri.js");