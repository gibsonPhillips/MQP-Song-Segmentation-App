import { globalState } from './globalData.js';
import htmlElements from './globalData.js';

let minPxPerSec = 100
// default colors
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

// Button click actions
htmlElements.segmentDetailsButton.onclick = () => {
    htmlElements.segmentDetailsDialog.showModal();
}

htmlElements.closeDialogButton.onclick = () => {
    htmlElements.segmentDetailsDialog.close();
    htmlElements.removeBoundaryDialog.close();
}

htmlElements.playButton.onclick = () => {
    if(htmlElements.wavesurfer.getDuration() > 0) {
        htmlElements.wavesurfer.playPause()
        if(htmlElements.wavesurfer.isPlaying()) {
            // pause icon
            htmlElements.playButton.innerHTML = '<img src="resources/icons/pause-solid.svg" alt="Pause Button">';
        } else {
            // play icon
            htmlElements.playButton.innerHTML = '<img src="resources/icons/play-solid.svg" alt="Play Button">';
        }
    }
}

htmlElements.forwardButton.onclick = () => {
    htmlElements.wavesurfer.skip(15)
}

htmlElements.backButton.onclick = () => {
    htmlElements.wavesurfer.skip(-15)
}

htmlElements.zoomInButton.onclick = () => {
    minPxPerSec = minPxPerSec + 10
    htmlElements.wavesurfer.zoom(minPxPerSec)
}

htmlElements.zoomOutButton.onclick = () => {
    minPxPerSec = minPxPerSec - 10
    htmlElements.wavesurfer.zoom(minPxPerSec)
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
        globalState.filePath = filePaths[0];
        htmlElements.regions.clearRegions();
        htmlElements.wavesurfer.load(filePaths[0]);
    } else {
        document.getElementById('filePath').textContent = 'No file selected.';
        console.log('No file selected');
    }
});

// runs the segmentation algorithm
async function segment(algorithm) {
    // const inputName = "C:\\Users\\sethb\\OneDrive - Worcester Polytechnic Institute (wpi.edu)\\gr-MQP-MLSongMap\\General\\Songs and Annotations\\Songs\\0043Carly Rae Jepsen  Call Me Maybe.wav"; // Example input data
    const inputName = globalState.filePath;
    globalState.clusters = determineVariability();
    try {
        console.log("Segmenting begin");

        // Send a POST request to the Python server
        const response = await fetch('http://127.0.0.1:5000/call-python', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ song: inputName, algorithm : algorithm, clusters : globalState.clusters }),
        });

        console.log("Segmenting end");

        // Parse the JSON response
        const data = await response.json();

        globalState.segmentData = data.map(row => {
            return Object.fromEntries(row.map((value, index) => [globalState.headers[index], value]));
        });

        updateSegmentElementsList(globalState.segmentData, true)
    } catch (error) {
        console.error('Error:', error);
    }
}

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

// Update labels on scroll
htmlElements.wavesurfer.on("scroll", () => {
    updateLabelPositions();
});

// Update labels on zoom
htmlElements.wavesurfer.on("zoom", () => {
    updateLabelPositions();
});

// Updates label positions with the most up to date waveform
function updateLabelPositions() {
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

// Determines the variability to be used for an algorithm
function determineVariability() {
    const target = document.getElementById('variability-slider');
    let num = parseInt(Number(target.value)/100) + 2
    console.log(num)
    return num
}

// Gets the next color to be used for segment region
function getColor(length) {
    if(length > 10) {
        return randomColor();
    } else {
        return defaultColors[length];
    }
}









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