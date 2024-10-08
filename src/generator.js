import { jsPDF } from "jspdf";
import { compareSetNumbers, loadSets, loadSetsFromImage } from "./loader";
import { logError } from "./logger";

const pageWidth = 4.75;
const pageHeight = 2.25;
const setRectWidth = 0.50;
const setRectHeight = 0.25;
const textMargin = 0.05;

let prevMatrix = null;

function inchesToPoints(inches) {
    return inches * 72;
}

function pointsToInches(points) {
    return points / 72;
}

/**
 * 
 * @param {jsPDF} doc 
 * @param {Object[]} page 
 * @param {Number} xOffset 
 * @param {Number} yOffset 
 */
function drawCard(doc, page, xOffset, yOffset) {
    doc.setLineWidth(1 / 64);
    let matrix = new doc.Matrix();
    matrix.tx = inchesToPoints(xOffset * pageWidth) - (prevMatrix.tx * (prevMatrix.tx > 0));
    matrix.ty = -inchesToPoints(yOffset * pageHeight) - (prevMatrix.ty * (prevMatrix.ty < 0));
    prevMatrix = matrix;
    console.log("matrix: ", matrix);
    doc.setCurrentTransformationMatrix(matrix);

    doc.line(pageWidth / 2, 0, pageWidth / 2, pageHeight);
    doc.line(0, pageHeight / 2, pageWidth, pageHeight / 2);

    doc.rect(pageWidth / 2 - setRectWidth, pageHeight / 2 - setRectHeight, setRectWidth * 2, setRectHeight * 2);

    // Border
    doc.setLineWidth(1 / 32);
    doc.line(pageWidth, 0, pageWidth, pageHeight);
    doc.line(0, pageHeight, pageWidth, pageHeight);
    if (xOffset == 0) {
        doc.line(0, 0, 0, pageHeight);
    }
    if (yOffset == 0) {
        doc.line(0, 0, pageWidth, 0);
    }

    for (let i = 0; i < page.length; i++) {
        populateSet(doc, page[i], i & 0b1, (i & 0b10) >> 1);
    }
}

function populateSet(doc, set, pageXLocation, pageYLocation) {
    const textSize = 11;
    const lineHeight = pointsToInches(textSize) * 1.2;
    doc.setFontSize(textSize);
    doc.text(set.setNumber,
        pageWidth / 2 + (setRectWidth / 2 * (pageXLocation * 2 - 1)),
        pageHeight / 2 + (setRectHeight / 2 * (pageYLocation * 2 - 1)),
        {
            align: "center",
            baseline: "middle"
        }
    );

    const leftEdge = pageXLocation * pageWidth / 2 + textMargin;
    const headerLine = pageYLocation * pageHeight / 2 + textMargin * 0.5 + pointsToInches(textSize);
    const measureIndent = (pageXLocation + pageYLocation == 2) * (setRectWidth);
    const firstLine = pageYLocation * pageHeight / 2 + setRectHeight + textMargin * 0.5 + pointsToInches(textSize);
    let cursor = 0;
    
    if (set.performanceLetter != "") {
        doc.setFont("helvetica", "bold");
        doc.text(
            set.performanceLetter + ":",
            leftEdge + measureIndent,
            headerLine
        );
        
        cursor = doc.getTextWidth(set.performanceLetter + ":") + textMargin * 0.5;
        doc.setFont("helvetica", "normal");
    }

    if (set.measures != "") {
        doc.text(
            set.measures,
            leftEdge + measureIndent + cursor,
            headerLine
        );
    }

    doc.text(
        `Counts: ${set.counts ? set.counts : 0}`,
        leftEdge,
        firstLine
    );

    
    doc.text(
        `S${set.sideToSide.sideNum}: ${getYardLineOffsetText(set)}`,
        leftEdge,
        firstLine + lineHeight
    );

    doc.text(
        getHashOffsetText(set),
        leftEdge,
        firstLine + lineHeight * 2
    );
}

function getYardLineOffsetText(set) {
    if (set.sideToSide.yardLineOffset == 0) {
        return "On " + set.sideToSide.yardLine;
    }

    return Math.abs(set.sideToSide.yardLineOffset).toString() +
        (set.sideToSide.yardLineOffset > 0 ? " outside " : " inside ") +
        set.sideToSide.yardLine;
}

function getHashOffsetText(set) {
    if (set.frontToBack.hashOffset == 0) {
        console.log("set", set.frontToBack.hash);
        return "On " + set.frontToBack.hash;
    }

    return Math.abs(set.frontToBack.hashOffset).toString() +
        (set.frontToBack.hashOffset > 0 ? " ahead of " : " behind ") +
        set.frontToBack.hash;
}

async function generateDotbook(movements, dotNumber, currentTask) {
    const doc = new jsPDF({
        orientation: "landscape",
        unit: "in",
        format: [11, 8.5]
    });

    const centeringMatrix = doc.Matrix();
    centeringMatrix.tx = inchesToPoints((11 - pageWidth * 2) / 2);
    centeringMatrix.ty = -inchesToPoints((8.5 - pageHeight * 2) / 2);

    console.log(movements.length);
    const setsPerCard = 4;
    const cardsPerPage = 4;
    for (let movement = 0; movement < movements.length; movement++) {
        const movementSets = movements[movement];
        
        for (let page = 0; page < movementSets.length / (setsPerCard * cardsPerPage); page++) {
            if (page + movement != 0) doc.addPage();

            const pageLabel = `Movement ${movement + 1}: ${dotNumber.toUpperCase()}`;
            doc.setFontSize(20);
            doc.text(
                pageLabel,
                (11 - doc.getTextWidth(pageLabel)) / 2,
                (8.5 - pageHeight * 2) / 4,
                {baseline: "middle"}
            );

            doc.setCurrentTransformationMatrix(centeringMatrix);
            prevMatrix = doc.Matrix(1, 0, 0, 1, 0, 0);

            for (let card = 0; card < cardsPerPage; card++) {
                const startSet = page * setsPerCard * cardsPerPage + card * setsPerCard;
                if (startSet >= movementSets.length) break;

                const xOffset = card & 0b1;
                const yOffset = (card & 0b10) >> 1;
                /*
                0: 0, 0
                1: 1, 0
                2: 0, 1
                3: 1, 1
                */
                drawCard(doc, movementSets.slice(startSet, startSet + setsPerCard), xOffset, yOffset);
            }
        }
    }

    const finalUrl = doc.output("bloburi", {filename: "Dotbook"});
    window.open(finalUrl, "_blank");
    const outputLink = document.getElementById("output");
    outputLink.style.display = "block";
    outputLink.href = finalUrl;
    outputLink.innerText = dotNumber.toUpperCase() + " Dotbook";
    currentTask.textContent = "";
}

export async function startGeneration(files, dotNumber, currentTask) {
    console.log("Started Generation");
    if (!dotNumber || dotNumber == "") {
        logError("Please Enter Dot Number");
        return;
    } else if (!/[a-z]+\d+/i.test(dotNumber)) {
        logError("Dot Number invalid");
        return;
    }

    if (files.length == 0) {
        logError("No files selected.");
        return;
    }

    document.querySelector("#currentTask").textContent = "Parsing Sets";
    let movements = [];
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const sets = await loadSets(file, dotNumber);
        if (sets.length == 0) {
            logError(`No sets found for '${dotNumber}' in file ${i}`);
            continue;
        }

        movements.push(sets);
    }

    if (movements.length == 0) {
        logError("Could not find dots for '" + dotNumber + "'");
        return;
    }
    
    movements.sort((a, b) => compareSetNumbers(a[0].setNumber, b[0].setNumber));

    currentTask.textContent = "Drawing Dotbook";
    await generateDotbook(movements, dotNumber, currentTask);
}