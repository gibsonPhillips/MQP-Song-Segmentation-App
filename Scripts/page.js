import WaveSurfer from 'https://unpkg.com/wavesurfer.js@7.8.16/dist/wavesurfer.esm.js';
import RegionsPlugin from 'https://unpkg.com/wavesurfer.js@7.8.16/dist/plugins/regions.esm.js';
import ZoomPlugin from 'https://unpkg.com/wavesurfer.js@7.8.16/dist/plugins/zoom.esm.js';

class EditMode {
    static NONE = 'none';
    static ADD = 'add';
    static REMOVE = 'remove';
    static CHANGE = 'change';
}

// input audio file path
let filePath = ''
let minPxPerSec = 100
// stores label color map
let colorMap = new Map();
// headers for segment data
const headers = ["number", "start", "end", "label"];
// stores all the segment data
let segmentData;
let clusters;
let mode = EditMode.NONE;
// stores the wavesurfer regions for segments
let segmentRegions;

// Initialize the Regions plugin
const regions = RegionsPlugin.create()

const zoom = ZoomPlugin.create({
    // the amount of zoom per wheel step, e.g. 0.5 means a 50% magnification per scroll
    scale: 0.1,
  });

// Create an instance of WaveSurfer
const wavesurfer = WaveSurfer.create({
    container: '#waveform',
    waveColor: 'rgb(200, 0, 200)',
    progressColor: 'rgb(100, 0, 100)',
    minPxPerSec: 100,
    plugins: [regions, zoom],
})

// Give regions a random color when they are created
const random = (min, max) => Math.random() * (max - min) + min
const randomColor = () => `rgba(${random(0, 255)}, ${random(0, 255)}, ${random(0, 255)}, 0.5)`

// Constants for HTML elements
const segmentDetailsDialog = document.querySelector('#segment-details-dialog')
const removeBoundaryDialog = document.querySelector('#remove-boundary-dialog')

const exportButton = document.querySelector('#export')
const segmentDetailsButton = document.querySelector('#segment-details')
const addBoundaryButton = document.querySelector('#add-boundary')
const removeBoundaryButton = document.querySelector('#remove-boundary')
const changeBoundaryButton = document.querySelector('#change-boundary')
const closeDialogButton = document.querySelector('#close-dialog')
const playButton = document.querySelector('#play')
const forwardButton = document.querySelector('#forward')
const backButton = document.querySelector('#backward')
const zoomInButton = document.querySelector('#zoom-in')
const zoomOutButton = document.querySelector('#zoom-out')
const labelsContainer = document.getElementById("labels-container")
const waveformContainer = document.getElementById("waveform")


// Button click actions
segmentDetailsButton.onclick = () => {
    segmentDetailsDialog.showModal();
}

closeDialogButton.onclick = () => {
    segmentDetailsDialog.close();
    removeBoundaryDialog.close();
}

addBoundaryButton.onclick = () => {
    toggleMode(addBoundaryButton, EditMode.ADD);
}

removeBoundaryButton.onclick = () => {
    toggleMode(removeBoundaryButton, EditMode.REMOVE);
}

changeBoundaryButton.onclick = () => {
    toggleMode(changeBoundaryButton, EditMode.CHANGE);
}

// Used to determine the current mode and update appropriate states
function toggleMode(button, newMode) {
    addBoundaryButton.style.backgroundColor = "white";
    removeBoundaryButton.style.backgroundColor = "white";
    changeBoundaryButton.style.backgroundColor = "white";

    if (mode === newMode) {
        mode = EditMode.NONE;
        button.style.backgroundColor = "white";
    } else {
        mode = newMode;
        button.style.backgroundColor = "rgb(255,197,61)";
    }

    segmentRegions.forEach(element => {
        element.setOptions({
            drag: mode === EditMode.CHANGE,
            resize: mode === EditMode.CHANGE
        });
    });
}

playButton.onclick = () => {
    if(wavesurfer.getDuration() > 0) {
        wavesurfer.playPause()
        if(wavesurfer.isPlaying()) {
            // pause icon
            playButton.innerHTML = '<img src="resources/icons/pause-solid.svg" alt="Pause Button">';
        } else {
            // play icon
            playButton.innerHTML = '<img src="resources/icons/play-solid.svg" alt="Play Button">';
        }
    }
}

forwardButton.onclick = () => {
    wavesurfer.skip(15)
}

backButton.onclick = () => {
    wavesurfer.skip(-15)
}

zoomInButton.onclick = () => {
    minPxPerSec = minPxPerSec + 10
    wavesurfer.zoom(minPxPerSec)
}

zoomOutButton.onclick = () => {
    minPxPerSec = minPxPerSec - 10
    wavesurfer.zoom(minPxPerSec)
}

// Algorithm buttons
document.getElementById("segment-algorithm1").addEventListener("click", () => {segment(1)});
document.getElementById("segment-algorithm2").addEventListener("click", () => {segment(2)});
document.getElementById("segment-algorithm3").addEventListener("click", () => {segment(3)});
document.getElementById("segment-algorithm4").addEventListener("click", () => {segment(4)});

// Import button
document.getElementById('chooseSong').addEventListener('click', async () => {
    const filePaths = await window.api.openFile();
    if (filePaths && filePaths.length > 0) {
        // Display the file path
        document.getElementById('filePath').textContent = `Selected file: ${filePaths[0]}`;
        console.log('File path:', filePaths[0]); // This is available in Electron or environments with full file access
        filePath = filePaths[0];
        regions.clearRegions();
        wavesurfer.load(filePaths[0]);
    } else {
        document.getElementById('filePath').textContent = 'No file selected.';
        console.log('No file selected');
    }
});

// runs the segmentation algorithm
async function segment(algorithm) {
    // const inputName = "C:\\Users\\sethb\\OneDrive - Worcester Polytechnic Institute (wpi.edu)\\gr-MQP-MLSongMap\\General\\Songs and Annotations\\Songs\\0043Carly Rae Jepsen  Call Me Maybe.wav"; // Example input data
    const inputName = filePath;
    clusters = determineVariability();
    try {
        console.log("Segmenting begin");

        // Send a POST request to the Python server
        const response = await fetch('http://127.0.0.1:5000/call-python', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ song: inputName, algorithm : algorithm, clusters : clusters }),
        });

        console.log("Segmenting end");

        // Parse the JSON response
        const data = await response.json();

        segmentData = data.map(row => {
            return Object.fromEntries(row.map((value, index) => [headers[index], value]));
        });

        updateSegmentElementsList(segmentData, true)
    } catch (error) {
        console.error('Error:', error);
    }
}

// Updates the segment elements and display in table
function updateSegmentElementsList(elements, updateWaveform) {
    const tbody = document.getElementById('segment-elements');
    tbody.innerHTML = ''

    // If waveform is being updated
    if(updateWaveform) {
        regions.clearRegions()
        colorMap.clear();
        labelsContainer.textContent = "";
        segmentRegions = [];
    }

    elements.forEach(element => {
        let tr = document.createElement('tr');
        for (let key in element) {
            let td = document.createElement('td');
            td.textContent = element[key]
            tr.appendChild(td)
        }
        tbody.appendChild(tr);

        if(!colorMap.has(element.label)) {
            colorMap.set(element.label, randomColor());
        }


        if(updateWaveform) {
            // Create new region
            let region = regions.addRegion({
                start: element.start,
                end: element.end,
                color: colorMap.get(element.label),
                drag: false,
                resize: false,
            });

            segmentRegions.push(region);

            // Create segment label for region
            let labelInput = document.createElement("input");
            labelInput.type = "text";
            labelInput.value = element.label;
            labelInput.className = "region-label-input";
            labelsContainer.appendChild(labelInput);
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

// Update labels on scroll
wavesurfer.on("scroll", () => {
    updateLabelPositions();
});

// Update labels on zoom
wavesurfer.on("zoom", () => {
    updateLabelPositions();
});

// Updates label positions with the most up to date waveform
function updateLabelPositions() {
    document.querySelectorAll(".region-label-input").forEach((label, index) => {
        let region = segmentRegions[index];
        let regionRect = region.element.getBoundingClientRect();
        let waveform = document.getElementById('waveform');

        label.style.left = `${regionRect.left - waveform.getBoundingClientRect().left + waveform.offsetLeft}px`;
        label.style.width = `${regionRect.width}px`;
    });
}

// Determines the variability to be used for an algorithm
function determineVariability() {
    const target = document.getElementById('variability-slider');
    let num = parseInt(Number(target.value)/100) + 2
    console.log(num)
    return num
}

// Listen for clicks on the waveform
wavesurfer.on('interaction', async (event) => {
if (segmentData != null && mode === EditMode.ADD) {
    // Get click time (relative to waveform duration)
    const time = wavesurfer.getCurrentTime();

    // Determine location
    let i = 0;
    let currentTime = segmentData[i].start;
    while(time > currentTime) {
        i++;
        currentTime = segmentData[i].start;
    }

    // Add to boundaryData
    let element = {"number": i+1, "start": time, "end": segmentData[i].start, "label": clusters};
    clusters++;
    segmentData.splice(i, 0, element);

    // Update segments
    segmentData[i-1].end = time;
    for(let j = i+1; j < segmentData.length; j++) {
        segmentData[j].number = j+1;
    }

    updateSegmentElementsList(segmentData, true);

    // Disable marker mode after placing one
    mode = EditMode.NONE;
    addBoundaryButton.style.backgroundColor = "white";
} else if (segmentData != null && mode === EditMode.REMOVE) {
    // Get click time (relative to waveform duration)
    const time = wavesurfer.getCurrentTime();

    // Find closest boundary
    let closestBoundaryIndex = 0;
    let closetBoundaryTime = Math.abs(segmentData[0].start - time);
    segmentData.forEach(element => {
        if(Math.abs(element.start - time) < closetBoundaryTime) {
            closetBoundaryTime = Math.abs(element.start - time);
            closestBoundaryIndex = element.number - 1;
        }
    });

    if(closestBoundaryIndex != 0) {
        // Choose to combine with previous or next
        removeBoundaryDialog.showModal();
        const previous = await removeBoundaryButtonClick();
        removeBoundaryDialog.close();

        if(previous) {
            // Combine with previous (get rid of current index, add to previous)
            segmentData[closestBoundaryIndex-1].end = segmentData[closestBoundaryIndex].end;
            segmentData.splice(closestBoundaryIndex, 1);
            for(let i = closestBoundaryIndex; i < segmentData.length; i++) {
                segmentData[i].number = i+1;
            }
        } else {
            // Combine with next (keep current index, get rid of next to combine with current)
            segmentData[closestBoundaryIndex].start = segmentData[closestBoundaryIndex-1].start;
            segmentData.splice(closestBoundaryIndex-1, 1);
            for(let i = closestBoundaryIndex-1; i < segmentData.length; i++) {
                segmentData[i].number = i+1;
            }
        }

        updateSegmentElementsList(segmentData, true);
    }

    // Disable marker mode after placing one
    mode = EditMode.REMOVE
    removeBoundaryButton.style.backgroundColor = "white";
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
regions.on('region-updated', (region) => {
    if (mode !== EditMode.CHANGE) return;

    let index = segmentRegions.findIndex(r => r.id === region.id);
    if (index === -1) return;

    let movedStart = segmentData[index].start !== region.start;

    let prevRegion = segmentRegions[index - 1];
    let nextRegion = segmentRegions[index + 1];

    // Enforce limits so you can't go before previous or after nextr segment
    let minStart = prevRegion ? prevRegion.start : 0; // Can't move before previous start
    let maxEnd = nextRegion ? nextRegion.end : wavesurfer.getDuration(); // Can't extend beyond next region

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
        segmentData[index].start = newStart;
        // Update end of prev
        if(index > 0)
            segmentData[index-1].end = newStart;
    } else {
        // Update end of current
        segmentData[index].end = newEnd;
        // Update start of next
        if(index+1 < segmentData.length)
            segmentData[index+1].start = newEnd;
    }

    updateSegmentElementsList(segmentData, false);

});









// regions.enableDragSelection({
//     color: 'rgba(255, 0, 0, 0.1)',
// })

// // Add event listener for region creation
// regions.on('region-created', (region) => {
//     console.log("REGION CREATED");
//     zoomToRegion(region.start, region.end);
//     region.remove();
// });

// // Function to zoom into a specific region
// function zoomToRegion(start, end) {
//     const totalDuration = wavesurfer.getDuration();
//     const regionDuration = end - start;

//     // Calculate zoom level and center
//     const zoomLevel = totalDuration / regionDuration;
//     const center = (start + end) / 2;

//     // Set zoom level and scroll to the region
//     wavesurfer.zoom(zoomLevel);

//     // const pxPerSec = wavesurfer.minPxPerSec * zoomLevel;
//     // const scrollPosition = Math.max(center * pxPerSec - wavesurfer.container.clientWidth / 2, 0);
//     // wavesurfer.drawer.wrapper.scrollLeft = scrollPosition;
// }

/*
document.getElementById("thisisn").addEventListener("click", function() {

    // resizes the whole mod window
    document.querySelectorAll("#modifiers").forEach(item => {
        item.style.width = item.style.width === "30px" ? "15%" : "30px";
    });

});
*/

// collapsing functions
// toggles every time the x button is clicked
document.getElementById("mod").addEventListener("click", function() {

    // cull
    document.querySelectorAll(".cull").forEach(item => {
        item.style.display = "none"
    });

    // resizes the whole mod window
    document.querySelectorAll("#modifiers").forEach(item => {
        item.style.width = item.style.width === "50px" ? "15%" : "50px";
    });

    // swaps out buttons for collapsing and expanding
    // also cull other items in mod window
    document.getElementById("expand").style.display = "flex"
    document.getElementById("expand-button").style.display = "flex"
    document.getElementsByClassName("cull")[0].style.setProperty("display","none")

    // failed experiment
    // document.querySelectorAll("#modifiers").forEach(item => {
    //     item.style.display = item.style.display === "none" ? "flex" : "none";

    // gets rid of the extra stuff in the way
    // document.querySelectorAll(".cull").forEach(item => {
    //     item.style.display = item.style.display === "none" ? "flex" : "none";
    // });

    // resizes the button so it doesn't get squashed
    // document.getElementById("mod").style.setProperty("max-width","unset")

    // document.getElementById("mod").style.setProperty("width","30px")

});


document.getElementById("expand").addEventListener("click", function() {
        
    // uncull
    document.querySelectorAll(".cull").forEach(item => {
        item.style.display = "flex"
    });

    // reset the window size
    document.querySelectorAll("#modifiers").forEach(item => {
        item.style.width = "15%";
    });

    // swap out the expand button for the collapse button
    document.getElementById("expand").style.display = "none"
    document.getElementById("expand-button").style.display = "none"
    document.getElementsByClassName("cull")[0].style.setProperty("display","flex")

});