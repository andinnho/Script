import { app, BrowserWindow, shell } from 'electron';
import path from 'path';
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
