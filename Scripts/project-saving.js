let workspace = ''

function getWorkspace() {
    window.api.getAppData().then((appdata) => {
        console.log(appdata);
        setWorkspace(appdata + '\\Song Segmentation')
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
    return workspace
}

function setWorkspace(path) {
    workspace = path
}