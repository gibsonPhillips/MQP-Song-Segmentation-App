import { globalState, updateSegmentElementsList } from './globalData.js';
import htmlElements from './globalData.js';

let editBoundaryMode = false;

// TODO hanlde mulitple waveforms
htmlElements.addBoundaryButton.onclick = () => {
    // Reset edit mode
    editBoundaryMode = false;
    htmlElements.changeBoundaryButton.style.backgroundColor = "white";

    // Get click time (relative to waveform duration)
    const time = globalState.wavesurferWaveforms[0].getCurrentTime();
    if(time === 0) return;

    // Determine location
    let i = 0;
    let currentTime = window.segmentData[0][i].start;
    while(time > currentTime) {
        i++;
        currentTime = window.segmentData[0][i].start;
    }

    // Add to boundaryData
    let element = {"number": i+1, "start": time, "end": window.segmentData[0][i].start, "label": window.clusters[0]};
    window.clusters[0]++;
    window.segmentData[0].splice(i, 0, element);

    // Update segments
    window.segmentData[0][i-1].end = time;
    for(let j = i+1; j < window.segmentData[0].length; j++) {
        window.segmentData[0][j].number = j+1;
    }

    updateSegmentElementsList(window.segmentData[0], true, 0);
}

// TODO hanlde mulitple waveforms
htmlElements.removeBoundaryButton.onclick = () => {
    // Reset edit mode
    editBoundaryMode = false;
    htmlElements.changeBoundaryButton.style.backgroundColor = "white";

    // Get click time (relative to waveform duration)
    const time = globalState.wavesurferWaveforms[0].getCurrentTime();
    
    // Find closest boundary
    let closestBoundaryIndex = 0;
    let closetBoundaryTime = Math.abs(window.segmentData[0][0].start - time);
    window.segmentData[0].forEach(element => {
        if(Math.abs(element.start - time) < closetBoundaryTime) {
            closetBoundaryTime = Math.abs(element.start - time);
            closestBoundaryIndex = element.number - 1;
        }
    });

    if(closestBoundaryIndex != 0 && closestBoundaryIndex != window.segmentData[0].length-1) {
        // Combine with previous (get rid of current index, add to previous)
        window.segmentData[0][closestBoundaryIndex-1].end = window.segmentData[0][closestBoundaryIndex].end;
        window.segmentData[0].splice(closestBoundaryIndex, 1);
        for(let i = closestBoundaryIndex; i < window.segmentData[0].length; i++) {
            window.segmentData[0][i].number = i+1;
        }
        updateSegmentElementsList(window.segmentData[0], true, 0);
    }
}

// TODO hanlde mulitple waveforms
htmlElements.changeBoundaryButton.onclick = () => {
    editBoundaryMode = !editBoundaryMode;

    if (!editBoundaryMode) {
        htmlElements.changeBoundaryButton.style.backgroundColor = "white";
    } else {
        htmlElements.changeBoundaryButton.style.backgroundColor = "rgb(255,197,61)";
    }

    // TODO update with multiple waveforms
    htmlElements.regions[0].regions.forEach(element => {
        element.setOptions({
            resize: editBoundaryMode
        });
    });
}

// Handle region update for editing boundaries
// TODO update with multiple waveforms
htmlElements.regions[0].on('region-updated', (region) => {
    if (!editBoundaryMode) return;

    let index = htmlElements.regions[0].regions.findIndex(r => r.id === region.id);
    if (index === -1) return;

    let movedStart = window.segmentData[0][index].start !== region.start;

    let prevRegion = htmlElements.regions[0].regions.at(index - 1);
    let nextRegion = htmlElements.regions[0].regions.at(index + 1);

    // Enforce limits so you can't go before previous or after nextr segment
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