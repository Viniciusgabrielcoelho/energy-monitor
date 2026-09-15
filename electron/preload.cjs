const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('energyAPI', {
  getSnapshot: () => ipcRenderer.invoke('energy:get-snapshot'),
  setSpeed: (ms) => ipcRenderer.invoke('energy:set-speed', ms),
  setSource: (s) => ipcRenderer.invoke('energy:set-source', s),
  onSample: (callback) => {
    const listener = (_evt, sample) => callback(sample)
    ipcRenderer.on('energy:sample', listener)
    return () => ipcRenderer.removeListener('energy:sample', listener)
  },
})