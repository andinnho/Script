import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

// RedNotebook standard data directory resolution
export class RedNotebookStorage {
  constructor(customDataDir = null) {
    this.configFilePath = path.join(process.cwd(), 'data_config.json');
    this.dataDir = customDataDir || this.loadSavedDataDir() || path.join(process.cwd(), 'data');
    this.ensureDataDirectory();
  }

  loadSavedDataDir() {
    try {
      if (fs.existsSync(this.configFilePath)) {
        const raw = fs.readFileSync(this.configFilePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && parsed.dataDir && typeof parsed.dataDir === 'string') {
          return parsed.dataDir;
        }
      }
    } catch (err) {
      console.error('Erro ao ler data_config.json:', err);
    }
    return null;
  }

  saveConfigDataDir(newDir) {
    try {
      fs.writeFileSync(this.configFilePath, JSON.stringify({ dataDir: newDir }, null, 2), 'utf-8');
    } catch (err) {
      console.error('Erro ao salvar data_config.json:', err);
    }
  }

  setDataDir(newDir, copyExisting = false) {
    if (!newDir) {
      return { success: false, error: 'Caminho do diretório inválido' };
    }

    const normalizedDir = path.resolve(newDir);
    const oldDir = this.dataDir;

    try {
      if (!fs.existsSync(normalizedDir)) {
        fs.mkdirSync(normalizedDir, { recursive: true });
      }

      let copiedCount = 0;
      if (copyExisting && oldDir !== normalizedDir && fs.existsSync(oldDir)) {
        copiedCount = this.copyDataDirectoryContents(oldDir, normalizedDir);
      }

      this.dataDir = normalizedDir;
      this.ensureDataDirectory();
      this.saveConfigDataDir(normalizedDir);

      return { success: true, dataDir: normalizedDir, copiedCount };
    } catch (err) {
      console.error('Erro ao alterar diretório de dados:', err);
      return { success: false, error: err.message };
    }
  }

  copyDataDirectoryContents(sourceDir, targetDir) {
    let count = 0;
    if (!fs.existsSync(sourceDir)) return count;

    const items = fs.readdirSync(sourceDir);
    for (const item of items) {
      const srcPath = path.join(sourceDir, item);
      const destPath = path.join(targetDir, item);

      const stat = fs.statSync(srcPath);
      if (stat.isDirectory()) {
        if (!fs.existsSync(destPath)) {
          fs.mkdirSync(destPath, { recursive: true });
        }
        const subItems = fs.readdirSync(srcPath);
        for (const sub of subItems) {
          const subSrc = path.join(srcPath, sub);
          const subDest = path.join(destPath, sub);
          if (!fs.existsSync(subDest)) {
            fs.copyFileSync(subSrc, subDest);
            count++;
          }
        }
      } else if (stat.isFile()) {
        if (!fs.existsSync(destPath)) {
          fs.copyFileSync(srcPath, destPath);
          count++;
        }
      }
    }
    return count;
  }

  ensureDataDirectory() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
    const imagesDir = path.join(this.dataDir, 'images');
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
    }
    const filesDir = path.join(this.dataDir, 'files');
    if (!fs.existsSync(filesDir)) {
      fs.mkdirSync(filesDir, { recursive: true });
    }
  }

  formatYearAndMonth(year, month) {
    const y = String(year).padStart(4, '0');
    const m = String(month).padStart(2, '0');
    return `${y}-${m}`;
  }

  getJournalFiles() {
    this.ensureDataDirectory();
    const files = fs.readdirSync(this.dataDir);
    const dateExp = /^(\d{4})-(\d{2})\.txt$/;
    const monthsList = [];

    for (const file of files.sort()) {
      const match = file.match(dateExp);
      if (match) {
        const year = parseInt(match[1], 10);
        const month = parseInt(match[2], 10);
        if (month >= 1 && month <= 12) {
          monthsList.push({
            filename: file,
            path: path.join(this.dataDir, file),
            year,
            month,
            key: this.formatYearAndMonth(year, month)
          });
        }
      }
    }
    return monthsList;
  }

  loadMonth(year, month) {
    const monthKey = this.formatYearAndMonth(year, month);
    const filePath = path.join(this.dataDir, `${monthKey}.txt`);

    if (!fs.existsSync(filePath)) {
      return { year, month, key: monthKey, days: {} };
    }

    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const parsedYaml = yaml.load(fileContent) || {};
      const days = {};

      for (const [dayNumStr, dayContent] of Object.entries(parsedYaml)) {
        const dayNum = parseInt(dayNumStr, 10);
        if (!isNaN(dayNum) && dayContent && typeof dayContent === 'object') {
          // Normalize day format
          const text = dayContent.text || '';
          const categories = {};
          
          for (const [key, val] of Object.entries(dayContent)) {
            if (key !== 'text') {
              categories[key] = val;
            }
          }

          days[dayNum] = {
            day: dayNum,
            text: text,
            categories: categories,
            raw: dayContent
          };
        }
      }

      return {
        year,
        month,
        key: monthKey,
        days,
        mtime: fs.statSync(filePath).mtimeMs
      };
    } catch (err) {
      console.error(`Error loading RedNotebook file ${filePath}:`, err);
      return { year, month, key: monthKey, days: {}, error: err.message };
    }
  }

  loadAllMonths() {
    const journalFiles = this.getJournalFiles();
    const result = {};
    for (const jFile of journalFiles) {
      result[jFile.key] = this.loadMonth(jFile.year, jFile.month);
    }
    return result;
  }

  saveMonth(year, month, daysData) {
    this.ensureDataDirectory();
    const monthKey = this.formatYearAndMonth(year, month);
    const filename = path.join(this.dataDir, `${monthKey}.txt`);
    const newFilename = path.join(this.dataDir, `${monthKey}.new.txt`);
    const oldFilename = path.join(this.dataDir, `${monthKey}.old.txt`);

    // Build RedNotebook compatible YAML structure
    const yamlData = {};
    for (const [dayNumStr, dayData] of Object.entries(daysData)) {
      const dayNum = parseInt(dayNumStr, 10);
      const text = dayData.text ? dayData.text.trim() : '';
      const categories = dayData.categories || {};

      // Check if day is empty
      const hasCategories = Object.keys(categories).length > 0;
      if (text || hasCategories) {
        const dayObj = { text: dayData.text || '' };
        for (const [catName, catVal] of Object.entries(categories)) {
          dayObj[catName] = catVal;
        }
        yamlData[dayNum] = dayObj;
      }
    }

    // Do not create empty month files if none exists
    if (Object.keys(yamlData).length === 0 && !fs.existsSync(filename)) {
      return { success: true, saved: false, message: 'Month is empty, no file created' };
    }

    // Dump to YAML with unicode enabled (matches PyYAML allow_unicode=True)
    const dumpedYaml = yaml.dump(yamlData, {
      lineWidth: -1,
      noRefs: true,
      quotingType: '"',
      forceQuotes: false
    });

    try {
      // Step 1: Write to .new.txt
      fs.writeFileSync(newFilename, dumpedYaml, 'utf-8');

      // Step 2: Validate written file
      const verifyContent = fs.readFileSync(newFilename, 'utf-8');
      const verifyParsed = yaml.load(verifyContent);
      if (JSON.stringify(verifyParsed || {}) !== JSON.stringify(yamlData)) {
        if (fs.existsSync(newFilename)) fs.unlinkSync(newFilename);
        throw new Error('YAML validation check failed during atomic write');
      }

      // Step 3: Backup existing file to .old.txt if present
      if (fs.existsSync(filename)) {
        fs.copyFileSync(filename, oldFilename);
        fs.unlinkSync(filename);
      }

      // Step 4: Move .new.txt to .txt
      fs.renameSync(newFilename, filename);

      // Step 5: Clean up .old.txt
      if (fs.existsSync(oldFilename)) {
        fs.unlinkSync(oldFilename);
      }

      return {
        success: true,
        saved: true,
        monthKey,
        path: filename,
        mtime: fs.statSync(filename).mtimeMs
      };
    } catch (err) {
      console.error(`Error saving month file ${filename}:`, err);
      if (fs.existsSync(newFilename)) {
        try { fs.unlinkSync(newFilename); } catch (e) {}
      }
      return { success: false, error: err.message };
    }
  }
}
