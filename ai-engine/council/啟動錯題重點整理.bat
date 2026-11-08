@echo off
chcp 65001 >nul
setlocal EnableExtensions EnableDelayedExpansion
title 錯題重點整理 - 背景執行

REM ============================================================
REM 錯題重點整理（2026-11-06）
REM   開機（登入）時由「啟動」資料夾的捷徑執行；也可手動雙擊。
REM   啟動後約 1 分鐘先跑一次，之後在背景等待知識弱點頁的「產生重點整理」按鈕。
REM   需要：Antigravity CLI agy（主要撰寫，已登入）、Claude Code（把關／備援）、git、gh（已登入）、node、
REM         Supabase service_role 金鑰（見「安裝錯題重點整理開機自動執行.bat」）。
REM   用法：啟動錯題重點整理.bat            開機模式（先跑一次）
REM         啟動錯題重點整理.bat /noinitial  只等待按鈕
REM ============================================================

set "ENGINE=%~dp0"
set "OLD_COUNCIL=%ENGINE%..\..\..\AI-Study-Council"
if not defined COUNCIL_DATA_DIR (
    if exist "%OLD_COUNCIL%\ollama_data" (
        for %%I in ("%OLD_COUNCIL%") do set "COUNCIL_DATA_DIR=%%~fI"
    )
)
if defined COUNCIL_DATA_DIR (set "DATA=%COUNCIL_DATA_DIR%") else (set "DATA=%ENGINE%data")

set "EXTRA="
if /i "%~1"=="/noinitial" set "EXTRA=-NoInitialRun"

start "錯題重點整理 - 請勿關閉" /min powershell -NoProfile -ExecutionPolicy Bypass -File "%ENGINE%tools\wrongbook-notes.ps1" -RepoRoot "%ENGINE%..\.." -DataDir "!DATA!" !EXTRA!
endlocal
