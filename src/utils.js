import { COLUMN_NAMES } from './constants.js';

// Function to check if CSV columns match the expected ones
function validateColumns(csvColumns) {
    return JSON.stringify(csvColumns) === JSON.stringify(COLUMN_NAMES);
}

export function extractRawData(lines) {
    let rawMetaData = [];
    let rawGameData = [];

    // Extract metadata and find the data start
    for (let line of lines) {
        if (line.startsWith('#')) {
            rawMetaData.push(line);  // Store meta comments
        } 
        else if (line.length === 0) {
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


function extractMetaData(rawMeta) {
    let metaData = {};

    rawMeta.forEach(line => {
        if (line.startsWith("#")) {
            const parts = line.slice(1).split(":"); // Remove '#' and split at ':'
            if (parts.length === 2) {
                const key   = parts[0].trim();
                const value = parts[1].trim();
                metaData[key] = value;
            }
        }
    });
    return metaData;
}

export function extractHMS(timestamp) {
    const parts = timestamp.split(':')
                           .map(num => parseInt(num, 10));

    if (parts.length !== 3 || parts.some(isNaN)) {
        console.error(`Invalid timestamp format: ${timestamp}`);
        // Return null values if invalid
        return { hh: null, mm: null, ss: null }; 
    }
    return {
        hh: parts[0], // Hours
        mm: parts[1], // Minutes
        ss: parts[2]  // Seconds
    };
}