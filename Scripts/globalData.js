import WaveSurfer from 'https://unpkg.com/wavesurfer.js@7.8.16/dist/wavesurfer.esm.js';
import RegionsPlugin from 'https://unpkg.com/wavesurfer.js@7.8.16/dist/plugins/regions.esm.js';
import ZoomPlugin from 'https://unpkg.com/wavesurfer.js@7.8.16/dist/plugins/zoom.esm.js';

class EditMode {
    static NONE = 'none';
    static ADD = 'add';
    static REMOVE = 'remove';
    static CHANGE = 'change';
}

// Initialize the Regions plugin
const regions = RegionsPlugin.create();

const zoom = ZoomPlugin.create({
    // the amount of zoom per wheel step, e.g. 0.5 means a 50% magnification per scroll
    scale: 0.1,
});

export const globalState = {
    // input audio file path
    filePath: '',
    // stores label color map
    colorMap: new Map(),
    // headers for segment data
    headers: ["number", "start", "end", "label"],
    // stores all the segment data
    segmentData: [],
    clusters: 0,
    mode: EditMode.NONE,
    // stores the wavesurfer regions for segments
    segmentRegions: [],
    EditMode: EditMode
};

const htmlElements = {
    // Constants for HTML elements
    segmentDetailsDialog: document.querySelector('#segment-details-dialog'),
    removeBoundaryDialog: document.querySelector('#remove-boundary-dialog'),
    importButton: document.getElementById('chooseSong'),
    exportButton: document.querySelector('#export'),
    segmentDetailsButton: document.querySelector('#segment-details'),
    addBoundaryButton: document.querySelector('#add-boundary'),
    removeBoundaryButton: document.querySelector('#remove-boundary'),
    changeBoundaryButton: document.querySelector('#change-boundary'),
    closeDialogButton: document.querySelector('#close-dialog'),
    playButton: document.querySelector('#play'),
    forwardButton: document.querySelector('#forward'),
    backButton: document.querySelector('#backward'),
    zoomInButton: document.querySelector('#zoom-in'),
    zoomOutButton: document.querySelector('#zoom-out'),
    labelsContainer: document.getElementById("labels-container"),
    waveformContainer: document.getElementById("waveform"),
    algorithm1Button: document.getElementById("segment-algorithm1"),
    algorithm2Button: document.getElementById("segment-algorithm2"),
    algorithm3Button: document.getElementById("segment-algorithm3"),
    algorithm4Button: document.getElementById("segment-algorithm4"),
    regions: regions,
    zoom: zoom,

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
        htmlElements.regions.clearRegions()
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
            let region = htmlElements.regions.addRegion({
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
    updateSegmentElementsList(globalState.segmentData, false);
}

// Gets the next color to be used for segment region
function getColor(length) {
    if(length > 10) {
        return randomColor();
    } else {
        return defaultColors[length];
    }
}