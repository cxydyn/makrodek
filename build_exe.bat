@echo off
echo ========================================================
echo   MACRO DECK 7 INCH - PYINSTALLER ONEFILE EXE BUILDER
echo ========================================================
echo.
echo 1. Memeriksa Python & Menginstall Dependencies...
python -m pip install --upgrade pip
python -m pip install -r requirements.txt

echo.
echo 2. Memulai proses bundling PyInstaller Standalone EXE...
pyinstaller --noconfirm --onefile --windowed ^
    --name "MacroDeck7Inch_Portable" ^
    --add-data "deck_config.json;." ^
    --add-data "config.ini;." ^
    --hidden-import "PyQt6.QtWebEngineWidgets" ^
    --hidden-import "PyQt6.QtWebEngineCore" ^
    --hidden-import "psutil" ^
    --hidden-import "requests" ^
    --hidden-import "keyboard" ^
    main.py

echo.
echo ========================================================
echo   SELESAI! File .exe tersimpan di folder dist/
echo   Pastikan file deck_config.json diletakkan bersama .exe
echo ========================================================
pause
