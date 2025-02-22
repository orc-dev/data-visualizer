import { COLUMN_NAMES } from './constants.js';

/** Export a list of functions for data reading/parsing. */
function extractMetaData(rawMeta) {
    let metaData = {};

    const separateFirstColon = (line) => {
        const index = line.indexOf(":"); // Find the first colon
        if (index === -1) return [line, ""]; // No colon found, return full string in first part
    
        const firstPart = line.slice(0, index).trim();  // Before the colon
        const secondPart = line.slice(index + 1).trim(); // After the colon
    
        return [firstPart, secondPart];
    };

    rawMeta.forEach(line => {
        if (line.startsWith("#")) {
            // Remove '#' and split at ':'
            const parts = separateFirstColon(line.slice(1)); 
            if (parts.length === 2) {
                const key   = parts[0].trim();
                const value = parts[1].trim();
                metaData[key] = value;
            }
        }
    });
    return metaData;
}

// Function to check if CSV columns match the expected ones
function validateColumns(csvColumns) {
    return JSON.stringify(csvColumns) === JSON.stringify(COLUMN_NAMES);
}

export function extractRawData(lines) {
    let rawMetaData = [];
    let rawGameData = [];

    // Extract metadata and find the data start
    for (let line of lines) {
        line = line.trim();

        if (line.startsWith('#')) {
            rawMetaData.push(line);  // Store meta comments
        } 
        else if (line === "---" || /^[,]+$/.test(line)) {
            continue;
        } 
        else {
            rawGameData.push(line);  // Store game data
        }
    }
    return { rawMetaData, rawGameData };
}


export function parseRawData(rawMetaData, rawGameData) {
    const metaData = extractMetaData(rawMetaData);

    // Join back data lines for parsing
    const formattedCSV = rawGameData.join('\n');
    const gameData = d3.csvParse(formattedCSV);

    if (gameData.length === 0) {
        console.warn('No data found in the CSV');
    }
    if (!validateColumns(Object.keys(gameData[0]))) {
        console.log(gameData[0]);
        throw new Error('Column names mismatch.');
    }
    // Convert numeric columns
    gameData.forEach(d => {
        for (let key in d) {
            if (!isNaN(d[key])) {
                d[key] = +d[key];  // Convert string to number
            }
        }
    });
    return { metaData, gameData };
}


// Function to partition gameData by ParticipantId
export function groupByPuzzle(gameData) {
    const partitioned = {};
    
    gameData.forEach(row => {
        const puzzleId = row[COLUMN_NAMES[0]];
        if (!partitioned[puzzleId]) {
            partitioned[puzzleId] = [];
        }
        partitioned[puzzleId].push(row);
    });
    return partitioned;
}


export function extractHMS(timestamp) {
    const parts = timestamp.split(':').map(num => parseInt(num, 10));

    if (parts.length !== 3 || parts.some(isNaN)) {
        throw new Error(`Invalid timestamp format: ${timestamp}`);
    }
    return {
        hh: parts[0], // Hours
        mm: parts[1], // Minutes
        ss: parts[2]  // Seconds
    };
}

export function toDailySeconds(hmsObject) {
    return hmsObject.hh * 3600 + hmsObject.mm * 60 + hmsObject.ss;
}