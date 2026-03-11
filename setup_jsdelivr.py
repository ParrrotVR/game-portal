#!/usr/bin/env python3
"""
Setup jsDelivr CDN hosting for game files.
This prepares files for jsDelivr CDN from GitHub releases.
"""

import os
import json
from pathlib import Path

def setup_jsdelivr_cdn():
    """Setup jsDelivr CDN URLs for game files."""
    
    print("🚀 Setting up jsDelivr CDN for game files...")
    print("=" * 50)
    
    # jsDelivr CDN base URL for your GitHub repository
    jsdelivr_base = "https://cdn.jsdelivr.net/gh/ParrrotVR/game-portal@latest"
    
    # Game files and their jsDelivr URLs
    game_files = {
        "feed-the-void/index.wasm": f"{jsdelivr_base}/games/feed-the-void/index.wasm",
        "outhold/index.pck": f"{jsdelivr_base}/games/outhold/index.pck",
        "outhold/index.side.wasm": f"{jsdelivr_base}/games/outhold/index.side.wasm",
        "gscriptlearn/index.pck": f"{jsdelivr_base}/games/gscriptlearn/index.pck",
        "reacticore/Build/Reacticore_20_02_26.wasm.br": f"{jsdelivr_base}/games/reacticore/Build/Reacticore_20_02_26.wasm.br",
        "scritchy-scratchy/Build/WebGL.wasm.br": f"{jsdelivr_base}/games/scritchy-scratchy/Build/WebGL.wasm.br",
        "epicmine/Build/dc5816d0674db347069a3818c4eebb18.wasm.br": f"{jsdelivr_base}/games/epicmine/Build/dc5816d0674db347069a3818c4eebb18.wasm.br",
        "epicmine/Build/f3f6b0ef131f67204364f79b8ba5fb91.data.br": f"{jsdelivr_base}/games/epicmine/Build/f3f6b0ef131f67204364f79b8ba5fb91.data.br"
    }
    
    print("🌐 jsDelivr CDN URLs:")
    print("=" * 50)
    for file_path, cdn_url in game_files.items():
        print(f"{file_path}:")
        print(f"  {cdn_url}")
        print()
    
    return game_files

def create_jsdelivr_version():
    """Create a version that uses jsDelivr CDN URLs."""
    
    game_files = setup_jsdelivr_cdn()
    
    # Create jsDelivr version directory
    jsdelivr_version_dir = Path("jsdelivr-version")
    if jsdelivr_version_dir.exists():
        import shutil
        shutil.rmtree(jsdelivr_version_dir)
    jsdelivr_version_dir.mkdir()
    
    # Copy all files except large game files (they'll be served from jsDelivr)
    import shutil
    
    # Copy main portal files
    shutil.copy2("index.html", jsdelivr_version_dir / "index.html")
    shutil.copy2("styles.css", jsdelivr_version_dir / "styles.css")
    shutil.copy2("script.js", jsdelivr_version_dir / "script.js")
    shutil.copy2("sw.js", jsdelivr_version_dir / "sw.js")
    
    # Copy js directory
    js_dir = jsdelivr_version_dir / "js"
    js_dir.mkdir(exist_ok=True)
    if Path("js").exists():
        for js_file in Path("js").iterdir():
            if js_file.is_file():
                shutil.copy2(js_file, js_dir / js_file.name)
    
    # Copy games directory (but update HTML files to use jsDelivr)
    games_src = Path("games")
    games_dest = jsdelivr_version_dir / "games"
    
    for game_dir in games_src.iterdir():
        if game_dir.is_dir():
            dest_game_dir = games_dest / game_dir.name
            shutil.copytree(game_dir, dest_game_dir)
    
    # Update game HTML files to use jsDelivr URLs
    update_games_for_jsdelivr(jsdelivr_version_dir, game_files)
    
    # Create README
    readme_content = f"""# jsDelivr CDN Game Portal

## 🚀 Powered by jsDelivr CDN

This version uses jsDelivr CDN to serve large game files directly from GitHub!

### 🌐 How it Works:
- **GitHub Repository**: Stores all game files
- **jsDelivr CDN**: Serves files with global edge network
- **Cloudflare Pages**: Hosts the lightweight HTML/CSS/JS

### 📋 jsDelivr URLs:
{chr(10).join([f"- {path}: {url}" for path, url in game_files.items()])}

### ✨ Benefits:
- 🚀 **Free CDN** - No hosting costs
- 🌍 **Global Network** - Fast worldwide
- ⚡ **Auto-caching** - Files cached automatically
- 🔄 **Easy Updates** - Push to GitHub, CDN updates
- 💾 **No Size Limits** - Large files work perfectly

### 🚀 Deployment:
1. This folder is ready for Cloudflare Pages
2. Games automatically load from jsDelivr CDN
3. No additional setup needed!

### 📊 Performance:
- Files served from 200+ edge locations
- Automatic HTTP/2 and compression
- Perfect for large game files

**Just deploy this folder to Cloudflare Pages and enjoy super fast gaming!** 🎮✨
"""
    
    with open(jsdelivr_version_dir / "README.md", 'w', encoding='utf-8') as f:
        f.write(readme_content)
    
    print(f"📁 Created jsDelivr version: {jsdelivr_version_dir}")
    print("✅ Ready for Cloudflare Pages deployment!")
    print("🌐 Games will load automatically from jsDelivr CDN")

def update_games_for_jsdelivr(base_dir, game_files):
    """Update game HTML files to use jsDelivr URLs."""
    
    # Update Feed the Void
    feed_the_void_html = base_dir / "games" / "feed-the-void" / "index.html"
    if feed_the_void_html.exists():
        with open(feed_the_void_html, 'r') as f:
            content = f.read()
        
        # Replace WASM file URL
        content = content.replace('"index.wasm"', f'"{game_files["feed-the-void/index.wasm"]}"')
        
        with open(feed_the_void_html, 'w') as f:
            f.write(content)
        print(f"✅ Updated: Feed the Void -> jsDelivr CDN")
    
    # Update Outhold
    outhold_html = base_dir / "games" / "outhold" / "index.html"
    if outhold_html.exists():
        with open(outhold_html, 'r') as f:
            content = f.read()
        
        content = content.replace('"index.pck"', f'"{game_files["outhold/index.pck"]}"')
        content = content.replace('"index.side.wasm"', f'"{game_files["outhold/index.side.wasm"]}"')
        
        with open(outhold_html, 'w') as f:
            f.write(content)
        print(f"✅ Updated: Outhold -> jsDelivr CDN")
    
    # Update Learn GDScript
    gscriptlearn_html = base_dir / "games" / "gscriptlearn" / "index.html"
    if gscriptlearn_html.exists():
        with open(gscriptlearn_html, 'r') as f:
            content = f.read()
        
        content = content.replace('"index.pck"', f'"{game_files["gscriptlearn/index.pck"]}"')
        
        with open(gscriptlearn_html, 'w') as f:
            f.write(content)
        print(f"✅ Updated: Learn GDScript -> jsDelivr CDN")
    
    # Update Reacticore
    reacticore_html = base_dir / "games" / "reacticore" / "index-force.html"
    if reacticore_html.exists():
        with open(reacticore_html, 'r') as f:
            content = f.read()
        
        content = content.replace('"Reacticore_20_02_26.wasm.br"', f'"{game_files["reacticore/Build/Reacticore_20_02_26.wasm.br"]}"')
        
        with open(reacticore_html, 'w') as f:
            f.write(content)
        print(f"✅ Updated: Reacticore -> jsDelivr CDN")
    
    # Update Epic Mine
    epicmine_html = base_dir / "games" / "epicmine" / "index.html"
    if epicmine_html.exists():
        with open(epicmine_html, 'r') as f:
            content = f.read()
        
        content = content.replace('"dc5816d0674db347069a3818c4eebb18.wasm.br"', f'"{game_files["epicmine/Build/dc5816d0674db347069a3818c4eebb18.wasm.br"]}"')
        content = content.replace('"f3f6b0ef131f67204364f79b8ba5fb91.data.br"', f'"{game_files["epicmine/Build/f3f6b0ef131f67204364f79b8ba5fb91.data.br"]}"')
        
        with open(epicmine_html, 'w') as f:
            f.write(content)
        print(f"✅ Updated: Epic Mine -> jsDelivr CDN")
    
    # Update Scritchy Scratchy
    scritchy_html = base_dir / "games" / "scritchy-scratchy" / "index.html"
    if scritchy_html.exists():
        with open(scritchy_html, 'r') as f:
            content = f.read()
        
        content = content.replace('"WebGL.wasm.br"', f'"{game_files["scritchy-scratchy/Build/WebGL.wasm.br"]}"')
        
        with open(scritchy_html, 'w') as f:
            f.write(content)
        print(f"✅ Updated: Scritchy Scratchy -> jsDelivr CDN")

if __name__ == "__main__":
    create_jsdelivr_version()
    print("\n✅ jsDelivr CDN setup complete!")
    print("\n📋 Next steps:")
    print("1. Deploy 'jsdelivr-version/' to Cloudflare Pages")
    print("2. Games will automatically load from jsDelivr CDN")
    print("3. Enjoy super fast worldwide gaming!")
