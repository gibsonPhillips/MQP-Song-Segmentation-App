import { globalState, updateSegmentElementsList, setExternalOpenMarker, setExternalAdd, setExternalRemove, setExternalChange, setExternalAddMarker } from './globalData.js';
import htmlElements from './globalData.js';

// let editBoundaryMode = false;
let currentMarker;
let currentWaveformNum;


setExternalAdd(addBoundaryButtonAction);
// TODO hanlde mulitple waveforms
function addBoundaryButtonAction(waveformNum) {
    // Reset edit mode
    globalState.editBoundaryMode[waveformNum] = false;
    // htmlElements.changeBoundaryButton.style.backgroundColor = "white";

    // Get click time (relative to waveform duration)
    const time = globalState.wavesurferWaveforms[waveformNum].getCurrentTime();
    if(time === 0) return;

    // Determine location
    let i = 0;
    let currentTime = window.segmentData[waveformNum][i].start;
    while(time > currentTime) {
        i++;
        currentTime = window.segmentData[waveformNum][i].start;
    }

    // Add to boundaryData
    let element = {"number": i+1, "start": time, "end": window.segmentData[waveformNum][i].start, "label": window.clusters[waveformNum], "annotation": ""};
    window.clusters[waveformNum]++;
    window.segmentData[waveformNum].splice(i, 0, element);

    // Update segments
    window.segmentData[waveformNum][i-1].end = time;
    for(let j = i+1; j < window.segmentData[waveformNum].length; j++) {
        window.segmentData[waveformNum][j].number = j+1;
    }

    updateSegmentElementsList(window.segmentData[waveformNum], true, waveformNum);
}

setExternalRemove(removeBoundaryButtonAction);
// TODO hanlde mulitple waveforms
function removeBoundaryButtonAction(waveformNum) {
    // Reset edit mode
    globalState.editBoundaryMode[waveformNum] = false;
    // htmlElements.changeBoundaryButton.style.backgroundColor = "white";

    // Get click time (relative to waveform duration)
    const time = globalState.wavesurferWaveforms[waveformNum].getCurrentTime();
    
    // Find closest boundary
    let closestBoundaryIndex = 0;
    let closetBoundaryTime = Math.abs(window.segmentData[waveformNum][0].start - time);
    window.segmentData[waveformNum].forEach(element => {
        if(Math.abs(element.start - time) < closetBoundaryTime) {
            closetBoundaryTime = Math.abs(element.start - time);
            closestBoundaryIndex = element.number - 1;
        }
    });

    if(closestBoundaryIndex != 0 && closestBoundaryIndex != window.segmentData[waveformNum].length-1) {
        // Combine with previous (get rid of current index, add to previous)
        window.segmentData[waveformNum][closestBoundaryIndex-1].end = window.segmentData[waveformNum][closestBoundaryIndex].end;
        window.segmentData[waveformNum].splice(closestBoundaryIndex, 1);
        for(let i = closestBoundaryIndex; i < window.segmentData[waveformNum].length; i++) {
            window.segmentData[waveformNum][i].number = i+1;
        }
        updateSegmentElementsList(window.segmentData[waveformNum], true, waveformNum);
    }
}

setExternalChange(changeBoundaryButtonAction);
// TODO hanlde mulitple waveforms
function changeBoundaryButtonAction(waveformNum) {
    globalState.editBoundaryMode[waveformNum] = !globalState.editBoundaryMode[waveformNum];

    if (!globalState.editBoundaryMode[waveformNum]) {
        // htmlElements.changeBoundaryButton.style.backgroundColor = "white";
    } else {
        // htmlElements.changeBoundaryButton.style.backgroundColor = "rgb(255,197,61)";
    }

    // TODO update with multiple waveforms
    console.log(htmlElements.regions[waveformNum].regions)
    htmlElements.regions[waveformNum].regions.forEach(element => {
        console.log("HELLO1")
        if(globalState.regionType[waveformNum].get(element) === 'segment') {
            console.log("HELLO2")
            element.setOptions({
                resize: globalState.editBoundaryMode[waveformNum]
            });
        }
    });
}

setExternalAddMarker(addMarkerButtonAction);
// Add marker to waveform
function addMarkerButtonAction(waveformNum) {
    // Get click time (relative to waveform duration)
    const time = globalState.wavesurferWaveforms[waveformNum].getCurrentTime();

    // Add marker at time
    const marker = htmlElements.regions[waveformNum].addRegion({
        start: time,
        content: "",
        color: "rgba(255, 0, 0, 0.5)",
        drag: false,
        resize: false,
    });
    marker.element.style.minWidth = "4px";
    marker.element.style.backgroundColor = "rgba(255, 0, 0)";

    globalState.regionType[waveformNum].set(marker, 'marker');

    marker.on('click', () => {
        openMarkerNote(marker, globalState.markerNotes[waveformNum], waveformNum);
    });

    currentMarker = marker;
    currentWaveformNum = waveformNum;

    htmlElements.markerTitle.value = "";
    htmlElements.markerNote.value = "";

    htmlElements.markerDialog.showModal();
}

// Saving marker note
htmlElements.saveMarker.onclick = () => {
    console.log(currentWaveformNum)
    globalState.markerNotes[currentWaveformNum].set(currentMarker.start, {start: currentMarker.start, title: htmlElements.markerTitle.value, note: htmlElements.markerNote.value});
    htmlElements.markerDialog.close();
}

// Deleting marker note
htmlElements.deleteMarker.onclick = () => {
    console.log(currentWaveformNum)
    globalState.markerNotes[currentWaveformNum].delete(currentMarker.start);
    updateSegmentElementsList(window.segmentData[currentWaveformNum], true, currentWaveformNum);
    htmlElements.markerDialog.close();
}

// Set the function in global.js
setExternalOpenMarker(openMarkerNote);

function openMarkerNote(marker, markerNotesMap, waveformNum) {
    currentMarker = marker;
    currentWaveformNum = waveformNum;
    console.log(currentWaveformNum)
    const currentMarkerMap = markerNotesMap.get(marker.start)

    htmlElements.markerTitle.value = currentMarkerMap.title;
    htmlElements.markerNote.value = currentMarkerMap.note;
    htmlElements.markerDialog.showModal();
}