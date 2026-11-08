@echo off
chcp 65001 >nul
setlocal EnableExtensions EnableDelayedExpansion
title 教材上傳引擎 - 啟動

REM ============================================================
REM 教材上傳引擎啟動器（原 AI Study Council，2026-09-29 併入學習平台）
REM   1. 等待 Docker Engine 就緒
REM   2. 若舊的 AI-Study-Council Runtime 正在執行，先停止（stop，不刪除任何資料）
REM   3. 啟動 ai-engine\council\docker-compose.yml（依顯示卡加上 nvidia 或 host-ollama 設定檔）
REM   4. 開啟 http://localhost:3000/upload.html
REM
REM 執行期資料：未設定 COUNCIL_DATA_DIR 時，若舊的 AI-Study-Council 資料夾存在，
REM 直接沿用它（Ollama 模型、MinerU 模型快取、既有 Final.md），不搬移、不重新下載。
REM ============================================================

set "ENGINE=%~dp0"
set "COMPOSE=%ENGINE%docker-compose.yml"
REM 2026-11-03：依顯示卡選擇 Ollama
REM   有 NVIDIA → 容器版 Ollama 使用 GPU（docker-compose.nvidia.yml）
REM   沒有 NVIDIA、主機 Ollama 有回應（例如 Intel Arc 筆電）→ 改連主機 Ollama（docker-compose.host-ollama.yml）
REM   都沒有 → 容器版 Ollama 走 CPU（很慢）
set "COMPOSE_FILES=-f "%COMPOSE%""
set "OLLAMA_MODE=容器版 Ollama（CPU）"
set "HAS_NVIDIA=0"
where nvidia-smi >nul 2>&1
if not errorlevel 1 (
    nvidia-smi >nul 2>&1
    if not errorlevel 1 set "HAS_NVIDIA=1"
)
if "!HAS_NVIDIA!"=="1" (
    set "COMPOSE_FILES=!COMPOSE_FILES! -f "%ENGINE%docker-compose.nvidia.yml""
    set "OLLAMA_MODE=容器版 Ollama（NVIDIA GPU）"
) else (
    set "COUNCIL_HOST_OLLAMA_PORT=11434"
    if defined OLLAMA_HOST for /f "tokens=2 delims=:" %%P in ("%OLLAMA_HOST:http://=%") do set "COUNCIL_HOST_OLLAMA_PORT=%%P"
    powershell -NoProfile -Command "try { Invoke-WebRequest -Uri 'http://127.0.0.1:!COUNCIL_HOST_OLLAMA_PORT!/api/version' -UseBasicParsing -TimeoutSec 3 | Out-Null; exit 0 } catch { exit 1 }" >nul 2>&1
    if not errorlevel 1 (
        set "COMPOSE_FILES=!COMPOSE_FILES! -f "%ENGINE%docker-compose.host-ollama.yml""
        set "OLLAMA_MODE=主機 Ollama（127.0.0.1:!COUNCIL_HOST_OLLAMA_PORT!）"
    )
)
set "OLD_COUNCIL=%ENGINE%..\..\..\AI-Study-Council"
set "HEALTH=http://localhost:3000/api/health"
set "URL=http://localhost:3000/upload.html"

if not defined COUNCIL_DATA_DIR (
    if exist "%OLD_COUNCIL%\ollama_data" (
        for %%I in ("%OLD_COUNCIL%") do set "COUNCIL_DATA_DIR=%%~fI"
    )
)
if defined COUNCIL_DATA_DIR (
    echo 執行期資料目錄：%COUNCIL_DATA_DIR%
) else (
    echo 執行期資料目錄：%ENGINE%data
)
echo Ollama：!OLLAMA_MODE!
echo.

echo [1/4] 等待 Docker Engine 啟動...
set /a COUNT=0
:WAIT_DOCKER
docker info >nul 2>&1
if not errorlevel 1 goto DOCKER_READY
set /a COUNT+=1
if !COUNT! GEQ 30 (
    echo [ERROR] Docker Engine 在 60 秒內沒有就緒，請確認 Docker Desktop 已開啟後重新執行。
    pause
    exit /b 1
)
timeout /t 2 /nobreak >nul
goto WAIT_DOCKER
:DOCKER_READY
echo [OK] Docker Engine 已就緒。
echo.

echo [2/4] 停止舊的 AI-Study-Council Runtime（若有；只停止，不刪除資料）...
if exist "%OLD_COUNCIL%\docker-compose.agent.yml" (
    docker compose -f "%OLD_COUNCIL%\docker-compose.agent.yml" stop >nul 2>&1
)
echo.

echo [3/4] 啟動教材上傳引擎...
REM 2026-11-08：引擎程式碼是掛載進容器的（不是打包在 image 裡），所以啟動前先把本機
REM 平台資料夾更新到 GitHub 最新版，啟動後再重新啟動引擎容器，新功能才會生效。
REM 只在 main 分支、沒有未提交變更時更新；更新失敗不影響啟動。
set "REPO=%ENGINE%..\.."
where git >nul 2>&1
if not errorlevel 1 (
    for /f "delims=" %%B in ('git -C "%REPO%" rev-parse --abbrev-ref HEAD 2^>nul') do set "CUR_BRANCH=%%B"
    git -C "%REPO%" diff --quiet HEAD >nul 2>&1
    if errorlevel 1 (
        echo [WARNING] 平台資料夾有尚未提交的變更，略過自動更新。
    ) else if /i "!CUR_BRANCH!"=="main" (
        git -C "%REPO%" fetch -q origin main && git -C "%REPO%" merge -q --ff-only origin/main && echo [OK] 平台程式已更新到最新版。
        if errorlevel 1 echo [WARNING] 無法自動更新平台程式，沿用目前版本。
    ) else (
        echo [WARNING] 平台資料夾目前在 !CUR_BRANCH! 分支，略過自動更新。
    )
)
docker compose !COMPOSE_FILES! up -d --build
if errorlevel 1 (
    echo [ERROR] Docker Compose 啟動失敗，請保留本視窗畫面的錯誤內容。
    pause
    exit /b 1
)
REM 讓已在執行的引擎載入剛更新的程式碼
docker compose !COMPOSE_FILES! restart council-engine >nul 2>&1
set /a COUNT=0
:WAIT_WEB
powershell -NoProfile -ExecutionPolicy Bypass -Command "try { $r=Invoke-WebRequest -Uri '%HEALTH%' -UseBasicParsing -TimeoutSec 2; if ($r.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>&1
if not errorlevel 1 goto WEB_READY
set /a COUNT+=1
if !COUNT! GEQ 60 (
    echo [WARNING] 引擎在 120 秒內尚未回應，請稍候再開啟 %URL%
    goto OPEN_BROWSER
)
timeout /t 2 /nobreak >nul
goto WAIT_WEB
:WEB_READY
echo [OK] 引擎已就緒。
echo.

:OPEN_BROWSER
REM 2026-10-05：發布後自動 commit + push。引擎在 Docker 裡沒有 git 與 GitHub 憑證，
REM 由主機上的 git-publisher.ps1 處理推送請求（只會提交該教材的檔案，且只推送 main）。
if defined COUNCIL_DATA_DIR (set "QUEUE=%COUNCIL_DATA_DIR%\git_queue") else (set "QUEUE=%ENGINE%data\git_queue")
echo 啟動發布推送程式（最小化視窗，發布教材時請勿關閉）...
start "教材發布推送 - 請勿關閉" /min powershell -NoProfile -ExecutionPolicy Bypass -File "%ENGINE%tools\git-publisher.ps1" -RepoRoot "%ENGINE%..\.." -QueueDir "!QUEUE!"
REM 2026-11-06：知識弱點頁「產生重點整理」按鈕由本機的錯題重點整理程式處理（已在執行就不會重複開）。
call "%ENGINE%啟動錯題重點整理.bat" /noinitial
echo.
echo [4/4] 開啟教材上傳頁（請以 Admin 登入）...
start "" "%URL%"
echo.
docker compose !COMPOSE_FILES! ps
echo.
echo 本視窗可關閉；引擎會繼續由 Docker 執行。
pause
endlocal
