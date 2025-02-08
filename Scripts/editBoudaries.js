import { globalState } from './globalData.js';
import htmlElements from './globalData.js';
import * as page from './page.js';

document.addEventListener("DOMContentLoaded", () => {
    htmlElements.addBoundaryButton.onclick = () => {
        console.log("ADD");
        toggleMode(htmlElements.addBoundaryButton, globalState.EditMode.ADD);
    }
});

htmlElements.removeBoundaryButton.onclick = () => {
    toggleMode(htmlElements.removeBoundaryButton, globalState.EditMode.REMOVE);
}

htmlElements.changeBoundaryButton.onclick = () => {
    toggleMode(htmlElements.changeBoundaryButton, globalState.EditMode.CHANGE);
}

// Used to determine the current mode and update appropriate states
function toggleMode(button, newMode) {
    htmlElements.addBoundaryButton.style.backgroundColor = "white";
    htmlElements.removeBoundaryButton.style.backgroundColor = "white";
    htmlElements.changeBoundaryButton.style.backgroundColor = "white";

    if (globalState.mode === newMode) {
        globalState.mode = globalState.EditMode.NONE;
        button.style.backgroundColor = "white";
    } else {
        globalState.mode = newMode;
        button.style.backgroundColor = "rgb(255,197,61)";
    }

    globalState.segmentRegions.forEach(element => {
        element.setOptions({
            drag: globalState.mode === globalState.EditMode.CHANGE,
            resize: globalState.mode === globalState.EditMode.CHANGE
        });
    });
}

// Listen for clicks on the waveform
htmlElements.wavesurfer.on('interaction', async (event) => {
    if (globalState.segmentData != null && globalState.mode === globalState.EditMode.ADD) {
        // Get click time (relative to waveform duration)
        const time = htmlElements.wavesurfer.getCurrentTime();
    
        // Determine location
        let i = 0;
        let currentTime = globalState.segmentData[i].start;
        while(time > currentTime) {
            i++;
            currentTime = globalState.segmentData[i].start;
        }
    
        // Add to boundaryData
        let element = {"number": i+1, "start": time, "end": globalState.segmentData[i].start, "label": globalState.clusters};
        globalState.clusters++;
        globalState.segmentData.splice(i, 0, element);
    
        // Update segments
        globalState.segmentData[i-1].end = time;
        for(let j = i+1; j < globalState.segmentData.length; j++) {
            globalState.segmentData[j].number = j+1;
        }
    
        page.updateSegmentElementsList(globalState.segmentData, true);
    
        // Disable marker mode after placing one
        globalState.mode = globalState.EditMode.NONE;
        htmlElements.addBoundaryButton.style.backgroundColor = "white";
    } else if (globalState.segmentData != null && globalState.mode === globalState.EditMode.REMOVE) {
        // Get click time (relative to waveform duration)
        const time = htmlElements.wavesurfer.getCurrentTime();
    
        // Find closest boundary
        let closestBoundaryIndex = 0;
        let closetBoundaryTime = Math.abs(globalState.segmentData[0].start - time);
        globalState.segmentData.forEach(element => {
            if(Math.abs(element.start - time) < closetBoundaryTime) {
                closetBoundaryTime = Math.abs(element.start - time);
                closestBoundaryIndex = element.number - 1;
            }
        });
    
        if(closestBoundaryIndex != 0) {
            // Choose to combine with previous or next
            htmlElements.removeBoundaryDialog.showModal();
            const previous = await removeBoundaryButtonClick();
            htmlElements.removeBoundaryDialog.close();
    
            if(previous) {
                // Combine with previous (get rid of current index, add to previous)
                globalState.segmentData[closestBoundaryIndex-1].end = globalState.segmentData[closestBoundaryIndex].end;
                globalState.segmentData.splice(closestBoundaryIndex, 1);
                for(let i = closestBoundaryIndex; i < globalState.segmentData.length; i++) {
                    globalState.segmentData[i].number = i+1;
                }
            } else {
                // Combine with next (keep current index, get rid of next to combine with current)
                globalState.segmentData[closestBoundaryIndex].start = globalState.segmentData[closestBoundaryIndex-1].start;
                globalState.segmentData.splice(closestBoundaryIndex-1, 1);
                for(let i = closestBoundaryIndex-1; i < globalState.segmentData.length; i++) {
                    globalState.segmentData[i].number = i+1;
                }
            }
    
            page.updateSegmentElementsList(globalState.segmentData, true);
        }
    
        // Disable marker mode after placing one
        globalState.mode = globalState.EditMode.REMOVE
        htmlElements.removeBoundaryButton.style.backgroundColor = "white";
    }
    return;
});    


// Deal with remove boundary click with 
function removeBoundaryButtonClick() {
    return new Promise(resolve => {
        const combinePreviousButton = document.querySelector('#combine-previous');
        const combineNextButton = document.querySelector('#combine-next');
    
        const handler = (event) => {
            if(event.target == combinePreviousButton)
                resolve(true);
            else
                resolve(false);
            combinePreviousButton.removeEventListener('click', handler);
            combineNextButton.removeEventListener('click', handler);
        };
    
        combinePreviousButton.addEventListener('click', handler);
        combineNextButton.addEventListener('click', handler);
    });
}

// Handle region update, handling constraints
htmlElements.regions.on('region-updated', (region) => {
    if (globalState.mode !== globalState.EditMode.CHANGE) return;

    let index = globalState.segmentRegions.findIndex(r => r.id === region.id);
    if (index === -1) return;

    let movedStart = globalState.segmentData[index].start !== region.start;

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
        globalState.segmentData[index].start = newStart;
        // Update end of prev
        if(index > 0)
            globalState.segmentData[index-1].end = newStart;
    } else {
        // Update end of current
        globalState.segmentData[index].end = newEnd;
        // Update start of next
        if(index+1 < globalState.segmentData.length)
            globalState.segmentData[index+1].start = newEnd;
    }

    page.updateSegmentElementsList(globalState.segmentData, false);

});