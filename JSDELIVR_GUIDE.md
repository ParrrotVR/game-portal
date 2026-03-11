# 🚀 jsDelivr Setup Guide

## 📋 Overview
jsDelivr is a free, super-fast CDN that serves files directly from GitHub releases. Perfect for hosting large game files!

## 🎯 Our Strategy
1. **Upload large game files to GitHub releases** (not the main repo)
2. **Use jsDelivr CDN URLs** in game HTML files
3. **Keep repository small** while hosting large files efficiently

## 📁 Files Prepared for jsDelivr
✅ **Ready in `jsdelivr-files/` directory:**
- `feed-the-void/index.wasm` (35.4MB)
- `outhold/index.pck` (35.1MB) 
- `outhold/index.side.wasm` (39.4MB)
- `gscriptlearn/index.pck` (38.4MB)
- `reacticore/Reacticore_20_02_26.wasm.br` (59.3MB)
- `scritchy-scratchy/WebGL.wasm.br` (56.7MB)
- `epicmine/dc5816d0674db347069a3818c4eebb18.wasm.br` (39.6MB)
- `epicmine/f3f6b0ef131f67204364f79b8ba5fb91.data.br` (24.3MB)

## 🚀 Step-by-Step Instructions

### Step 1: Create GitHub Repository
1. Go to https://github.com/parrrotvr/game-portal
2. Click "Create repository"
3. Make it public
4. Initialize with README (optional)

### Step 2: Upload Game Files to Releases
1. **Push your code first:**
   ```bash
   git push -u origin main
   ```

2. **Create GitHub Release:**
   - Go to your repository on GitHub
   - Click "Releases" tab
   - Click "Create a new release"
   - Tag version: `v1.0.0`
   - Release title: `Game Assets v1.0.0`

3. **Upload game files:**
   - Drag all files from `jsdelivr-files/` directory
   - Or upload as ZIP if GitHub has limits
   - Click "Publish release"

### Step 3: Update Game Files to Use jsDelivr
Run the update script:
```bash
python update_jsdelivr.py
```

This will replace local file paths with jsDelivr CDN URLs.

### Step 4: Commit and Push Updates
```bash
git add .
git commit -m "Add jsDelivr CDN integration"
git push origin main
```

## 🌐 jsDelivr CDN URLs
Once uploaded, your files will be available at:
```
https://cdn.jsdelivr.net/gh/parrrotvr/game-portal@latest/jsdelivr-files/[game]/[filename]
```

Examples:
- Feed the Void: `https://cdn.jsdelivr.net/gh/parrrotvr/game-portal@latest/jsdelivr-files/feed-the-void/index.wasm`
- Outhold: `https://cdn.jsdelivr.net/gh/parrrotvr/game-portal@latest/jsdelivr-files/outhold/index.pck`

## ✅ Benefits
- **🚀 Super fast CDN** - Global edge network
- **📦 Free hosting** - No cost for game files
- **⚡ Auto-caching** - Files cached automatically
- **🔄 Easy updates** - Just create new release
- **💾 GitHub integration** - No separate hosting needed

## 🎮 After Setup
1. **Deploy to GitHub Pages** for the main portal
2. **Games load from jsDelivr CDN** instantly
3. **No file size limits** in your repository
4. **Fast loading** for users worldwide

## 🛠️ Troubleshooting
- **404 errors:** Make sure release is published and files are uploaded
- **Slow loading:** jsDelivr may need time to cache new files (usually <1 minute)
- **File updates:** Create new release with updated files

## 📝 Next Steps
1. Create GitHub repository
2. Upload files to releases
3. Run update script
4. Deploy to GitHub Pages
5. Test games load from CDN

**Your Game Portal will be super fast with jsDelivr!** 🎮✨
