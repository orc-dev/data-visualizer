import { parseRawData, extractRawData, groupByPuzzle, extractHMS } from './utils.js';
import { COLUMN_NAMES } from './constants.js';

const fileInput = document.getElementById('fileInput');
const fileNameDisplay = document.getElementById('fileName');

// Listen for file selection
fileInput.addEventListener('change', event => {
    const file = event.target.files[0]; // Get the selected file
    if (file) {
        fileNameDisplay.textContent = `Selected File: ${file.name}`;
        // Process the CSV file
        readCSVFile(file); 
    } else {
        fileNameDisplay.textContent = 'No file selected';
    }
});


// Read and process CSV file
function readCSVFile(file) {
    const reader = new FileReader();

    reader.onload = event => {
        const csvData = event.target.result;
        const lines = csvData.split(/\r?\n/);

        // Extract and parse raw data
        const { rawMetaData, rawGameData } = extractRawData(lines);
        const { metaData, gameData } = parseRawData(rawMetaData, rawGameData);

        // Partition data by puzzleId
        const puzzleData = groupByPuzzle(gameData);
        const puzzleKeys = Object.keys(puzzleData);
        
        // Visualize each participant's data
        puzzleKeys.forEach(puzzleId => {
            visualizePuzzle(puzzleId, puzzleData[puzzleId]);
        });
    };
    reader.readAsText(file);
}


function visualizePuzzle(puzzleId, puzzleData) {
    // Create a container for the visualization
    const containerId = `visualization-${puzzleId}`;
    let container = document.getElementById(containerId);

    // Convert timestamps to seconds
    const firstTime = extractHMS(puzzleData[0].TIMESTAMP); // Get first timestamp
    const firstTimeInSeconds = firstTime.hh * 3600 + firstTime.mm * 60 + firstTime.ss;

    const end = puzzleData.length - 1;
    const lastRow = puzzleData[end];
    const finalProgress = lastRow.PROGRESS;

    const lastTime = extractHMS(puzzleData[end].TIMESTAMP);
    const lastTimeInSeconds = lastTime.hh * 3600 + lastTime.mm * 60 + lastTime.ss;
    const timeSpend = lastTimeInSeconds - firstTimeInSeconds;

    const finalStatus = (finalProgress === 100) ? `SOLVED | ${timeSpend} sec | ${end} steps` 
                                                : `TIMEOUT | ${finalProgress}% | ${end} steps`;

    if (!container) {
        container = document.createElement("div");
        container.id = containerId;
        container.className = "visualization-container";
        container.innerHTML = `<h2>Puzzle: ${puzzleId} &nbsp;
            <span style="font-size: 16px; color:rgb(163, 174, 230);">${finalStatus}</span></h2>`;
        document.body.appendChild(container);
    }

    // Remove previous visualization if it exists
    d3.select(`#${containerId} svg`).remove();

    // Set up SVG dimensions
    const width = 1450, height = 400;
    const margin = { top: 40, right: 50, bottom: 50, left: 50 };
    const svgWidth = width - margin.left - margin.right;
    const svgHeight = height - margin.top - margin.bottom;

    // Create an SVG inside the container
    const svg = d3.select(`#${containerId}`)
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    

    puzzleData.forEach(d => {
        const { hh, mm, ss } = extractHMS(d.TIMESTAMP);
        d.timeInSeconds = (hh * 3600 + mm * 60 + ss) - firstTimeInSeconds; // Make time relative
        d.progress = +d.PROGRESS; // Convert to number
    });

    // Sort data by time (in case it's not sorted)
    //puzzleData.sort((a, b) => a.timeInSeconds - b.timeInSeconds);

    // Define scales
    const xScale = d3.scaleLinear()
        .domain([0, 480]) // Time range (0 to 8 minutes)
        .range([0, svgWidth]);

    const yScale = d3.scaleLinear()
        .domain([0, 100]) // Progress range (0 to 100)
        .range([svgHeight, 0]); // Inverted since SVG y=0 is top

    // Define line generator
    const lineGenerator = d3.line()
        .x(d => xScale(d.timeInSeconds))
        .y(d => yScale(d.progress))
        .curve(d3.curveLinear);

    // Draw line connecting points
    svg.append("path")
        .datum(puzzleData) // Bind data
        .attr("fill", "none")
        .attr("stroke", "#cccccc")
        .attr("stroke-width", 1)
        .attr("d", lineGenerator); // Use the line generator to draw path

    // Add X-axis
    svg.append("g")
        .attr("transform", `translate(0, ${svgHeight})`)
        .call(d3.axisBottom(xScale)
            .ticks(16)
            .tickFormat(d => `${d}s`) // Format the tick labels
        )
        .append("text")
        .attr("x", svgWidth / 2)
        .attr("y", 40)
        .attr("fill", "black")
        .attr("text-anchor", "middle")
        .text("Time (seconds)");

    // Add Y-axis
    svg.append("g")
        .call(d3.axisLeft(yScale))
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -svgHeight / 2)
        .attr("y", -40)
        .attr("fill", "black")
        .attr("text-anchor", "middle")
        .text("Progress (%)");

    // Append a transparent hover layer over the entire chart
    svg.append("rect")
        .attr("width", svgWidth)
        .attr("height", svgHeight)
        .attr("fill", "transparent")
        .style("pointer-events", "all") // Ensures the rect captures mouse events
        .on("mousemove", function(event) {
            const mouseX = d3.pointer(event, this)[0]; // Get X position of mouse
            
            // Find the closest data point based on X-axis (time)
            let closestPoint = puzzleData.reduce((prev, curr) => {
                const currDiff = Math.abs(xScale(curr.timeInSeconds) - mouseX);
                const prevDiff = Math.abs(xScale(prev.timeInSeconds) - mouseX);
                return (currDiff < prevDiff) ? curr : prev;
            });

            // Select all circles, reset color and size
            svg.selectAll("circle")
                .attr("fill", COLORS.plainDot)
                .attr("r", 2.5);

            // Highlight the closest point
            svg.selectAll("circle")
                .filter(d => d === closestPoint)
                .attr("fill", COLORS.hoverDot) // Highlight color
                .attr("r", 5); // Increase size
        })
        .on("mouseleave", function() {
            // Reset all points when mouse leaves
            svg.selectAll("circle")
                .attr("fill", COLORS.plainDot)
                .attr("r", 2.5);
        });

    // Append scatter plot points
    svg.selectAll("circle")
        .data(puzzleData)
        .enter()
        .append("circle")
        .attr("cx", d => xScale(d.timeInSeconds))
        .attr("cy", d => yScale(d.progress))
        .attr("r", 2.5) // Default radius
        .attr("fill", COLORS.plainDot)
        .attr("opacity", 1)
        .on("mouseover", function (event, d) {
            d3.select(this)
                .attr("fill", COLORS.hoverDot) // Highlight color
                .attr("r", 5); // Increase size
        });
}

const COLORS = {
    plainDot: '#8969F5',
    hoverDot: '#FF6666',
};

export { readCSVFile };
