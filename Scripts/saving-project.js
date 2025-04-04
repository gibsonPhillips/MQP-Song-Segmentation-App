import htmlElements from './globalData.js';
import { updateTrackName, globalState, loadSong, presentErrorDialog, updateSegmentElementsList, setExternalSaveTrack, setExternalExportData, setExternalLoadColorPreferences, updateTrackColors } from './globalData.js';
import { setExternalSaveColorPreferences, setExternalLoadColorPreferences2 } from './buttons.js';

// Sort out the save file system
let workspace = ''
let tracksWorkspace = ''
let projectsWorkspace = ''

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

    console.log(workspace);
    tracksWorkspace = workspace + '\\tracks'
    console.log(tracksWorkspace)

    // Create the tracks directory if it doesnt already exist
    window.api.createDirectory(tracksWorkspace).then((result) => {

        console.log('Directory handled successfully.');

    }).catch((error) => {
        // Throw error if there is an issue creating the directory
        console.error(error);
        presentErrorDialog("Issue creating the directory:\n" + error);
    });

    projectsWorkspace = workspace + '\\projects'
    console.log(projectsWorkspace)

    // Create the projects directory if it doesnt already exist
    window.api.createDirectory(projectsWorkspace).then((result) => {

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

// when load track is clicked
htmlElements.loadTrackButton.addEventListener('click', async () => {

    // scan the directory
    let chosenTrack = ''
    let vbox = htmlElements.loadTrackFiles;
    while (vbox.firstChild) {
        vbox.removeChild(vbox.firstChild);
    }
    window.api.getDirectoryContents(tracksWorkspace).then((files) => {
        if (files.length != 0) {

            files.forEach(file => {
                // Create a button for each existing track
                let newButton = document.createElement('button');
                newButton.className='btn';
                newButton.textContent = file
                newButton.addEventListener('click', async () => {
                    chosenTrack = file
                    console.log(chosenTrack);
                    htmlElements.loadTrackMenuDialog.close();
                    let trackPath = tracksWorkspace + '\\' + chosenTrack;
                    loadOneTrackData(trackPath, chosenTrack);
                })
                vbox.appendChild(newButton)
            });
        }

        //Show the dialog
        htmlElements.loadTrackMenuDialog.showModal();

    }).catch((error) => {
        // Throw error if there is an issue getting the files within the directory
        console.error('Issue getting the files within the directory:\n' + error);
        presentErrorDialog('Issue getting the files within the directory:\n' + error);
    });
});

//// when save track is clicked
//htmlElements.saveTrackButton.addEventListener('click', async () => {
//    saveTrack(0)
//});

setExternalSaveTrack(saveTrack);
// Saves the track
function saveTrack(waveformNum) {
    console.log(window.songFilePaths[waveformNum])

    if (window.songFilePaths[waveformNum] != '' && window.songFilePaths[waveformNum] != null) {
//        let filePathEnd = window.songFilePath.split("\\").pop();
//        filePathEnd = filePathEnd.substring(0,filePathEnd.length-4);
//        console.log(filePathEnd)
        selectSaveTrack(waveformNum);

    } else {
        console.log('No audio selected')
        presentErrorDialog('No audio selected')
    }
}

// when delete is clicked
htmlElements.deleteTrackButton.addEventListener('click', async () => {
    selectDeleteTrack();
});

//htmlElements.exportButton.addEventListener('click', async () => {
//    exportData(0);
//});

setExternalExportData(exportData);
// exports the data
async function exportData(waveformNum) {
    let exportStats = calculateExportStats(waveformNum)
    let fileText = createExportFileText(exportStats, waveformNum)
    console.log(fileText)
    const filePath = await window.api.saveFile();
    if (filePath) {
        window.api.writeToFile(filePath, fileText).then((result) => {
            console.log('saved successfully')
        }).catch((err) => {
            console.error(err)
        });
    } else {
        console.log('unable to save')
    }
}


// Functionality function
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


// Queues the pop-up dialog to save the track
async function selectSaveTrack(waveformNum) {
    // Get the save track files
    let chosenTrack = ''
    window.currentWaveformNum = waveformNum;
    let vbox = htmlElements.saveTrackFiles;
    while (vbox.firstChild) {
        vbox.removeChild(vbox.firstChild);
    }

    //Set the default value for the input at the top
    htmlElements.saveTrackInput.value = window.trackNames[waveformNum];

    //create the header for the pre-existing tracks
    let vboxHeader = document.createElement('h1');
    vboxHeader.textContent = 'Replace Existing Track';
    vbox.appendChild(vboxHeader);
    
    window.api.getDirectoryContents(tracksWorkspace).then((files) => {
        if (files.length != 0) {
        // Implement selecting the track
        //placeholders

            files.forEach(file => {

                // Create a button for each existing track
                let newButton = document.createElement('button');
                newButton.className='btn';
                newButton.textContent = file
                newButton.addEventListener('click', async () => {
                    chosenTrack = file
                    htmlElements.saveTrackMenuDialog.close();
                    saveTrackData(chosenTrack, waveformNum, htmlElements.saveTrackAudioCheckbox.checked) // CHANGE WAVEFORM NUM
                })
                vbox.appendChild(newButton);
            });
        }

        //Show the dialog
        htmlElements.saveTrackMenuDialog.showModal();
    }).catch((error) => {
        // Throw error if there is an issue getting the files within the directory
        console.error('Issue getting the files within the directory:\n' + error);
        presentErrorDialog('Issue getting the files within the directory:\n' + error);
    });
}

htmlElements.createNewTrackButton.addEventListener('click', async () => {
    let chosenTrack = htmlElements.saveTrackInput.value;
    htmlElements.saveTrackMenuDialog.close();
    saveTrackData(chosenTrack, window.currentWaveformNum, htmlElements.saveTrackAudioCheckbox.checked);
})

//save the track data
async function saveTrackData(chosenTrack, waveformNum, saveTrackAudioFile) {

    if (chosenTrack != '') {
        let saveTrackDirectoryPath = tracksWorkspace + "\\" + chosenTrack
        console.log('saveTrackDirectoryPath: ' + saveTrackDirectoryPath);
        
        saveOneTrackData(saveTrackDirectoryPath, chosenTrack, waveformNum, saveTrackAudioFile);

    } else {
        console.log('No data was saved (2)')
        presentErrorDialog('No data was saved (2)')
    }

    // Implement Saving of the song file
}

async function selectDeleteTrack() {

    // scan the directory
    let chosenTrack = ''
    let vbox = htmlElements.deleteTrackFiles;
    while (vbox.firstChild) {
        vbox.removeChild(vbox.firstChild);
    }
    await window.api.getDirectoryContents(tracksWorkspace).then((files) => {
        if (files.length != 0) {
        // Implement selecting the track
        //placeholders

            files.forEach(file => {

                // Create a button for each existing track
                let newButton = document.createElement('button');
                newButton.className='btn';
                newButton.textContent = file
                newButton.addEventListener('click', async () => {
                    chosenTrack = file
                    console.log(chosenTrack);
                    htmlElements.deleteTrackMenuDialog.close();
                    openAreYouSureDialog(chosenTrack)
                })
                vbox.appendChild(newButton);
            });
        }

        //Show the dialog
        htmlElements.deleteTrackMenuDialog.showModal();

    }).catch((error) => {
        // Throw error if there is an issue getting the files within the directory
        console.error('Issue getting the files within the directory:\n' + error);
        presentErrorDialog('Issue getting the files within the directory:\n' + error);
    });

}

// asks the user if they are sure they want to delete Track
async function openAreYouSureDialog(chosenTrack) {
    let header = htmlElements.areYouSureHeader;
    //header.innerHTML = 'Are you sure you want to delete \"' + chosenTrack + '\"?'
    let hbox = htmlElements.yesOrNo;
    // remove all existing buttons
    while (hbox.firstChild) {
        hbox.removeChild(hbox.firstChild);
    }

    // Create a button for yes
    let yesButton = document.createElement('button');
    yesButton.className='btn';
    yesButton.textContent = 'yes'
    yesButton.addEventListener('click', async () => {
        htmlElements.areYouSureDialog.close();
        let trackPath = tracksWorkspace + '\\' + chosenTrack;
        deleteTheTrack(trackPath)
    })

    // Create a button for no
    let noButton = document.createElement('button');
    noButton.className='btn';
    noButton.textContent = 'no'
    noButton.addEventListener('click', async () => {
        htmlElements.areYouSureDialog.close();
    })

    // append the buttons
    hbox.appendChild(yesButton);
    hbox.appendChild(noButton);
    htmlElements.areYouSureDialog.showModal();
}

// deletes the track
async function deleteTheTrack(trackPath) {
    try {
        let files = await window.api.getDirectoryContents(trackPath);

        for (const file of files) {
            await window.api.deleteFile(trackPath + '\\' + file);
            console.log("FILE WIPED");
        }

        await window.api.deleteDir(trackPath);
        console.log('TRACK WIPED');
    } catch (error) {
        console.error('Issue deleting files or directory:\n' + error);
        presentErrorDialog('Issue deleting files or directory:\n' + error);
    }

    console.log("DELETING TRACK END");

    // await window.api.wipeDir(trackPath).then((result) => {
    //     console.log('Track Wiped')
    // }).catch((error) => {
    //     // Throw error if there is an issue getting the files within the directory
    //     console.error('Issue wiping directory:\n' + error);
    //     presentErrorDialog('Issue wiping directory:\n' + error);
    // });

//    let deleteTrackFilePromises = []
//
//    // Gets the files
//    await window.api.getDirectoryContents(trackPath).then((files) => {
//        // deletes each file
//        for (let i = 0; i < files.length; i++) {
//            let trackFilePath = trackPath + '\\' + files[i]
//            let deletePromise = window.api.deleteFile(trackFilePath);
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
//        window.api.deleteDir(trackPath).then((result) => {
//            console.log(chosenTrack + ' deleted')
//        }).catch((err) => {
//            console.error('error deleting directory: ' + chosenTrack)
//            presentErrorDialog('error deleting directory: ' + chosenTrack)
//        });
//    }).catch((err) => {
//        console.error('error deleting files')
//        presentErrorDialog('error deleting file')
//    });

}



// Project Saving Functions

htmlElements.loadProjectButton.addEventListener('click', async () => {

    // scan the directory
    let chosenProject = ''
    let vbox = htmlElements.loadProjectFiles;
    while (vbox.firstChild) {
        vbox.removeChild(vbox.firstChild);
    }
    window.api.getDirectoryContents(projectsWorkspace).then((files) => {
        if (files.length != 0) {

            files.forEach(file => {
                // Create a button for each existing track
                let newButton = document.createElement('button');
                newButton.className='btn';
                newButton.textContent = file
                newButton.addEventListener('click', async () => {
                    chosenProject = file
                    console.log(chosenProject);
                    htmlElements.loadProjectMenuDialog.close();
                    loadTheProjectData(chosenProject)
                })
                vbox.appendChild(newButton)
            });
        }

        //Show the dialog
        htmlElements.loadProjectMenuDialog.showModal();

    }).catch((error) => {
        // Throw error if there is an issue getting the files within the directory
        console.error('Issue getting the files within the directory:\n' + error);
        presentErrorDialog('Issue getting the files within the directory:\n' + error);
    });
});

// Saves the track
htmlElements.saveProjectButton.addEventListener('click', async () => {
    selectSaveProject();
});

htmlElements.deleteProjectButton.addEventListener('click', async () => {

    // scan the directory
    let chosenProject = ''
    let vbox = htmlElements.deleteProjectFiles;
    while (vbox.firstChild) {
        vbox.removeChild(vbox.firstChild);
    }
    window.api.getDirectoryContents(projectsWorkspace).then((files) => {
        if (files.length != 0) {

            files.forEach(file => {
                // Create a button for each existing track
                let newButton = document.createElement('button');
                newButton.className='btn';
                newButton.textContent = file
                newButton.addEventListener('click', async () => {
                    chosenProject = file
                    console.log(chosenProject);
                    htmlElements.deleteProjectMenuDialog.close();
                    await deleteTheProjectData(chosenProject)
                })
                vbox.appendChild(newButton)
            });
        }

        //Show the dialog
        htmlElements.deleteProjectMenuDialog.showModal();

    }).catch((error) => {
        // Throw error if there is an issue getting the files within the directory
        console.error('Issue getting the files within the directory:\n' + error);
        presentErrorDialog('Issue getting the files within the directory:\n' + error);
    });
});

async function loadTheProjectData(chosenProject) {
    console.log('loading ' + chosenProject);
    let projectPath = projectsWorkspace + '\\' + chosenProject;
    await window.api.getDirectoryContents(projectPath).then((files) => {
        files.forEach(file => {
            let trackPath = projectPath + '\\' + file;
            loadOneTrackData(trackPath, file);
        });
    });
}

async function selectSaveProject() {
    // Get the save track files
    let chosenProject = ''
    let vbox = htmlElements.saveProjectFiles;
    while (vbox.firstChild) {
        vbox.removeChild(vbox.firstChild);
    }
    window.api.getDirectoryContents(projectsWorkspace).then((files) => {
        if (files.length != 0) {
        // Implement selecting the track
        //placeholders

            files.forEach(file => {

                // Create a button for each existing track
                let newButton = document.createElement('button');
                newButton.className='btn';
                newButton.textContent = file
                newButton.addEventListener('click', async () => {
                    chosenProject = file
                    htmlElements.saveProjectMenuDialog.close();
                    saveTheProjectData(chosenProject, htmlElements.saveProjectAudioCheckbox.checked) // CHANGE WAVEFORM NUM
                })
                vbox.appendChild(newButton);
            });
        }
        // New Track button
        let hbox = document.createElement('div');
        hbox.class = 'hbox';
        let newButton = document.createElement('button');
        newButton.className='btn';
        newButton.textContent = 'Create New Project'
        let newInput = document.createElement('input');
        newInput.value = 'New Project';
        newButton.addEventListener('click', async () => {
            // Place holder for new track textbox
            chosenProject = newInput.value
            htmlElements.saveProjectMenuDialog.close();

            await window.api.createDirectory(projectsWorkspace + '\\' + chosenProject).then((result) => {
                console.log('Directory creation handled successfully.');
                saveTheProjectData(chosenProject, htmlElements.saveProjectAudioCheckbox.checked) // CHANGE WAVEFORM NUM
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
        htmlElements.saveProjectMenuDialog.showModal();
    }).catch((error) => {
        // Throw error if there is an issue getting the files within the directory
        console.error('Issue getting the files within the directory:\n' + error);
        presentErrorDialog('Issue getting the files within the directory:\n' + error);
    });
}

async function saveTheProjectData(chosenProject, saveTrackAudioFile) {
    console.log('Chosen Project ' + chosenProject + ' ' + saveTrackAudioFile)
    let projectDirectory = projectsWorkspace + '\\' + chosenProject;
    
    globalState.waveformNums.forEach(waveformNum => {
        let trackName = window.trackNames[waveformNum];
        if (trackName != null) {
            let projectTrackDirectory = projectDirectory + '\\' + trackName
            window.api.createDirectory(projectTrackDirectory).then((result) => {
                console.log('Directory creation handled successfully.');
                saveOneTrackData(projectTrackDirectory, trackName, waveformNum, htmlElements.saveProjectAudioCheckbox.checked) // CHANGE WAVEFORM NUM
            }).catch((error) => {
                // Throw error if there is an issue creating the directory
                console.error('Issue creating directory:\n' + error);
                presentErrorDialog('Issue creating directory:\n' + error);

            });
        }
    });

}

async function deleteTheProjectData(chosenProject) {
    console.log('Not defined: Deleting ' + chosenProject);

    let projectPath = projectsWorkspace + '\\' + chosenProject;

    console.log("DELETING PROJECT BEGIN");

    try {
        let files = await window.api.getDirectoryContents(projectPath);

        for (const file of files) {
            await deleteTheTrack(projectPath + '\\' + file);
            console.log("FILE WIPED");
        }

        await window.api.deleteDir(projectPath);
        console.log('PROJECT WIPED');
    } catch (error) {
        console.error('Issue deleting files or directory:\n' + error);
        presentErrorDialog('Issue deleting files or directory:\n' + error);
    }

    console.log("DELETING PROJECT END");
}

// Helper Functions

// parses the segment data
async function parseSegmentDataFile(segmentDataFilePath) {
    let rows = [];
    let result = await window.api.getFile(segmentDataFilePath);

    if (result.content !== 'No data') {
        let rowsText = result.content.trim().split('\n');
        rowsText.forEach(textRow => {
            let textTuple = textRow.split(',')
            let obj = {
                number: parseInt(textTuple[0]),
                start: parseFloat(textTuple[1]),
                end: parseFloat(textTuple[2]),
                label: textTuple[3],
                annotation: textTuple[4]
            };
            rows.push(obj);
        })
    }
    return rows;
}

async function loadOneTrackData(trackDirectory, trackName) {
    // important file paths
    let loadTrackSongFilePath = '';
    let loadTrackMetadataFilePath = '';
    let loadTrackSegmentDataFilePath = '';
    let loadTrackMarkerNotesFilePath = '';
    let loadTrackColorDataFilePath = '';

    // look for the files
    await window.api.getDirectoryContents(trackDirectory).then((files) => {
        files.forEach(file => {
            if (file.substring(file.length-4,file.length) == '.wav') {
                loadTrackSongFilePath = trackDirectory + '\\' + file;
            } else if (file.substring(file.length-13,file.length) == '-metadata.txt') {
                loadTrackMetadataFilePath = trackDirectory + '\\' + file;
            } else if (file.substring(file.length-16,file.length) == '-segmentdata.txt') {
                loadTrackSegmentDataFilePath = trackDirectory + '\\' + file;
            } else if (file.substring(file.length-15,file.length) == '-markerdata.txt') {
                loadTrackMarkerNotesFilePath = trackDirectory + '\\' + file;
            } else if (file.substring(file.length-14,file.length) == '-colordata.txt') {
                loadTrackColorDataFilePath = trackDirectory + '\\' + file;
            }
        })
    })

    console.log('song: ' + loadTrackSongFilePath)
    console.log('metadata: ' + loadTrackMetadataFilePath)
    console.log('segment data: ' + loadTrackSegmentDataFilePath)
    console.log('marker data: ' + loadTrackMarkerNotesFilePath)
    console.log('color data: ' + loadTrackColorDataFilePath)

    // loads the track metadata

    let metadata = await parseMetadataFile(loadTrackMetadataFilePath)
    if (loadTrackSongFilePath == '') {
        loadTrackSongFilePath = metadata[0]; // song file path
    }

    // loads the song

    let waveformNum = await loadSong(loadTrackSongFilePath);
    window.songFilePaths[waveformNum] = loadTrackSongFilePath
    updateTrackName(trackName, waveformNum);

    // loads the track segment data
    window.segmentData[waveformNum] = await parseSegmentDataFile(loadTrackSegmentDataFilePath);

    // loads the track marker notes data
    globalState.markerNotes[waveformNum] = await parseMarkerDataFile(loadTrackMarkerNotesFilePath);

    // loads the track color data
    globalState.labelColors[waveformNum] = await parseColorDataFile(loadTrackColorDataFilePath);

    // updates track colors and runs update segment elements
    updateTrackColors(waveformNum);
}

// helper function to save individual track
function saveOneTrackData(directory, trackName, waveformNum, saveTrackAudioFile) {
    if (window.segmentData[waveformNum] != null && window.segmentData[waveformNum].length != 0) {

        try {

            // Writing the segment data to the file
            let saveTrackSegmentDataFilePath = directory + '\\' + trackName + '-segmentdata.txt';
            let segmentDataText = createSegmentDataFileText(waveformNum);
            window.api.writeToFile(saveTrackSegmentDataFilePath, segmentDataText);

            // Writing the metadata to the file
            let saveTrackMetadataFilePath = directory + '\\' + trackName + '-metadata.txt';
            let metadataText = createMetadataFileText(waveformNum);
            window.api.writeToFile(saveTrackMetadataFilePath, metadataText);

            // Writing the marker notes
            let saveTrackMarkerNotesFilePath = directory + '\\' + trackName + '-markerdata.txt';
            let markerNotesData = createMarkerNotesFileText(waveformNum);
            window.api.writeToFile(saveTrackMarkerNotesFilePath, markerNotesData);

            // Writing the color data
            let saveTrackColorDataFilePath = directory + '\\' + trackName + '-colordata.txt';
            let colorData = createColorDataFileText(waveformNum);
            window.api.writeToFile(saveTrackColorDataFilePath, colorData);

            // Copy song the song (if set to true)
            if (saveTrackAudioFile) {
                let filePathEnd = window.songFilePaths[waveformNum].split("\\").pop();
                window.api.copySongFile(window.songFilePaths[waveformNum], directory + '\\' + filePathEnd);
            }

            updateTrackName(trackName, waveformNum);

        } catch (error) {
            console.error('Error in writing to file:\n', error);
            presentErrorDialog('Error in writing to file:\n' + error)
        }

    } else {

        // Saves no data but saves the song
        try {

            // Writing the segment data to the file
            let saveTrackSegmentDataFilePath = directory + '\\' + trackName + '-segmentdata.txt';
            window.api.writeToFile(saveTrackSegmentDataFilePath, 'No data');

            // Writing the metadata to the file
            let saveTrackMetadataFilePath = directory + '\\' + trackName + '-metadata.txt';
            window.api.writeToFile(saveTrackMetadataFilePath, 'No data');

            // Writing the marker notes
            let saveTrackMarkerNotesFilePath = directory + '\\' + trackName + '-markerdata.txt';
            window.api.writeToFile(saveTrackMarkerNotesFilePath, 'No data');

            // Writing the color data
            let saveTrackColorDataFilePath = directory + '\\' + trackName + '-colordata.txt';
            window.api.writeToFile(saveTrackColorDataFilePath, 'No data');

            // Copy song the song (if set to true)
            if (saveTrackAudioFile) {
                let filePathEnd = window.songFilePaths[waveformNum].split("\\").pop();
                window.api.copySongFile(window.songFilePaths[waveformNum], directory + '\\' + filePathEnd);
            }

        } catch (error) {
            console.error('Error in writing to file:\n', error);
            presentErrorDialog('Error in writing to file:\n' + error)
        }
        console.log('Song was saved, no data was saved')
        presentErrorDialog('Song was saved, no data was saved')
    }








    if (window.segmentData[waveformNum] != null && window.segmentData[waveformNum].length != 0) {

        try {

            // Writing the segment data to the file
            let saveTrackSegmentDataFilePath = directory + '\\' + trackName + '-segmentdata.txt';
            let segmentDataText = createSegmentDataFileText(waveformNum);
            window.api.writeToFile(saveTrackSegmentDataFilePath, segmentDataText);

            // Writing the metadata to the file
            let saveTrackMetadataFilePath = directory + '\\' + trackName + '-metadata.txt';
            let metadataText = createMetadataFileText(waveformNum);
            window.api.writeToFile(saveTrackMetadataFilePath, metadataText);

            // Writing the marker notes
            let saveTrackMarkerNotesFilePath = directory + '\\' + trackName + '-markerdata.txt';
            let markerNotesData = createMarkerNotesFileText(waveformNum);
            window.api.writeToFile(saveTrackMarkerNotesFilePath, markerNotesData);

            // Copy song the song (if set to true)
            if (saveTrackAudioFile) {
                let filePathEnd = window.songFilePaths[waveformNum].split("\\").pop();
                window.api.copySongFile(window.songFilePaths[waveformNum], directory + '\\' + filePathEnd);
            }

            updateTrackName(trackName, waveformNum);

        } catch (error) {
            console.error('Error in writing to file:\n', error);
            presentErrorDialog('Error in writing to file:\n' + error)
        }

    } else {

        // Saves no data but saves the song
        try {

            // Writing the segment data to the file
            let saveTrackSegmentDataFilePath = directory + '\\' + trackName + '-segmentdata.txt';
            window.api.writeToFile(saveTrackSegmentDataFilePath, 'No data');

            // Writing the metadata to the file
            let saveTrackMetadataFilePath = directory + '\\' + trackName + '-metadata.txt';
            window.api.writeToFile(saveTrackMetadataFilePath, 'No data');

            // Writing the marker notes
            let saveTrackMarkerNotesFilePath = directory + '\\' + trackName + '-markerdata.txt';
            window.api.writeToFile(saveTrackMarkerNotesFilePath, 'No data');

            // Copy song the song (if set to true)
            if (saveTrackAudioFile) {
                let filePathEnd = window.songFilePaths[waveformNum].split("\\").pop();
                window.api.copySongFile(window.songFilePaths[waveformNum], directory + '\\' + filePathEnd);
            }

            updateTrackName(trackName, waveformNum);

        } catch (error) {
            console.error('Error in writing to file:\n', error);
            presentErrorDialog('Error in writing to file:\n' + error)
        }
        console.log('Song was saved, no data was saved')
        presentErrorDialog('Song was saved, no data was saved')
    }
}

// parses marker notes data
async function parseMarkerDataFile(markerDataFilePath) {
    let markerNotes = new Map();
    let result = await window.api.getFile(markerDataFilePath);

    if (result.content !== 'No data') {

        let rowsText = result.content.trim().split('\n');
        rowsText.forEach(textRow => {
            let textTuple = textRow.split(',')
            markerNotes.set(parseFloat(textTuple[0]), {start: parseFloat(textTuple[0]), title: textTuple[1], note: textTuple[2]});
        })
    }
    return markerNotes;
}

// parses color data
async function parseColorDataFile(colorDataFilePath) {
    let colorData = new Map();
    let result = await window.api.getFile(colorDataFilePath);

    if (result.content !== 'No data') {

        let rowsText = result.content.trim().split('\n');
        rowsText.forEach(textRow => {
            let textTuple = textRow.split(';')
            colorData.set(String(textTuple[0]), {label: String(textTuple[0]), color: String(textTuple[1])});
        })
    }
    return colorData;
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

function createMetadataFileText(waveformNum) {
    return window.songFilePaths[waveformNum];
}

function createMarkerNotesFileText(waveformNum) {
    let text = '';
    globalState.markerNotes[waveformNum].forEach(marker => {
        text = text + marker.start + ',' + marker.title + ',' + marker.note +'\n';
    });
    return text;
}

function createColorDataFileText(waveformNum) {
    let text = '';
    globalState.labelColors[waveformNum].forEach(color => {
        text = text + color.label + ';' + color.color +'\n';
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


// loads the color preferences
setExternalLoadColorPreferences(loadColorPreferences);
setExternalLoadColorPreferences2(loadColorPreferences);
async function loadColorPreferences() {
    // important file paths
    let loadColorPreferencesFilePath = '';

    // look for color preference file
    await window.api.getDirectoryContents(workspace).then((files) => {
        files.forEach(file => {
            if (file.substring(file.length-20,file.length) == 'colorPreferences.txt') {
                loadColorPreferencesFilePath = workspace + '\\' + file;
            }
        });
    });

    // If file doesn't already exist
    if(loadColorPreferencesFilePath === '') {
        loadColorPreferencesFilePath = workspace + '\\' + 'colorPreferences.txt';
        let colorPreferencesText = '';
        await window.api.writeToFile(loadColorPreferencesFilePath, colorPreferencesText);
    }

    console.log('color preferences: ' + loadColorPreferencesFilePath)

    // loads the color preferences
    globalState.colorLegendMap = await parseColorPreferencesFile(loadColorPreferencesFilePath)
}

//save the color preferences
setExternalSaveColorPreferences(saveColorPreferences);
async function saveColorPreferences() {
    console.log('saveDirectoryPath: ' + workspace);

    // Writing the segment data to the file
    let colorPreferencesFilePath = workspace + '\\' + 'colorPreferences.txt';
    let colorPreferencesText = createColorPreferencesFileText();
    window.api.writeToFile(colorPreferencesFilePath, colorPreferencesText);
}

// creates file for color preferences
function createColorPreferencesFileText() {
    let text = '';
    globalState.colorLegendMap.forEach(color => {
        text = text + color.label + ';' + color.color + '\n'
    });
    return text;
}

// parses color data
async function parseColorPreferencesFile(colorPreferencesFilePath) {
    let colorPreferences = new Map();
    let result = await window.api.getFile(colorPreferencesFilePath);

    if (result.content !== 'No data') {
        let rowsText = result.content.trim().split('\n');
        rowsText.forEach(textRow => {
            let textTuple = textRow.split(';')
            colorPreferences.set(textTuple[0], {label: textTuple[0], color: textTuple[1]});
        })
    }
    return colorPreferences;
}