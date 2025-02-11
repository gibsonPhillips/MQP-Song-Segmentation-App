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
    });
}).catch((error) => {
    // Throw error if there is an issue getting the appdata environment variable
    console.error(error);
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
                console.log(file)
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
        newButton.textContent = 'Create New Project'
        let newInput = document.createElement('input');
        newInput.textContent = 'New Project'
        newButton.addEventListener('click', async () => {
            // Place holder for new project textbox
            chosenProject = newInput.value
            console.log(chosenProject);
            htmlElements.saveMenuDialog.close();
            window.api.createDirectory(workspace + '\\' + chosenProject).then((result) => {
               console.log('Directory creation handled successfully.');
            }).catch((error) => {
                // Throw error if there is an issue creating the directory
                console.error(error);
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
    });
}

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
