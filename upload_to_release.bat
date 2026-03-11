@echo off
echo Uploading game files to GitHub release...
echo.

REM Create release
gh release create game-assets-v1.0 --title "Game Assets v1.0" --notes "Large game files for Game Portal CDN" --latest

REM Upload large files
echo Uploading Feed the Void WASM...
gh release upload game-assets-v1.0 games/feed-the-void/index.wasm

echo Uploading Outhold files...
gh release upload game-assets-v1.0 games/outhold/index.pck
gh release upload game-assets-v1.0 games/outhold/index.side.wasm

echo Uploading Learn GDScript...
gh release upload game-assets-v1.0 games/gscriptlearn/index.pck

echo Uploading Reacticore...
gh release upload game-assets-v1.0 games/reacticore/Build/Reacticore_20_02_26.wasm.br

echo Uploading Scritchy Scratchy...
gh release upload game-assets-v1.0 games/scritchy-scratchy/Build/WebGL.wasm.br

echo Uploading Epic Mine files...
gh release upload game-assets-v1.0 games/epicmine/Build/dc5816d0674db347069a3818c4eebb18.wasm.br
gh release upload game-assets-v1.0 games/epicmine/Build/f3f6b0ef131f67204364f79b8ba5fb91.data.br

echo.
echo All files uploaded to GitHub release!
echo jsDelivr CDN will be available at:
echo https://cdn.jsdelivr.net/gh/ParrrotVR/game-portal@game-assets-v1.0/
echo.
pause