# OpenJournal - Fork Moderno do RedNotebook (Desktop Electron)

[![Compatibilidade RedNotebook](https://img.shields.io/badge/RedNotebook-100%25%20Compat%C3%ADvel-blue.svg)](https://github.com/jendrikseipp/rednotebook)
[![Electron Desktop](https://img.shields.io/badge/Electron-Windows%20App-47848F.svg)](https://www.electronjs.org/)
[![License: GPL v2](https://img.shields.io/badge/License-GPL%20v2-blue.svg)](LICENSE)

O **OpenJournal (Script)** é um aplicativo desktop nativo e moderno para Windows, desenvolvido com **Electron**, **React** e **Node.js**. Ele entrega uma experiência de diário de bordo/passagem de turno pessoal de última geração (inspirada nas UIs do ChatGPT, Claude e Gemini), mantendo **100% de compatibilidade com o formato de arquivos de histórico do RedNotebook**.

---

## 🌟 Principais Recursos

- 💻 **Aplicativo Desktop Nativo (Windows)**:
  - Rodando diretamente em uma janela nativa via **Electron**, sem necessidade de scripts `.bat` ou navegadores abertos.
  - Execução silenciosa sem janelas de terminal ou Prompt de Comando.
  - Atalhos automáticos na Área de Trabalho e Menu Iniciar gerados pelo instalador.
- 🔒 **Compatibilidade de Dados 100% Garantida**:
  - Armazenamento em arquivos `data/AAAA-MM.txt` em formato **YAML UTF-8**.
  - Estrutura de chaves por dia (`1` a `31`), marcas de texto (`**negrito**`, `//itálico//`, `== Títulos ==`, `#hashtags`, `[links]`, `[image: ...]`).
  - Nenhuma conversão necessária: abra diários antigos do RedNotebook diretamente no OpenJournal e vice-versa.
- 🎨 **Interface Moderna & Responsiva**:
  - Temas **Claro** e **Escuro** com troca instantânea.
  - Ícones vetoriais estilo *outline* inspirados nas UIs do ChatGPT e Claude.
- ✏️ **Editor de Texto Aprimorado**:
  - Barra de ferramentas para formatação rápida.
  - Visualização em tempo real (Split-view) ou modo focado.
  - Suporte a imagens, mídias e anexos com upload direto.
- 📅 **Calendário & Timeline Diária**:
  - Calendário mensal interativo com indicativo visual de dias com escrita (pontos verdes).
  - Visão em linha do tempo (Timeline) diária.
- 🔍 **Busca Rápida & Nuvem de Tags**:
  - Pesquisa instantânea por texto, intervalo de datas ou hashtags.
  - Nuvem de tags extraídas automaticamente das `#hashtags` e categorias.
- 📁 **Backup, Restauração e OneDrive**:
  - Exportação e importação de todo o histórico em arquivos `.zip`.
  - Detecção automática e suporte à sincronização de pastas na nuvem pelo **Microsoft OneDrive**.
- 🤖 **Pronto para Integração com IA**:
  - Painel lateral de assistente de IA para geração de resumos, perguntas reflexivas e melhoria de escrita.

---

## 📁 Estrutura do Projeto

```
Script/
├── electron/                      # Processo principal e pré-carregamento do Electron
│   ├── main.js                    # Inicializador da janela desktop e servidor embutido
│   └── preload.js                 # Bridge seguro IPC
├── build/                         # Ícones nativos executáveis (icon.ico e icon.png)
├── server/                        # Backend Node.js para manuseio estrito dos arquivos YAML RedNotebook
│   ├── storage.js                 # Motor de armazenamento YAML atômico
│   ├── search.js                  # Motor de busca rápida e hashtags
│   ├── backup.js                  # Gerador e leitor de ZIP de backup
│   ├── onedrive.js                # Detecção e sincronizador de pastas OneDrive
│   └── index.js                  # Servidor Express API (Exportável/Standalone)
├── client/                        # Interface Web SPA em Vite + React
│   ├── src/                       # Componentes React, Estilos e Parsers
│   └── index.html                 # Shell HTML
├── dist/                          # Build estático da interface web
├── release/                       # Executável (.exe) e Instalador Windows gerados pelo Electron Builder
├── package.json                   # Scripts de build e dependências do projeto
└── electron-builder.json          # Configuração de empacotamento NSIS/Portable
```

---

## 🚀 Como Executar e Compilar o OpenJournal

### Pré-requisitos
- **Node.js** (versão 18+ instalada)
- **npm** (incluso com o Node.js)

### 1. Executar em Modo de Desenvolvimento (Electron Desktop):
```bash
npm run electron:dev
```
Isso iniciará o servidor Vite frontend e abrirá automaticamente o aplicativo na janela desktop nativa do Electron.

### 2. Gerar o Instalador Executável (.exe) para Windows:
```bash
npm run electron:build
```
Após a conclusão, os arquivos compilados estarão disponíveis na pasta `release/`:
- `release/Script-Setup-1.0.0.exe` (Instalador NSIS com atalhos na Área de Trabalho e Menu Iniciar)
- `release/Script-1.0.0.exe` (Versão Portátil)

---

## 🧪 Teste de Compatibilidade com RedNotebook

Para comprovar a compatibilidade total com o RedNotebook original:
1. Crie qualquer anotação no OpenJournal e salve.
2. Acesse a pasta `data/` do projeto (ou sua pasta customizada no OneDrive) e note os arquivos `AAAA-MM.txt`.
3. Abra estes arquivos no RedNotebook desktop tradicional — eles serão carregados sem qualquer erro ou alteração na estrutura!

---

## 📜 Licença

Distribuído sob a licença **GPL v2 or later**, respeitando a licença do projeto original RedNotebook.

