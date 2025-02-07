export function processCSV(csvText) {
    // Parse CSV using D3.js
    const data = d3.csvParse(csvText);

    console.log("Parsed CSV Data:", data);

    // Example: Convert numerical values if needed
    data.forEach(d => {
        d.someNumericColumn = +d.someNumericColumn; // Convert to number
    });

    console.log("Processed Data:", data);
}