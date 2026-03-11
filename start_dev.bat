@echo off
title Game Portal - Reassemble All Files
echo ========================================
echo.
echo 🎮 Reassembling all split game files...
echo.

cd /d "%~dp0"

python reassemble_all.py

echo.
echo ========================================
echo ✅ File reassembly complete!
echo.
echo 🚀 Starting local server...
echo.
python -m http.server 8080

echo.
echo 🌐 Server running at: http://localhost:8080
echo.
pause
