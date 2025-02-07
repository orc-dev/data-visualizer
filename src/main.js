import { processCSV } from "./utils.js";

// Get file input element
const fileInput = document.getElementById("fileInput");
const fileNameDisplay = document.getElementById("fileName");

// Listen for file selection
fileInput.addEventListener("change", event => {
    const file = event.target.files[0]; // Get the first selected file

    if (file) {
        fileNameDisplay.textContent = `Selected File: ${file.name}`;
        readCSVFile(file);
    }
});

// Function to read CSV file
function readCSVFile(file) {
    const reader = new FileReader();

    reader.onload = event => {
        const csvData = event.target.result;
        processCSV(csvData); // Send to processing function
    };

    reader.readAsText(file);
}