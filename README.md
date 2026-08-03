# OpenJournal - Fork Moderno do RedNotebook

[![Compatibilidade RedNotebook](https://img.shields.io/badge/RedNotebook-100%25%20Compat%C3%ADvel-blue.svg)](https://github.com/jendrikseipp/rednotebook)
[![License: GPL v2](https://img.shields.io/badge/License-GPL%20v2-blue.svg)](LICENSE)

O **OpenJournal** é um fork moderno, responsivo e elegante do projeto open-source **RedNotebook**. Ele foi desenvolvido com o objetivo de entregar uma experiência de diário pessoal de última geração (inspirada nas interfaces modernas de assistentes de IA como ChatGPT, Claude e Gemini), mantendo **100% de compatibilidade com o formato de arquivos de histórico do RedNotebook**.

---

## 🌟 Principais Recursos

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
Open_Journal/
├── original_rednotebook_src/     # Código-fonte oficial baixado do RedNotebook (v2.42)
├── server/                        # Backend Node.js para manuseio estrito dos arquivos YAML RedNotebook
│   ├── storage.js                 # Motor de armazenamento YAML atômico (idêntico ao storage.py)
│   ├── search.js                  # Motor de busca rápida e hashtags
│   ├── backup.js                  # Gerador e leitor de ZIP de backup
│   ├── onedrive.js                # Detecção e sincronizador de pastas OneDrive
│   └── index.js                  # Servidor Express API na porta 3001
├── client/                        # Interface Web SPA em Vite + React
│   ├── src/
│   │   ├── components/            # Componentes (Calendar, Editor, Timeline, Sidebar, Search, AI, Backup)
│   │   ├── styles/                # CSS com variáveis de tema Claro/Escuro
│   │   ├── utils/                 # Parser de marcação RedNotebook
│   │   └── App.jsx                # Componente principal
│   └── index.html                 # Shell HTML
├── package.json                   # Scripts e dependências (npm run dev)
└── vite.config.js                 # Configuração do Vite
```

---

## 🚀 Como Executar o OpenJournal

### Pré-requisitos
- **Node.js** (versão 18+ instalada)
- **npm** (incluso com o Node.js)

### Passos para iniciar:

1. **Instalar as dependências**:
   No terminal, na pasta raiz do projeto, execute:
   ```bash
   npm install
   ```

2. **Iniciar o aplicativo em modo de desenvolvimento**:
   ```bash
   npm run dev
   ```
   Isso iniciará simultaneamente:
   - Servidor Backend RedNotebook na porta `http://localhost:3001`
   - Interface Frontend em Vite na porta `http://localhost:3000` (abrindo automaticamente no seu navegador).

---

## 🧪 Teste de Compatibilidade com RedNotebook

Para comprovar a compatibilidade total com o RedNotebook original:
1. Crie qualquer anotação no OpenJournal e salve.
2. Acesse a pasta `data/` do projeto e note os arquivos `AAAA-MM.txt`.
3. Abra estes arquivos no RedNotebook desktop tradicional — eles serão carregados sem qualquer erro ou alteração na estrutura!

---

## 📜 Licença

Distribuído sob a licença **GPL v2 or later**, respeitando a licença do projeto original RedNotebook.
