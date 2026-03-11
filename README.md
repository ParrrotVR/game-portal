# 🎮 Game Portal

A multi-game web portal featuring HTML5 games built with various engines.

## ⚠️ Important - Game Assets Required

Due to GitHub's 25MB file size limit, large game files are excluded from this repository. You'll need to download them separately:

### Missing Files (~150MB total):
- `games/feed-the-void/index.wasm` (37MB)
- `games/feed-the-void/index.pck` (15MB) 
- `games/outhold/index.wasm` (41MB)
- `games/outhold/index.pck` (36MB)
- `games/gscriptlearn/index.wasm` (17MB)
- `games/gscriptlearn/index.pck` (40MB)

### Solution:
1. **Download the complete game files** from your original sources
2. **Place them in the correct folders** as shown above
3. **Or use Git LFS** if you have it set up

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
