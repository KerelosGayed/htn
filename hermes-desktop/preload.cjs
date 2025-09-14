const { contextBridge, ipcRenderer } = require('electron');

// Safe, minimal API surface for frontend
contextBridge.exposeInMainWorld('hermes', {
  ping: () => 'pong',
  steamlinkLaunch: () => ipcRenderer.invoke('hermes:steamlink:launch'),
  volume: {
    get: () => ipcRenderer.invoke('hermes:volume:get'),
    set: (pct) => ipcRenderer.invoke('hermes:volume:set', pct),
    inc: (step = 5) => ipcRenderer.invoke('hermes:volume:inc', step),
    dec: (step = 5) => ipcRenderer.invoke('hermes:volume:dec', step),
    mute: () => ipcRenderer.invoke('hermes:volume:mute'),
    unmute: () => ipcRenderer.invoke('hermes:volume:unmute'),
  },
  wifi: {
    list: () => ipcRenderer.invoke('hermes:wifi:list'),
    status: () => ipcRenderer.invoke('hermes:wifi:status'),
    connect: (ssid, pass) => ipcRenderer.invoke('hermes:wifi:connect', { ssid, pass }),
    disconnect: () => ipcRenderer.invoke('hermes:wifi:disconnect'),
    radio: (on) => ipcRenderer.invoke('hermes:wifi:radio', on),
  },
  bt: {
    power: (on) => ipcRenderer.invoke('hermes:bt:power', on),
    paired: () => ipcRenderer.invoke('hermes:bt:paired'),
    connect: (mac) => ipcRenderer.invoke('hermes:bt:connect', mac),
    disconnect: (mac) => ipcRenderer.invoke('hermes:bt:disconnect', mac),
    scan: (seconds = 6) => ipcRenderer.invoke('hermes:bt:scan', seconds),
  },
  system: {
    status: () => ipcRenderer.invoke('hermes:system:status'),
  },
});
