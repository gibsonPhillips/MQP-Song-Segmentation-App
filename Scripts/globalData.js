import WaveSurfer from '../resources/wavesurfer/wavesurfer.esm.js';
import RegionsPlugin from '../resources/wavesurfer/regions.esm.js';
import ZoomPlugin from '../resources/wavesurfer/zoom.esm.js';
import TimelinePlugin from '../resources/wavesurfer/timeline.esm.js';


window.trackNames = [];
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
    regionType: [],
    globalTimelineMode: false,
    editBoundaryMode: false,
    waveformNums: []
};

const htmlElements = {
    // Larger elements
    timeline: document.getElementById("waveforms"),

    // Constants for HTML elements
    segmentDetailsDialog: document.querySelector('#segment-details-dialog'),
    removeBoundaryDialog: document.querySelector('#remove-boundary-dialog'),

    // import/export buttons
    importButton: document.getElementById('chooseSong'),

    // Segment buttons
    // segmentDetailsButton: document.querySelector('#segment-details'),
    closeDialogButton: document.querySelector('#close-dialog'),
    // addBoundaryButton: document.querySelector('#add-boundary'),
    // removeBoundaryButton: document.querySelector('#remove-boundary'),
    // changeBoundaryButton: document.querySelector('#change-boundary'),
    // addMarkerButton: document.querySelector("#add-marker"),

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
    modifyBoundariesButton: document.getElementById("modify-boundaries"),
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
let externalOpenMarker = null;
export function setExternalOpenMarker(fn) {
    externalOpenMarker = fn;
}

let externalSegment = null;
export function setExternalSegment(fn) {
    externalSegment = fn;
}

let externalAutoSegment = null;
export function setExternalAutoSegment(fn) {
    externalAutoSegment = fn;
}

let externalAddBoundary = null;
export function setExternalAdd(fn) {
    externalAddBoundary = fn;
}

let externalRemoveBoundary = null;
export function setExternalRemove(fn) {
    externalRemoveBoundary = fn;
}

let externalChangeBoundary = null;
export function setExternalChange(fn) {
    externalChangeBoundary = fn;
}

let externalAddMarker = null;
export function setExternalAddMarker(fn) {
    externalAddMarker = fn;
}

let externalSaveProject = null;
export function setExternalSaveProject(fn) {
    externalSaveProject = fn;
}

let externalExportData = null;
export function setExternalExportData(fn) {
    externalExportData = fn;
}

// updates the trackname of the given waveform
export function updateTrackName(name, waveformNum) {
    window.trackNames[waveformNum] = name;
    let title = document.getElementById('track-' + waveformNum + '-header');
    title.textContent = name;
}

// Updates the segment elements and display in table
export function updateSegmentElementsList(elements, updateWaveform, waveformNum) {
    const labelsContainerStr = 'labels-container' + String(waveformNum);
    const annotationContainerStr = 'segment-annotation-container' + String(waveformNum);

    // If waveform is being updated
    if(updateWaveform) {
        regionsPlugins[waveformNum].clearRegions()
        globalState.regionType[waveformNum].clear();
        globalState.colorMap.clear();
        document.getElementById(labelsContainerStr).textContent = "";
        document.getElementById(annotationContainerStr).textContent = "";
    }

    elements.forEach(element => {
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

            globalState.regionType[waveformNum].set(region, 'segment');

            // Create segment label for region
            let labelInput = document.createElement("input");
            labelInput.type = "text";
            labelInput.value = element.label;
            labelInput.className = "region-label-input" + String(waveformNum);
            labelInput.style.backgroundColor = globalState.colorMap.get(element.label);

            labelInput.addEventListener("keydown", function(event) {
                if (event.key === "Enter") {
                    if(globalState.groupEditingMode) {
                        updateGroupSegmentLabel(element, event.target.value, waveformNum);
                    } else {
                        updateOneSegmentLabel(element, event.target.value, waveformNum);
                    }  
                }
            });

            // labelInput.addEventListener("blur", (event) => {
            //     if(globalState.groupEditingMode) {
            //         updateGroupSegmentLabel(element, event.target.value, waveformNum);
            //     } else {
            //         updateOneSegmentLabel(element, event.target.value, waveformNum);
            //     }                
            // });
            
            labelInput.addEventListener("input", function(event) {
                this.value = this.value.replace(/,/g, "");
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
            annotationInput.addEventListener("input", function(event) {
                this.value = this.value.replace(/,/g, "");
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
            marker.element.style.minWidth = "6px";
            marker.element.style.backgroundColor = "rgba(255, 0, 0)";

            // Create a flag element
            const flag = document.createElement("div");
            flag.innerText = "🔻";
            flag.style.position = "absolute";
            flag.style.top = "0";
            flag.style.left = "50%";
            flag.style.transform = "translateX(-50%)";
            flag.style.fontSize = "14px";
            flag.style.backgroundColor = "rgba(255, 0, 0)";
            flag.style.padding = "2px 4px";
            flag.style.zIndex = "10";

            // Append the flag to the marker
            marker.element.appendChild(flag);
        
            globalState.regionType[waveformNum].set(marker, 'marker');
        
            marker.element.addEventListener('mouseenter', () => {
                marker.element.style.backgroundColor = "rgb(255,197,61)";
                flag.style.backgroundColor = "rgb(255,197,61)";
            });
        
            marker.element.addEventListener('mouseleave', () => {
                marker.element.style.backgroundColor = "rgba(255, 0, 0)";
                flag.style.backgroundColor = "rgba(255, 0, 0)";
            });

            marker.on('click', () => {
                if (externalOpenMarker) {
                    externalOpenMarker(marker, globalState.markerNotes[waveformNum], waveformNum);
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
function updateOneSegmentLabel(segmentElement, value, waveformNum) {
    segmentElement.label = value;
    updateSegmentElementsList(window.segmentData[waveformNum], true, waveformNum);
}

// Updates the specified segment elements label value for all those labels
function updateGroupSegmentLabel(segmentElement, value, waveformNum) {
    let label = segmentElement.label;
    window.segmentData[waveformNum].forEach(element => {
        if(element.label === label) {
            element.label = value;
        }
    });
    updateSegmentElementsList(window.segmentData[waveformNum], true, waveformNum);
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

// helper function to set the track heights when called. 
function setTrackHeights(divHeight) {
    root.style.setProperty("--track-height", divHeight + "px");
    waveformsHeight = divHeight;
}

// helper function to set the waveform heights when called
function setWaveformHeights(divHeight) {

    // will collect all of the dynamically added waveform divs
    let waveforms = [];

    // selects everything in the shadow-root placing them into the waveforms array
    let hostElement = document.querySelectorAll('*');
    hostElement.forEach(element =>{
        if (element.shadowRoot){

            console.log(element.shadowRoot);
            let scrollElement = element.shadowRoot.querySelector(".scroll");
            console.log(`class ${scrollElement}`)
            waveforms.push(scrollElement)
        }
    });


    // assigns correct height
    waveforms.forEach(element => {
        element.style.height = divHeight + "px";
        // element.style.overflowX("clip", "scroll", "important")
    // console.log(waveformDivs);
    });
}

// determines  the height for all the waveforms
let slider = document.getElementById('trackHeight')
let root = document.documentElement; // Selects :root
let waveformsHeight = parseInt(slider.value);    // gets value from the slider. Default value set there. 

slider.addEventListener("input", function () {
    let divHeight = parseInt(slider.value);

    // dynamically call the helpers to set trackheights and waveformheights
    setTrackHeights(divHeight)
    setWaveformHeights(divHeight)
    
})


// to count out id's sequentially
let idCounter = 0

// helper function to create the track title bar
function createTrackTitle(waveformNum) {

    // Create the title-bar div
    let titleBar = document.createElement('div');
    titleBar.classList.add('title-bar');

    // Create the close button
    let closeButton = document.createElement('button');
    closeButton.setAttribute('aria-label', 'Close');
    closeButton.classList.add('collapsible', 'coll');
    closeButton.setAttribute('id', 'close-track-' + waveformNum);

    // add event listener
    closeButton.addEventListener("click", function() {
        // Remove HTML elements
        document.getElementById("labels-container" + String(waveformNum)).remove();
        document.getElementById("waveform" + String(waveformNum)).remove();
        document.getElementById("segment-annotation-container" + String(waveformNum)).remove();
        document.getElementById("track" + String(waveformNum)).remove();
    })

    titleBar.appendChild(closeButton);

    // Create the header
    let title = document.createElement('h1');
    title.classList.add('title');
    title.setAttribute('id', 'track-' + waveformNum + '-header');
    title.textContent = 'Track ' + waveformNum;

    titleBar.appendChild(title);

    let resizeButton = document.createElement('button');
    resizeButton.setAttribute('aria-label', 'Resize');
    resizeButton.disabled = true;
    resizeButton.classList.add('hidden');

    titleBar.appendChild(resizeButton);

    return(titleBar);

}

// helper function creates button and adds event listener for each track
function CreateAlgorithmDropdownButton(waveformNum) {
    // Create dropdown container
        const dropdown = document.createElement("div");
        dropdown.classList.add("dropdown");
        dropdown.id = "algorithms-dropdown";

        // Create button
        const algoButton = document.createElement("button");
        algoButton.classList.add("btn");
        algoButton.classList.add("track-button")
        algoButton.id = "algorithms-dropdown-button";
        algoButton.textContent = "Algorithms";

        // Create dropdown content container
        const dropdownContent = document.createElement("div");
        dropdownContent.classList.add("dropdown-content");
        dropdownContent.id = "algorithms-dropdown-content";

        // Create and append links for each algorithm
        const algorithm1 = document.createElement("a");
        algorithm1.href = "#";
        algorithm1.id = "segment-algorithm1";
        algorithm1.textContent = "Algorithm 1: Human Percieved Frequencies";
        dropdownContent.appendChild(algorithm1);
        algorithm1.addEventListener("click", () => {externalSegment(1, waveformNum)});

        const algorithm2 = document.createElement("a");
        algorithm2.href = "#";
        algorithm2.id = "segment-algorithm2";
        algorithm2.textContent = "Algorithm 2: Equal Distance Frequencies";
        dropdownContent.appendChild(algorithm2);
        algorithm2.addEventListener("click", () => {externalSegment(2, waveformNum)});

        const algorithm3 = document.createElement("a");
        algorithm3.href = "#";
        algorithm3.id = "segment-algorithm3";
        algorithm3.textContent = "Algorithm 3: Human Percieved Frequencies";
        dropdownContent.appendChild(algorithm3);
        algorithm3.addEventListener("click", () => {externalSegment(3, waveformNum)});

        const algorithm4 = document.createElement("a");
        algorithm4.href = "#";
        algorithm4.id = "segment-algorithm4";
        algorithm4.textContent = "Algorithm 4: Multi-use";
        dropdownContent.appendChild(algorithm4);
        algorithm4.addEventListener("click", () => {externalSegment(4, waveformNum)});

        const algorithmAuto = document.createElement("a");
        algorithmAuto.href = "#";
        algorithmAuto.id = "auto-segment";
        algorithmAuto.textContent = "Auto Segment";
        dropdownContent.appendChild(algorithmAuto);
        algorithmAuto.addEventListener("click", () => {externalAutoSegment(4, 4, 0, false, waveformNum)});

        // Append button and dropdown content to dropdown container
        dropdown.appendChild(algoButton);
        dropdown.appendChild(dropdownContent);

        // Toggle dropdown on button click
        algoButton.addEventListener("click", function () {
            dropdownContent.classList.toggle("show");
        });

        // Close dropdown when clicking outside
        document.addEventListener("click", function (event) {
            if (!algoButton.contains(event.target) && !dropdownContent.contains(event.target)) {
                dropdownContent.classList.remove("show");
            }
        });

        // Append dropdown to the body (or any other container)
        return(dropdown);
}

// helper function creates button and adds event listener for each track
function createSegmentDetailsButton(waveformNum) {
    
    const button = document.createElement("button");
    button.id = "segment-details-" + waveformNum;
    button.textContent = "Details";
    button.classList.add("btn");
    button.classList.add("track-button");


    // add event listener
    button.addEventListener("click", function() {
        const tbody = document.getElementById('segment-elements');
        tbody.innerHTML = ''
    
        window.segmentData[waveformNum].forEach(element => {
            let tr = document.createElement('tr');
            for (let key in element) {
                let td = document.createElement('td');
                td.textContent = element[key]
                tr.appendChild(td)
            }
            tbody.appendChild(tr);
        });

        htmlElements.segmentDetailsDialog.showModal();
    })

    return(button);
}

// helper function creates button and adds event listener for each track
function createBoundaryDropdownButton(waveformNum) {
    // Create dropdown container
    const dropdown = document.createElement("div");
    dropdown.classList.add("dropdown");
    dropdown.id = "boundaries-dropdown";

    // Create button
    const button = document.createElement("button");
    button.classList.add("btn");
    button.classList.add("track-button");
    button.id = "boundaries-dropdown-button";
    button.textContent = "Boundaries";

    // Create dropdown content container
    const dropdownContent = document.createElement("div");
    dropdownContent.classList.add("dropdown-content");
    dropdownContent.id = "boundaries-dropdown-content";

    const link1 = document.createElement("a");
    link1.href = "#";
    link1.id = "add-boundary";
    link1.textContent = "Add Boundary";
    dropdownContent.appendChild(link1);
    link1.addEventListener("click", () => {externalAddBoundary(waveformNum)});

    const link2 = document.createElement("a");
    link2.href = "#";
    link2.id = "remove-boundary";
    link2.textContent = "Remove Boundary";
    dropdownContent.appendChild(link2);
    link2.addEventListener("click", () => {externalRemoveBoundary(waveformNum)});
    
    const link4 = document.createElement("a");
    link4.href = "#";
    link4.id = "add-marker";
    link4.textContent = "Add Marker";
    dropdownContent.appendChild(link4);
    link4.addEventListener("click", () => {externalAddMarker(waveformNum)});

    // Append button and dropdown content to dropdown container
    dropdown.appendChild(button);
    dropdown.appendChild(dropdownContent);

    // Toggle dropdown on button click
    button.addEventListener("click", function () {
        dropdownContent.classList.toggle("show");
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", function (event) {
        if (!button.contains(event.target) && !dropdownContent.contains(event.target)) {
            dropdownContent.classList.remove("show");
        }
    });

    return dropdown;
}

// helper function creates button for save system and adds event listener for each track
function createSaveDropdownButton(waveformNum) {
    // Create dropdown container
    const dropdown = document.createElement("div");
    dropdown.classList.add("dropdown");
    dropdown.id = "save-dropdown";

    // Create button
    const button = document.createElement("button");
    button.classList.add("btn");
    button.id = "save-dropdown-button";
    button.textContent = "Saving and Exporting";

    // Create dropdown content container
    const dropdownContent = document.createElement("div");
    dropdownContent.classList.add("dropdown-content");
    dropdownContent.id = "save-dropdown-content";

    const link1 = document.createElement("a");
    link1.href = "#";
    link1.id = "save";
    link1.textContent = "Save Song Project";
    dropdownContent.appendChild(link1);
    link1.addEventListener("click", () => {externalSaveProject(waveformNum)});

    const link2 = document.createElement("a");
    link2.href = "#";
    link2.id = "export";
    link2.textContent = "Export Data";
    dropdownContent.appendChild(link2);
    link2.addEventListener("click", () => {externalExportData(waveformNum)});

    // Append button and dropdown content to dropdown container
    dropdown.appendChild(button);
    dropdown.appendChild(dropdownContent);

    // Toggle dropdown on button click
    button.addEventListener("click", function () {
        dropdownContent.classList.toggle("show");
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", function (event) {
        if (!button.contains(event.target) && !dropdownContent.contains(event.target)) {
            dropdownContent.classList.remove("show");
        }
    });

    return dropdown;
}

// Create delete track button for the track
function createDeleteTrackButton(waveformNum) { //CURRENTLY UNUSED
    const button = document.createElement("button");
    button.id = "delete-track";
    button.textContent = "Delete Track";
    button.classList.add("btn");
    button.classList.add("track-button");

    // add event listener
    button.addEventListener("click", function() {
        // Remove HTML elements
        document.getElementById("labels-container" + String(waveformNum)).remove();
        document.getElementById("waveform" + String(waveformNum)).remove();
        document.getElementById("segment-annotation-container" + String(waveformNum)).remove();
        document.getElementById("track" + String(waveformNum)).remove();
    })

    return button;
}

function createPlayButton(waveformNum) {
    const playButton = document.createElement("button");
    playButton.classList.add("btn");
    playButton.id = "play";

    const img = document.createElement("img");
    img.src = "resources/icons/play-solid.svg";
    img.alt = "Play Button";

    playButton.appendChild(img);
    playButton.onclick = () => {
        if(globalState.wavesurferWaveforms[waveformNum].getDuration() > 0) {
            globalState.wavesurferWaveforms[waveformNum].playPause()
            if(globalState.wavesurferWaveforms[waveformNum].isPlaying()) {
                // pause icon
                playButton.innerHTML = '<img src="resources/icons/pause-solid.svg" alt="Pause Button">';
            } else {
                // play icon
                playButton.innerHTML = '<img src="resources/icons/play-solid.svg" alt="Play Button">';
            }
        }
    }
    return playButton;
}

function createForwardButton(waveformNum) {
    const forwardButton = document.createElement("button");
    forwardButton.classList.add("btn");
    forwardButton.id = "forward";

    const img = document.createElement("img");
    img.src = "resources/icons/forward15-seconds.svg";
    img.alt = "Play Button";

    forwardButton.appendChild(img);
    forwardButton.onclick = () => {
        globalState.wavesurferWaveforms[waveformNum].skip(15)
    }
    return forwardButton;
}

function createBackwardButton(waveformNum) {
    const backwardButton = document.createElement("button");
    backwardButton.classList.add("btn");
    backwardButton.id = "backward";

    const img = document.createElement("img");
    img.src = "resources/icons/backward15-seconds.svg";
    img.alt = "Play Button";

    backwardButton.appendChild(img);
    backwardButton.onclick = () => {
        globalState.wavesurferWaveforms[waveformNum].skip(-15)
    }
    return backwardButton;
}

// function that creates the next tracks as new waveforms are being added
function NewTrack(waveformNum) {

    // Create a new div element to be track
    const trackDiv = document.createElement("div");
    trackDiv.id = "track" + String(waveformNum);
    trackDiv.classList.add("trackers");

    // make the title bar
    let titleBar = createTrackTitle(waveformNum);
    let titleBarSeparator = document.createElement("div");
    titleBarSeparator.classList.add("separator");

    // make the buttons
    let algDropdown = CreateAlgorithmDropdownButton(waveformNum);
    let boundaryDropdown = createBoundaryDropdownButton(waveformNum);
    let saveDropdown = createSaveDropdownButton(waveformNum);
    let segmentDetailsButton = createSegmentDetailsButton(waveformNum);
    // let deleteTrackButton = createDeleteTrackButton(waveformNum);
    let playButton = createPlayButton(waveformNum);
    let forwardButton = createForwardButton(waveformNum);
    let backwardButton = createBackwardButton(waveformNum);

    // Append the buttons to the div
    trackDiv.appendChild(titleBar);
    trackDiv.appendChild(titleBarSeparator);
    trackDiv.appendChild(playButton);
    trackDiv.appendChild(algDropdown);
    trackDiv.appendChild(boundaryDropdown);
    trackDiv.appendChild(saveDropdown);
    trackDiv.appendChild(segmentDetailsButton);
    // trackDiv.appendChild(deleteTrackButton);
    trackDiv.appendChild(forwardButton);
    trackDiv.appendChild(backwardButton);

    // Append the div to the body (or any other container)
    document.getElementById("tracks").appendChild(trackDiv);
}


// Gets the next available waveform
export function setupNextWaveform() {
    // Create div elements for label, waveform, segment annotations
    // let num = window.songFilePaths.length;
    let num = 0;
    if(globalState.waveformNums.length == 0) {
        globalState.waveformNums.push(0);
    } else {
        num = globalState.waveformNums[globalState.waveformNums.length - 1] + 1;
        globalState.waveformNums.push(num);
    }

    // calls out to make a new track alongside the new waveform
    NewTrack(num);

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
        waveColor: 'rgb(92, 92, 92)',
        progressColor: 'rgb(5, 5, 5)',
        minPxPerSec: 100,
        plugins: [regionsPlugins[num], ZoomPlugin.create({scale:0.1})],
        height: waveformsHeight,
    }));
    globalState.markerNotes.push(new Map());
    globalState.regionType.push(new Map());

    // Reset edit mode
    globalState.editBoundaryMode = false;
    htmlElements.modifyBoundariesButton.style.backgroundColor = "white";
    for(let i = 0; i < htmlElements.regions.length; i++) {
        htmlElements.regions[i].regions.forEach(element => {
            if(globalState.regionType[i].get(element) === 'segment') {
                element.setOptions({
                    resize: globalState.editBoundaryMode
                });
            }
        });
    }

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
        if(globalState.regionType[num].get(region) === 'marker') return;
        if (!globalState.editBoundaryMode) return;

        let index = htmlElements.regions[num].regions.findIndex(r => r.id === region.id);
        if (index === -1) return;

        let movedStart = window.segmentData[num][index].start !== region.start;

        let prevRegion = getPrevRegion(num, index);
        let nextRegion = getNextRegion(num, index);

        // Enforce limits so you can't go before previous or after next segment
        let minStart = prevRegion ? prevRegion.start : 0; // Can't move before previous start
        let maxEnd = nextRegion ? nextRegion.end : globalState.wavesurferWaveforms[num].getDuration(); // Can't extend beyond next region

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
            window.segmentData[num][index].start = newStart;
            // Update end of prev
            if(index > 0)
                window.segmentData[num][index-1].end = newStart;
        } else {
            // Update end of current
            window.segmentData[num][index].end = newEnd;
            // Update start of next
            if(index+1 < window.segmentData[num].length)
                window.segmentData[num][index+1].start = newEnd;
        }

        updateSegmentElementsList(window.segmentData[num], false, num);
    });


    return num;
}


// Get previous region that is not a marker
function getPrevRegion(waveformNum, index) {
    index--;
    let region = htmlElements.regions[waveformNum].regions.at(index);
    while(globalState.regionType[waveformNum].get(region) === 'marker') {
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
    while(globalState.regionType[waveformNum].get(region) === 'marker') {
        index++;
        if(index > htmlElements.regions[waveformNum].regions.length-1) return null;
        region = htmlElements.regions[waveformNum].regions.at(index + 1);
    }
    if(index > htmlElements.regions[waveformNum].regions.length-1) return null;
    return region;
}