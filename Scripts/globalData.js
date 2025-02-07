class EditMode {
    static NONE = 'none';
    static ADD = 'add';
    static REMOVE = 'remove';
    static CHANGE = 'change';
}

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
    segmentRegions: []
};