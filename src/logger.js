const errorLog = document.querySelector("#errorText");

export function logError(message) {
    errorLog.style.display = "block";
    errorLog.textContent = message;
}

export function resetLog() {
    errorLog.style.display = "none";
    errorLog.textContent = "";
}