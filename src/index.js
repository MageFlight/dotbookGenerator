import { startGeneration } from "./generator";

let standardDotsheets = importFiles(require.context("../dotsheets", true, /\.pdf$/));

document.querySelector("#generatorForm").addEventListener("submit", () => {
    const dotNumber = document.querySelector("#dotNumberInput").value;
    
    const dotsheetType = document.querySelector("input[name='dotsheetSelector']:checked").value;
    
    let dotsheetPromise = null;
    if (dotsheetType == "custom") {
        dotsheetPromise = loadCustomDotsheet();
    } else {
        dotsheetPromise = loadStandardDotsheet(dotsheetType);
    }

    dotsheetPromise.then(dotsheets => {
        console.log(dotsheets);
        startGeneration(dotsheets, dotNumber);
    });
    
    return false;
});

async function loadCustomDotsheet() {
    const uploads = document.querySelector("#fileInput").files;

    const fileBufferPromises = [];
    for (const file of uploads) {
        fileBufferPromises.push(file.arrayBuffer());
    }
    console.log(fileBufferPromises);

    const files = (await Promise.all(fileBufferPromises)).map(file => new Uint8Array(file));

    return files;
}

async function loadStandardDotsheet(dotsheetType) {
    const dotsheetURLs = Object.values(standardDotsheets[dotsheetType]);
    
    let responses = dotsheetURLs.map(url => fetch(url));

    let dotsheetLoadPromises = (await Promise.all(responses)).map(async (response) => new Uint8Array(await response.arrayBuffer()));
    
    const dotsheets = await Promise.all(dotsheetLoadPromises);
    console.log(dotsheets);
    
    return dotsheets;
}

function importFiles(r) {
    let files = {};

    r.keys().forEach(key => {
        let path = key.substring(2).split("/");
        let directory = files;
        for (let i = 0; i < path.length - 1; i++) {
            const dirName = path[i];
            if (!directory[dirName]) {
                directory[dirName] = {};
            }
            
            directory = directory[dirName];
        }
    
        const filename = path[path.length - 1];
        directory[filename] = r(key);
    });

    return files;
}