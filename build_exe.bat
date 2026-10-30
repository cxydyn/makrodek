@echo off
echo ========================================================
echo   MACRO DECK 7 INCH - PYINSTALLER ONEFILE EXE BUILDER
echo ========================================================
echo.
echo 1. Memeriksa Python & Menginstall Dependencies...
python -m pip install --upgrade pip
python -m pip install -r requirements.txt

echo.
echo 2. Memulai proses bundling PyInstaller...
pyinstaller --noconfirm --onedir --windowed ^
    --name "MacroDeck7Inch" ^
    --add-data "config.ini;." ^
    --hidden-import "PyQt6.QtWebEngineWidgets" ^
    --hidden-import "PyQt6.QtWebEngineCore" ^
    --hidden-import "psutil" ^
    --hidden-import "requests" ^
    main.py

echo.
echo Catatan: Untuk single executable (.exe tunggal):
pyinstaller --noconfirm --onefile --windowed ^
    --name "MacroDeck7Inch_Portable" ^
    --add-data "config.ini;." ^
    --hidden-import "PyQt6.QtWebEngineWidgets" ^
    --hidden-import "PyQt6.QtWebEngineCore" ^
    --hidden-import "psutil" ^
    --hidden-import "requests" ^
    main.py

echo.
echo ========================================================
echo   SELESAI! File .exe tersimpan di folder dist/
echo   Pastikan file config.ini diletakkan bersama file .exe
echo ========================================================
pause
