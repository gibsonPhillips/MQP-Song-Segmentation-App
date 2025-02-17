import WaveSurfer from '../resources/wavesurfer/wavesurfer.esm.js';
import RegionsPlugin from '../resources/wavesurfer/regions.esm.js';
import ZoomPlugin from '../resources/wavesurfer/zoom.esm.js';
import TimelinePlugin from '../resources/wavesurfer/timeline.esm.js';

window.songFilePaths = ['','','','',''];
window.segmentData = [[],[],[],[],[]];
window.clusters = [0, 0, 0, 0, 0];

// Initialize the Regions plugin
// const regions = RegionsPlugin.create();
const regionsPlugins = [
    RegionsPlugin.create(),
    RegionsPlugin.create(),
    RegionsPlugin.create(),
    RegionsPlugin.create(),
    RegionsPlugin.create()
]

export let globalState = {
    // stores label color map
    colorMap: new Map(),
    // headers for segment data
    headers: ["number", "start", "end", "label"],
    // stores the wavesurfer regions for segments
    segmentRegions: [
        [],
        [],
        [],
        [],
        []
    ],
    currentZoom: 10,
    timelines: [null, null, null, null, null],
    groupEditingMode: false,
    wavesurferWaveforms: [
        WaveSurfer.create({
            container: '#waveform0',
            waveColor: 'rgb(200, 0, 200)',
            progressColor: 'rgb(100, 0, 100)',
            minPxPerSec: 100,
            plugins: [regionsPlugins[0], ZoomPlugin.create({scale:0.1})],
        }),
        WaveSurfer.create({
            container: '#waveform1',
            waveColor: 'rgb(200, 0, 200)',
            progressColor: 'rgb(100, 0, 100)',
            minPxPerSec: 100,
            plugins: [regionsPlugins[1], ZoomPlugin.create({scale:0.1})],
        }),
        WaveSurfer.create({
            container: '#waveform2',
            waveColor: 'rgb(200, 0, 200)',
            progressColor: 'rgb(100, 0, 100)',
            minPxPerSec: 100,
            plugins: [regionsPlugins[2], ZoomPlugin.create({scale:0.1})],
        }),
        WaveSurfer.create({
            container: '#waveform3',
            waveColor: 'rgb(200, 0, 200)',
            progressColor: 'rgb(100, 0, 100)',
            minPxPerSec: 100,
            plugins: [regionsPlugins[3], ZoomPlugin.create({scale:0.1})],
        }),
        WaveSurfer.create({
            container: '#waveform4',
            waveColor: 'rgb(200, 0, 200)',
            progressColor: 'rgb(100, 0, 100)',
            minPxPerSec: 100,
            plugins: [regionsPlugins[4], ZoomPlugin.create({scale:0.1})],
        })
    ]
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
    // 0
    playButton0: document.querySelector('#play0'),
    forwardButton0: document.querySelector('#forward0'),
    backButton0: document.querySelector('#backward0'),
    // 1
    playButton1: document.querySelector('#play1'),
    forwardButton1: document.querySelector('#forward1'),
    backButton1: document.querySelector('#backward1'),
    // 2
    playButton2: document.querySelector('#play2'),
    forwardButton2: document.querySelector('#forward2'),
    backButton2: document.querySelector('#backward2'),
    // 3
    playButton3: document.querySelector('#play3'),
    forwardButton3: document.querySelector('#forward3'),
    backButton3: document.querySelector('#backward3'),
    // 4
    playButton4: document.querySelector('#play4'),
    forwardButton4: document.querySelector('#forward4'),
    backButton4: document.querySelector('#backward4'),
    // zoomInButton: document.querySelector('#zoom-in'),
    // zoomOutButton: document.querySelector('#zoom-out'),

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
    saveAudioCheckbox: document.getElementById('save-audio-checkbox'),
    closeSaveDialogButton: document.querySelector('#close-save-dialog'),

    // delete menu dialog
    deleteMenuDialog: document.querySelector('#delete-dialog'),
    deleteFiles: document.getElementById('delete-files'),
    closeDeleteDialogButton: document.querySelector('#close-delete-dialog'),

    // are you sure dialog
    areYouSureDialog: document.querySelector('#are-you-sure-dialog'),
    areYouSureHeader: document.getElementById('are-you-sure-header'),
    closeAreYouSureDialogButton: document.querySelector('#close-are-you-sure-dialog'),

    // error dialog
    errorDialog: document.getElementById('error-dialog'),
    closeErrorDialogButton: document.getElementById('close-error-dialog'),
    errorDialogMessage: document.getElementById('error-message'),

    // project buttons
    openWorkspaceButton: document.getElementById('open-workspace'),
    loadButton: document.getElementById('load'),
    saveButton: document.getElementById('save'),
    deleteButton: document.getElementById('delete'),

    // drop down stuff
    fileDropdownContent: document.getElementById("file-dropdown-content"),
    fileDropdown: document.getElementById("file-dropdown"),
    fileDropdownButton: document.getElementById("file-dropdown-button"),
    algorithmsDropdownContent: document.getElementById("algorithms-dropdown-content"),
    algorithmsDropdown: document.getElementById("algorithms-dropdown"),
    algorithmsDropdownButton: document.getElementById("algorithms-dropdown-button"),
    boundariesDropdownContent: document.getElementById("boundaries-dropdown-content"),
    boundariesDropdown: document.getElementById("boundaries-dropdown"),
    boundariesDropdownButton: document.getElementById("boundaries-dropdown-button"),
    groupEditingButton: document.getElementById("group-editing"),
    regions: regionsPlugins,
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
export function updateSegmentElementsList(elements, updateWaveform, waveformNum) {
    const tbody = document.getElementById('segment-elements');
    const str = 'labels-container' + String(waveformNum);
    tbody.innerHTML = ''

    // If waveform is being updated
    if(updateWaveform) {
        regionsPlugins[waveformNum].clearRegions()
        globalState.colorMap.clear();
        document.getElementById(str).textContent = "";
        // globalState.segmentRegions[waveformNum] = [];
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
            let region = regionsPlugins[waveformNum].addRegion({
                start: element.start,
                end: element.end,
                color: globalState.colorMap.get(element.label),
                drag: false,
                resize: false,
            });

            // Create segment label for region
            let labelInput = document.createElement("input");
            labelInput.type = "text";
            labelInput.value = element.label;
            labelInput.className = "region-label-input" + String(waveformNum);
            labelInput.style.backgroundColor = globalState.colorMap.get(element.label);
            labelInput.addEventListener("blur", (event) => {
                if(globalState.groupEditingMode) {
                    updateGroupSegmentLabel(element, event.target.value);
                } else {
                    updateOneSegmentLabel(element, event.target.value);
                }                
            });
            document.getElementById(str).appendChild(labelInput);

            // Sync text input value with region data
            labelInput.addEventListener("input", () => {
                region.data = region.data || {}; 
                region.data.label = labelInput.value;
            });

            // Update position when region is moved/resized
            region.on("update-end", () => updateLabelPositions(waveformNum));
        }
    });
    setTimeout(() => updateLabelPositions(waveformNum), 10);
}

// Updates label positions with the most up to date waveform
export function updateLabelPositions(waveformNum) {
    let str = 'waveform' + String(waveformNum);
    const str1 = ".region-label-input" + String(waveformNum);
    document.querySelectorAll(str1).forEach((label, index) => {
        // let region = globalState.segmentRegions[waveformNum][index];
        let region = regionsPlugins[waveformNum].regions.at(index);
        let regionRect = region.element.getBoundingClientRect();
        let waveform = document.getElementById(str);
        label.style.left = `${regionRect.left - waveform.getBoundingClientRect().left + waveform.offsetLeft}px`;
        label.style.width = `${regionRect.width}px`;
    });
}

// Updates the specified segment elements label value
// TODO update with mulitple waveforms
function updateOneSegmentLabel(segmentElement, value) {
    segmentElement.label = value;
    updateSegmentElementsList(window.segmentData[0], true, 0);
}

// Updates the specified segment elements label value for all those labels
// TODO update with mulitple waveforms
function updateGroupSegmentLabel(segmentElement, value) {
    let label = segmentElement.label;
    window.segmentData[0].forEach(element => {
        if(element.label === label) {
            element.label = value;
        }
    });
    updateSegmentElementsList(window.segmentData[0], true, 0);
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
export function updateTimeline(waveformNum) {
    const timeInterval = calculateTimeInterval(globalState.currentZoom, globalState.wavesurferWaveforms[waveformNum].getDuration());
    console.log(timeInterval)
    if(globalState.timelines[waveformNum] != null) {
        globalState.timelines[waveformNum].destroy(); // Remove the old timeline
    }
    globalState.timelines[waveformNum] = TimelinePlugin.create({
        height: 20,
        insertPosition: 'beforebegin',
        timeInterval: timeInterval,
        style: {
          fontSize: '20px',
          color: '#2D5B88',
        }
    });
    globalState.wavesurferWaveforms[waveformNum].registerPlugin(globalState.timelines[waveformNum]);
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
    let num = getNextWaveform();
    if(num == -1) return;
    window.songFilePaths[num] = filePath;
    regionsPlugins[num].clearRegions();
    await globalState.wavesurferWaveforms[num].load(filePath);
    globalState.currentZoom = 10;
    updateTimeline(num);
}

// Gets the next available waveform
export function getNextWaveform() {
    let num = 0;
    let filePath = window.songFilePaths[num];
    while(filePath !== '') {
        num++;
        filePath = window.songFilePaths[num];
        if(num > 4) return -1;
    }
    return num;
}