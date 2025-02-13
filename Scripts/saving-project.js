import htmlElements from './globalData.js';
import globalState from './globalData.js';
import { loadSong, presentErrorDialog } from './globalData.js';

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
    console.log('not implemented')
    presentErrorDialog('not implemented')

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
                vbox.appendChild(newButton);
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
    console.log(window.songFilePath)

    if (window.songFilePath != '' && window.songFilePath != null) {
//        let filePathEnd = window.songFilePath.split("\\").pop();
//        filePathEnd = filePathEnd.substring(0,filePathEnd.length-4);
//        console.log(filePathEnd)
        selectSaveProject();

    } else {
        console.log('No audio selected')
        presentErrorDialog('No audio selected')
    }
});


// Functionality functions

// loads the data
async function loadTheData(chosenProject) {
    console.log('No data loaded, not implemented');
    presentErrorDialog('No data loaded from ' + chosenProject + ', not implemented');

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

    loadSong(loadSongFilePath);
}


// Queues the pop-up to save the project
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
                    console.log(chosenProject);
                    htmlElements.saveMenuDialog.close();
                    saveTheData(chosenProject)
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
            console.log(chosenProject);
            htmlElements.saveMenuDialog.close();

            await window.api.createDirectory(workspace + '\\' + chosenProject).then((result) => {
                console.log('Directory creation handled successfully.');
                saveTheData(chosenProject)
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
function saveTheData(chosenProject) {

    if (chosenProject != '') {

        let saveDirectoryPath = workspace + "\\" + chosenProject
        console.log('saveDirectoryPath: ' + saveDirectoryPath);

        // console.log(window.segmentData)
        if (window.segmentData != null && window.segmentData.length != 0) {

            try {

                // Writing the segment data to the file
                let saveSegmentDataFilePath = saveDirectoryPath + '\\' + chosenProject + '-segmentdata.txt';
                let segmentDataText = createSegmentDataFileText();
                window.api.writeToFile(saveSegmentDataFilePath, segmentDataText);

                // Writing the metadata to the file
                let saveMetadataFilePath = saveDirectoryPath + '\\' + chosenProject + '-metadata.txt';
                let metadataText = createMetadataFileText();
                window.api.writeToFile(saveMetadataFilePath, metadataText);

                let filePathEnd = window.songFilePath.split("\\").pop();
                window.api.moveSongFile(window.songFilePath, saveDirectoryPath + '\\' + filePathEnd);

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

                let filePathEnd = window.songFilePath.split("\\").pop();
                window.api.moveSongFile(window.songFilePath, saveDirectoryPath + '\\' + filePathEnd);

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

// Helper Functions

function createSegmentDataFileText() {
    let text = '';
    window.segmentData.forEach(segment => {
        text = text + segment.number + ',' + segment.start + ',' + segment.end + ',' + segment.label + '\n'
    });
    window.segmentData
    return text;
}

function createMetadataFileText() {
    return 'Metadata';
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
