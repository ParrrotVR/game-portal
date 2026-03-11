# Cloudflare Pages Game Portal

## 🚀 CDN Setup Required

This version is designed for Cloudflare Pages with external CDN hosting.

### 📋 Steps:

1. **Upload CDN Files:**
   - Upload all files from `cdn-files/` directory to your CDN
   - Recommended: Cloudflare R2, AWS S3, or BunnyCDN

2. **Update CDN URLs:**
   - Replace `https://cdn.yourdomain.com/game-portal` with your actual CDN URL
   - Update in game HTML files

3. **Deploy to Cloudflare Pages:**
   - Upload contents of `cloudflare-version/` to Cloudflare Pages
   - Or connect this folder to Cloudflare Pages

### 🌐 CDN Files to Upload:
- feed-the-void/index.wasm: 35.38MB
- outhold/index.pck: 35.05MB
- outhold/index.side.wasm: 39.44MB
- gscriptlearn/index.pck: 38.44MB
- reacticore/Reacticore_20_02_26.wasm.br: 59.33MB
- scritchy-scratchy/WebGL.wasm.br: 56.68MB
- epicmine/dc5816d0674db347069a3818c4eebb18.wasm.br: 39.58MB
- epicmine/f3f6b0ef131f67204364f79b8ba5fb91.data.br: 24.28MB

### 📊 Benefits:
- 🚀 Super fast global CDN
- 📦 Small Cloudflare Pages site
- 💾 Large files on optimized CDN
- ⚡ Better performance worldwide
