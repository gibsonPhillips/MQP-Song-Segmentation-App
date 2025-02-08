import WaveSurfer from 'https://unpkg.com/wavesurfer.js@7.8.16/dist/wavesurfer.esm.js';
import RegionsPlugin from 'https://unpkg.com/wavesurfer.js@7.8.16/dist/plugins/regions.esm.js';
import ZoomPlugin from 'https://unpkg.com/wavesurfer.js@7.8.16/dist/plugins/zoom.esm.js';

class EditMode {
    static NONE = 'none';
    static ADD = 'add';
    static REMOVE = 'remove';
    static CHANGE = 'change';
}

// Initialize the Regions plugin
const regions = RegionsPlugin.create();

const zoom = ZoomPlugin.create({
    // the amount of zoom per wheel step, e.g. 0.5 means a 50% magnification per scroll
    scale: 0.1,
});

export const globalState = {
    // input audio file path
    filePath: '',
    // stores label color map
    colorMap: new Map(),
    // headers for segment data
    headers: ["number", "start", "end", "label"],
    // stores all the segment data
    segmentData: [],
    clusters: 0,
    mode: EditMode.NONE,
    // stores the wavesurfer regions for segments
    segmentRegions: [],
    EditMode: EditMode
};

const htmlElements = {
    // Constants for HTML elements
    segmentDetailsDialog: document.querySelector('#segment-details-dialog'),
    removeBoundaryDialog: document.querySelector('#remove-boundary-dialog'),
    exportButton: document.querySelector('#export'),
    segmentDetailsButton: document.querySelector('#segment-details'),
    addBoundaryButton: document.querySelector('#add-boundary'),
    removeBoundaryButton: document.querySelector('#remove-boundary'),
    changeBoundaryButton: document.querySelector('#change-boundary'),
    closeDialogButton: document.querySelector('#close-dialog'),
    playButton: document.querySelector('#play'),
    forwardButton: document.querySelector('#forward'),
    backButton: document.querySelector('#backward'),
    zoomInButton: document.querySelector('#zoom-in'),
    zoomOutButton: document.querySelector('#zoom-out'),
    labelsContainer: document.getElementById("labels-container"),
    waveformContainer: document.getElementById("waveform"),
    regions: regions,
    zoom: zoom,

    // Create an instance of WaveSurfer
    wavesurfer: WaveSurfer.create({
        container: '#waveform',
        waveColor: 'rgb(200, 0, 200)',
        progressColor: 'rgb(100, 0, 100)',
        minPxPerSec: 100,
        plugins: [regions, zoom],
    })
};
export default htmlElements;