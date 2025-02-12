import { globalState, updateSegmentElementsList } from './globalData.js';
import htmlElements from './globalData.js';

let editBoundaryMode = false;

htmlElements.addBoundaryButton.onclick = () => {
    // Reset edit mode
    editBoundaryMode = false;
    htmlElements.changeBoundaryButton.style.backgroundColor = "white";

    // Get click time (relative to waveform duration)
    const time = htmlElements.wavesurfer.getCurrentTime();
    if(time === 0) return;

    // Determine location
    let i = 0;
    let currentTime = window.segmentData[i].start;
    while(time > currentTime) {
        i++;
        currentTime = window.segmentData[i].start;
    }

    // Add to boundaryData
    let element = {"number": i+1, "start": time, "end": window.segmentData[i].start, "label": window.clusters};
    window.clusters++;
    window.segmentData.splice(i, 0, element);

    // Update segments
    window.segmentData[i-1].end = time;
    for(let j = i+1; j < window.segmentData.length; j++) {
        window.segmentData[j].number = j+1;
    }

    updateSegmentElementsList(window.segmentData, true);
}

htmlElements.removeBoundaryButton.onclick = () => {
    // Reset edit mode
    editBoundaryMode = false;
    htmlElements.changeBoundaryButton.style.backgroundColor = "white";

    // Get click time (relative to waveform duration)
    const time = htmlElements.wavesurfer.getCurrentTime();
    
    // Find closest boundary
    let closestBoundaryIndex = 0;
    let closetBoundaryTime = Math.abs(window.segmentData[0].start - time);
    window.segmentData.forEach(element => {
        if(Math.abs(element.start - time) < closetBoundaryTime) {
            closetBoundaryTime = Math.abs(element.start - time);
            closestBoundaryIndex = element.number - 1;
        }
    });

    if(closestBoundaryIndex != 0 && closestBoundaryIndex != window.segmentData.length-1) {
        // Combine with previous (get rid of current index, add to previous)
        window.segmentData[closestBoundaryIndex-1].end = window.segmentData[closestBoundaryIndex].end;
        window.segmentData.splice(closestBoundaryIndex, 1);
        for(let i = closestBoundaryIndex; i < window.segmentData.length; i++) {
            window.segmentData[i].number = i+1;
        }
        updateSegmentElementsList(window.segmentData, true);
    }
}

htmlElements.changeBoundaryButton.onclick = () => {
    editBoundaryMode = !editBoundaryMode;

    if (!editBoundaryMode) {
        htmlElements.changeBoundaryButton.style.backgroundColor = "white";
    } else {
        htmlElements.changeBoundaryButton.style.backgroundColor = "rgb(255,197,61)";
    }

    globalState.segmentRegions.forEach(element => {
        element.setOptions({
            resize: editBoundaryMode
        });
    });
}

// Handle region update for editing boundaries
htmlElements.regions.on('region-updated', (region) => {
    if (!editBoundaryMode) return;

    let index = globalState.segmentRegions.findIndex(r => r.id === region.id);
    if (index === -1) return;

    let movedStart = window.segmentData[index].start !== region.start;

    let prevRegion = globalState.segmentRegions[index - 1];
    let nextRegion = globalState.segmentRegions[index + 1];

    // Enforce limits so you can't go before previous or after nextr segment
    let minStart = prevRegion ? prevRegion.start : 0; // Can't move before previous start
    let maxEnd = nextRegion ? nextRegion.end : htmlElements.wavesurfer.getDuration(); // Can't extend beyond next region

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
        window.segmentData[index].start = newStart;
        // Update end of prev
        if(index > 0)
            window.segmentData[index-1].end = newStart;
    } else {
        // Update end of current
        window.segmentData[index].end = newEnd;
        // Update start of next
        if(index+1 < window.segmentData.length)
            window.segmentData[index+1].start = newEnd;
    }

    updateSegmentElementsList(window.segmentData, false);
});