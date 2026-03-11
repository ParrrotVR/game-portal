# GitHub Releases + jsDelivr CDN Game Portal

## 🚀 Powered by GitHub Releases + jsDelivr CDN

This version uses GitHub releases to store large game files and jsDelivr CDN to serve them globally!

### 🌐 How it Works:
- **GitHub Releases**: Store large game files (no size limits)
- **jsDelivr CDN**: Serves files from releases globally
- **Cloudflare Pages**: Hosts the lightweight HTML/CSS/JS

### 📋 jsDelivr URLs (from releases):
- feed-the-void/index.wasm: https://cdn.jsdelivr.net/gh/ParrrotVR/game-portal@game-assets-v1.0/games/feed-the-void/index.wasm
- outhold/index.pck: https://cdn.jsdelivr.net/gh/ParrrotVR/game-portal@game-assets-v1.0/games/outhold/index.pck
- outhold/index.side.wasm: https://cdn.jsdelivr.net/gh/ParrrotVR/game-portal@game-assets-v1.0/games/outhold/index.side.wasm
- gscriptlearn/index.pck: https://cdn.jsdelivr.net/gh/ParrrotVR/game-portal@game-assets-v1.0/games/gscriptlearn/index.pck
- reacticore/Build/Reacticore_20_02_26.wasm.br: https://cdn.jsdelivr.net/gh/ParrrotVR/game-portal@game-assets-v1.0/games/reacticore/Build/Reacticore_20_02_26.wasm.br
- scritchy-scratchy/Build/WebGL.wasm.br: https://cdn.jsdelivr.net/gh/ParrrotVR/game-portal@game-assets-v1.0/games/scritchy-scratchy/Build/WebGL.wasm.br
- epicmine/Build/dc5816d0674db347069a3818c4eebb18.wasm.br: https://cdn.jsdelivr.net/gh/ParrrotVR/game-portal@game-assets-v1.0/games/epicmine/Build/dc5816d0674db347069a3818c4eebb18.wasm.br
- epicmine/Build/f3f6b0ef131f67204364f79b8ba5fb91.data.br: https://cdn.jsdelivr.net/gh/ParrrotVR/game-portal@game-assets-v1.0/games/epicmine/Build/f3f6b0ef131f67204364f79b8ba5fb91.data.br

### ✨ Benefits:
- 🚀 **No size limits** - GitHub releases handle large files
- 🌍 **Global CDN** - jsDelivr serves from 200+ edge locations
- ⚡ **Free hosting** - No costs for storage or bandwidth
- 🔄 **Easy updates** - Create new release, CDN updates
- 💾 **Reliable** - GitHub infrastructure

### 🚀 Deployment:
1. Create GitHub release with game files
2. Deploy this folder to Cloudflare Pages
3. Games automatically load from jsDelivr CDN!

### 📊 Performance:
- Files served from GitHub releases via jsDelivr
- Global edge network for fast loading
- Perfect for large game files

### 🛠️ Setup Commands:
```bash
# Create release (run this first)
gh release create game-assets-v1.0 --title "Game Assets v1.0" --latest

# Upload files to release
gh release upload game-assets-v1.0 games/feed-the-void/index.wasm
gh release upload game-assets-v1.0 games/outhold/index.pck
# ... etc for all large files
```

**Just deploy this folder to Cloudflare Pages and enjoy super fast gaming!** 🎮✨
