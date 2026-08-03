import { app, BrowserWindow, shell, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';
import os from 'os';
import http from 'http';
import https from 'https';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { startServer } from '../server/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow = null;
let serverInstance = null;

async function createWindow() {
  const isDev = process.env.NODE_ENV === 'development';
  const port = process.env.PORT || 3001;

  // Iniciar servidor Express backend embutido
  try {
    const serverResult = await startServer(port);
    serverInstance = serverResult.server;
  } catch (err) {
    console.error('Erro ao iniciar servidor backend no Electron:', err);
  }

  const iconPath = path.join(__dirname, '../build/icon.png');

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    title: 'Script - OpenJournal',
    icon: iconPath,
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  });

  const targetUrl = isDev && process.env.VITE_DEV_SERVER_URL
    ? process.env.VITE_DEV_SERVER_URL
    : `http://localhost:${port}`;

  await mainWindow.loadURL(targetUrl);
  mainWindow.show();

  // Redirecionar links externos para o navegador padrão do sistema
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Handlers para Atualização Automática
ipcMain.handle('get-current-version', () => {
  return app.getVersion();
});

ipcMain.handle('download-and-install-update', async (event, downloadUrl) => {
  try {
    const tempDir = os.tmpdir();
    const tempInstallerPath = path.join(tempDir, `Script-Setup-Update-${Date.now()}.exe`);
    const fullUrl = downloadUrl.startsWith('http') ? downloadUrl : `http://localhost:3001${downloadUrl}`;
    
    const fileStream = fs.createWriteStream(tempInstallerPath);

    await new Promise((resolve, reject) => {
      const client = fullUrl.startsWith('https') ? https : http;
      client.get(fullUrl, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          client.get(res.headers.location, (redRes) => {
            redRes.pipe(fileStream);
            fileStream.on('finish', () => fileStream.close(resolve));
          }).on('error', reject);
        } else {
          res.pipe(fileStream);
          fileStream.on('finish', () => fileStream.close(resolve));
        }
      }).on('error', reject);
    });

    // Iniciar o instalador e fechar o Electron graciosamente
    const child = spawn(tempInstallerPath, [], {
      detached: true,
      stdio: 'ignore'
    });
    child.unref();

    setTimeout(() => {
      app.quit();
    }, 1000);

    return { success: true };
  } catch (err) {
    console.error('Erro no processo de atualização IPC:', err);
    return { success: false, error: err.message };
  }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (serverInstance) {
    try {
      serverInstance.close();
    } catch (e) {}
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

