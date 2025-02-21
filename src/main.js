import { parseRawData, extractRawData, groupByPuzzle, extractHMS, toDailySeconds } from './utils.js';
import { COLORS, unit } from './constants.js';
import { SVG_PIECE, PTN_PIECE } from './svgPieces.js';
import { PUZZLE_LIST } from './puzzles/puzzleLib.js';

/** Global fields */
const fileInput = document.getElementById('fileInput');
const pFileName = document.getElementById('fileName');
const coord = document.getElementById('svgCoord');
const patterns = {};
const pieceKeys = Object.keys(SVG_PIECE);

// Listen for file selection
fileInput.addEventListener('change', event => {
    const file = event.target.files[0]; // Get the selected file
    const spanStyle = 'font-size: 15px; color: rgb(123, 48, 235); font-family: monospace;';
    if (file) {
        pFileName.innerHTML = `Selected File: <span style="${spanStyle}">${file.name}</span>`;
        pFileName.style.visibility = 'visible';
        visualizeCSVFile(file); 
    } else {
        pFileName.textContent = 'No file selected';
    }
});


const displayMetaData = (metaData) => {
    const container = document.getElementById('metadata-container');
    container.innerHTML = ''; // Clear previous content

    const ul = document.createElement('ul');

    Object.entries(metaData).forEach(([key, value]) => {
        const li = document.createElement('li');

        // Create spans for key and value
        const keySpan = document.createElement('span');
        keySpan.textContent = `${key}: `;
        keySpan.classList.add('key-style'); // Add CSS class

        const valueSpan = document.createElement('span');
        valueSpan.textContent = value;
        valueSpan.classList.add('value-style'); // Add CSS class

        // Append spans to list item
        li.appendChild(keySpan);
        li.appendChild(valueSpan);

        ul.appendChild(li);
    });

    container.appendChild(ul);
};



// Read and process CSV file
function visualizeCSVFile(file) {
    const reader = new FileReader();

    reader.onload = event => {
        const csvData = event.target.result;
        const lines = csvData.split(/\r?\n/);

        // Extract and parse raw data
        const { rawMetaData, rawGameData } = extractRawData(lines);
        const { metaData, gameData } = parseRawData(rawMetaData, rawGameData);
        // TODO: add code to visualize metaData :::::::::::::::::::::: { TODO }
        displayMetaData(metaData);

        // Partition data by puzzleId
        const puzzleData = groupByPuzzle(gameData);
        const puzzleKeys = Object.keys(puzzleData);
        
        // Adjust the svg coord and append svg pieces to it
        coord.setAttribute('transform', 'translate(200, 110) scale(1, -1)');
        Object.values(PTN_PIECE).forEach(piece => coord.appendChild(piece));
        Object.values(SVG_PIECE).forEach(piece => coord.appendChild(piece));

        // Visualize each participant's data
        puzzleKeys.forEach(puzzleId => {
            patterns[puzzleId] = PUZZLE_LIST[puzzleId];
            visualizePuzzle(puzzleId, puzzleData[puzzleId]);
        });
    };
    reader.readAsText(file);
}


function visualizePuzzle(puzzleId, puzzleData) {
    // Extract puzzle result by checking the progress and computing time duration
    const firstTimeObj = extractHMS(puzzleData[0].TIMESTAMP);
    const firstTimeSec = toDailySeconds(firstTimeObj);

    const endIdx = puzzleData.length - 1;
    const lastTimeObj = extractHMS(puzzleData[endIdx].TIMESTAMP);
    const lastTimeSec = toDailySeconds(lastTimeObj);

    const finalProgress = puzzleData[endIdx].PROGRESS;
    const maxProgress = puzzleData[endIdx].MAX_PROGRESS;
    const TotalTimeSec = lastTimeSec - firstTimeSec;

    const finalStatus = (finalProgress === 100) 
        ? `SOLVED | ${TotalTimeSec} sec | ${endIdx} steps`
        : `TIMEOUT | ${maxProgress}% | ${endIdx} steps`;

    // Formalize puzzle data
    puzzleData.forEach(d => {
        const { hh, mm, ss } = extractHMS(d.TIMESTAMP);
        d.timeInSeconds = (hh * 3600 + mm * 60 + ss) - firstTimeSec;
        d.progress = +d.PROGRESS;
    });

    // Create a container for the visualization
    const containerId = `visualization-${puzzleId}`;
    let container = document.getElementById(containerId);
    const spanStyle = 'font-size: 15px; color: rgb(163, 174, 230); font-family: monospace;';
    if (!container) {
        container = document.createElement('div');
        container.id = containerId;
        container.className = 'visualization-container';
        container.innerHTML = `<h2>Puzzle: ${puzzleId} &nbsp;<span style="${spanStyle}">${finalStatus}</span></h2>`;
        document.body.appendChild(container);
    }
    // Remove previous visualization if it exists
    d3.select(`#${containerId} svg`).remove();

    // Set up SVG dimensions
    const width = 1450, height = 400;
    const margin = { top: 50, right: 50, bottom: 50, left: 50 };
    const svgWidth = width - margin.left - margin.right;
    const svgHeight = height - margin.top - margin.bottom;

    // Create an SVG inside the container
    const svg = d3.select(`#${containerId}`)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`)
        .on('mouseover', function () {
            Object.values(PTN_PIECE).forEach(p => p.setAttribute('visibility', 'visible'));
            Object.values(SVG_PIECE).forEach(p => p.setAttribute('visibility', 'visible'));
            loadPattern(PUZZLE_LIST[puzzleId]);
        })
        .on('mouseleave', function () {
            Object.values(PTN_PIECE).forEach(p => p.setAttribute('visibility', 'hidden'));
            Object.values(SVG_PIECE).forEach(p => p.setAttribute('visibility', 'hidden'));
        });
    
    // Define scales
    const xScale = d3.scaleLinear().domain([0, 480]).range([0, svgWidth]);
    const yScale = d3.scaleLinear().domain([0, 100]).range([svgHeight, 0]);

    // Define line generator
    const lineGenerator = d3.line()
        .x(d => xScale(d.timeInSeconds))
        .y(d => yScale(d.progress))
        .curve(d3.curveLinear);

    // Draw line connecting points
    svg.append('path')
        .datum(puzzleData) // Bind data
        .attr('fill', 'none')
        .attr('stroke', '#cccccc')
        .attr('stroke-width', 1)
        .attr('d', lineGenerator); // Use the line generator to draw path

    // Add X-axis
    svg.append('g')
        .attr('transform', `translate(0, ${svgHeight})`)
        .call(d3.axisBottom(xScale).ticks(16).tickFormat(d => `${d}s`))
        .append('text')
        .attr('x', svgWidth / 2)
        .attr('y', 40)
        .attr('fill', 'black')
        .attr('text-anchor', 'middle')
        .text('Time (seconds)');

    // Add Y-axis
    svg.append('g')
        .call(d3.axisLeft(yScale))
        .append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -svgHeight / 2)
        .attr('y', -40)
        .attr('fill', 'black')
        .attr('text-anchor', 'middle')
        .text('Progress (%)');

    // Append a transparent hover layer over the entire chart
    svg.append('rect')
        .attr('width', svgWidth)
        .attr('height', svgHeight)
        .attr('fill', 'transparent')
        .style('pointer-events', 'all') // Ensures the rect captures mouse events
        .on('mousemove', function(event) {
            const mouseX = d3.pointer(event, this)[0]; // Get X position of mouse
            
            // Find the closest data point based on X-axis (time)
            let closestPoint = puzzleData.reduce((prev, curr) => {
                const currDiff = Math.abs(xScale(curr.timeInSeconds) - mouseX);
                const prevDiff = Math.abs(xScale(prev.timeInSeconds) - mouseX);
                return (currDiff < prevDiff) ? curr : prev;
            });
            updatePieces(closestPoint);

            // Select all circles, reset color and size
            svg.selectAll('circle')
                .attr('fill', COLORS.plainDot)
                .attr('r', 2.5);

            // Highlight the closest point
            svg.selectAll('circle')
                .filter(d => d === closestPoint)
                .attr('fill', COLORS.hoverDot) // Highlight color
                .attr('r', 5); // Increase size
        })
        .on('mouseleave', function() {
            // Reset all points when mouse leaves
            svg.selectAll('circle')
                .attr('fill', COLORS.plainDot)
                .attr('r', 2.5);
        });

    // Append scatter plot points
    svg.selectAll('circle')
        .data(puzzleData)
        .enter()
        .append('circle')
        .attr('cx', d => xScale(d.timeInSeconds))
        .attr('cy', d => yScale(d.progress))
        .attr('r', 2.5) // Default radius
        .attr('fill', COLORS.plainDot)
        .attr('opacity', 1)
        .on('mouseover', function (event, d) {
            d3.select(this)
                .attr('fill', COLORS.hoverDot) // Highlight color
                .attr('r', 5); // Increase size
        });
}


/** Transform the svg pieces to show the state at given data point */
function updatePieces(dataPoint) {
    pieceKeys.forEach(key => {
        const px = unit * dataPoint[`${key}_X`];
        const py = unit * dataPoint[`${key}_Y`];
        const sx = (key === 'PL' && dataPoint[`${key}_F`] === 180) ? -1 : 1;
        const dg = dataPoint[`${key}_R`] * sx;
        
        SVG_PIECE[key].setAttribute(
            'transform',
            `translate(${px}, ${py}) rotate(${dg}) scale(${sx},1)`
        );
    });
}

/** Transform dark svg pieces to form the pattern */
function loadPattern(pattern) {
    pieceKeys.forEach(key => {
        const t = pattern.getPiece(key);  // transform data
        const px = unit * t.px;
        const py = unit * t.py;
        const dg = t.rz;
        const sx = (key === 'PL' && t.ry === 180) ? -1 : 1;
        PTN_PIECE[key].setAttribute(
            'transform', 
            `translate(${px}, ${py}) rotate(${dg}) scale(${sx},1)`
        );
    });
}
