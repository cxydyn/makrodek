@echo off
title Macro Deck 7 Inch - Web App Launcher
echo ========================================================
echo   MACRO DECK 7 INCH - LOCAL WEB CONSOLE LAUNCHER
echo ========================================================
echo.
echo [1/3] Memeriksa Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python tidak terdeteksi. Silakan install Python terlebih dahulu.
    pause
    exit /b
)

echo [2/3] Menjalankan Server Lokal di http://localhost:5000...
start "" /B python web_server.py

timeout /t 2 /nobreak >nul

echo [3/3] Membuka Konsol 1024x600 di Browser Kiosk / App Mode...

:: Coba buka via Microsoft Edge App Mode (bawaan Windows 10/11)
start "" msedge.exe --app=http://localhost:5000 --window-size=1024,600 >nul 2>&1
if %errorlevel% neq 0 (
    :: Jika Edge gagal, coba Google Chrome
    start "" chrome.exe --app=http://localhost:5000 --window-size=1024,600 >nul 2>&1
    if %errorlevel% neq 0 (
        :: Fallback ke browser default
        start http://localhost:5000
    )
)

echo.
echo ========================================================
echo   MACRO DECK WEB APP BERHASIL BERJALAN!
echo   Tampilan terbuka di layar 1024x600.
echo   Pindahkan jendela ini ke monitor 7 inci Anda dan tekan F11.
echo ========================================================
exit
