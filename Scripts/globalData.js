import WaveSurfer from '../resources/wavesurfer/wavesurfer.esm.js';
import RegionsPlugin from '../resources/wavesurfer/regions.esm.js';
import ZoomPlugin from '../resources/wavesurfer/zoom.esm.js';
import TimelinePlugin from '../resources/wavesurfer/timeline.esm.js';


window.songFilePaths = [];
window.segmentData = [];
window.clusters = [];

let regionsPlugins = [];
let currentlyEditing = false;

export let globalState = {
    // stores label color map
    colorMap: new Map(),
    // headers for segment data
    headers: ["number", "start", "end", "label"],
    // stores the wavesurfer regions for segments
    segmentRegions: [],
    currentZoom: 10,
    timelines: [],
    groupEditingMode: false,
    wavesurferWaveforms: [],
    markerNotes: [],
    regionType: new Map(),
    globalTimelineMode: false,
    editBoundaryMode: false,
};

const htmlElements = {
    // Larger elements
    timeline: document.getElementById("waveforms"),

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
    addMarkerButton: document.querySelector("#add-marker"),

    // wavesurfer buttons
    playButton: document.querySelector('#play'),
    forwardButton: document.querySelector('#forward'),
    backButton: document.querySelector('#backward'),
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
    yesOrNo: document.querySelector('#yes-or-no'),
    closeAreYouSureDialogButton: document.querySelector('#close-are-you-sure-dialog'),

    // error dialog
    errorDialog: document.getElementById('error-dialog'),
    closeErrorDialogButton: document.getElementById('close-error-dialog'),
    errorDialogMessage: document.getElementById('error-message'),

    // marker dialog
    markerDialog: document.getElementById('marker-dialog'),
    closeMarkerDialog: document.getElementById('marker-dialog-close'),
    deleteMarker: document.getElementById('delete-marker'),
    saveMarker: document.getElementById('save-marker'),
    markerTitle: document.getElementById('marker-dialog-title'),
    markerNote: document.getElementById('marker-dialog-note'),

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
    segmentAnnotationButton: document.getElementById("segment-annotations"),
    globalTimelineButton: document.getElementById("global-timeline"),
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

// Sets external function for openMarkerNote in editBoundaries.js
let externalFunction = null;
export function setExternalFunction(fn) {
    externalFunction = fn;
}

// Updates the segment elements and display in table
export function updateSegmentElementsList(elements, updateWaveform, waveformNum) {
    const tbody = document.getElementById('segment-elements');
    const labelsContainerStr = 'labels-container' + String(waveformNum);
    const annotationContainerStr = 'segment-annotation-container' + String(waveformNum);
    tbody.innerHTML = ''

    // If waveform is being updated
    if(updateWaveform) {
        regionsPlugins[waveformNum].clearRegions()
        globalState.regionType.clear();
        globalState.colorMap.clear();
        document.getElementById(labelsContainerStr).textContent = "";
        document.getElementById(annotationContainerStr).textContent = "";
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
                // height: waveformsHeight
            });

            globalState.regionType.set(region, 'segment');

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
            document.getElementById(labelsContainerStr).appendChild(labelInput);

            // Sync text input value with region data
            labelInput.addEventListener("input", () => {
                region.data = region.data || {}; 
                region.data.label = labelInput.value;
            });

            // Create segment annotation box for region
            let annotationInput = document.createElement("textarea");
            annotationInput.value = element.annotation;
            annotationInput.className = "segment-annotation-input" + String(waveformNum);
            annotationInput.addEventListener("blur", (event) => {
                element.annotation = event.target.value;
            });
            document.getElementById(annotationContainerStr).appendChild(annotationInput);

            // Update position when region is moved/resized
            region.on("update-end", () => updateLabelPositions(waveformNum));
            region.on("update-end", () => updateSegmentAnnotationPositions(waveformNum));
        }
    });

    // Re add markers
    if(updateWaveform) {
        globalState.markerNotes[waveformNum].keys().forEach(element => {
            // Add marker at time
            const marker = htmlElements.regions[waveformNum].addRegion({
                start: element,
                content: "",
                color: "rgba(255, 0, 0, 0.5)",
                drag: false,
                resize: false,
            });
            globalState.regionType.set(marker, 'marker');

            marker.on('click', () => {
                if (externalFunction) {
                    externalFunction(marker, globalState.markerNotes[0]);
                } else {
                    console.warn("External function not set!");
                }
            });
        });
    }
    setTimeout(() => updateLabelPositions(waveformNum), 10);
    setTimeout(() => updateSegmentAnnotationPositions(waveformNum), 10);
}

// Updates label positions with the most up to date waveform
export function updateLabelPositions(waveformNum) {
    const waveformStr = 'waveform' + String(waveformNum);
    const inputStr = ".region-label-input" + String(waveformNum);
    document.querySelectorAll(inputStr).forEach((label, index) => {
        let region = regionsPlugins[waveformNum].regions.at(index);
        let regionRect = region.element.getBoundingClientRect();
        let waveform = document.getElementById(waveformStr);
        label.style.left = `${regionRect.left - waveform.getBoundingClientRect().left + waveform.offsetLeft}px`;
        label.style.width = `${regionRect.width}px`;
    });
}

// Updates segment annotation positions with the most up to date waveform
export function updateSegmentAnnotationPositions(waveformNum) {
    const waveformStr = 'waveform' + String(waveformNum);
    const inputStr = ".segment-annotation-input" + String(waveformNum);
    document.querySelectorAll(inputStr).forEach((label, index) => {
        let region = regionsPlugins[waveformNum].regions.at(index);
        let regionRect = region.element.getBoundingClientRect();
        let waveform = document.getElementById(waveformStr);
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
    let num = setupNextWaveform();
    if(num == -1) return;
    window.songFilePaths[num] = filePath;
    regionsPlugins[num].clearRegions();
    await globalState.wavesurferWaveforms[num].load(filePath);
    globalState.currentZoom = 10;
    updateTimeline(num);
    return num;
}




// determines  the height for all the waveforms
let slider = document.getElementById('trackHeight')
let root = document.documentElement; // Selects :root
let waveformsHeight = parseInt(slider.value);    // gets value from the slider. Default value set there. 

slider.addEventListener("input", function () {
    let divHeight = parseInt(slider.value);

    root.style.setProperty("--track-height", divHeight + "px");
    waveformsHeight = divHeight;
})

// to count out id's sequentially
let idCounter = 0



// function that creates the next tracks as new waveforms are being added
function NewTrack() {

    // Create a new div element
    const trackDiv = document.createElement("div");
    trackDiv.classList.add("trackers");


    // Create a new button element
    // const button = document.createElement("button");
    // button.id = "button " + idCounter;
    // button.textContent = "button";
    // button.classList.add("btn");

    // algorithm button
    const algoBtn = document.createElement("button");
    algoBtn.id = "button" + idCounter;
    algoBtn.textContent = "Segment!";
    algoBtn.classList.add("btn");
    // segment details button
    // boundaries button


    // Append the buttons to the div
    trackDiv.appendChild(algoBtn);

    // Append the div to the body (or any other container)
    document.getElementById("tracks").appendChild(trackDiv);

    // iterate idCounter
    idCounter++
}


// Gets the next available waveform
export function setupNextWaveform() {

    // calls out to make a new track alongside the new waveform
    NewTrack()
    console.log("newtrack")


    // Create div elements for label, waveform, segment annotations
    let num = window.songFilePaths.length;
    let labelsContainer = document.createElement("div");
    labelsContainer.className = "labels-container";
    labelsContainer.id = "labels-container" + String(num);
    // labelsContainer.style = "height: 22px;"
    let waveform = document.createElement("div");
    waveform.className = "waveform";
    waveform.id = "waveform" + String(num);
    let segmentAnnotationContainer = document.createElement("div");
    segmentAnnotationContainer.className = "segment-annotation-container";
    segmentAnnotationContainer.id = "segment-annotation-container" + String(num);
    // segmentAnnotationContainer.style = "height: 0px; visibility: hidden;"

    htmlElements.timeline.appendChild(labelsContainer);
    htmlElements.timeline.appendChild(waveform);
    htmlElements.timeline.appendChild(segmentAnnotationContainer);

    // Add necessary elements to global variables
    window.songFilePaths.push('');
    window.segmentData.push([]);
    window.clusters.push(0);
    regionsPlugins.push(RegionsPlugin.create());
    globalState.segmentRegions.push([]);
    globalState.timelines.push(null);
    globalState.wavesurferWaveforms.push(WaveSurfer.create({
        container: "#waveform" + String(num),
        waveColor: 'rgb(200, 0, 200)',
        progressColor: 'rgb(100, 0, 100)',
        minPxPerSec: 100,
        plugins: [regionsPlugins[num], ZoomPlugin.create({scale:0.1})],
        height: waveformsHeight,
    }));
    globalState.markerNotes.push(new Map());

    // Set up scroll and zoom for wavesurfer
    globalState.wavesurferWaveforms[num].on("scroll", () => {
        if(currentlyEditing) return;
        const currentScroll = globalState.wavesurferWaveforms[num].getScroll();

        if(globalState.globalTimelineMode) {
            currentlyEditing = true;
            for (let i = 0; i < globalState.wavesurferWaveforms.length; i++) {               
                const waveform = globalState.wavesurferWaveforms[i];
                if(waveform.getDuration() > 0) {
                    waveform.setScroll(currentScroll);
                    updateLabelPositions(i);
                    updateSegmentAnnotationPositions(i);
                }
            }
            currentlyEditing = false;
        } else {
            updateLabelPositions(num);
            updateSegmentAnnotationPositions(num);
        }
    });

    // Update labels and timeline on zoom
    globalState.wavesurferWaveforms[num].on("zoom", (newPxPerSec) => {
        if(currentlyEditing) return;
        globalState.currentZoom = newPxPerSec;

        if(globalState.globalTimelineMode) {
            currentlyEditing = true;
            for (let i = 0; i < globalState.wavesurferWaveforms.length; i++) {               
                const waveform = globalState.wavesurferWaveforms[i];
                if(waveform.getDuration() > 0) {
                    waveform.zoom(newPxPerSec);
                    updateLabelPositions(i);
                    updateSegmentAnnotationPositions(i);
                    updateTimeline(i);
                }
            }
            currentlyEditing = false;
        } else {
            updateLabelPositions(num);
            updateSegmentAnnotationPositions(num);
            updateTimeline(num);
        }
    });

    // Handle region update for editing boundaries
    htmlElements.regions[num].on('region-updated', (region) => {
        if(globalState.regionType.get(region) === 'marker') return;
        if (!globalState.editBoundaryMode) return;

        let index = htmlElements.regions[0].regions.findIndex(r => r.id === region.id);
        if (index === -1) return;

        let movedStart = window.segmentData[0][index].start !== region.start;

        let prevRegion = getPrevRegion(0, index);
        let nextRegion = getNextRegion(0, index);

        // Enforce limits so you can't go before previous or after next segment
        let minStart = prevRegion ? prevRegion.start : 0; // Can't move before previous start
        let maxEnd = nextRegion ? nextRegion.end : globalState.wavesurferWaveforms[0].getDuration(); // Can't extend beyond next region

        let newStart = Math.max(region.start, minStart);
        let newEnd = Math.min(region.end, maxEnd);

        // Apply the constraints
        region.setOptions({ start: newStart, end: newEnd });

        // Adjust adjacent regions to stay connected
        if (nextRegion) nextRegion.setOptions({ start: newEnd });
        if (prevRegion) prevRegion.setOptions({ end: newStart });

        // Update segment data
        if(movedStart) {
            // Update start of current
            window.segmentData[0][index].start = newStart;
            // Update end of prev
            if(index > 0)
                window.segmentData[0][index-1].end = newStart;
        } else {
            // Update end of current
            window.segmentData[0][index].end = newEnd;
            // Update start of next
            if(index+1 < window.segmentData[0].length)
                window.segmentData[0][index+1].start = newEnd;
        }

        updateSegmentElementsList(window.segmentData[0], false, 0);
    });


    return num;
}


// Get previous region that is not a marker
function getPrevRegion(waveformNum, index) {
    index--;
    let region = htmlElements.regions[waveformNum].regions.at(index);
    while(globalState.regionType.get(region) === 'marker') {
        index--;
        if(index < 0) return null;
        region = htmlElements.regions[waveformNum].regions.at(index);
    }
    if(index < 0) return null;
    return region;
}

// Get next region that is not a marker
function getNextRegion(waveformNum, index) {
    let region = htmlElements.regions[waveformNum].regions.at(index + 1);
    while(globalState.regionType.get(region) === 'marker') {
        index++;
        if(index > htmlElements.regions[waveformNum].regions.length-1) return null;
        region = htmlElements.regions[waveformNum].regions.at(index + 1);
    }
    if(index > htmlElements.regions[waveformNum].regions.length-1) return null;
    return region;
}