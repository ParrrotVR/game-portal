# 🎮 Game Portal

A multi-game web portal featuring HTML5 games built with various engines.

## 🎮 Game Files - Split for GitHub

Large game files are split into 20MB chunks to work around GitHub's 25MB limit.

### 📁 Split Files Included:
- `games/feed-the-void/index.wasm.part.001` (20MB)
- `games/feed-the-void/index.wasm.part.002` (15.4MB)
- `games/outhold/index.pck.part.001` (20MB)
- `games/outhold/index.pck.part.002` (15.1MB)
- `games/gscriptlearn/index.pck.part.001` (20MB)
- `games/gscriptlearn/index.pck.part.002` (18.4MB)

### 🔄 Reassemble Game Files:
**Option 1: Automatic (Recommended)**
```bash
# Run the automatic reassembly script
python join_all_files.py
# Or on Windows: join_all_files.bat
```

**Option 2: Manual**
```bash
# Reassemble each file individually
python split_files.py join "games/feed-the-void/index.wasm"
python split_files.py join "games/outhold/index.pck"
python split_files.py join "games/gscriptlearn/index.pck"
```

**Option 3: Manual Copy**
1. Combine split files in order:
   ```bash
   # Windows
   copy /b games\feed-the-void\index.wasm.part.001 + games\feed-the-void\index.wasm.part.002 games\feed-the-void\index.wasm
   
   # Mac/Linux
   cat games/feed-the-void/index.wasm.part.001 games/feed-the-void/index.wasm.part.002 > games/feed-the-void/index.wasm
   ```
2. Repeat for other split files
3. Delete the .part files after successful reassembly

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
