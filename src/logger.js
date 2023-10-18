const errorLog = document.querySelector("#errorText");

export function logError(message) {
    errorLog.textContent = message;
}

export function resetLog() {
    errorLog.textContent = "";
}