import htmlElements from './globalData.js';
import globalState from './globalData.js';

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


// Button Clicks


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
    // Implement
});

// when save is clicked
htmlElements.saveButton.addEventListener('click', async () => {
    console.log(window.filePath)

    if (window.filePath != '' && window.filePath != null) {
        let filePathEnd = window.filePath.split("\\").pop();
        filePathEnd = filePathEnd.substring(0,filePathEnd.length-4);
        console.log(filePathEnd)
        selectSaveProject();

    } else {
        console.log('No audio selected')
        presentErrorDialog('No audio selected')
    }
});


// Functionality functions



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
                console.error(error);
                presentErrorDialog('Issue creating directory:\n' + error);

            });
            saveTheData(chosenProject)
        })

        hbox.appendChild(newInput);
        hbox.appendChild(newButton);

        vbox.appendChild(hbox);

        //Show the dialog
        htmlElements.saveMenuDialog.showModal();
    }).catch((error) => {
        // Throw error if there is an issue getting the files within the directory
        console.error(error);
        presentErrorDialog('Issue getting the files within the directory:\n' + error);
    });
}

//save the project data
function saveTheData(chosenProject) {
    if (chosenProject != '') {
        let saveDirectoryPath = workspace + "\\" + chosenProject
        console.log('saveDirectoryPath: ' + saveDirectoryPath);
        let data = "hello world!"
        if (data != null) {

            try {
                // Writing the save data to the file
                let saveDataFilePath = saveDirectoryPath + '\\' + chosenProject + '-data.txt';
                const result = window.api.writeToFile(saveDataFilePath, window.segmentData);

            } catch (error) {
                console.error('Error in writing to file:\n', error);
                presentErrorDialog('Error in writing to file:\n' + error)
            }

        } else {
            console.log('No data was saved')
            presentErrorDialog('No data was saved')
        }
    } else {
        console.log('No data was saved (2)')
        presentErrorDialog('No data was saved (2)')
    }

    // Implement Saving of the song file
}

function presentErrorDialog(message) {
    htmlElements.errorDialogMessage.textContent = message;
    htmlElements.errorDialog.showModal();
}