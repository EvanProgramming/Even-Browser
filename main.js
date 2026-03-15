const { app, BrowserWindow, BrowserView, session, ipcMain } = require('electron');
const path = require('path');

let mainWindow;
let views = new Map();
let currentTabId = 0;
let nextTabId = 1;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    titleBarStyle: 'hidden',
    trafficLightPosition: process.platform === 'darwin' ? { x: 18, y: 18 } : undefined,
    vibrancy: process.platform === 'darwin' ? 'under-window' : undefined,
    transparent: true,
    backgroundColor: '#00000000',
    frame: false,
    resizable: true,
    minimizable: true,
    maximizable: true,
    closable: true,
    backgroundMaterial: process.platform === 'win32' ? 'mica' : undefined,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      sandbox: true,
      backgroundThrottling: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'src/ui/index.html'));

  mainWindow.on('resize', () => {
    const bounds = mainWindow.getBounds();
    const currentView = views.get(currentTabId);
    if (currentView) {
      currentView.setBounds({
        x: 0,
        y: 90,
        width: bounds.width,
        height: bounds.height - 90
      });
    }
  });

  mainWindow.on('maximize', () => {
    const bounds = mainWindow.getBounds();
    const currentView = views.get(currentTabId);
    if (currentView) {
      currentView.setBounds({
        x: 0,
        y: 90,
        width: bounds.width,
        height: bounds.height - 90
      });
    }
  });

  mainWindow.on('unmaximize', () => {
    const bounds = mainWindow.getBounds();
    const currentView = views.get(currentTabId);
    if (currentView) {
      currentView.setBounds({
        x: 0,
        y: 90,
        width: bounds.width,
        height: bounds.height - 90
      });
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Double click on title bar to maximize/minimize window (Windows default behavior)
  let lastClickTime = 0;
  mainWindow.webContents.on('mousedown', (event) => {
    // Check if click is on the title bar area (top 52px - toolbar height)
    if (event.y < 52) {
      // Get the browser window bounds to calculate click position relative to window
      const windowBounds = mainWindow.getBounds();
      const windowWidth = windowBounds.width;
      
      // Calculate address bar area (assuming it's centered with max width 640px)
      const addressBarLeft = (windowWidth - 640) / 2;
      const addressBarRight = addressBarLeft + 640;
      
      // Only trigger if click is outside the address bar area
      if (event.x < addressBarLeft || event.x > addressBarRight) {
        const currentTime = Date.now();
        if (currentTime - lastClickTime < 300) {
          // Double click detected
          if (mainWindow.isMaximized()) {
            mainWindow.unmaximize();
          } else {
            mainWindow.maximize();
          }
        }
        lastClickTime = currentTime;
      }
    }
  });

  createTab('file://' + path.join(__dirname, 'src/pages/home.html'));
}

function createTab(url) {
  const tabId = nextTabId++;
  const view = new BrowserView({
    webPreferences: {
      partition: 'persist:main',
      sandbox: true
    }
  });

  const bounds = mainWindow.getBounds();
  view.setBounds({
    x: 0,
    y: 90,
    width: bounds.width,
    height: bounds.height - 90
  });

  view.webContents.loadURL(url);
  views.set(tabId, view);

  view.webContents.on('page-title-updated', (event, title) => {
    mainWindow.webContents.send('tab-title-updated', { tabId, title });
  });

  view.webContents.on('page-favicon-updated', (event, favicons) => {
    mainWindow.webContents.send('tab-favicon-updated', { tabId, favicon: favicons[0] });
  });

  view.webContents.on('did-start-loading', () => {
    mainWindow.webContents.send('tab-loading', { tabId, loading: true });
  });

  view.webContents.on('did-stop-loading', () => {
    mainWindow.webContents.send('tab-loading', { tabId, loading: false });
  });

  view.webContents.on('did-navigate', (event, url) => {
    mainWindow.webContents.send('tab-url-updated', { tabId, url });
  });

  // 处理链接点击，在新标签中打开
  view.webContents.setWindowOpenHandler((details) => {
    createTab(details.url);
    return { action: 'deny' };
  });

  switchTab(tabId);
  return tabId;
}

function switchTab(tabId) {
  if (!views.has(tabId)) return;

  // 移除当前视图
  if (currentTabId && views.has(currentTabId)) {
    mainWindow.removeBrowserView(views.get(currentTabId));
  }

  // 添加新视图
  const view = views.get(tabId);
  mainWindow.addBrowserView(view);
  
  // 设置视图层级低于主窗口内容
  view.setAutoResize({ width: true, height: true });
  
  currentTabId = tabId;
  mainWindow.webContents.send('tab-switched', tabId);
}

function closeTab(tabId) {
  if (!views.has(tabId)) return;

  const view = views.get(tabId);
  if (view) {
    // 在 Electron 33.0+ 中，BrowserView 不需要手动销毁，移除引用后会被垃圾回收
    views.delete(tabId);

    if (views.size === 0) {
      createTab('file://' + path.join(__dirname, 'src/pages/home.html'));
    } else if (currentTabId === tabId) {
      const firstTabId = Array.from(views.keys())[0];
      switchTab(firstTabId);
    }

    mainWindow.webContents.send('tab-closed', tabId);
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  session.defaultSession.setWindowOpenHandler((details) => {
    createTab(details.url);
    return { action: 'deny' };
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.on('create-tab', (event, url) => {
  createTab(url || 'file://' + path.join(__dirname, 'src/pages/home.html'));
});

ipcMain.on('switch-tab', (event, tabId) => {
  switchTab(tabId);
});

ipcMain.on('close-tab', (event, tabId) => {
  closeTab(tabId);
});

ipcMain.on('load-url', (event, { tabId, url }) => {
  const view = views.get(tabId);
  if (view) {
    view.webContents.loadURL(url);
  }
});

ipcMain.on('go-back', (event, tabId) => {
  const view = views.get(tabId);
  if (view && view.webContents.canGoBack()) {
    view.webContents.goBack();
  }
});

ipcMain.on('go-forward', (event, tabId) => {
  const view = views.get(tabId);
  if (view && view.webContents.canGoForward()) {
    view.webContents.goForward();
  }
});

ipcMain.on('reload', (event, tabId) => {
  const view = views.get(tabId);
  if (view) {
    view.webContents.reload();
  }
});

ipcMain.on('minimize-window', () => {
  mainWindow.minimize();
});

ipcMain.on('maximize-window', () => {
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
});

ipcMain.on('close-window', () => {
  mainWindow.close();
});

ipcMain.on('hide-browser-view', () => {
  if (currentTabId && views.has(currentTabId)) {
    mainWindow.removeBrowserView(views.get(currentTabId));
  }
});

ipcMain.on('show-browser-view', () => {
  if (currentTabId && views.has(currentTabId)) {
    mainWindow.addBrowserView(views.get(currentTabId));
  }
});