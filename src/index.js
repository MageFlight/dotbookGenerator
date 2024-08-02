import { startGeneration } from "./generator";
import { logError, resetLog } from "./logger";

let standardDotsheets = importFiles(require.context("../dotsheets", true, /\.pdf$/));

document.querySelector("#generatorForm").addEventListener("submit", event => {
    resetLog();
    const processingDialog = document.querySelector("#processingDialog");
    const currentTask = document.querySelector("#currentTask");

    processingDialog.showModal();
    currentTask.textContent = "Loading Data";

    const dotNumber = document.querySelector("#dotNumberInput").value;
    
    const dotsheetType = document.querySelector("input[name='dotsheetSelector']:checked").value;
    
    let dotsheetPromise = null;
    if (dotsheetType == "custom") {
        dotsheetPromise = loadCustomDotsheet();
    } else {
        dotsheetPromise = loadStandardDotsheet(dotsheetType);
    }

    dotsheetPromise.then(async (dotsheets) => {
        console.log(dotsheets);
        startGeneration(dotsheets, dotNumber, currentTask).then(() => processingDialog.close()).catch(error => logError(error.stack));
    });

    event.stopImmediatePropagation();
    
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

async function loadStandardDotsheet() {
    const selectDotsheet = document.querySelector("#standardDotsheet").value;
    
    const dotsheetURLs = Object.values(standardDotsheets[selectDotsheet]);
    
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

// Show the user when the file upload has been successful

let input = document.getElementById('fileInput');
let label = input.nextElementSibling;
let labelText = label.innerText;

input.addEventListener('change', e => {
    console.log("label Text: ", labelText);

    let filename = ""
    if (input.files && input.files.length > 1) {
        filename = (input.getAttribute( 'data-multiple-caption' ) || '').replace( '{count}', input.files.length)
    } else {
        filename = e.target.value.split('\\').pop()
    }

    if (filename) {
        label.innerText = filename
        document.getElementById("dotsheet-custom").checked = true;
    } else {
        label.innerText = labelText
    }
})