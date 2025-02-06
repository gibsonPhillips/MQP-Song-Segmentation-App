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

    // Create a directory if it doesnt already exist
    window.api.createDirectory(workspace).then((result) => {

        console.log('Directory handled successfully.');

    }).catch((error) => {
        // Throw error if there is an issue creating the directory
        console.error(error);
    });
}).catch((error) => {
    // Throw error if there is an issue getting the appdata environment variable
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
const saveMenuDialog = document.querySelector('#save-dialog')
const closeSaveDialogButton = document.querySelector('#close-save-dialog')
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

closeSaveDialogButton.onclick = () => {
    saveMenuDialog.close();
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
document.getElementById('open-workspace').addEventListener('click', async () => {
    // Gets the appdata
    window.api.openDirectory(workspace).then((result) => {
        console.log('Directory Opened Successfully')
    }).catch((error) => {
        console.error(error);
    });

});


document.getElementById("segment-algorithm1").addEventListener("click", () => {segment(1)});
document.getElementById("segment-algorithm2").addEventListener("click", () => {segment(2)});
document.getElementById("segment-algorithm3").addEventListener("click", () => {segment(3)});
document.getElementById("segment-algorithm4").addEventListener("click", () => {segment(4)});

// when import is pressed
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

// when load is clicked
document.getElementById('load').addEventListener('click', async () => {
    console.log('not implemented')
    // Implement
});

// Queues the pop-up to save the project
async function selectSaveProject() {
    // Get the save files
    let chosenProject = ''
        window.api.getDirectoryContents(workspace).then((files) => {
            const vbox = document.getElementById('save-files');
            if (files.length != 0) {
            // Implement selecting the project
            //placeholders

                files.forEach(file => {

                    // Create a button for each existing project
                    let newButton = document.createElement('button');
                    newButton.textContent = file
                    newButton.addEventListener('click', async () => {
                        chosenProject = file
                        console.log(chosenProject);
                        saveMenuDialog.close();
                        saveTheData(chosenProject)
                    })
                    vbox.appendChild(newButton);
                });
            }
            // New Project button
            let newButton = document.createElement('button');
            newButton.textContent = 'New Project'
            newButton.addEventListener('click', async () => {
                // Place holder for new project textbox
                chosenProject = 'New Project - ' + '1'
                console.log(chosenProject);
                saveMenuDialog.close();
                window.api.createDirectory(workspace + '\\' + chosenProject).then((result) => {
                   console.log('Directory creation handled successfully.');
                }).catch((error) => {
                    // Throw error if there is an issue creating the directory
                    console.error(error);
                });
                saveTheData(chosenProject)
            })
            vbox.appendChild(newButton);

            //Show the dialog
            saveMenuDialog.showModal();
}).catch((error) => {
            // Throw error if there is an issue getting the files within the directory
            console.error(error);
});
}


// when save is clicked
document.getElementById('save').addEventListener('click', async () => {

    if (filePath != '') {
        let filePathEnd = filePath.split("\\").pop();
        filePathEnd = filePathEnd.substring(0,filePathEnd.length-4);
        console.log(filePathEnd)
        selectSaveProject();

    } else {
        console.log('No audio selected')
    }
});

//save the project data
function saveTheData(chosenProject) {
    if (chosenProject != '') {
        let saveDirectoryPath = workspace + "\\" + chosenProject
        console.log('saveDirectoryPath: ' + saveDirectoryPath);
        data = "hello world!"
        if (data != null) {

            try {
                // Writing the save data to the file
                let saveDataFilePath = saveDirectoryPath + '\\' + chosenProject + '-data.txt';
                const result = window.api.writeToFile(saveDataFilePath, data);

            } catch (error) {
                console.error('Error in writing to file:', error);
            }



        } else {
            console.log('No data was saved')
        }
    } else {
        console.log('No data was saved (2)')
    }

    // Implement Saving of the song file
}

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
