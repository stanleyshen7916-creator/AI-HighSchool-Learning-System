@echo off
chcp 65001 >nul
setlocal EnableExtensions EnableDelayedExpansion
title 安裝錯題重點整理開機自動執行

REM ============================================================
REM 只需執行一次：
REM   1. 確認 claude（撰寫）、git、gh、node 都已安裝
REM   2. 儲存 Supabase service_role 金鑰到 %USERPROFILE%\.ahs\supabase-service-role.key
REM      （只存在這台電腦，不會上傳；之後要換金鑰，重新執行本檔即可）
REM   3. 在「啟動」資料夾建立捷徑：每次開機登入後自動執行「啟動錯題重點整理.bat」
REM ============================================================

set "ENGINE=%~dp0"
echo [1/3] 檢查必要程式...
set "MISSING="
for %%T in (git gh node) do (
    where %%T >nul 2>&1
    if errorlevel 1 set "MISSING=!MISSING! %%T"
)
if defined MISSING (
    echo [ERROR] 找不到：!MISSING!
    echo   gh：安裝 GitHub CLI 後執行 gh auth login
    pause
    exit /b 1
)
echo [OK] git、gh、node 都已安裝。
where claude >nul 2>&1
if errorlevel 1 (
    echo [ERROR] 找不到 Claude Code。安裝：npm install -g @anthropic-ai/claude-code，再執行 claude 一次完成登入
    pause
    exit /b 1
)
echo [OK] Claude Code 已安裝。
echo.

echo [2/3] Supabase service_role 金鑰
set "KEYDIR=%USERPROFILE%\.ahs"
set "KEYFILE=%KEYDIR%\supabase-service-role.key"
if exist "%KEYFILE%" (
    echo 已有金鑰檔：%KEYFILE%
    set /p "REPLACE=要換新的金鑰嗎？(y/N) "
    if /i not "!REPLACE!"=="y" goto KEY_DONE
)
echo 請到 Supabase 專案 Settings ^> API Keys 複製 secret（或舊版 service_role）金鑰，貼上後按 Enter：
powershell -NoProfile -ExecutionPolicy Bypass -Command "$s = Read-Host -AsSecureString; $k = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($s)).Trim(); if (-not $k) { exit 1 }; New-Item -ItemType Directory -Force -Path '%KEYDIR%' | Out-Null; [IO.File]::WriteAllText('%KEYFILE%', $k); icacls '%KEYFILE%' /inheritance:r /grant:r ('{0}:F' -f $env:USERNAME) | Out-Null"
if errorlevel 1 (
    echo [ERROR] 沒有貼上金鑰。
    pause
    exit /b 1
)
echo [OK] 金鑰已存到 %KEYFILE%（只有目前的 Windows 帳號可以讀取）。
:KEY_DONE
echo.

echo [3/3] 建立開機自動執行捷徑...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$w = New-Object -ComObject WScript.Shell; $p = Join-Path ([Environment]::GetFolderPath('Startup')) 'AHS 錯題重點整理.lnk'; $s = $w.CreateShortcut($p); $s.TargetPath = '%ENGINE%啟動錯題重點整理.bat'; $s.WorkingDirectory = '%ENGINE%'; $s.WindowStyle = 7; $s.Save(); Write-Host $p"
if errorlevel 1 (
    echo [ERROR] 建立捷徑失敗。
    pause
    exit /b 1
)
echo [OK] 之後每次開機登入都會自動執行。
echo 要取消：刪除「啟動」資料夾裡的「AHS 錯題重點整理」捷徑（Win+R 輸入 shell:startup）。
echo.
set /p "NOW=現在就啟動一次嗎？(Y/n) "
if /i not "%NOW%"=="n" call "%ENGINE%啟動錯題重點整理.bat"
pause
endlocal
