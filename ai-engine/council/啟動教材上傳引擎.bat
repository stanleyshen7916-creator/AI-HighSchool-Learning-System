@echo off
chcp 65001 >nul
setlocal EnableExtensions EnableDelayedExpansion
title 教材上傳引擎 - 啟動

REM ============================================================
REM 教材上傳引擎啟動器（原 AI Study Council，2026-09-29 併入學習平台）
REM   1. 等待 Docker Engine 就緒
REM   2. 若舊的 AI-Study-Council Runtime 正在執行，先停止（stop，不刪除任何資料）
REM   3. 啟動 ai-engine\council\docker-compose.yml
REM   4. 開啟 http://localhost:3000/upload.html
REM
REM 執行期資料：未設定 COUNCIL_DATA_DIR 時，若舊的 AI-Study-Council 資料夾存在，
REM 直接沿用它（Ollama 模型、MinerU 模型快取、既有 Final.md），不搬移、不重新下載。
REM ============================================================

set "ENGINE=%~dp0"
set "COMPOSE=%ENGINE%docker-compose.yml"
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
docker compose -f "%COMPOSE%" up -d --build
if errorlevel 1 (
    echo [ERROR] Docker Compose 啟動失敗，請保留本視窗畫面的錯誤內容。
    pause
    exit /b 1
)
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
echo.
echo [4/4] 開啟教材上傳頁（請以 Admin 登入）...
start "" "%URL%"
echo.
docker compose -f "%COMPOSE%" ps
echo.
echo 本視窗可關閉；引擎會繼續由 Docker 執行。
pause
endlocal
