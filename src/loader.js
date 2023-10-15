const pdfjs = require("pdfjs-dist");

export async function loadSets(pdfData, performer) {
    if (!performer) return null;

    pdfjs.GlobalWorkerOptions.workerSrc = "pdf.worker.bundle.js";

    const pdfDocument = await pdfjs.getDocument(pdfData).promise;
    let pagesPromises = [];

    for (let i = 0; i < pdfDocument.numPages; i++) {
        // Store the promise of getPageText that returns the text of a page
        pagesPromises.push(getPageText(i + 1, pdfDocument));
    }

    let performerSets = [];
    // Execute all the promises
    const pagesText = await Promise.all(pagesPromises)
    for (const page of pagesText) {
        const sets = parseText(page, performer);
        performerSets = performerSets.concat(sets);
    }
    
    performerSets.sort((a, b) => compareSetNumbers(a.setNumber, b.setNumber));
    return performerSets;
}

export function compareSetNumbers(a, b) {
    console.log("comp: ", a, ", ", b);
    const aNumber = parseInt(a.match(/\d+/));
    const bNumber = parseInt(b.match(/\d+/));
    if (aNumber < bNumber) return -1;
    if (aNumber > bNumber) return 1;

    const aLetter = a.match(/[a-z]+/i);
    const bLetter = b.match(/[a-z]+/i);
    if (aLetter == null && bLetter == null) return 0;
    if (aLetter == null && bLetter != null) return -1;
    if (aLetter != null && bLetter == null) return 1
    return aLetter[0].localeCompare(bLetter[0]);
}

/**
 * 
 * @param {string} text 
 * @param {string} performer 
 */
function parseText(text, performer) {
    const quadrantTexts = text.split(/Page \d+ of \d+;/i);
    let performerInformation = [];

    for (let quadrant = 0; quadrant < quadrantTexts.length; quadrant++) {
        const quadrantText = quadrantTexts[quadrant].toLowerCase();
        if (quadrantText == "") continue;

        // Check if the quadrant is for the correct person
        let quadrantPerformer = quadrantText.match(/Label: ((\w+\d+)|(\(unlabeled\)))/i)[0].split(' ')[1];
        if (quadrantPerformer != performer.toLowerCase()) continue;

        // Trim the text and split on semicolons
        console.log(quadrantText);
        const beginMarker = "front-back;";
        let beginIndex = quadrantText.indexOf(beginMarker) + beginMarker.length;
        if (/\d/.test(quadrantText[0])) beginIndex = 0;
        const endIndex = quadrantText.indexOf(";performer:");

        const setTexts = quadrantText.substring(beginIndex, endIndex).split(';');

        const parsedSets = parseTable(setTexts);
        console.log(quadrantPerformer);
        console.log("parsedSets: ", parsedSets);

        performerInformation = performerInformation.concat(parsedSets);
    }

    return performerInformation;
}

/**
 * 
 * @param {string[]} table 
 */
function parseTable(table) {
    let sets = [];
    
    let cursor = 0;
    let currentSet = 0;

    while (cursor < table.length) {
        // The first item must be the set number
        let setInformtaion = {
            setNumber: table[cursor].toUpperCase(),

            performanceLetter: "",
            measures: "",
            counts: 0,

            sideToSide: null,
            frontToBack: null
        };
        cursor++;

        // If the item starts with a letter, it is the performanceLetter
        if (table[cursor].match(/^[a-z]/) != null) {
            setInformtaion.performanceLetter = table[cursor].replace(/^\w/, chr => chr.toUpperCase());
            cursor++;
        }

        // If the next item starts with a number, it is the measures and the next is the counts
        if (table[cursor + 1].match(/^\d/)) {
            setInformtaion.measures = table[cursor];
            setInformtaion.counts = parseInt(table[cursor + 1]);
            cursor += 2;
        } else {
            setInformtaion.counts = table[cursor];
            cursor++;
        }

        setInformtaion.sideToSide = parseSideToSide(table[cursor]);
        setInformtaion.frontToBack = parseFrontToBack(table[cursor + 1]);
        sets[currentSet] = setInformtaion;

        cursor += 2;
        currentSet++;

    }

    return sets;
}

/**
 * 
 * @param {string} str 
 */
function parseSideToSide(str) {
    const sideNumIndex = str.indexOf(":") - 1
    let sideToSideInfo = {
        sideNum: sideNumIndex < 0 ? 1 : parseFloat(str[sideNumIndex]),
        yardLine: 0,
        yardLineOffset: 0,
    };

    const onYardLn = str.match(/on \d+/i);
    if (onYardLn != null) {
        sideToSideInfo.yardLine = parseFloat(onYardLn[0].substring(3));
        return sideToSideInfo;
    }

    sideToSideInfo.yardLineOffset = parseFloat(str.match(/: \d+(.\d+)?/)[0].substring(2));
    if (str.includes("inside")) sideToSideInfo.yardLineOffset *= -1;

    sideToSideInfo.yardLine = parseFloat(str.match(/\d+ yd ln/i)[0].match(/\d+/));
    
    return sideToSideInfo;
}

/**
 * 
 * @param {string} str 
 */
function parseFrontToBack(str) {
    let frontToBackInfo = {
        hash: "",
        hashOffset: 0
    };

    const onHash = str.match(/on [\w ]+/i);
    if (onHash != null) {
        frontToBackInfo.hash = onHash[0].substring(3).trim();
        return frontToBackInfo;
    }

    frontToBackInfo.hashOffset = parseFloat(str.match(/^\d+(.\d+)?/)[0]);
    if (str.includes("behind")) frontToBackInfo.hashOffset *= -1;

    frontToBackInfo.hash = abbreviate(str.match(/((front)|(back)) ((hash)|(side line))/i)[0]);

    return frontToBackInfo;
}

/**
 * 
 * @param {string} str 
 */
function abbreviate(str) {
    return str.toLowerCase().split(" ").map(word => word[0]).join("").toUpperCase();
}

/**
 * Retrieves the text of a specif page within a PDF Document obtained through pdf.js 
 * 
 * @param {Integer} pageNum Specifies the number of the page 
 * @param {PDFDocument} PDFDocumentInstance The PDF document obtained 
 **/
function getPageText(pageNum, PDFDocumentInstance) {
    // Return a Promise that is solved once the text of the page is retrieven
    return new Promise(function (resolve, reject) {
        PDFDocumentInstance.getPage(pageNum).then(function (pdfPage) {
            // The main trick to obtain the text of the PDF page, use the getTextContent method
            pdfPage.getTextContent().then(function (textContent) {
                let textItems = textContent.items;
                let finalString = "";

                // Concatenate the string of the item to the final string
                for (let i = 0; i < textItems.length; i++) {
                    let item = textItems[i].str.trim();
                    if (item.length == 0) continue;

                    finalString += item + ";";
                }

                // Solve promise with the text retrieven from the page
                resolve(finalString);
            });
        });
    });
}