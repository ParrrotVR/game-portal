# 🎮 Game Portal

A multi-game web portal featuring HTML5 games built with various engines.

## 🎮 Game Files - Split for GitHub

Large game files are split into 20MB chunks to work around GitHub's 25MB limit.

**Note:** For local development, you'll need to reassemble the split files manually using the provided scripts.

### 📁 Split Files Included:
- `games/feed-the-void/index.wasm.part.001` (20MB)
- `games/feed-the-void/index.wasm.part.002` (15.4MB)
- `games/outhold/index.pck.part.001` (20MB)
- `games/outhold/index.pck.part.002` (15.1MB)
- `games/outhold/index.side.wasm.part.001` (20MB)
- `games/outhold/index.side.wasm.part.002` (19.4MB)
- `games/gscriptlearn/index.pck.part.001` (20MB)
- `games/gscriptlearn/index.pck.part.002` (18.4MB)
- `games/reacticore/Build/Reacticore_20_02_26.wasm.br.part.001` (20MB)
- `games/reacticore/Build/Reacticore_20_02_26.wasm.br.part.002` (20MB)
- `games/reacticore/Build/Reacticore_20_02_26.wasm.br.part.003` (19.3MB)
- `games/scritchy-scratchy/Build/WebGL.wasm.br.part.001` (20MB)
- `games/scritchy-scratchy/Build/WebGL.wasm.br.part.002` (20MB)
- `games/scritchy-scratchy/Build/WebGL.wasm.br.part.003` (16.7MB)
- `games/epicmine/Build/dc5816d0674db347069a3818c4eebb18.wasm.br.part.001` (20MB)
- `games/epicmine/Build/dc5816d0674db347069a3818c4eebb18.wasm.br.part.002` (19.6MB)
- `games/epicmine/Build/f3f6b0ef131f67204364f79b8ba5fb91.data.br.part.001` (20MB)
- `games/epicmine/Build/f3f6b0ef131f67204364f79b8ba5fb91.data.br.part.002` (4.3MB)

### ✨ Automatic Process:
1. **Visit the website** - Files are automatically downloaded and reassembled
2. **Stored locally** - Files are cached in browser storage for instant loading
3. **Seamless gaming** - No manual steps required!

### 🔧 Manual Reassembly (Required for Local Development):
**For local development, you MUST reassemble the split files:**

**🚀 Quick Start (Recommended):**
```bash
# Windows - Reassemble all files and start server
start_dev.bat

# Or Mac/Linux - Reassemble all files and start server
python reassemble_all.py && python -m http.server 8080
```

**🔧 Manual Reassembly:**
```bash
# Reassemble all files at once
python reassemble_all.py

# Or reassemble individual files
python split_files.py join "games/feed-the-void/index.wasm"
python split_files.py join "games/outhold/index.pck"
python split_files.py join "games/outhold/index.side.wasm"
python split_files.py join "games/gscriptlearn/index.pck"
python split_files.py join "games/reacticore/Build/Reacticore_20_02_26.wasm.br"
python split_files.py join "games/scritchy-scratchy/Build/WebGL.wasm.br"
python split_files.py join "games/epicmine/Build/dc5816d0674db347069a3818c4eebb18.wasm.br"
python split_files.py join "games/epicmine/Build/f3f6b0ef131f67204364f79b8ba5fb91.data.br"
```

**After reassembly:** All games will load properly in your local development environment.

## 🚀 Quick Start

1. **Start the server**:
   ```bash
   python -m http.server 8080
   ```

2. **Open in browser**: Navigate to `http://localhost:8080`

3. **Play games**: Click on any game card to launch!

## ✨ Features

- **Sleek Design**: Purple and black theme with rounded edges and glassmorphism
- **3D Card Effects**: Cards tilt based on cursor position for immersive interaction
- **Game Overlay**: Full-screen game player with control bar
- **Game Controls**: Close, Fullscreen, and Open in New Tab buttons
- **Auto-Save**: Games automatically save progress via localStorage

## 🎯 Games Included

1. **Plants vs Zombies Fusion Edition** 🌻
2. **Car Crash Simulator** 🚗

## 📁 Project Structure

```
game-portal/
├── index.html          # Main portal page
├── styles.css          # Styling and animations
├── script.js           # Interactive features
├── README.md           # This file
└── games/
    ├── pvz/           # Plants vs Zombies
    └── carcrash/      # Car Crash Simulator
```

## 🎨 Design Features

- Modern Inter font from Google Fonts
- Animated gradient background
- Smooth hover effects and transitions
- Responsive grid layout
- Glassmorphism UI elements
- Purple glow effects

## 💾 Game Saves

Both games automatically save your progress using localStorage. Your game data persists across sessions, so you can pick up right where you left off!

## 🌐 Browser Compatibility

Tested and working on:
- Chrome
- Firefox
- Edge
- Safari

## 📝 License

Free to use and modify!

---

**Enjoy gaming!** 🎮✨
