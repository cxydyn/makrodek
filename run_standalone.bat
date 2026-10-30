@echo off
title Macro Deck 7 Inch Launcher
echo ========================================================
echo   MACRO DECK 7 INCH - DIRECT PORTABLE LAUNCHER
echo ========================================================
echo Memeriksa instalasi Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python tidak terdeteksi di laptop ini.
    echo Silakan install Python 3.10+ dari python.org atau Microsoft Store.
    pause
    exit /b
)

echo Memeriksa dependensi...
python -m pip install -r requirements.txt --quiet

echo Menjalankan Macro Deck 7 Inch...
start "" pythonw main.py
exit
