import { globalState, updateSegmentElementsList, updateTimeline, loadSong } from './globalData.js';
import htmlElements from './globalData.js';

// Algorithm buttons
htmlElements.algorithm1Button.addEventListener("click", () => {segment(1)});
htmlElements.algorithm2Button.addEventListener("click", () => {segment(2)});
htmlElements.algorithm3Button.addEventListener("click", () => {segment(3)});
htmlElements.algorithm4Button.addEventListener("click", () => {segment(4)});
htmlElements.algorithmAutoButton.addEventListener("click", () => {autoSegment(4, 4, 0, false)}); // auto to highest scoring algorithm

// Import button
htmlElements.importButton.addEventListener('click', async () => {
    const filePaths = await window.api.openFile();
    if (filePaths && filePaths.length > 0) {
        await loadSong(filePaths[0]);
    } else {
        console.log('No file selected');
    }
});

// runs the segmentation algorithm
// TODO handle multiple waveforms
async function segment(algorithm) {
    const inputName = window.songFilePaths[0];
    window.clusters[0] = determineVariability();
    try {
        console.log("Segmenting begin");

        // Send a POST request to the Python server
        const response = await fetch('http://127.0.0.1:5000/call-python', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ song: inputName, algorithm : algorithm, clusters : window.clusters[0] }),
        });

        console.log("Segmenting end");

        // Parse the JSON response
        const data = await response.json();
        console.log(data)
        window.segmentData[0] = data.map(row => {
            return Object.fromEntries(row.map((value, index) => [globalState.headers[index], value]));
        });
        updateSegmentElementsList(window.segmentData[0], true, 0)
    } catch (error) {
        console.error('Error:', error);
    }
}

// Determines the variability to be used for an algorithm
function determineVariability() {
    const target = document.getElementById('variability-slider');
    let num = parseInt(Number(target.value)/100) + 2
    console.log(num)
    return num
}

// TODO handle multiple waveforms
async function autoSegment(clusters, closestClusters, closestAverage, finalCall) {
    const inputName = window.songFilePaths[0];
    try {
        console.log("Segmenting begin");

        // Send a POST request to the Python server
        const response = await fetch('http://127.0.0.1:5000/call-python', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ song: inputName, algorithm : 4, clusters : clusters }),
        });

        console.log("Segmenting end");

        // Parse the JSON response
        const data = await response.json();

        let segmentData = data.map(row => {
            return Object.fromEntries(row.map((value, index) => [globalState.headers[index], value]));
        });

        let average = determineAverageSegmentLength(segmentData);

        if(finalCall) {
            window.segmentData[0] = segmentData;
            window.clusters[0] = closestClusters;
            updateSegmentElementsList(window.segmentData[0], true, 0);
            return;
        }

        if(Math.abs(average - 25) < closestAverage) {
            closestAverage = Math.abs(average - 25);
            closestClusters = clusters;

            if(average < 25) {
                autoSegment(clusters-1, closestClusters, closestAverage, false);
            } else {
                autoSegment(clusters+1, closestClusters, closestAverage, false);
            }
        } else {
            autoSegment(closestClusters, closestClusters, closestAverage, true);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Determines average length of all segments in the song
function determineAverageSegmentLength(segmentData) {
    let totalLength = 0;
    segmentData.forEach(element => {
        totalLength += element.end - element.start;
    });
    console.log(totalLength/segmentData.length);
    return totalLength/segmentData.length;
}