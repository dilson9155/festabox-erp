@echo off
chcp 65001 > nul
title FestaBox ERP - Instalador
color 0B
echo.
echo ============================================
echo   FestaBox ERP - Instalacao Automatica
echo ============================================
echo.

cd /d "%~dp0"

echo [1/6] Verificando Node.js...
node --version > nul 2>&1
if errorlevel 1 (
    echo.
    echo  ERRO: Node.js nao encontrado!
    echo  Instale em: https://nodejs.org (versao 20 LTS)
    echo.
    pause
    exit /b 1
)

echo [2/6] Configurando SQLite...
powershell -Command "(Get-Content prisma\schema.prisma) -replace 'provider\s*=\s*\"postgresql\"','provider = \"sqlite\"' | Set-Content prisma\schema.prisma"
powershell -Command "(Get-Content prisma\schema.prisma) -replace 'url\s*=\s*env\(\"DATABASE_URL\"\)','url = \"file:./dev.db\"' | Set-Content prisma\schema.prisma"

if not exist .env (
    echo DATABASE_URL="file:./dev.db" > .env
    echo AUTH_SECRET="festabox-dev-secret-change-me-please" >> .env
    echo AUTH_URL="http://localhost:3001" >> .env
)

echo [3/6] Instalando dependencias (pode demorar)...
call npm install
if errorlevel 1 (
    echo ERRO no npm install
    pause
    exit /b 1
)

echo [4/6] Criando banco de dados...
call npm run db:push
if errorlevel 1 (
    echo ERRO no db push
    pause
    exit /b 1
)

echo [5/6] Populando dados de demonstracao...
call npm run db:seed
if errorlevel 1 (
    echo ERRO no seed
    pause
    exit /b 1
)

echo.
echo ============================================
echo   Instalacao concluida com sucesso!
echo.
echo   Iniciando servidor na porta 3001...
echo   Acesse: http://localhost:3001
echo.
echo   Login: admin@festabox.com
echo   Senha: admin123
echo.
echo   NAO FECHE esta janela!
echo ============================================
echo.

start http://localhost:3001
call npm run dev
pause