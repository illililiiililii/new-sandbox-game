const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('desktop',Object.freeze({
  info:()=>ipcRenderer.invoke('app:info'),
  fullscreen:()=>ipcRenderer.invoke('app:fullscreen'),
  minimize:()=>ipcRenderer.invoke('app:minimize'),
  quit:()=>ipcRenderer.invoke('app:quit'),
  host:options=>ipcRenderer.invoke('lan:host',options),
  loadWorld:()=>ipcRenderer.invoke('world:load'),
  saveWorld:data=>ipcRenderer.invoke('world:save',data),
  stopHost:()=>ipcRenderer.invoke('lan:stop'),
  copy:text=>ipcRenderer.invoke('app:clipboard',text)
}));
