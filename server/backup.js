import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import extractZip from 'extract-zip';

export async function createJournalBackupZip(dataDir, outputPath) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      resolve({ success: true, bytes: archive.pointer(), outputPath });
    });

    archive.on('error', (err) => {
      reject(err);
    });

    archive.pipe(output);
    archive.directory(dataDir, false);
    archive.finalize();
  });
}

export async function restoreJournalBackupZip(zipPath, targetDataDir) {
  try {
    await extractZip(zipPath, { dir: targetDataDir });
    return { success: true, message: 'Backup restaurado com sucesso' };
  } catch (err) {
    console.error('Erro ao extrair backup ZIP:', err);
    return { success: false, error: err.message };
  }
}
