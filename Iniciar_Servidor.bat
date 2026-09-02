@echo off
chcp 65001 > nul
title Script | Servidor & Aplicativo Desktop

echo.
echo  ╔══════════════════════════════════════════════════════╗
echo  ║        Script v1.0.0                               ║
echo  ║        Inicializador do Aplicativo Desktop         ║
echo  ╚══════════════════════════════════════════════════════╝
echo.

:: Verificar se o Node.js está instalado
where node >nul 2>&1
if errorlevel 1 (
    echo  [ERRO] Node.js não encontrado!
    echo.
    echo  Por favor, instale o Node.js antes de continuar:
    echo  https://nodejs.org/  (versão LTS recomendada)
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
    echo  (Isso pode levar alguns minutos)
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

:: Iniciar o aplicativo desktop nativo com a Splash Screen
echo  [INFO] Iniciando aplicativo Desktop com Splash Screen...
echo  ════════════════════════════════════════════════════════
echo   Servidor rodando em: http://localhost:3001
echo   Aplicativo Desktop: Iniciando Electron nativo...
echo  ════════════════════════════════════════════════════════
echo.

npx electron .

pause
