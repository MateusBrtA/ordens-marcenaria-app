@echo off
chcp 65001 >nul
title Sistema de Ordens de Marcenaria

echo.
echo ========================================
echo   Sistema de Ordens de Marcenaria
echo ========================================
echo.

REM Verificar se Python está instalado
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python não encontrado! Instale o Python primeiro.
    pause
    exit /b 1
)

REM Verificar se o arquivo de configuração existe
if not exist "config.json" (
    echo ❌ Arquivo config.json não encontrado!
    echo Certifique-se de que está executando na pasta correta.
    pause
    exit /b 1
)

REM Verificar se o script Python existe
if not exist "start_server.py" (
    echo ❌ Script start_server.py não encontrado!
    pause
    exit /b 1
)

echo 🚀 Iniciando servidor...
echo.

REM Executar o script Python
python start_server.py

echo.
echo 🏁 Servidor finalizado.
pause

