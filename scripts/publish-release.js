import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

function calculateSHA256(filePath) {
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function publishRelease() {
  const pkgPath = path.resolve('package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  const version = pkg.version || '1.0.0';
  const releaseDate = new Date().toISOString().slice(0, 10);

  const releaseSourceDir = path.resolve('release');
  const targetDir = path.resolve(`server/distribution/releases/v${version}`);

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const installerName = `Script Setup ${version}.exe`;
  const portableName = `Script ${version}.exe`;

  const srcInstaller = path.join(releaseSourceDir, installerName);
  const srcPortable = path.join(releaseSourceDir, portableName);

  if (!fs.existsSync(srcInstaller)) {
    console.error(`[ERRO] Arquivo do instalador não encontrado em: ${srcInstaller}`);
    console.error('Execute `npm run electron:build` primeiro.');
    process.exit(1);
  }

  // 1. Copiar executáveis para o repositório de distribuição
  const destInstaller = path.join(targetDir, installerName);
  const destPortable = path.join(targetDir, portableName);

  fs.copyFileSync(srcInstaller, destInstaller);
  console.log(`✓ Copiado: ${installerName} -> ${targetDir}`);

  let hasPortable = false;
  if (fs.existsSync(srcPortable)) {
    fs.copyFileSync(srcPortable, destPortable);
    hasPortable = true;
    console.log(`✓ Copiado: ${portableName} -> ${targetDir}`);
  }

  // 2. Calcular Hashes SHA256 e Tamanhos
  const installerStat = fs.statSync(destInstaller);
  const installerHash = calculateSHA256(destInstaller);

  let portableStat = null;
  let portableHash = null;
  if (hasPortable) {
    portableStat = fs.statSync(destPortable);
    portableHash = calculateSHA256(destPortable);
  }

  // 3. Gerar SHA256.txt
  const sha256Content = `================================================================================
SCRIPT (OPENJOURNAL) - VALIDAÇÃO DE INTEGRIDADE SHA-256
Data de Publicação: ${releaseDate} | Versão: v${version}
================================================================================

1. INSTALADOR WINDOWS (NSIS)
   Arquivo: ${installerName}
   Tamanho: ${formatBytes(installerStat.size)} (${installerStat.size} bytes)
   SHA-256: ${installerHash}

${hasPortable ? `2. VERSÃO PORTÁTIL WINDOWS
   Arquivo: ${portableName}
   Tamanho: ${formatBytes(portableStat.size)} (${portableStat.size} bytes)
   SHA-256: ${portableHash}` : ''}
================================================================================
`;

  const sha256Path = path.resolve('server/distribution/SHA256.txt');
  fs.writeFileSync(sha256Path, sha256Content, 'utf-8');
  console.log(`✓ Arquivo SHA256.txt gerado com sucesso!`);

  // 4. Gerar/Atualizar CHANGELOG.md
  const changelogPath = path.resolve('server/distribution/CHANGELOG.md');
  const newChangelogEntry = `## [v${version}] - ${releaseDate}

### 🚀 Novidades e Melhorias
- Módulo de distribuição e atualizações automáticas integrado.
- Página de Downloads dedicada para a Intranet da empresa.
- Validação de integridade via checksum SHA-256.
- Preservação total de histórico, configurações e preferências em %APPDATA%/OpenJournal.
- Versão desktop nativa com Electron sem dependência de navegadores ou scripts batch.

---

`;

  let existingChangelog = '';
  if (fs.existsSync(changelogPath)) {
    existingChangelog = fs.readFileSync(changelogPath, 'utf-8');
  }

  if (!existingChangelog.includes(`## [v${version}]`)) {
    fs.writeFileSync(changelogPath, newChangelogEntry + existingChangelog, 'utf-8');
  }

  // 5. Gerar version.json
  const manifest = {
    version,
    releaseDate,
    installerFilename: installerName,
    portableFilename: portableName,
    installerSize: formatBytes(installerStat.size),
    portableSize: hasPortable ? formatBytes(portableStat.size) : null,
    installerSha256: installerHash,
    portableSha256: portableHash,
    installerUrl: `/api/download/installer`,
    portableUrl: `/api/download/portable`,
    changelogUrl: `/api/download/changelog`,
    sha256Url: `/api/download/sha256`,
    changelog: [
      "Módulo de distribuição e atualizações automáticas integrado",
      "Página de Downloads dedicada para a Intranet da empresa",
      "Validação de integridade via checksum SHA-256",
      "Preservação total das configurações e diários do usuário",
      "Versão desktop nativa com Electron e instalador Windows"
    ]
  };

  const versionJsonPath = path.resolve('server/distribution/version.json');
  fs.writeFileSync(versionJsonPath, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`✓ Manifesto version.json atualizado para v${version}!`);
  console.log('\n🎉 Publicação da versão concluída com sucesso!');
}

publishRelease().catch(err => {
  console.error('Erro ao publicar versão:', err);
  process.exit(1);
});
