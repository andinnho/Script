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
let splashWindow = null;
let serverInstance = null;
let splashStartTime = 0;

function updateSplashStatus(text, progress) {
  if (splashWindow && !splashWindow.isDestroyed() && splashWindow.webContents) {
    splashWindow.webContents.send('splash-status', { text, progress });
  }
}

function createSplashWindow() {
  splashStartTime = Date.now();
  const iconPath = path.join(__dirname, 'icon.png');
  const splashPath = path.join(__dirname, 'splash.html');

  console.log('[MAIN] Criando Splash Window com exibição imediata. Arquivo:', splashPath);
  
  splashWindow = new BrowserWindow({
    width: 680,
    height: 420,
    frame: false,
    resizable: false,
    center: true,
    alwaysOnTop: true,
    show: true, // EXIBIR INSTANTANEAMENTE no momento da execução
    backgroundColor: '#090d16',
    icon: iconPath,
    skipTaskbar: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  });

  splashWindow.loadFile(splashPath);

  splashWindow.webContents.on('did-finish-load', () => {
    console.log('[MAIN] Splash Window carregou splash.html.');
    updateSplashStatus('Iniciando serviços do sistema...', 25);
  });

  splashWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('[MAIN] Erro ao carregar splash.html:', errorCode, errorDescription);
  });

  splashWindow.on('closed', () => {
    console.log('[MAIN] Splash Window fechada.');
    splashWindow = null;
  });
}

function finishSplashAndShowMain() {
  const MIN_SPLASH_TIME = 3000;
  const elapsed = Date.now() - splashStartTime;
  const remaining = Math.max(0, MIN_SPLASH_TIME - elapsed);

  console.log(`[MAIN] Finalizando Splash Screen. Tempo transcorrido: ${elapsed}ms. Exibindo por mais ${remaining}ms...`);
  updateSplashStatus('Ambiente de trabalho pronto!', 100);

  setTimeout(() => {
    console.log('[MAIN] Fechando Splash Screen e exibindo janela principal.');
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show();
      mainWindow.focus();
    }
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.close();
      splashWindow = null;
    }
  }, remaining);
}

async function createWindow() {
  console.log('[MAIN] Executando createWindow...');
  // 1. Exibir Splash Screen IMEDIATAMENTE ao iniciar o app
  createSplashWindow();

  const isDev = process.env.NODE_ENV === 'development';
  const port = process.env.PORT || 3001;

  // 2. Iniciar servidor Express backend embutido
  try {
    console.log('[MAIN] Iniciando servidor backend na porta', port);
    const serverResult = await startServer(port);
    serverInstance = serverResult.server;
    updateSplashStatus('Servidor backend ativado com sucesso', 55);
  } catch (err) {
    console.error('[MAIN] Erro ao iniciar servidor backend no Electron:', err);
    updateSplashStatus('Iniciando em modo de contingência...', 55);
  }

  updateSplashStatus('Carregando módulos da interface...', 75);

  const iconPath = path.join(__dirname, 'icon.png');

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    title: 'Script',
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

  console.log('[MAIN] Carregando URL no mainWindow:', targetUrl);

  let isAppShown = false;
  const showApp = () => {
    if (!isAppShown) {
      isAppShown = true;
      finishSplashAndShowMain();
    }
  };

  ipcMain.once('app-ready', () => {
    console.log('[MAIN] Recebido evento IPC app-ready!');
    updateSplashStatus('Interface pronta para uso!', 95);
    showApp();
  });

  mainWindow.webContents.once('did-finish-load', () => {
    console.log('[MAIN] mainWindow did-finish-load!');
    // Forçar título fixo — impede o <title> da página HTML de sobrescrever
    mainWindow.setTitle('Script');
    updateSplashStatus('Concluindo inicialização...', 90);
    setTimeout(() => {
      showApp();
    }, 800);
  });

  // Bloquear qualquer mudança de título vinda do HTML/React
  mainWindow.on('page-title-updated', (event) => {
    event.preventDefault();
    mainWindow.setTitle('Script');
  });

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

  await mainWindow.loadURL(targetUrl);
}

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
