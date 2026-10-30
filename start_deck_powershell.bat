@echo off
title Macro Deck 7 Inch - PowerShell Native Launcher
echo ========================================================
echo   MACRO DECK 7 INCH - PURE WINDOWS POWERSHELL LAUNCHER
echo   (100%% Bawaan Windows - Tanpa Python - Tanpa Install)
echo ========================================================
echo.
echo Menjalankan server PowerShell bawaan Windows...
start "" powershell -ExecutionPolicy Bypass -NoProfile -File "%~dp0server.ps1"

timeout /t 2 /nobreak >nul

echo Membuka di Microsoft Edge App Mode 1024x600...
start "" msedge.exe --app=http://localhost:5000 --window-size=1024,600 >nul 2>&1
if %errorlevel% neq 0 (
    start "" chrome.exe --app=http://localhost:5000 --window-size=1024,600 >nul 2>&1
    if %errorlevel% neq 0 (
        start http://localhost:5000
    )
)

echo.
echo ========================================================
echo   MACRO DECK BERHASIL BERJALAN!
echo   Pindahkan ke monitor 7 inci Anda dan tekan F11.
echo ========================================================
exit
