import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { RedNotebookStorage } from './storage.js';
import { searchJournal, getAllTagsWithCounts, replaceInJournal } from './search.js';
import { createJournalBackupZip, restoreJournalBackupZip } from './backup.js';
import { detectOneDrivePaths, browseDirectory, createNewFolder } from './onedrive.js';
import { getVersionManifest, getLatestBinaryPath } from './distributionManager.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const storage = new RedNotebookStorage();

// Multer upload config for images & files
const uploadStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const isImage = file.mimetype.startsWith('image/');
    const targetFolder = isImage ? 'images' : 'files';
    const uploadPath = path.join(storage.dataDir, targetFolder);
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ storage: uploadStorage });

// Serve static images and files stored in data/
app.use('/data-assets', (req, res, next) => {
  express.static(storage.dataDir)(req, res, next);
});

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '../dist');

app.use(express.static(distPath));

// API Routes

// 1. Get info and list of available months
app.get('/api/months', (req, res) => {
  try {
    const files = storage.getJournalFiles();
    res.json({ success: true, files, dataDir: storage.dataDir });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Load specific month
app.get('/api/month/:year/:month', (req, res) => {
  try {
    const year = parseInt(req.params.year, 10);
    const month = parseInt(req.params.month, 10);
    const monthData = storage.loadMonth(year, month);
    res.json({ success: true, data: monthData });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Save specific month
app.post('/api/month/:year/:month', (req, res) => {
  try {
    const year = parseInt(req.params.year, 10);
    const month = parseInt(req.params.month, 10);
    const daysData = req.body.days || {};
    const saveResult = storage.saveMonth(year, month, daysData);
    res.json(saveResult);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Search entries
app.get('/api/search', (req, res) => {
  try {
    const query = req.query.q || '';
    const tag = req.query.tag || '';
    const from = req.query.from || null;
    const to = req.query.to || null;

    const allMonths = storage.loadAllMonths();
    const results = searchJournal(allMonths, query, tag, from, to);
    res.json({ success: true, count: results.length, results });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4b. Replace in entries
app.post('/api/replace', (req, res) => {
  try {
    const { oldQuery, newText } = req.body;
    if (!oldQuery) {
      return res.status(400).json({ success: false, error: 'Termo de busca não fornecido' });
    }
    const allMonths = storage.loadAllMonths();
    const result = replaceInJournal(allMonths, storage, oldQuery, newText || '');
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Get all tags with counts
app.get('/api/tags', (req, res) => {
  try {
    const allMonths = storage.loadAllMonths();
    const tags = getAllTagsWithCounts(allMonths);
    res.json({ success: true, tags });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Media Upload (Images & Attachments)
app.post('/api/upload-media', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Nenhum arquivo enviado' });
    }
    const isImage = req.file.mimetype.startsWith('image/');
    const subFolder = isImage ? 'images' : 'files';
    const relativePath = `${subFolder}/${req.file.filename}`;
    
    // RedNotebook standard format for images: [image: filename]
    const rednotebookMarkup = isImage 
      ? `[image: ${relativePath}]`
      : `[${req.file.originalname} ${relativePath}]`;

    res.json({
      success: true,
      filename: req.file.filename,
      originalname: req.file.originalname,
      relativePath,
      rednotebookMarkup,
      url: `/data-assets/${relativePath}`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Backup Download
app.get('/api/backup', async (req, res) => {
  try {
    const tempZipPath = path.join(process.cwd(), `RedNotebook_Backup_${Date.now()}.zip`);
    await createJournalBackupZip(storage.dataDir, tempZipPath);
    
    res.download(tempZipPath, `RedNotebook_Backup_${new Date().toISOString().slice(0,10)}.zip`, (err) => {
      if (fs.existsSync(tempZipPath)) {
        fs.unlinkSync(tempZipPath);
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. Backup Restore
app.post('/api/restore', upload.single('backupZip'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Arquivo ZIP de backup não fornecido' });
    }
    const result = await restoreJournalBackupZip(req.file.path, storage.dataDir);
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. OneDrive status & Storage directory
app.get('/api/onedrive', (req, res) => {
  try {
    const info = detectOneDrivePaths();
    res.json({
      success: true,
      activeDataDir: storage.dataDir,
      defaultDataDir: path.join(process.cwd(), 'data'),
      ...info
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9b. Get/Set Storage Directory Config
app.get('/api/storage/config', (req, res) => {
  try {
    const info = detectOneDrivePaths();
    res.json({
      success: true,
      activeDataDir: storage.dataDir,
      defaultDataDir: path.join(process.cwd(), 'data'),
      oneDriveFolders: info.oneDriveFolders,
      cDriveFolders: info.cDriveFolders,
      isOneDriveAvailable: info.isAvailable
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/storage/config', (req, res) => {
  try {
    const { dataDir, copyExisting } = req.body;
    if (!dataDir) {
      return res.status(400).json({ success: false, error: 'Caminho do diretório não fornecido' });
    }
    const result = storage.setDataDir(dataDir, copyExisting !== false);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9c. Browse Directory Endpoint for Interactive Folder Picker
app.get('/api/storage/browse', (req, res) => {
  try {
    const dir = req.query.dir || null;
    const browseResult = browseDirectory(dir);
    res.json(browseResult);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9d. Create Subfolder Endpoint
app.post('/api/storage/create-folder', (req, res) => {
  try {
    const { parentDir, folderName } = req.body;
    const result = createNewFolder(parentDir, folderName);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10. AI Assistant Endpoint (Prompt generator, summarizer, tone polish)
app.post('/api/ai/prompt', (req, res) => {
  try {
    const { action, text, prompt } = req.body;

    if (action === 'summary') {
      const words = (text || '').trim().split(/\s+/).filter(Boolean).length;
      return res.json({
        success: true,
        response: `[Resumo Inteligente]\nEste registro possui ${words} palavras. Destacam-se as ideias principais e reflexões anotadas.`,
        action
      });
    }

    if (action === 'prompts') {
      const dailyPrompts = [
        "Qual foi o momento mais gratificante do seu dia hoje?",
        "Qual desafio você enfrentou e como lidou com ele?",
        "Cite 3 coisas pelas quais você é grato hoje.",
        "O que você aprendeu de novo ou gostaria de aprofundar amanhã?"
      ];
      const randomPrompt = dailyPrompts[Math.floor(Math.random() * dailyPrompts.length)];
      return res.json({ success: true, response: randomPrompt, action });
    }

    if (action === 'polish') {
      return res.json({
        success: true,
        response: (text || '').trim(),
        action
      });
    }

    res.json({
      success: true,
      response: "Assistente de IA pronto para integrar com chaves Gemini, OpenAI ou Claude.",
      action
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 11. Distribution & Auto-Update Endpoints
app.get('/downloads', (req, res) => {
  const downloadsPath = path.resolve(__dirname, 'distribution/downloads.html');
  if (fs.existsSync(downloadsPath)) {
    return res.sendFile(downloadsPath);
  }
  res.status(404).send('Página de downloads não encontrada.');
});

app.get('/api/check-updates', (req, res) => {
  try {
    const manifest = getVersionManifest();
    res.json(manifest);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/download/installer', (req, res) => {
  try {
    const filePath = getLatestBinaryPath('installer');
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'Instalador não encontrado no repositório' });
    }
    const manifest = getVersionManifest();
    res.download(filePath, manifest.installerFilename || path.basename(filePath));
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/download/portable', (req, res) => {
  try {
    const filePath = getLatestBinaryPath('portable');
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'Versão portátil não encontrada no repositório' });
    }
    const manifest = getVersionManifest();
    res.download(filePath, manifest.portableFilename || path.basename(filePath));
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/download/changelog', (req, res) => {
  try {
    const filePath = path.resolve(__dirname, 'distribution/CHANGELOG.md');
    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath);
    }
    res.status(404).send('CHANGELOG.md não encontrado');
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/download/sha256', (req, res) => {
  try {
    const filePath = path.resolve(__dirname, 'distribution/SHA256.txt');
    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath);
    }
    res.status(404).send('SHA256.txt não encontrado');
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// SPA fallback for production
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/downloads') || req.path.startsWith('/data-assets')) {
    return next();
  }
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  res.status(404).send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>OpenJournal - Build Necessário</title>
      <style>
        body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
        .card { background: #1e293b; padding: 2.5rem; border-radius: 12px; max-width: 500px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.5); border: 1px solid #334155; }
        h1 { color: #f43f5e; margin-top: 0; font-size: 1.5rem; }
        p { color: #94a3b8; line-height: 1.6; }
        code { background: #0f172a; color: #38bdf8; padding: 0.2rem 0.5rem; border-radius: 4px; font-family: monospace; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>OpenJournal - Interface não encontrada</h1>
        <p>A pasta <strong>dist</strong> não foi encontrada. O frontend precisa ser gerado antes de iniciar a versão portable.</p>
        <p>Execute no terminal:</p>
        <p><code>npm run build</code></p>
        <p>Ou execute <code>Iniciar_OpenJournal.bat</code> atualizado para compilar automaticamente.</p>
      </div>
    </body>
    </html>
  `);
});

export function startServer(preferredPort = process.env.PORT || 3001) {
  return new Promise((resolve, reject) => {
    const port = parseInt(preferredPort, 10);
    const server = app.listen(port, () => {
      console.log(`OpenJournal Backend Server rodando em http://localhost:${port}`);
      console.log(`Diretório de dados RedNotebook: ${storage.dataDir}`);
      resolve({ server, port, storage, app });
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.warn(`[AVISO] A porta ${port} já está em uso.`);
        resolve({ server: null, port, isPortInUse: true, error: err });
      } else {
        console.error(`Erro ao iniciar servidor:`, err.message);
        reject(err);
      }
    });
  });
}

export { app, storage };

// Se executado diretamente via terminal (node server/index.js)
if (import.meta.url === `file://${process.argv[1]}` || (process.argv[1] && process.argv[1].includes('server/index.js'))) {
  startServer().catch((err) => {
    console.error('Falha crítica ao iniciar servidor:', err);
    process.exit(1);
  });
}

