@echo off
chcp 65001 > nul
title FestaBox ERP - Publicar no GitHub e Vercel
color 0E

echo.
echo ============================================================
echo   FestaBox ERP - Publicacao automatica
echo   GitHub + Vercel + PostgreSQL (Neon)
echo ============================================================
echo.

cd /d "%~dp0"

REM =========================
REM 1. Validar requisitos
REM =========================
echo [1/8] Verificando requisitos...

where git > nul 2>&1
if errorlevel 1 (
    echo  ERRO: git nao encontrado. Instale em https://git-scm.com
    pause & exit /b 1
)

where node > nul 2>&1
if errorlevel 1 (
    echo  ERRO: Node.js nao encontrado. Instale em https://nodejs.org
    pause & exit /b 1
)

if not exist node_modules (
    echo  Instalando dependencias do projeto...
    call npm install --legacy-peer-deps > nul
)

echo [OK] Requisitos OK
echo.

REM =========================
REM 2. Garantir schema PostgreSQL para producao
REM =========================
echo [2/8] Configurando schema para PostgreSQL (Vercel/Neon)...
powershell -Command "(Get-Content prisma\schema.prisma) -replace 'provider = \"sqlite\"','provider = \"postgresql\"' | Set-Content prisma\schema.prisma"

REM =========================
REM 3. GitHub - autenticar e enviar
REM =========================
echo [3/8] Configurando GitHub...

where gh > nul 2>&1
if errorlevel 1 (
    echo.
    echo  GitHub CLI (gh) nao encontrado. Instalando...
    winget install --id GitHub.cli -e --silent > nul 2>&1
    if errorlevel 1 (
        echo  Baixando GitHub CLI direto...
        curl -L -o %TEMP%\gh.zip" "https://github.com/cli/cli/releases/download/v2.62.0/gh_2.62.0_windows_amd64.zip > nul 2>&1
        powershell -Command "Expand-Archive -Path '%TEMP%\gh.zip' -DestinationPath '%TEMP%\gh' -Force"
        set PATH=%PATH%;%TEMP%\gh\gh_2.62.0_windows_amd64\bin
    )
)

echo.
echo  === LOGIN NO GITHUB ===
echo  Uma janela do navegador vai abrir para voce autorizar.
echo.
gh auth login --web --git-protocol https > nul 2>&1
if errorlevel 1 gh auth login --web > nul 2>&1

if errorlevel 1 (
    echo.
    echo  Nao foi possivel autenticar via web.
    echo  Vou pedir seu Personal Access Token (crie em https://github.com/settings/tokens com scope 'repo').
    echo.
    set /p GH_TOKEN="Cole seu token aqui: "
    if "%GH_TOKEN%"=="" (
        echo  Token vazio. Abortando.
        pause & exit /b 1
    )
    echo %GH_TOKEN% | gh auth login --with-token > nul 2>&1
)

echo [OK] GitHub autenticado
echo.

REM =========================
REM 4. Criar/enviar repositorio
REM =========================
echo [4/8] Criando repositorio festabox-erp no GitHub...

gh repo view festabox-24h/festabox-erp > nul 2>&1
if errorlevel 1 (
    gh repo create festabox-24h/festabox-erp --public --source=. --remote=origin --push --description "FestaBox ERP - Sistema profissional de gestao comercial e PDV" > nul 2>&1
    if errorlevel 1 (
        echo.
        echo  Ja existe ou conflito. Tentando apenas enviar...
        git remote add origin https://github.com/festabox-24h/festabox-erp.git > nul 2>&1
        git push -u origin main 2>&1
    )
) else (
    echo  Repositorio ja existe. Atualizando...
    git remote add origin https://github.com/festabox-24h/festabox-erp.git > nul 2>&1
    git push -u origin main 2>&1
)

if errorlevel 1 (
    echo  ERRO ao enviar para o GitHub. Verifique permissoes.
    pause & exit /b 1
)
echo [OK] Codigo no GitHub: https://github.com/festabox-24h/festabox-erp
echo.

REM =========================
REM 5. Vercel - instalar CLI
REM =========================
echo [5/8] Preparando Vercel CLI...
where vercel > nul 2>&1
if errorlevel 1 (
    echo  Instalando Vercel CLI globalmente...
    call npm install -g vercel > nul 2>&1
)
vercel --version > nul 2>&1
if errorlevel 1 (
    echo  ERRO: vercel CLI nao instalou
    pause & exit /b 1
)
echo [OK] Vercel CLI pronto
echo.

REM =========================
REM 6. Login Vercel
REM =========================
echo [6/8] Login no Vercel (janela do navegador abrira)...
call vercel login
if errorlevel 1 (
    echo  ERRO no Login no Vercel
    pause & exit /b 1
)
echo.

REM =========================
REM 7. Configurar variaveis de ambiente
REM =========================
echo [7/8] Configurando variaveis de ambiente...
echo.
echo  === BANCO DE DADOS POSTGRESQL ===
echo  Crie um banco GRATIS em https://neon.tech (recomendado) ou https://supabase.com
echo  Copie a "Connection string" completa (termina com ?sslmode=require)
echo.
set /p DATABASE_URL="Cole a DATABASE_URL do PostgreSQL: "

if "%DATABASE_URL%"=="" (
    echo  DATABASE_URL obrigatoria. Abortando.
    pause & exit /b 1
)

REM Gerar AUTH_SECRET aleatorio
powershell -Command "$s = [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }) -as 'byte[]'); echo $s" 2>&1 > %TEMP%\secret.txt
set /p AUTH_SECRET=<%TEMP%\secret.txt

echo.
echo  Aplicando variaveis ao projeto Vercel...

call vercel link --yes > nul 2>&1

echo %DATABASE_URL% | call vercel env add DATABASE_URL production > nul 2>&1
echo %DATABASE_URL% | call vercel env add DATABASE_URL preview > nul 2>&1
echo %DATABASE_URL% | call vercel env add DATABASE_URL development > nul 2>&1

echo %AUTH_SECRET% | call vercel env add AUTH_SECRET production > nul 2>&1
echo %AUTH_SECRET% | call vercel env add AUTH_SECRET preview > nul 2>&1
echo %AUTH_SECRET% | call vercel env add AUTH_SECRET development > nul 2>&1

echo [OK] Variaveis configuradas
echo.

REM =========================
REM 8. Deploy
REM =========================
echo [8/8] Fazendo deploy no Vercel...
echo  (isso pode demorar 1-3 minutos)
echo.

call vercel deploy --prod --yes

if errorlevel 1 (
    echo.
    echo  ERRO no deploy. Verifique os logs acima.
    pause & exit /b 1
)

echo.
echo ============================================================
echo   PUBLICACAO CONCLUIDA COM SUCESSO!
echo.
echo   Repositorio: https://github.com/festabox-24h/festabox-erp
echo.
echo   PROXIMOS PASSOS:
echo   1. Copie a URL do Vercel mostrada acima
echo   2. Adicione tambem: vercel env add NEXTAUTH_URL (sua URL)
echo   3. Popule o banco: vercel env pull ^&^& npm run db:seed
echo   4. Acesse sua URL no navegador
echo.
echo   Login: admin@festabox.com / admin123
echo ============================================================
echo.
pause