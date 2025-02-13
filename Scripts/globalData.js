import WaveSurfer from '../resources/wavesurfer/wavesurfer.esm.js';
import RegionsPlugin from '../resources/wavesurfer/regions.esm.js';
import ZoomPlugin from '../resources/wavesurfer/zoom.esm.js';
import TimelinePlugin from '../resources/wavesurfer/timeline.esm.js';

window.songFilePath = '';
window.segmentData = [];
window.clusters = 0;

// Initialize the Regions plugin
const regions = RegionsPlugin.create();

const zoom = ZoomPlugin.create({
    // the amount of zoom per wheel step, e.g. 0.5 means a 50% magnification per scroll
    scale: 0.1,
});

export let globalState = {
    // stores label color map
    colorMap: new Map(),
    // headers for segment data
    headers: ["number", "start", "end", "label"],
    // stores the wavesurfer regions for segments
    segmentRegions: [],
    currentZoom: zoom.options.minPxPerSec,
    timeline: null
};

const htmlElements = {
    // Constants for HTML elements
    segmentDetailsDialog: document.querySelector('#segment-details-dialog'),
    removeBoundaryDialog: document.querySelector('#remove-boundary-dialog'),

    // import/export buttons
    importButton: document.getElementById('chooseSong'),
    exportButton: document.querySelector('#export'),

    // Segment buttons
    segmentDetailsButton: document.querySelector('#segment-details'),
    closeDialogButton: document.querySelector('#close-dialog'),
    addBoundaryButton: document.querySelector('#add-boundary'),
    removeBoundaryButton: document.querySelector('#remove-boundary'),
    changeBoundaryButton: document.querySelector('#change-boundary'),

    // wavesurfer buttons
    playButton: document.querySelector('#play'),
    forwardButton: document.querySelector('#forward'),
    backButton: document.querySelector('#backward'),
    zoomInButton: document.querySelector('#zoom-in'),
    zoomOutButton: document.querySelector('#zoom-out'),
    labelsContainer: document.getElementById("labels-container"),
    waveformContainer: document.getElementById("waveform"),

    // algorithm buttons
    algorithm1Button: document.getElementById("segment-algorithm1"),
    algorithm2Button: document.getElementById("segment-algorithm2"),
    algorithm3Button: document.getElementById("segment-algorithm3"),
    algorithm4Button: document.getElementById("segment-algorithm4"),
    algorithmAutoButton: document.getElementById("auto-segment"),

    // load menu dialog
    loadMenuDialog: document.querySelector('#load-dialog'),
    loadFiles: document.getElementById('load-files'),
    closeLoadDialogButton: document.querySelector('#close-load-dialog'),

    // save menu dialog
    saveMenuDialog: document.querySelector('#save-dialog'),
    saveFiles: document.getElementById('save-files'),
    closeSaveDialogButton: document.querySelector('#close-save-dialog'),

    // error dialog
    errorDialog: document.getElementById('error-dialog'),
    closeErrorDialogButton: document.getElementById('close-error-dialog'),
    errorDialogMessage: document.getElementById('error-message'),

    // project buttons
    openWorkspaceButton: document.getElementById('open-workspace'),
    loadButton: document.getElementById('load'),
    saveButton: document.getElementById('save'),
    algorithmAutoButton: document.getElementById("auto-segment"),
    fileDropdownContent: document.getElementById("file-dropdown-content"),
    fileDropdown: document.getElementById("file-dropdown"),
    fileDropdownButton: document.getElementById("file-dropdown-button"),
    algorithmsDropdownContent: document.getElementById("algorithms-dropdown-content"),
    algorithmsDropdown: document.getElementById("algorithms-dropdown"),
    algorithmsDropdownButton: document.getElementById("algorithms-dropdown-button"),
    boundariesDropdownContent: document.getElementById("boundaries-dropdown-content"),
    boundariesDropdown: document.getElementById("boundaries-dropdown"),
    boundariesDropdownButton: document.getElementById("boundaries-dropdown-button"),

    // Create an instance of WaveSurfer
    wavesurfer: WaveSurfer.create({
        container: '#waveform',
        waveColor: 'rgb(200, 0, 200)',
        progressColor: 'rgb(100, 0, 100)',
        minPxPerSec: 100,
        plugins: [regions, zoom],
    })
};
export default htmlElements;

let defaultColors = [
    `rgba(213, 133, 42, 0.5)`,
    `rgba(79, 120, 176, 0.5)`,
    `rgba(132, 192, 63, 0.5)`,
    `rgba(142, 87, 168, 0.5)`,
    `rgba(169, 86, 88, 0.5)`,
    `rgba(180, 205, 50, 0.5)`,
    `rgba(62, 66, 193, 0.5)`,
    `rgba(186, 69, 144, 0.5)`,
    `rgba(88, 167, 109, 0.5)`    
]
// Give regions a random color when there are no more default colors
const random = (min, max) => Math.random() * (max - min) + min
const randomColor = () => `rgba(${random(0, 255)}, ${random(0, 255)}, ${random(0, 255)}, 0.5)`

// Updates the segment elements and display in table
export function updateSegmentElementsList(elements, updateWaveform) {
    const tbody = document.getElementById('segment-elements');
    tbody.innerHTML = ''

    // If waveform is being updated
    if(updateWaveform) {
        regions.clearRegions()
        globalState.colorMap.clear();
        htmlElements.labelsContainer.textContent = "";
        globalState.segmentRegions = [];
    }

    elements.forEach(element => {
        let tr = document.createElement('tr');
        for (let key in element) {
            let td = document.createElement('td');
            td.textContent = element[key]
            tr.appendChild(td)
        }
        tbody.appendChild(tr);

        if(!globalState.colorMap.has(element.label)) {
            globalState.colorMap.set(element.label, getColor(globalState.colorMap.size));
        }


        if(updateWaveform) {
            // Create new region
            let region = regions.addRegion({
                start: element.start,
                end: element.end,
                color: globalState.colorMap.get(element.label),
                drag: false,
                resize: false,
            });

            globalState.segmentRegions.push(region);

            // Create segment label for region
            let labelInput = document.createElement("input");
            labelInput.type = "text";
            labelInput.value = element.label;
            labelInput.className = "region-label-input";
            labelInput.style.backgroundColor = globalState.colorMap.get(element.label);
            labelInput.addEventListener("input", (event) => {
                updateSegmentLabel(element, event.target.value);
            });
            htmlElements.labelsContainer.appendChild(labelInput);
            updateLabelPositions();

            // Sync text input value with region data
            labelInput.addEventListener("input", () => {
                region.data = region.data || {}; 
                region.data.label = labelInput.value;
            });

            // Update position when region is moved/resized
            region.on("update-end", updateLabelPositions);
        }
    });
}

// Updates label positions with the most up to date waveform
export function updateLabelPositions() {
    document.querySelectorAll(".region-label-input").forEach((label, index) => {
        let region = globalState.segmentRegions[index];
        let regionRect = region.element.getBoundingClientRect();
        let waveform = document.getElementById('waveform');
        label.style.left = `${regionRect.left - waveform.getBoundingClientRect().left + waveform.offsetLeft}px`;
        label.style.width = `${regionRect.width}px`;
    });
}

// Updates the specified segment elements label value
function updateSegmentLabel(segmentElement, value) {
    segmentElement.label = value;
    updateSegmentElementsList(window.segmentData, false);
}

// Gets the next color to be used for segment region
function getColor(length) {
    if(length > 10) {
        return randomColor();
    } else {
        return defaultColors[length];
    }
}

// Updates the timeline based on the current zoom level
export function updateTimeline() {
    const timeInterval = calculateTimeInterval(globalState.currentZoom, htmlElements.wavesurfer.getDuration());
    if(globalState.timeline != null) {
        globalState.timeline.destroy(); // Remove the old timeline
    }
    globalState.timeline = TimelinePlugin.create({
        height: 20,
        insertPosition: 'beforebegin',
        timeInterval: timeInterval,
        primaryLabelInterval: timeInterval * 5,
        secondaryLabelInterval: timeInterval,
        style: {
          fontSize: '20px',
          color: '#2D5B88',
        }
    });
    htmlElements.wavesurfer.registerPlugin(globalState.timeline);
}

// Determines time interval for given zoom level
function calculateTimeInterval(zoomLevel, duration) {
    let baseInterval;
    
    // Adjust based on zoom level
    if (zoomLevel > 300) baseInterval = 0.1;
    else if (zoomLevel > 200) baseInterval = 0.25;
    else if (zoomLevel > 150) baseInterval = 0.5;
    else if (zoomLevel > 100) baseInterval = 1;
    else if (zoomLevel > 50) baseInterval = 2;
    else if (zoomLevel > 10) baseInterval = 5;
    else if (zoomLevel > 5) baseInterval = 10;
    else baseInterval = 20;

    // Adjust further based on duration to avoid label crowding
    if (duration > 300 && zoomLevel <= 10) baseInterval *= 2; // Longer waveform, spread labels out more
    if (duration > 600 && zoomLevel <= 10) baseInterval *= 3;
    if (duration > 1200 && zoomLevel <= 10) baseInterval *= 4;
    
    return baseInterval;
}

// displays the error dialog
export function presentErrorDialog(message) {
    htmlElements.errorDialogMessage.textContent = message;
    htmlElements.errorDialog.showModal();
}

// loads the song in the app
export async function loadSong(filePath) {
    console.log('File path:', filePath);
    window.songFilePath = filePath;
    regions.clearRegions();
    await htmlElements.wavesurfer.load(filePath);
    globalState.currentZoom = 10;
    updateTimeline();
}