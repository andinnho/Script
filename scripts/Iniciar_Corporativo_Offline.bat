@echo off
title OpenJournal - Diario de Passagem de Turno
chcp 65001 > nul
cls

echo ====================================================================
echo                   INICIANDO OPEN JOURNAL
echo ====================================================================
echo.

set "NODE_EXEC=node"
if exist "%~dp0node\node.exe" (
    set "NODE_EXEC=%~dp0node\node.exe"
)

echo  [1/2] Iniciando servidor local em http://localhost:3001...
echo  [2/2] Abrindo navegador...
echo.

start "" cmd /c "timeout /t 2 /nobreak > nul && start http://localhost:3001"

echo ====================================================================
echo  STATUS: SERVIDOR ATIVO (PORTA 3001)
echo  ------------------------------------------------------------------
echo  - O OpenJournal esta rodando nesta janela.
echo  - Mantenha esta janela aberta enquanto utiliza o sistema.
echo  - Para encerrar o sistema, basta fechar esta janela.
echo ====================================================================
echo.

"%NODE_EXEC%" server/index.js
if errorlevel 1 (
    echo.
    echo  [ERRO] Nao foi possivel iniciar o servidor na porta 3001.
    echo  Verifique se o sistema ja esta aberto em outra janela.
    echo.
    pause
)
