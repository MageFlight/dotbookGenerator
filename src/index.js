import { jsPDF } from "jspdf";

const doc = new jsPDF({
    orientation: "landscape",
    unit: "in",
    format: [11, 8.5]
});

doc.setLineWidth(1 / 64);
doc.line(2.5, 0, 2.5, 3);
doc.line(0, 1.5, 5, 1.5);

const sheetWidth = 5;
const sheetHeight = 3;
const setRectWidth = 0.50;
const setRectHeight = 0.30;
doc.rect(2.5 - setRectWidth, 1.5 - setRectHeight, setRectWidth, setRectHeight);
doc.rect(2.5, 1.5 - setRectHeight, setRectWidth, setRectHeight);
doc.rect(2.5 - setRectWidth, 1.5, setRectWidth, setRectHeight);
doc.rect(2.5, 1.5, setRectWidth, setRectHeight);
doc.setFontSize(14);
doc.text("9", 2.5 - setRectWidth / 2, 1.5 - setRectHeight / 2, {
    align: "center",
    baseline: "middle"
});
doc.text("9A", 2.5 + setRectWidth / 2, 1.5 - setRectHeight / 2, {
    align: "center",
    baseline: "middle"
});
doc.text("10", 2.5 - setRectWidth / 2, 1.5 + setRectHeight / 2, {
    align: "center",
    baseline: "middle"
});
doc.text("11", 2.5 + setRectWidth / 2, 1.5 + setRectHeight / 2, {
    align: "center",
    baseline: "middle"
});

doc.setLineWidth(1 / 32);
doc.line(sheetWidth, 0, sheetWidth, sheetHeight);
doc.line(0, sheetHeight, sheetWidth, sheetHeight);

document.getElementById("display").src = doc.output("dataurlstring");