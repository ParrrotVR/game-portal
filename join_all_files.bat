@echo off
echo 🔄 Reassembling split game files...
echo.

cd /d "%~dp0"

echo 📦 Reassembling Feed the Void files...
python split_files.py join "games\feed-the-void\index.wasm"
python split_files.py join "games\feed-the-void\index.pck"

echo 📦 Reassembling Outhold files...
python split_files.py join "games\outhold\index.wasm"
python split_files.py join "games\outhold\index.pck"

echo 📦 Reassembling Learn GDScript files...
python split_files.py join "games\gscriptlearn\index.wasm"
python split_files.py join "games\gscriptlearn\index.pck"

echo.
echo ✅ All game files reassembled!
echo 🎮 Games should now work properly
pause
