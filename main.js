// const { app, BrowserWindow } = require('electron/main')
const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron')
const path = require('node:path');
const { spawn, exec } = require('child_process');
const fs = require('fs');

let pythonProcess
let filePath = '';

// Gets appdata environment variable
ipcMain.handle('get-appdata', () => {
    // Access APPDATA environment variable
    return process.env.APPDATA;
});

// Gets the directory contents
ipcMain.handle('get-directory-contents', async (event, dirPath) => {
    try {
        const files = await fs.promises.readdir(dirPath);
        return files;
    } catch (error) {
        throw new Error('Unable to read directory: ' + error.message);
    }
});

ipcMain.handle('create-directory', async (event, dirPath) => {
    try {
        // Check if the directory exists
        const directoryExists = await fs.promises.access(dirPath, fs.constants.F_OK)
        .then(() => true) // Directory exists
        .catch(() => false); // Directory doesn't exist

        if (!directoryExists) {
            // Create the directory if it doesn't exist
            await fs.promises.mkdir(dirPath, { recursive: true }); // `recursive: true` ensures parent dirs are also created if needed
            console.log(`Directory created at: ${dirPath}`);
        } else {
            console.log(`Directory already exists: ${dirPath}`);
        }
    } catch (error) {
        console.error('Error creating directory:', error);
        throw error
    }
});

// Open the directory in the file explorer (Windows Explorer, Finder, etc.)
ipcMain.handle('open-directory', async (event, dirPath) => {
  try {
    await shell.openPath(dirPath); // This will open the directory in the default file explorer
    return { success: true };
  } catch (error) {
    console.error('Error opening directory:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-file', async (event, filePath) => {
  try {
    const fileContents = await fs.promises.readFile(filePath, 'utf-8');
    return { success: true, content: fileContents }; // Return the file content
  } catch (error) {
    console.error('Error reading file:', error);
    return { success: false, error: error.message }; // Return error message if something goes wrong
  }
});

ipcMain.handle('write-to-file', async (event, filePath, data) => {
  try {
    // Open the file (will create it if it doesn't exist, 'wx' flag will fail if it exists)
    const fileHandle = await fs.promises.open(filePath, 'w'); // 'w' flag means "write", creates the file if not exists
    await fileHandle.writeFile(data, 'utf-8'); // Write the data to the file
    await fileHandle.close(); // Close the file after writing
    console.log(`File created or written to: ${filePath}`);
    return { success: true }; // Return success
  } catch (error) {
    console.error('Error creating or writing to file:', error);
    return { success: false, error: error.message }; // Return error if something goes wrong
  }
});


// Function to start the Python server
function startPythonServer() {
    if (pythonProcess) {
        console.log("Python server is already running.");
        return;
    }
    pythonProcess = spawn('python', ['pythonServer.py'], { shell: true });

    pythonProcess.stdout.on('data', (data) => {
        console.log(`Python stdout: ${data}`);
    });

    pythonProcess.stderr.on('data', (data) => {
        console.error(`Python stderr: ${data}`);
    });

    pythonProcess.on('close', (code) => {
        console.log(`Python process exited with code ${code}`);
        pythonProcess = null;
        restartPythonServer();
    });

    pythonProcess.on('error', (error) => {
        console.error(`Failed to start Python server: ${error.message}`);
        pythonProcess = null;
        restartPythonServer();
    });
}

// Function to stop the Python server
async function stopPythonServer() {
    if (pythonProcess) {
        try {
            console.log("Shut down begin");
    
            // Send a POST request to the Python server to shutdown
            const response = await fetch('http://127.0.0.1:5000/shutdown', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ success: true }),
            });
        } catch (error) {
            console.error('Error:', error);
        }
        pythonProcess = null;
    } else {
        console.log("No Python server is running.");
    }
}

// Function to restart the Python server with a delay
function restartPythonServer() {
    console.log("Attempting to restart Python server in 5 seconds...");
    setTimeout(() => {
        startPythonServer();
    }, 5000);
}

function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: true,
            enableRemoteModule: true
        }
    })

    startPythonServer()

    win.loadFile('index.html')
}

app.whenReady().then(() => {
    createWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })

    ipcMain.handle('dialog:openFile', async () => {
        const result = await dialog.showOpenDialog({
          properties: ['openFile'] // Add 'multiSelections' if needed
        });
        return result.filePaths; // Return file paths to renderer
      });
})

app.on('will-quit', () => {
    stopPythonServer();
});