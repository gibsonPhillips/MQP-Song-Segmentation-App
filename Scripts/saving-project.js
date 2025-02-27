import htmlElements from './globalData.js';
import { globalState, loadSong, presentErrorDialog, updateSegmentElementsList } from './globalData.js';

// Sort out the save file system
let workspace = ''

// gets the workspace
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
        presentErrorDialog("Issue creating the directory:\n" + error);
    });
}).catch((error) => {
    // Throw error if there is an issue getting the appdata environment variable
    console.error(error);
    presentErrorDialog("Issue getting the appdata environment variable:\n" + error);
});


// When the workspace button is clicked
htmlElements.openWorkspaceButton.addEventListener('click', async () => {
    // Gets the appdata
    window.api.openDirectory(workspace).then((result) => {
        console.log('Directory Opened Successfully')
    }).catch((error) => {
        console.error(error);
    });
});

// when load is clicked
htmlElements.loadButton.addEventListener('click', async () => {

    // scan the directory
    let chosenProject = ''
    let vbox = htmlElements.loadFiles;
    while (vbox.firstChild) {
        vbox.removeChild(vbox.firstChild);
    }
    window.api.getDirectoryContents(workspace).then((files) => {
        if (files.length != 0) {
        // Implement selecting the project
        //placeholders

            files.forEach(file => {
                // Create a button for each existing project
                let newButton = document.createElement('button');
                newButton.class='btn';
                newButton.textContent = file
                newButton.addEventListener('click', async () => {
                    chosenProject = file
                    console.log(chosenProject);
                    htmlElements.loadMenuDialog.close();
                    loadTheData(chosenProject)
                })
                vbox.appendChild(newButton)
            });
        }

        //Show the dialog
        htmlElements.loadMenuDialog.showModal();

    }).catch((error) => {
        // Throw error if there is an issue getting the files within the directory
        console.error('Issue getting the files within the directory:\n' + error);
        presentErrorDialog('Issue getting the files within the directory:\n' + error);
    });
});

// when save is clicked
htmlElements.saveButton.addEventListener('click', async () => {
    console.log(window.songFilePaths[0])

    if (window.songFilePaths[0] != '' && window.songFilePaths[0] != null) {
//        let filePathEnd = window.songFilePath.split("\\").pop();
//        filePathEnd = filePathEnd.substring(0,filePathEnd.length-4);
//        console.log(filePathEnd)
        selectSaveProject();

    } else {
        console.log('No audio selected')
        presentErrorDialog('No audio selected')
    }
});

// when delete is clicked
htmlElements.deleteButton.addEventListener('click', async () => {
    selectDeleteProject();
});

htmlElements.exportButton.addEventListener('click', async () => {
    let exportStats = calculateExportStats(0)
    let fileText = createExportFileText(exportStats, 0)
    console.log(fileText)
    const filePath = await window.api.saveFile();
    if (filePath) {
        window.api.writeToFile(filePath, fileText).then((result) => {
            console.log('saved successfully')
        }).catch((err) => {
            console.err(err)
        });
    } else {
        console.log('unable to save')
    }
});


// Functionality functions

// loads the data
async function loadTheData(chosenProject) {
    // the path to the project directory
    let projectPath = workspace + '\\' + chosenProject;

    // important file paths
    let loadSongFilePath = '';
    let loadMetadataFilePath = '';
    let loadSegmentDataFilePath = '';
    let loadMarkerNotesFilePath = '';

    // look for the files
    await window.api.getDirectoryContents(projectPath).then((files) => {
        files.forEach(file => {
            if (file.substring(file.length-4,file.length) == '.wav') {
                loadSongFilePath = projectPath + '\\' + file;
            } else if (file.substring(file.length-13,file.length) == '-metadata.txt') {
                loadMetadataFilePath = projectPath + '\\' + file;
            } else if (file.substring(file.length-16,file.length) == '-segmentdata.txt') {
                loadSegmentDataFilePath = projectPath + '\\' + file;
            } else if (file.substring(file.length-15,file.length) == '-markerdata.txt') {
                loadMarkerNotesFilePath = projectPath + '\\' + file;
            }
        })
    })

    console.log('song: ' + loadSongFilePath)
    console.log('metadata: ' + loadMetadataFilePath)
    console.log('segment data: ' + loadSegmentDataFilePath)
    console.log('marker data: ' + loadMarkerNotesFilePath)

    // loads the metadata

    let metadata = await parseMetadataFile(loadMetadataFilePath)
    if (loadSongFilePath == '') {
        loadSongFilePath = metadata[0]; // song file path
    }

    // loads the song

    let waveformNum = await loadSong(loadSongFilePath);
    window.songFilePaths[waveformNum] = loadSongFilePath

    // loads the metadata
    // implement

    // loads the segment data
    window.segmentData[waveformNum] = await parseSegmentDataFile(loadSegmentDataFilePath);
    if (window.segmentData[waveformNum].length === 0) {
        console.log('No data loaded');
        presentErrorDialog('No data loaded from ' + chosenProject);
    } else {
        updateSegmentElementsList(window.segmentData[waveformNum], true, waveformNum);
        window.clusters[waveformNum] = determineNumClusters(waveformNum);
    }

    // loads the marker notes data
    globalState.markerNotes[waveformNum] = await parseMarkerDataFile(loadMarkerNotesFilePath);
    if (globalState.markerNotes[waveformNum].size === 0) {
        console.log('No marker data loaded');
    } else {
        updateSegmentElementsList(window.segmentData[waveformNum], true, waveformNum);
        // window.clusters[waveformNum] = determineNumClusters(waveformNum);
    }
}

function determineNumClusters(waveformNum) {
    let count = 0;
    let set = new Set();
    window.segmentData[waveformNum].forEach(element => {
        if(!set.has(element.label)) {
            set.add(element.label);
            count++;
        }
    });
    return count;
}


// Queues the pop-up dialog to save the project
async function selectSaveProject() {
    // Get the save files
    let chosenProject = ''
    let vbox = htmlElements.saveFiles;
    while (vbox.firstChild) {
        vbox.removeChild(vbox.firstChild);
    }
    window.api.getDirectoryContents(workspace).then((files) => {
        if (files.length != 0) {
        // Implement selecting the project
        //placeholders

            files.forEach(file => {

                // Create a button for each existing project
                let newButton = document.createElement('button');
                newButton.class='btn';
                newButton.textContent = file
                newButton.addEventListener('click', async () => {
                    chosenProject = file
                    htmlElements.saveMenuDialog.close();
                    saveTheData(chosenProject, htmlElements.saveAudioCheckbox.checked)
                })
                vbox.appendChild(newButton);
            });
        }
        // New Project button
        let hbox = document.createElement('div');
        hbox.class = 'hbox';
        let newButton = document.createElement('button');
        newButton.class='btn';
        newButton.textContent = 'Create New Project'
        let newInput = document.createElement('input');
        newInput.textContent = 'New Project'
        newButton.addEventListener('click', async () => {
            // Place holder for new project textbox
            chosenProject = newInput.value
            htmlElements.saveMenuDialog.close();

            await window.api.createDirectory(workspace + '\\' + chosenProject).then((result) => {
                console.log('Directory creation handled successfully.');
                saveTheData(chosenProject, htmlElements.saveAudioCheckbox.checked)
            }).catch((error) => {
                // Throw error if there is an issue creating the directory
                console.error('Issue creating directory:\n' + error);
                presentErrorDialog('Issue creating directory:\n' + error);

            });
        })

        hbox.appendChild(newInput);
        hbox.appendChild(newButton);

        vbox.appendChild(hbox);

        //Show the dialog
        htmlElements.saveMenuDialog.showModal();
    }).catch((error) => {
        // Throw error if there is an issue getting the files within the directory
        console.error('Issue getting the files within the directory:\n' + error);
        presentErrorDialog('Issue getting the files within the directory:\n' + error);
    });
}

//save the project data
async function saveTheData(chosenProject, saveAudioFile) {

    if (chosenProject != '') {

        let saveDirectoryPath = workspace + "\\" + chosenProject
        console.log('saveDirectoryPath: ' + saveDirectoryPath);

        if (window.segmentData[0] != null && window.segmentData[0].length != 0) {

            try {

                // Writing the segment data to the file
                let saveSegmentDataFilePath = saveDirectoryPath + '\\' + chosenProject + '-segmentdata.txt';
                let segmentDataText = createSegmentDataFileText(0);
                window.api.writeToFile(saveSegmentDataFilePath, segmentDataText);

                // Writing the metadata to the file
                let saveMetadataFilePath = saveDirectoryPath + '\\' + chosenProject + '-metadata.txt';
                let metadataText = createMetadataFileText();
                window.api.writeToFile(saveMetadataFilePath, metadataText);

                // Writing the marker notes
                let saveMarkerNotesFilePath = saveDirectoryPath + '\\' + chosenProject + '-markerdata.txt';
                let markerNotesData = createMarkerNotesFileText(0);
                window.api.writeToFile(saveMarkerNotesFilePath, markerNotesData);

                // Copy song the song (if set to true)
                if (saveAudioFile) {
                    let filePathEnd = window.songFilePaths[0].split("\\").pop();
                    window.api.copySongFile(window.songFilePaths[0], saveDirectoryPath + '\\' + filePathEnd);
                }

            } catch (error) {
                console.error('Error in writing to file:\n', error);
                presentErrorDialog('Error in writing to file:\n' + error)
            }

        } else {

            // Saves no data but saves the song
            try {

                // Writing the segment data to the file
                let saveSegmentDataFilePath = saveDirectoryPath + '\\' + chosenProject + '-segmentdata.txt';
                window.api.writeToFile(saveSegmentDataFilePath, 'No data');

                // Writing the metadata to the file
                let saveMetadataFilePath = saveDirectoryPath + '\\' + chosenProject + '-metadata.txt';
                window.api.writeToFile(saveMetadataFilePath, 'No data');

                // Writing the marker notes
                let saveMarkerNotesFilePath = saveDirectoryPath + '\\' + chosenProject + '-markerdata.txt';
                window.api.writeToFile(saveMarkerNotesFilePath, 'No data');

                // Copy song the song (if set to true)
                if (saveAudioFile) {
                    let filePathEnd = window.songFilePaths[0].split("\\").pop();
                    window.api.copySongFile(window.songFilePaths[0], saveDirectoryPath + '\\' + filePathEnd);
                }

            } catch (error) {
                console.error('Error in writing to file:\n', error);
                presentErrorDialog('Error in writing to file:\n' + error)
            }
            console.log('Song was saved, no data was saved')
            presentErrorDialog('Song was saved, no data was saved')
        }
    } else {
        console.log('No data was saved (2)')
        presentErrorDialog('No data was saved (2)')
    }

    // Implement Saving of the song file
}

async function selectDeleteProject() {

    // scan the directory
    let chosenProject = ''
    let vbox = htmlElements.deleteFiles;
    while (vbox.firstChild) {
        vbox.removeChild(vbox.firstChild);
    }
    window.api.getDirectoryContents(workspace).then((files) => {
        if (files.length != 0) {
        // Implement selecting the project
        //placeholders

            files.forEach(file => {

                // Create a button for each existing project
                let newButton = document.createElement('button');
                newButton.class='btn';
                newButton.textContent = file
                newButton.addEventListener('click', async () => {
                    chosenProject = file
                    console.log(chosenProject);
                    htmlElements.deleteMenuDialog.close();
                    openAreYouSureDialog(chosenProject)
                })
                vbox.appendChild(newButton);
            });
        }

        //Show the dialog
        htmlElements.deleteMenuDialog.showModal();

    }).catch((error) => {
        // Throw error if there is an issue getting the files within the directory
        console.error('Issue getting the files within the directory:\n' + error);
        presentErrorDialog('Issue getting the files within the directory:\n' + error);
    });

}

// asks the user if they are sure they want to delete
async function openAreYouSureDialog(chosenProject) {
    let header = htmlElements.areYouSureHeader;
    header.innerHTML = 'Are you sure you want to delete \"' + chosenProject + '\"?'
    let hbox = htmlElements.yesOrNo;
    // remove all existing buttons
    while (hbox.firstChild) {
        hbox.removeChild(hbox.firstChild);
    }

    // Create a button for yes
    let yesButton = document.createElement('button');
    yesButton.class='btn';
    yesButton.textContent = 'yes'
    yesButton.addEventListener('click', async () => {
        htmlElements.areYouSureDialog.close();
        deleteTheProject(chosenProject)
    })

    // Create a button for no
    let noButton = document.createElement('button');
    noButton.class='btn';
    noButton.textContent = 'no'
    noButton.addEventListener('click', async () => {
        htmlElements.areYouSureDialog.close();
    })

    // append the buttons
    hbox.appendChild(yesButton);
    hbox.appendChild(noButton);
    htmlElements.areYouSureDialog.showModal();
}

// deletes the project
async function deleteTheProject(chosenProject) {
    console.log('Deleted: ' + chosenProject)

    let projectPath = workspace + '\\' + chosenProject;

    await window.api.wipeDir(projectPath).then((result) => {
        console.log('projectWiped')
    }).catch((error) => {
        // Throw error if there is an issue getting the files within the directory
        console.error('Issue wiping directory:\n' + error);
        presentErrorDialog('Issue wiping directory:\n' + error);
    });

//    let deleteFilePromises = []
//
//    // Gets the files
//    await window.api.getDirectoryContents(projectPath).then((files) => {
//        // deletes each file
//        for (let i = 0; i < files.length; i++) {
//            let projectFilePath = projectPath + '\\' + files[i]
//            let deletePromise = window.api.deleteFile(projectFilePath);
//            deleteFilePromises.push(deletePromise)
//        }
//    }).catch((err) => {
//        console.error('Issue get directory contents: ' + err);
//        presentErrorDialog('Issue get directory contents: ' + err);
//    })
//
//
//    Promise.allSettled(deleteFilePromises).then((result) => {
//        console.log('Deleted files')
//
//        // deletes the directory
//        window.api.deleteDir(projectPath).then((result) => {
//            console.log(chosenProject + ' deleted')
//        }).catch((err) => {
//            console.error('error deleting directory: ' + chosenProject)
//            presentErrorDialog('error deleting directory: ' + chosenProject)
//        });
//    }).catch((err) => {
//        console.error('error deleting files')
//        presentErrorDialog('error deleting file')
//    });

}

// Helper Functions

// parses the segment data
async function parseSegmentDataFile(segmentDataFilePath) {
    let rows = [];
    let result = await window.api.getFile(segmentDataFilePath);

    console.log(result);

    if (result.content !== 'No data') {
        let rowsText = result.content.trim().split('\n');
        rowsText.forEach(textRow => {
            console.log(textRow);
            let textTuple = textRow.split(',')
            let obj = {
                number: parseInt(textTuple[0]),
                start: parseFloat(textTuple[1]),
                end: parseFloat(textTuple[2]),
                label: parseInt(textTuple[3]),
                annotation: textTuple[4]
            };
            rows.push(obj);
        })
        console.log(rows)
    }
    return rows;
}

// parses marker notes data
async function parseMarkerDataFile(markerDataFilePath) {
    let markerNotes = new Map();
    let result = await window.api.getFile(markerDataFilePath);

    console.log(result);

    if (result.content !== 'No data') {

        let rowsText = result.content.trim().split('\n');
        rowsText.forEach(textRow => {
            let textTuple = textRow.split(',')
            markerNotes.set(parseFloat(textTuple[0]), {start: parseFloat(textTuple[0]), title: textTuple[1], note: textTuple[2]});
        })
        console.log(markerNotes)
    }
    return markerNotes;
}

// parses the metadata
async function parseMetadataFile(metadataFilePath) {
    let rows = []
    let result = await window.api.getFile(metadataFilePath);

    if (result.content !== 'No data') {
        rows = result.content.trim().split('\n');
    }

    return rows;
}

function createSegmentDataFileText(waveformNum) {
    let text = '';
    window.segmentData[waveformNum].forEach(segment => {
        text = text + segment.number + ',' + segment.start + ',' + segment.end + ',' + segment.label + ',' + segment.annotation + '\n'
    });
    window.segmentData[waveformNum]
    return text;
}

function createMetadataFileText() {
    return window.songFilePath;
}

function createMarkerNotesFileText(waveformNum) {
    let text = '';
    globalState.markerNotes[waveformNum].forEach(marker => {
        text = text + marker.start + ',' + marker.title + ',' + marker.note +'\n';
    });
    return text;
}

function calculateExportStats(waveformNum) {

    // Song Name
    let songName = window.songFilePaths[waveformNum].split('\\').pop()
    songName = songName.substring(0, songName.length-4)

    // Song Length + start and end
    let segmentData = window.segmentData[waveformNum]
    let songStart = segmentData[0].start
    let songEnd = segmentData[segmentData.length-1].end
    let songLength = songEnd - songStart

    // Number of boundaries
    let segmentCount = segmentData.length

    // Average Segment Length
    let avgSegmentLength = songLength/segmentCount


    //Labels ?

    return [songName, songLength, songStart, songEnd, segmentCount, avgSegmentLength]
}

function createExportFileText(exportStats, waveformNum) {
    let text = 'Song Name,' + exportStats[0] + '\n';
    text = text + 'Song Length,' + exportStats[1] + '\n';
    text = text + 'Song Start,' + exportStats[2] + '\n';
    text = text + 'Song End,' + exportStats[3] + '\n';
    text = text + 'Segment Count,' + exportStats[4] + '\n';
    text = text + 'Average Segment Length,' + exportStats[5] + '\n';
    text = text + '\nSegment Number,Start,End,Label Number\n'+ createSegmentDataFileText(waveformNum);
    return text;
}

//function moveSongFile(currentFilePath, newPath){
//    fs.rename(currentFilePath, newPath, (err) => {
//        if (err) {
//            console.error("Error moving file:", err);
//        } else {
//            console.log('File moved successfully from ' + currentFilePath + ' to ' + newPath);
//        }
//    });
//}
