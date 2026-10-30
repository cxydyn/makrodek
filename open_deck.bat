@echo off
title Macro Deck 7 Inch - Zero Install Launcher
echo ========================================================
echo   MACRO DECK 7 INCH - ZERO INSTALL LAUNCHER
echo   (Tanpa Python - Tanpa .EXE - 100%% Bebas SmartScreen)
echo ========================================================
echo.
echo Membuka Macro Deck di layar 1024x600...

set "FILE_PATH=%~dp0offline_deck.html"

:: Buka di Microsoft Edge App Mode (bawaan Windows 10/11)
start "" msedge.exe --app="file:///%FILE_PATH%" --window-size=1024,600 >nul 2>&1
if %errorlevel% neq 0 (
    :: Jika gagal, coba Google Chrome
    start "" chrome.exe --app="file:///%FILE_PATH%" --window-size=1024,600 >nul 2>&1
    if %errorlevel% neq 0 (
        :: Buka via default browser
        start "" "%FILE_PATH%"
    )
)

echo.
echo ========================================================
echo   MACRO DECK BERHASIL DIBUKA!
echo   Pindahkan jendela ke monitor 7 inci Anda dan tekan F11.
echo ========================================================
exit
