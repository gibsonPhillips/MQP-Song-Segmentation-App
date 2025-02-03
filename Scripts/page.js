import WaveSurfer from 'https://unpkg.com/wavesurfer.js@7.8.16/dist/wavesurfer.esm.js';
import RegionsPlugin from 'https://unpkg.com/wavesurfer.js@7.8.16/dist/plugins/regions.esm.js';
import ZoomPlugin from 'https://unpkg.com/wavesurfer.js@7.8.16/dist/plugins/zoom.esm.js';

// input audio file path
let filePath = ''
let minPxPerSec = 100
let colorMap = new Map();



// Sort out the save file system
let workspace = ''

let appdataPromise = window.api.getAppData().then((appdata) => {
    console.log(appdata);
    workspace = appdata + '\\Song Segmentation'
    console.log(workspace)
    try {
        let files = window.api.getDirectoryContents(workspace);
        console.log('Directory handled successfully.');
        console.log(files)
    } catch (error) {
        console.error('Error handling directory:', error);
    }
})
.catch((error) => {
    // Handle errors that occurred during the promise
    console.error(error);
});
var data

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

const segmentDetailsDialog = document.querySelector('#segment-details-dialog')

const exportButton = document.querySelector('#export')
const segmentDetailsButton = document.querySelector('#segment-details')
const closeDialogButton = document.querySelector('#close-dialog')
const playButton = document.querySelector('#play')
const forwardButton = document.querySelector('#forward')
const backButton = document.querySelector('#backward')
const zoomInButton = document.querySelector('#zoom-in')
const zoomOutButton = document.querySelector('#zoom-out')


// Button click actions
segmentDetailsButton.onclick = () => {
    segmentDetailsDialog.showModal();
}

closeDialogButton.onclick = () => {
    segmentDetailsDialog.close();
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

// When the export button is clicked
document.getElementById('select-workspace').addEventListener('click', async () => {
    //Gets the appdata
    console.log(workspace)


});


document.getElementById("segment-algorithm1").addEventListener("click", () => {segment(1)});
document.getElementById("segment-algorithm2").addEventListener("click", () => {segment(2)});
document.getElementById("segment-algorithm3").addEventListener("click", () => {segment(3)});
document.getElementById("segment-algorithm4").addEventListener("click", () => {segment(4)});

// when import is pressed
document.getElementById('chooseSong').addEventListener('click', async () => {
    if (chosenDirectory != null) {
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
    } else {
        console.log('No workspace selected')
    }
});

// when load is clicked
document.getElementById('load').addEventListener('click', async () => {
    console.log('not implemented')
    // Implement
});

// when save is clicked
document.getElementById('save').addEventListener('click', async () => {
    if (chosenDirectory != null) {
        if (filePath != '') {
            let filePathEnd = filePath.split("\\").pop();
            filePathEnd = filePathEnd.substring(0,filePathEnd.length-4);
            console.log(filePathEnd)
            const newSaveFolder = await chosenDirectory.getDirectoryHandle(filePathEnd, { create: true });
            if (data != null) {

                //placeholder - implement the saving of save data
                const helloFile = await newSaveFolder.getFileHandle('hello.txt', { create: true });
                const writable = await helloFile.createWritable();
                await writable.write(data);
                await writable.close();
            } else {
                console.log('No data was saved')
            }

            // Implement Saving of the song file

        } else {
            console.log('No audio selected')
        }
    } else {
        console.log('No workspace selected')
    }
});

// runs the segmentation algorithm
async function segment(algorithm) {
    // const inputName = "C:\\Users\\sethb\\OneDrive - Worcester Polytechnic Institute (wpi.edu)\\gr-MQP-MLSongMap\\General\\Songs and Annotations\\Songs\\0043Carly Rae Jepsen  Call Me Maybe.wav"; // Example input data
    const inputName = filePath;
    let clusters = determineVariability();
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
        data = await response.json();
        console.log(data)
        updateSegmentElementsList(data)
    } catch (error) {
        console.error('Error:', error);
    }
}

// Updates the segment elements and display in table
function updateSegmentElementsList(elements) {
    const tbody = document.getElementById('segment-elements');
    tbody.innerHTML = ''
    regions.clearRegions()
    colorMap.clear();
    elements.forEach(element => {
        let tr = document.createElement('tr');
        element.forEach(item => {
            let td = document.createElement('td');
            td.textContent = item
            tr.appendChild(td)
        });
        tbody.appendChild(tr);

        if(!colorMap.has(element[3])) {
            colorMap.set(element[3], randomColor());
        }

        regions.addRegion({
            start: element[1],
            end: element[2],
            content: 'Section ' + element[3],
            color: colorMap.get(element[3]),
            drag: false,
            resize: false,
        })
    });
}

// Determines the variability to be used for an algorithm
function determineVariability() {
    const target = document.getElementById('variability-slider');
    let num = parseInt(Number(target.value)/100) + 2
    console.log(num)
    return num
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
