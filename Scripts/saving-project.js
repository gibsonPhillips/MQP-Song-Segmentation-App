import htmlElements from './globalData.js';
import globalState from './globalData.js';
import { loadSong, presentErrorDialog, updateSegmentElementsList, getNextWaveform } from './globalData.js';

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
                    deleteTheProject(chosenProject)
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

});


// Functionality functions

// loads the data
async function loadTheData(chosenProject) {

    let waveformNum = getNextWaveform();

    // the path to the project directory
    let projectPath = workspace + '\\' + chosenProject;

    // important file paths
    let loadSongFilePath = '';
    let loadMetadataFilePath = '';
    let loadSegmentDataFilePath = '';

    // look for the files
    await window.api.getDirectoryContents(projectPath).then((files) => {
        files.forEach(file => {
            if (file.substring(file.length-4,file.length) == '.wav') {
                loadSongFilePath = projectPath + '\\' + file;
            } else if (file.substring(file.length-13,file.length) == '-metadata.txt') {
                loadMetadataFilePath = projectPath + '\\' + file;
            } else if (file.substring(file.length-16,file.length) == '-segmentdata.txt') {
                loadSegmentDataFilePath = projectPath + '\\' + file;
            }
        })
    })

    console.log('song: ' + loadSongFilePath)
    console.log('metadata: ' + loadMetadataFilePath)
    console.log('segment data: ' + loadSegmentDataFilePath)

    // loads the metadata

    let metadata = await parseMetadataFile(loadMetadataFilePath)
    if (loadSongFilePath == '') {
        loadSongFilePath = metadata[0]; // song file path
    }

    // loads the song

    await loadSong(loadSongFilePath);
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
                let segmentDataText = createSegmentDataFileText();
                window.api.writeToFile(saveSegmentDataFilePath, segmentDataText);

                // Writing the metadata to the file
                let saveMetadataFilePath = saveDirectoryPath + '\\' + chosenProject + '-metadata.txt';
                let metadataText = createMetadataFileText();
                window.api.writeToFile(saveMetadataFilePath, metadataText);

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

// deletes the project
async function deleteTheProject(chosenProject) {
    console.log('Deleted: ' + chosenProject)
    presentErrorDialog('Deleted: ' + chosenProject)

    let projectPath = workspace + '\\' + chosenProject;

    await window.api.getDirectoryContents(projectPath).then((files) => {
        if (files.length != 0) {
            files.forEach(file => {
                let projectFilePath = projectPath + '\\' + file
                window.api.deleteFile(projectFilePath).then((result) => {
                    console.log(projectFilePath + ' deleted')
                }).catch((err) => {
                    console.error('error deleting file: ' + projectFilePath)
                    presentErrorDialog('error deleting file: ' + projectFilePath)
                });
            });
        }
    }).catch((err) => {
        console.error('Issue get directory contents: ' + err);
        presentErrorDialog('Issue get directory contents: ' + err);
    })
    await window.api.deleteDir(projectPath).then((result) => {
        console.log(chosenProject + ' deleted')
    }).catch((err) => {
        console.error('error deleting directory: ' + chosenProject)
        presentErrorDialog('error deleting directory: ' + chosenProject)
    });
}

// Helper Functions

// parses the segment data
async function parseSegmentDataFile(segmentDataFilePath) {
    let rows = [];
    let result = await window.api.getFile(segmentDataFilePath);

    console.log(result);

    if (result.content !== 'No data') {
        let rowsText = result.content.trim().split('\n');
        rowsText.pop()
        rowsText.forEach(textRow => {
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

// parses the metadata
async function parseMetadataFile(metadataFilePath) {
    let rows = []
    let result = await window.api.getFile(metadataFilePath);

    if (result.content !== 'No data') {
        rows = result.content.trim().split('\n');
    }

    return rows;
}

function createSegmentDataFileText() {
    let text = '';
    window.segmentData[0].forEach(segment => {
        text = text + segment.number + ',' + segment.start + ',' + segment.end + ',' + segment.label + ',' + segment.annotation + '\n'
    });
    window.segmentData[0]
    return text;
}

function createMetadataFileText() {
    return window.songFilePath;
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
