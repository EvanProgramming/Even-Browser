const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  createTab: (url) => ipcRenderer.send('create-tab', url),
  switchTab: (tabId) => ipcRenderer.send('switch-tab', tabId),
  closeTab: (tabId) => ipcRenderer.send('close-tab', tabId),
  loadUrl: (tabId, url) => ipcRenderer.send('load-url', { tabId, url }),
  goBack: (tabId) => ipcRenderer.send('go-back', tabId),
  goForward: (tabId) => ipcRenderer.send('go-forward', tabId),
  reload: (tabId) => ipcRenderer.send('reload', tabId),
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  maximizeWindow: () => ipcRenderer.send('maximize-window'),
  closeWindow: () => ipcRenderer.send('close-window'),
  hideBrowserView: () => ipcRenderer.send('hide-browser-view'),
  showBrowserView: () => ipcRenderer.send('show-browser-view'),
  onTabTitleUpdated: (callback) => ipcRenderer.on('tab-title-updated', (event, data) => callback(data)),
  onTabFaviconUpdated: (callback) => ipcRenderer.on('tab-favicon-updated', (event, data) => callback(data)),
  onTabLoading: (callback) => ipcRenderer.on('tab-loading', (event, data) => callback(data)),
  onTabUrlUpdated: (callback) => ipcRenderer.on('tab-url-updated', (event, data) => callback(data)),
  onTabSwitched: (callback) => ipcRenderer.on('tab-switched', (event, tabId) => callback(tabId)),
  onTabClosed: (callback) => ipcRenderer.on('tab-closed', (event, tabId) => callback(tabId))
});