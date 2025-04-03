import { updateTrackName, globalState, updateSegmentElementsList, updateTimeline, loadSong, setExternalSegment, setExternalAutoSegment } from './globalData.js';
import htmlElements from './globalData.js';
// import {LoadingState, ResetButtonContent} from "./loading_demo.js"

// Import button
htmlElements.importButton.addEventListener('click', async () => {
    const filePaths = await window.api.openFile();
    if (filePaths && filePaths.length > 0) {
        let waveformNum = await loadSong(filePaths[0]);
        let filePathEnd = filePaths[0].split("\\").pop();
        updateTrackName(filePathEnd, waveformNum);
    } else {
        console.log('No file selected');
    }
});

// Set the function in global.js
setExternalSegment(segment);

// runs the segmentation algorithm
// TODO handle multiple waveforms
async function segment(algorithm, waveformNum) {
    const inputName = window.songFilePaths[waveformNum];
    window.clusters[waveformNum] = determineVariability();
    try {
        console.log("Segmenting begin");
        // LoadingState(htmlElements.algorithmsDropdown);

        // Send a POST request to the Python server
        const response = await fetch('http://127.0.0.1:5000/call-python', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ song: inputName, algorithm : algorithm, clusters : window.clusters[waveformNum] }),
        });

        console.log("Segmenting end");
        // ResetButtonContent(0);

        // Parse the JSON response
        const data = await response.json();
        window.segmentData[waveformNum] = data.map(row => {
            return Object.fromEntries(row.map((value, index) => [globalState.headers[index], value]));
        });

        console.log(window.segmentData[waveformNum])

        // Add in segment annotation
        window.segmentData[waveformNum].forEach(obj => {
            obj.label = obj.label + 1;
            obj.annotation = "";
        });

        updateSegmentElementsList(window.segmentData[waveformNum], true, waveformNum)
    } catch (error) {
        console.error('Error:', error);
    }
}

// Determines the variability to be used for an algorithm
function determineVariability() {
    //TODO fix with new slider
    // const target = document.getElementById('variability-slider');
    // let num = parseInt(Number(target.value)/100) + 2
    // console.log(num)
    // return num

    return 4;
}

// Set the function in global.js
setExternalAutoSegment(autoSegment);

// TODO handle multiple waveforms
async function autoSegment(clusters, closestClusters, closestAverage, finalCall, waveformNum) {
    const inputName = window.songFilePaths[waveformNum];
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

        // Add in segment annotation
        segmentData.forEach(obj => {
            obj.annotation = "";
        });

        let average = determineAverageSegmentLength(segmentData);

        if(finalCall) {
            window.segmentData[waveformNum] = segmentData;
            window.clusters[waveformNum] = closestClusters;
            updateSegmentElementsList(window.segmentData[waveformNum], true, waveformNum);
            return;
        }

        if(Math.abs(average - 25) < closestAverage) {
            closestAverage = Math.abs(average - 25);
            closestClusters = clusters;

            if(average < 25) {
                autoSegment(clusters-1, closestClusters, closestAverage, false, waveformNum);
            } else {
                autoSegment(clusters+1, closestClusters, closestAverage, false, waveformNum);
            }
        } else {
            autoSegment(closestClusters, closestClusters, closestAverage, true, waveformNum);
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
    return totalLength/segmentData.length;
}