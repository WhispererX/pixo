import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let mainWindow: BrowserWindow | null = null;
let pendingFilePath: string | null = null;

const SUPPORTED_EXTENSIONS = ['.pixo', '.pix', '.png'];

function extractFileArg(argv: string[]): string | undefined {
  return argv.find((arg) => SUPPORTED_EXTENSIONS.includes(path.extname(arg).toLowerCase()));
}

function createWindow() {
  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, 'icon.png')
    : path.join(__dirname, '../icon.png');

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#1e1e1e',
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    frame: true,
    titleBarStyle: 'default',
    autoHideMenuBar: true,
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  if (pendingFilePath) {
    mainWindow.webContents.on('did-finish-load', () => {
      mainWindow?.webContents.send('open-file', pendingFilePath);
      pendingFilePath = null;
    });
  }
}

const gotLock = app.requestSingleInstanceLock();

if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', (_event, argv) => {
    const args = process.platform === 'win32' ? argv.slice(1) : argv.slice(1);
    const fileFromArgs = extractFileArg(args);
    if (fileFromArgs) {
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
        mainWindow.webContents.send('open-file', fileFromArgs);
      } else {
        pendingFilePath = fileFromArgs;
      }
    }
  });

  const startupArgs = process.platform === 'win32' ? process.argv.slice(1) : process.argv.slice(1);
  const startupFile = extractFileArg(startupArgs);
  if (startupFile) {
    pendingFilePath = startupFile;
  }

  app.whenReady().then(createWindow);
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('open-file', (event, filePath) => {
  event.preventDefault();
  
  if (mainWindow) {
    mainWindow.webContents.send('open-file', filePath);
  } else {
    pendingFilePath = filePath;
  }
});

// IPC Handlers

// Save file dialog
ipcMain.handle('save-file-dialog', async () => {
  if (!mainWindow) return { canceled: true };
  
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Save Sprite',
    filters: [
      { name: 'Pixo Files', extensions: ['pix'] },
      { name: 'PNG Files', extensions: ['png'] },
      { name: 'All Files', extensions: ['*'] }
    ],
    defaultPath: 'untitled.pix'
  });
  
  return result;
});

// Open file dialog
ipcMain.handle('open-file-dialog', async () => {
  if (!mainWindow) return { canceled: true };
  
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Open Sprite',
    filters: [
      { name: 'Pixo Files', extensions: ['pix'] },
      { name: 'PNG Files', extensions: ['png'] },
      { name: 'All Files', extensions: ['*'] }
    ],
    properties: ['openFile']
  });
  
  return result;
});

// Save file
ipcMain.handle('save-file', async (event, filePath: string, content: string) => {
  try {
    fs.writeFileSync(filePath, content, 'utf-8');
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// Read file
ipcMain.handle('read-file', async (event, filePath: string) => {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return { success: true, content };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// Read file binary (base64) for images like PNG
ipcMain.handle('read-file-binary', async (event, filePath: string) => {
  try {
    const buffer = fs.readFileSync(filePath);
    const base64 = buffer.toString('base64');
    return { success: true, base64 };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// Export as PNG
ipcMain.handle('export-png', async (event, filePath: string, dataUrl: string) => {
  try {
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(filePath, buffer);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// Get recent files
const recentFilesPath = path.join(app.getPath('userData'), 'recent-files.json');

ipcMain.handle('get-recent-files', async () => {
  try {
    if (fs.existsSync(recentFilesPath)) {
      const data = fs.readFileSync(recentFilesPath, 'utf-8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    return [];
  }
});

ipcMain.handle('add-recent-file', async (event, filePath: string) => {
  try {
    let recentFiles: string[] = [];
    if (fs.existsSync(recentFilesPath)) {
      const data = fs.readFileSync(recentFilesPath, 'utf-8');
      recentFiles = JSON.parse(data);
    }
    
    recentFiles = recentFiles.filter(f => f !== filePath);
    
    recentFiles.unshift(filePath);
    
    recentFiles = recentFiles.slice(0, 10);
    
    fs.writeFileSync(recentFilesPath, JSON.stringify(recentFiles), 'utf-8');
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});
