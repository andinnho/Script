# Script - OpenJournal | Servidor Corporativo

## Como usar

### Pré-requisito
- **Node.js** instalado (versão LTS): https://nodejs.org/

### Iniciar o servidor
Dê um duplo clique no arquivo:
```
Iniciar_Servidor.bat
```

O navegador abrirá automaticamente na **Central de Downloads**.

### Acessos disponíveis
| Endereço | Descrição |
|---|---|
| http://localhost:3001/downloads | Central de Downloads (Intranet) |
| http://localhost:3001 | Aplicativo Script (Diário) |

### Acesso pela rede interna (Intranet)
Descubra o IP da máquina com:
```
ipconfig
```
E compartilhe com os analistas:
```
http://SEU-IP:3001/downloads
```
Exemplo: `http://192.168.1.100:3001/downloads`

### Estrutura dos arquivos
```
Script-Corporativo/
├── server/              → Servidor backend (API + arquivos)
│   └── distribution/   → Arquivos de distribuição
│       └── releases/   → Executáveis para download (.exe)
├── dist/                → Interface web (frontend compilado)
├── package.json         → Configuração do projeto
└── Iniciar_Servidor.bat → Inicia tudo com duplo clique
```

### Publicar nova versão
Quando houver uma nova versão para distribuir:
1. Copie os novos `.exe` para `server/distribution/releases/vX.X.X/`
2. Execute: `node scripts/publish-release.js`
3. Reinicie o servidor

---
*Script - OpenJournal | Desenvolvido para TI & Operações de Rede*
