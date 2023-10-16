import { startGeneration } from "./generator";

let standardDotsheets = importFiles(require.context("../dotsheets", true, /\.pdf$/));

document.querySelector("#generatorForm").addEventListener("submit", () => {
    const dotNumber = document.querySelector("#dotNumberInput").value;
    
    const dotsheetType = document.querySelector("input[name='dotsheetSelector']:checked").value;
    let selectedDotsheets = null;

    if (dotsheetType == "custom") {
        selectedDotsheets = loadCustomDotsheet();
    } else {
        selectedDotsheets = loadStandardDotsheet(dotsheetType);
    }
    
    // startGeneration();
    return false;
});

function loadCustomDotsheet() {

}

function loadStandardDotsheet(dotsheetType) {
    const dotsheetURLs = Object.values(standardDotsheets[dotsheetType]);
    console.log("dotsheets: ", dotsheetURLs);
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