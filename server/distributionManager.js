import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DISTRIBUTION_DIR = path.resolve('server/distribution');
const VERSION_FILE = path.join(DISTRIBUTION_DIR, 'version.json');
const CHANGELOG_FILE = path.join(DISTRIBUTION_DIR, 'CHANGELOG.md');
const SHA256_FILE = path.join(DISTRIBUTION_DIR, 'SHA256.txt');
const RELEASES_DIR = path.join(DISTRIBUTION_DIR, 'releases');

export function ensureDistributionDirectories() {
  if (!fs.existsSync(DISTRIBUTION_DIR)) {
    fs.mkdirSync(DISTRIBUTION_DIR, { recursive: true });
  }
  if (!fs.existsSync(RELEASES_DIR)) {
    fs.mkdirSync(RELEASES_DIR, { recursive: true });
  }
}

export function calculateFileHash(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getVersionManifest() {
  ensureDistributionDirectories();
  if (fs.existsSync(VERSION_FILE)) {
    try {
      const content = fs.readFileSync(VERSION_FILE, 'utf-8');
      return JSON.parse(content);
    } catch (err) {
      console.error('Erro ao ler version.json:', err);
    }
  }

  // Manifesto padrao inicial
  return {
    version: "1.0.0",
    releaseDate: new Date().toISOString().slice(0, 10),
    installerFilename: "Script Setup 1.0.0.exe",
    portableFilename: "Script 1.0.0.exe",
    installerUrl: "/api/download/installer",
    portableUrl: "/api/download/portable",
    changelogUrl: "/api/download/changelog",
    sha256Url: "/api/download/sha256",
    changelog: [
      "Lançamento da versão desktop nativa com Electron para Windows",
      "Instalador silencioso (NSIS) e versão portátil sem arquivos .bat",
      "Suporte 100% garantido ao formato de histórico YAML do RedNotebook",
      "Detecção de pastas do Microsoft OneDrive e seletor interativo de histórico",
      "Busca rápida com suporte a hashtags e nuvem de marcas",
      "Módulo de distribuição e atualizações automáticas integrado"
    ]
  };
}

export function getLatestBinaryPath(type = 'installer') {
  ensureDistributionDirectories();
  const manifest = getVersionManifest();
  const targetVersion = manifest.version || '1.0.0';
  const versionFolder = path.join(RELEASES_DIR, `v${targetVersion}`);

  const filename = type === 'portable' 
    ? (manifest.portableFilename || `Script ${targetVersion}.exe`)
    : (manifest.installerFilename || `Script Setup ${targetVersion}.exe`);

  const primaryPath = path.join(versionFolder, filename);
  if (fs.existsSync(primaryPath)) {
    return primaryPath;
  }

  // Fallback para a pasta release/ raiz do projeto
  const fallbackPath = path.resolve('release', filename);
  if (fs.existsSync(fallbackPath)) {
    return fallbackPath;
  }

  return null;
}
