const { contextBridge, ipcRenderer } = require('electron');

window.addEventListener('DOMContentLoaded', () => {
    const replaceText = (selector, text) => {
        const element = document.getElementById(selector)
        if (element) element.innerText = text
    }

    for (const type of ['chrome', 'node', 'electron']) {
        replaceText(`${type}-version`, process.versions[type])
    }
})

contextBridge.exposeInMainWorld('api', {
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  getAppData: () => ipcRenderer.invoke('get-appdata'),
  createDirectory: (dirPath) => ipcRenderer.invoke('create-directory', dirPath),
  getDirectoryContents: (dirPath) => ipcRenderer.invoke('get-directory-contents', dirPath)
});


