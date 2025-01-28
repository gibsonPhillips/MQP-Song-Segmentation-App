// const { app, BrowserWindow } = require('electron/main')
const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('node:path');
const { spawn, exec } = require('child_process');

let pythonProcess

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