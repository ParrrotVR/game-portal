@echo off
echo 🎮 Splitting large game files for GitHub upload...
echo.

cd /d "%~dp0"

echo 📦 Splitting Feed the Void files...
python split_files.py split "games\feed-the-void\index.wasm"
python split_files.py split "games\feed-the-void\index.pck"

echo 📦 Splitting Outhold files...
python split_files.py split "games\outhold\index.wasm"
python split_files.py split "games\outhold\index.pck"

echo 📦 Splitting Learn GDScript files...
python split_files.py split "games\gscriptlearn\index.wasm"
python split_files.py split "games\gscriptlearn\index.pck"

echo.
echo ✅ All large files split into 20MB chunks!
echo 📁 Chunks are ready for GitHub upload
echo.
echo 🔄 To reassemble: python split_files.py join <filename>
pause
