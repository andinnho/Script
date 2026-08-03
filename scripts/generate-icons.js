import fs from 'fs';
import path from 'path';
import pngToIco from 'png-to-ico';

const buildDir = path.resolve('build');
const logoPath = path.resolve('img/logo-script.png');

if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

// 1. Copiar imagem de alta resolução para build/icon.png
fs.copyFileSync(logoPath, path.join(buildDir, 'icon.png'));
console.log('✓ Icone PNG gerado: build/icon.png');

// 2. Converter PNG para icon.ico (256x256 multi-resolution)
pngToIco(logoPath)
  .then(buf => {
    fs.writeFileSync(path.join(buildDir, 'icon.ico'), buf);
    console.log('✓ Icone ICO gerado com sucesso: build/icon.ico');
  })
  .catch(err => {
    console.error('Erro ao gerar icon.ico:', err);
  });
