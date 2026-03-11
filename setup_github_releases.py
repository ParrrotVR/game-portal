#!/usr/bin/env python3
"""
Setup GitHub Releases + jsDelivr CDN for large game files.
This creates releases and uses jsDelivr to serve from releases (no size limits).
"""

import os
import json
import subprocess
from pathlib import Path

def create_github_release():
    """Create a GitHub release with large game files."""
    
    print("🚀 Creating GitHub Release for large game files...")
    print("=" * 50)
    
    # Check if gh CLI is available
    try:
        result = subprocess.run(['gh', '--version'], capture_output=True, text=True)
        print(f"✅ GitHub CLI found: {result.stdout.strip()}")
    except:
        print("❌ GitHub CLI not found. Please install it first:")
        print("   Windows: winget install GitHub.cli")
        print("   Mac: brew install gh")
        return False
    
    # Create release
    try:
        # Create a new release
        cmd = [
            'gh', 'release', 'create', 
            'game-assets-v1.0',
            '--title', 'Game Assets v1.0',
            '--notes', 'Large game files for Game Portal CDN',
            '--latest'
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode == 0:
            print("✅ GitHub release created successfully!")
            return True
        else:
            print(f"⚠️ Release might already exist: {result.stderr}")
            return True
            
    except Exception as e:
        print(f"❌ Error creating release: {e}")
        return False

def setup_release_cdn():
    """Setup jsDelivr CDN URLs from GitHub releases."""
    
    print("🌐 Setting up jsDelivr CDN from GitHub releases...")
    print("=" * 50)
    
    # jsDelivr CDN base URL for GitHub releases
    jsdelivr_base = "https://cdn.jsdelivr.net/gh/ParrrotVR/game-portal@game-assets-v1.0"
    
    # Game files and their jsDelivr URLs (from releases)
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
    
    print("🌐 jsDelivr CDN URLs (from GitHub releases):")
    print("=" * 50)
    for file_path, cdn_url in game_files.items():
        print(f"{file_path}:")
        print(f"  {cdn_url}")
        print()
    
    return game_files

def create_release_version():
    """Create a version that uses GitHub release CDN URLs."""
    
    game_files = setup_release_cdn()
    
    # Create release version directory
    release_version_dir = Path("release-version")
    if release_version_dir.exists():
        import shutil
        shutil.rmtree(release_version_dir)
    release_version_dir.mkdir()
    
    # Copy all files except large game files (they'll be served from releases)
    import shutil
    
    # Copy main portal files
    shutil.copy2("index.html", release_version_dir / "index.html")
    shutil.copy2("styles.css", release_version_dir / "styles.css")
    shutil.copy2("script.js", release_version_dir / "script.js")
    shutil.copy2("sw.js", release_version_dir / "sw.js")
    
    # Copy js directory
    js_dir = release_version_dir / "js"
    js_dir.mkdir(exist_ok=True)
    if Path("js").exists():
        for js_file in Path("js").iterdir():
            if js_file.is_file():
                shutil.copy2(js_file, js_dir / js_file.name)
    
    # Copy games directory (but update HTML files to use release URLs)
    games_src = Path("games")
    games_dest = release_version_dir / "games"
    
    for game_dir in games_src.iterdir():
        if game_dir.is_dir():
            dest_game_dir = games_dest / game_dir.name
            shutil.copytree(game_dir, dest_game_dir)
    
    # Update game HTML files to use release URLs
    update_games_for_releases(release_version_dir, game_files)
    
    # Create README
    readme_content = f"""# GitHub Releases + jsDelivr CDN Game Portal

## 🚀 Powered by GitHub Releases + jsDelivr CDN

This version uses GitHub releases to store large game files and jsDelivr CDN to serve them globally!

### 🌐 How it Works:
- **GitHub Releases**: Store large game files (no size limits)
- **jsDelivr CDN**: Serves files from releases globally
- **Cloudflare Pages**: Hosts the lightweight HTML/CSS/JS

### 📋 jsDelivr URLs (from releases):
{chr(10).join([f"- {path}: {url}" for path, url in game_files.items()])}

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
"""
    
    with open(release_version_dir / "README.md", 'w', encoding='utf-8') as f:
        f.write(readme_content)
    
    print(f"📁 Created release version: {release_version_dir}")
    print("✅ Ready for Cloudflare Pages deployment!")
    print("🌐 Games will load from GitHub releases via jsDelivr CDN")

def update_games_for_releases(base_dir, game_files):
    """Update game HTML files to use GitHub release URLs."""
    
    # Update Feed the Void
    feed_the_void_html = base_dir / "games" / "feed-the-void" / "index.html"
    if feed_the_void_html.exists():
        with open(feed_the_void_html, 'r') as f:
            content = f.read()
        
        content = content.replace('"index.wasm"', f'"{game_files["feed-the-void/index.wasm"]}"')
        
        with open(feed_the_void_html, 'w') as f:
            f.write(content)
        print(f"✅ Updated: Feed the Void -> GitHub releases")
    
    # Update Outhold
    outhold_html = base_dir / "games" / "outhold" / "index.html"
    if outhold_html.exists():
        with open(outhold_html, 'r') as f:
            content = f.read()
        
        content = content.replace('"index.pck"', f'"{game_files["outhold/index.pck"]}"')
        content = content.replace('"index.side.wasm"', f'"{game_files["outhold/index.side.wasm"]}"')
        
        with open(outhold_html, 'w') as f:
            f.write(content)
        print(f"✅ Updated: Outhold -> GitHub releases")
    
    # Update other games similarly...
    gscriptlearn_html = base_dir / "games" / "gscriptlearn" / "index.html"
    if gscriptlearn_html.exists():
        with open(gscriptlearn_html, 'r') as f:
            content = f.read()
        content = content.replace('"index.pck"', f'"{game_files["gscriptlearn/index.pck"]}"')
        with open(gscriptlearn_html, 'w') as f:
            f.write(content)
        print(f"✅ Updated: Learn GDScript -> GitHub releases")
    
    reacticore_html = base_dir / "games" / "reacticore" / "index-force.html"
    if reacticore_html.exists():
        with open(reacticore_html, 'r') as f:
            content = f.read()
        content = content.replace('"Reacticore_20_02_26.wasm.br"', f'"{game_files["reacticore/Build/Reacticore_20_02_26.wasm.br"]}"')
        with open(reacticore_html, 'w') as f:
            f.write(content)
        print(f"✅ Updated: Reacticore -> GitHub releases")
    
    epicmine_html = base_dir / "games" / "epicmine" / "index.html"
    if epicmine_html.exists():
        with open(epicmine_html, 'r') as f:
            content = f.read()
        content = content.replace('"dc5816d0674db347069a3818c4eebb18.wasm.br"', f'"{game_files["epicmine/Build/dc5816d0674db347069a3818c4eebb18.wasm.br"]}"')
        content = content.replace('"f3f6b0ef131f67204364f79b8ba5fb91.data.br"', f'"{game_files["epicmine/Build/f3f6b0ef131f67204364f79b8ba5fb91.data.br"]}"')
        with open(epicmine_html, 'w') as f:
            f.write(content)
        print(f"✅ Updated: Epic Mine -> GitHub releases")
    
    scritchy_html = base_dir / "games" / "scritchy-scratchy" / "index.html"
    if scritchy_html.exists():
        with open(scritchy_html, 'r') as f:
            content = f.read()
        content = content.replace('"WebGL.wasm.br"', f'"{game_files["scritchy-scratchy/Build/WebGL.wasm.br"]}"')
        with open(scritchy_html, 'w') as f:
            f.write(content)
        print(f"✅ Updated: Scritchy Scratchy -> GitHub releases")

def create_upload_script():
    """Create a script to upload files to GitHub release."""
    
    script_content = '''@echo off
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
echo ✅ All files uploaded to GitHub release!
echo 🌐 jsDelivr CDN will be available at:
echo https://cdn.jsdelivr.net/gh/ParrrotVR/game-portal@game-assets-v1.0/
echo.
pause
'''
    
    with open("upload_to_release.bat", 'w') as f:
        f.write(script_content)
    
    print("📝 Created upload_to_release.bat script")

if __name__ == "__main__":
    # Create GitHub release
    create_github_release()
    
    # Create release version
    create_release_version()
    
    # Create upload script
    create_upload_script()
    
    print("\n✅ GitHub Releases + jsDelivr setup complete!")
    print("\n📋 Next steps:")
    print("1. Run: upload_to_release.bat")
    print("2. Deploy 'release-version/' to Cloudflare Pages")
    print("3. Games will load from GitHub releases via jsDelivr CDN")
