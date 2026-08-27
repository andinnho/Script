@echo off
chcp 65001 > nul
title Script - OpenJournal | Servidor Corporativo

echo.
echo  ╔══════════════════════════════════════════════════════╗
echo  ║        Script - OpenJournal v1.0.0                   ║
echo  ║        Servidor Corporativo - Intranet               ║
echo  ╚══════════════════════════════════════════════════════╝
echo.

:: Verificar se o Node.js está instalado
where node >nul 2>&1
if errorlevel 1 (
    echo  [ERRO] Node.js não encontrado!
    echo.
    echo  Por favor, instale o Node.js antes de continuar:
    echo  https://nodejs.org/  ^(versão LTS recomendada^)
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VER=%%i
echo  [OK] Node.js encontrado: %NODE_VER%
echo.

:: Instalar dependências se necessário
if not exist "node_modules\" (
    echo  [INFO] Instalando dependências pela primeira vez...
    echo  ^(Isso pode levar alguns minutos^)
    echo.
    npm install --omit=dev
    if errorlevel 1 (
        echo  [ERRO] Falha ao instalar dependências.
        pause
        exit /b 1
    )
    echo.
    echo  [OK] Dependências instaladas com sucesso!
    echo.
)

:: Abrir o navegador na Central de Downloads após 2 segundos
echo  [INFO] Abrindo Central de Downloads no navegador...
start /B cmd /C "timeout /t 2 > nul && start http://localhost:3001/downloads"

:: Iniciar o servidor
echo  ════════════════════════════════════════════════════════
echo   Servidor rodando em: http://localhost:3001
echo   Central de Downloads: http://localhost:3001/downloads
echo   Aplicativo: http://localhost:3001
echo  ════════════════════════════════════════════════════════
echo.
echo   Para encerrar o servidor, feche esta janela ou pressione Ctrl+C
echo.

node server/index.js

pause
