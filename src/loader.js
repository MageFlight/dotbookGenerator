const pdfjs = require("pdfjs-dist");

export function loadSets() {
    pdfjs.GlobalWorkerOptions.workerSrc = "pdf.worker.bundle.js";

    const pdfUrl = "./mvmt1.pdf";
    
    pdfjs.getDocument(pdfUrl).promise.then(pdfDocument => {

        let totalPages = pdfDocument.numPages;
        let pageNumber = 1;
    
        // Extract the text
        getPageText(pageNumber, pdfDocument).then(textPage => {
            // Show the text of the page in the console
            parseText(textPage, "B1")
        });

    }).catch(error => {
        console.error(error);
    })
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
        let quadrantPerformer = quadrantText.match(/Label: \w+\d+/i)[0].split(' ')[1];
        console.log(quadrantPerformer)
        if (quadrantPerformer != performer.toLowerCase()) continue;
        console.log(quadrantText);

        // Trim the text and split on semicolons
        const beginMarker = "front-back;";
        const beginIndex = quadrantText.indexOf(beginMarker) + beginMarker.length;
        const endIndex = quadrantText.indexOf(";performer:");
        console.log(beginIndex, endIndex, quadrantText.length);

        const setTexts = quadrantText.substring(beginIndex, endIndex).split(';');
        console.log(setTexts);const setNumberRegex = /\d+\w*/;

        parseTable(setTexts);
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
            counts: "",

            sideToSide: "",
            frontToBack: ""
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
            setInformtaion.counts = table[cursor + 1];
            cursor += 2;
        } else {
            setInformtaion.counts = table[cursor];
            cursor++;
        }

        setInformtaion.sideToSide = table[cursor];
        setInformtaion.frontToBack = table[cursor + 1];
        sets[currentSet] = setInformtaion;

        cursor += 2;
        currentSet++;

    }

    console.log(sets);

    return sets;
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
                console.log(textContent);
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