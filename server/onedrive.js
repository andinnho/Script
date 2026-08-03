import fs from 'fs';
import path from 'path';
import os from 'os';

export function detectOneDrivePaths() {
  const userHome = os.homedir();
  const baseOneDriveCandidates = [
    process.env.OneDrive,
    process.env.OneDriveConsumer,
    process.env.OneDriveCommercial,
    path.join(userHome, 'OneDrive'),
    path.join(userHome, 'OneDrive - Personal'),
    path.join(userHome, 'OneDrive', 'Documentos'),
    path.join(userHome, 'OneDrive', 'Documents')
  ].filter(Boolean);

  const detectedRoots = [];
  for (const p of baseOneDriveCandidates) {
    if (fs.existsSync(p) && !detectedRoots.includes(p)) {
      detectedRoots.push(p);
    }
  }

  const oneDriveFolders = [];
  for (const root of detectedRoots) {
    oneDriveFolders.push(path.join(root, 'OpenJournalData'));
    const docsPath = path.join(root, 'Documentos');
    if (fs.existsSync(docsPath)) {
      oneDriveFolders.push(path.join(docsPath, 'OpenJournalData'));
    }
  }

  const uniqueOneDriveFolders = [...new Set(oneDriveFolders)];

  const systemDrive = process.env.SystemDrive || 'C:';
  const cDriveFolders = [
    path.join(systemDrive, '\\', 'OpenJournalData'),
    path.join(userHome, 'OpenJournalData'),
    path.join(process.cwd(), 'data')
  ];

  return {
    isAvailable: detectedRoots.length > 0,
    detectedRoots,
    oneDriveFolders: uniqueOneDriveFolders,
    cDriveFolders,
    activePath: uniqueOneDriveFolders[0] || detectedRoots[0] || null
  };
}

export function browseDirectory(targetDir = null) {
  const userHome = os.homedir();
  const systemDrive = process.env.SystemDrive || 'C:';
  
  let currentDir = targetDir;
  if (!currentDir || !fs.existsSync(currentDir)) {
    const oneDriveInfo = detectOneDrivePaths();
    currentDir = oneDriveInfo.detectedRoots[0] || userHome;
  }

  currentDir = path.resolve(currentDir);
  const parentDir = path.dirname(currentDir) !== currentDir ? path.dirname(currentDir) : null;

  // List drive letters (C:\, D:\, etc.)
  const drives = [];
  const driveLetters = ['C', 'D', 'E', 'F', 'G', 'H'];
  for (const letter of driveLetters) {
    const dPath = `${letter}:\\`;
    if (fs.existsSync(dPath)) {
      drives.push(dPath);
    }
  }

  // Quick paths for navigation
  const oneDriveInfo = detectOneDrivePaths();
  const quickPaths = [];
  
  if (oneDriveInfo.detectedRoots.length > 0) {
    for (const odRoot of oneDriveInfo.detectedRoots) {
      quickPaths.push({ name: `OneDrive (${path.basename(odRoot)})`, path: odRoot, type: 'onedrive' });
    }
  }
  
  const docsPath = path.join(userHome, 'Documents');
  if (fs.existsSync(docsPath)) {
    quickPaths.push({ name: 'Documentos', path: docsPath, type: 'docs' });
  }

  const desktopPath = path.join(userHome, 'Desktop');
  if (fs.existsSync(desktopPath)) {
    quickPaths.push({ name: 'Área de Trabalho', path: desktopPath, type: 'desktop' });
  }

  quickPaths.push({ name: 'Pasta do Usuário', path: userHome, type: 'user' });
  quickPaths.push({ name: `Unidade (${systemDrive}\\)`, path: `${systemDrive}\\`, type: 'cdrive' });

  // List subfolders
  const subfolders = [];
  try {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (entry.name.startsWith('$') || entry.name.startsWith('.') || entry.name === 'System Volume Information' || entry.name === 'node_modules') {
          continue;
        }
        subfolders.push({
          name: entry.name,
          path: path.join(currentDir, entry.name)
        });
      }
    }
    subfolders.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  } catch (err) {
    console.error(`Erro ao ler pasta ${currentDir}:`, err.message);
  }

  return {
    success: true,
    currentDir,
    parentDir,
    drives,
    quickPaths,
    subfolders
  };
}

export function createNewFolder(parentDir, folderName) {
  if (!parentDir || !folderName) {
    return { success: false, error: 'Diretório pai e nome da pasta são obrigatórios' };
  }
  try {
    const targetPath = path.join(parentDir, folderName.trim());
    if (!fs.existsSync(targetPath)) {
      fs.mkdirSync(targetPath, { recursive: true });
    }
    return { success: true, folderPath: targetPath };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

