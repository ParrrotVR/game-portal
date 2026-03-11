#!/usr/bin/env python3
"""
Prepare game files for jsDelivr hosting via GitHub releases.
This creates a structured directory for uploading to GitHub releases.
"""

import os
import shutil
from pathlib import Path

def prepare_jsdelivr_files():
    """Create a directory with game files ready for jsDelivr upload."""
    
    print("🚀 Preparing files for jsDelivr hosting...")
    print("=" * 50)
    
    # Create jsdelivr directory
    jsdelivr_dir = Path("jsdelivr-files")
    if jsdelivr_dir.exists():
        shutil.rmtree(jsdelivr_dir)
    jsdelivr_dir.mkdir()
    
    # Game files to host on jsDelivr (large files only)
    game_files = [
        ("games/feed-the-void/index.wasm", "feed-the-void"),
        ("games/outhold/index.pck", "outhold"),
        ("games/outhold/index.side.wasm", "outhold"),
        ("games/gscriptlearn/index.pck", "gscriptlearn"),
        ("games/reacticore/Build/Reacticore_20_02_26.wasm.br", "reacticore"),
        ("games/scritchy-scratchy/Build/WebGL.wasm.br", "scritchy-scratchy"),
        ("games/epicmine/Build/dc5816d0674db347069a3818c4eebb18.wasm.br", "epicmine"),
        ("games/epicmine/Build/f3f6b0ef131f67204364f79b8ba5fb91.data.br", "epicmine")
    ]
    
    # Copy files to jsdelivr directory
    for file_path, game_name in game_files:
        source = Path(file_path)
        if source.exists():
            # Create game subdirectory
            game_dir = jsdelivr_dir / game_name
            game_dir.mkdir(exist_ok=True)
            
            # Copy file
            dest = game_dir / source.name
            shutil.copy2(source, dest)
            
            size_mb = source.stat().st_size / (1024 * 1024)
            print(f"✅ Copied: {game_name}/{source.name} ({size_mb:.1f}MB)")
        else:
            print(f"❌ Missing: {file_path}")
    
    print("=" * 50)
    print(f"📁 Prepared files in: {jsdelivr_dir}")
    print("📋 Next steps:")
    print("   1. Create GitHub repository")
    print("   2. Upload files to GitHub releases")
    print("   3. Use jsDelivr CDN links")
    
    return jsdelivr_dir

def generate_jsdelivr_urls():
    """Generate jsDelivr CDN URLs for the uploaded files."""
    
    base_url = "https://cdn.jsdelivr.net/gh/parrrotvr/game-portal@latest/jsdelivr-files"
    
    urls = {
        "feed-the-void/index.wasm": f"{base_url}/feed-the-void/index.wasm",
        "outhold/index.pck": f"{base_url}/outhold/index.pck",
        "outhold/index.side.wasm": f"{base_url}/outhold/index.side.wasm",
        "gscriptlearn/index.pck": f"{base_url}/gscriptlearn/index.pck",
        "reacticore/Reacticore_20_02_26.wasm.br": f"{base_url}/reacticore/Reacticore_20_02_26.wasm.br",
        "scritchy-scratchy/WebGL.wasm.br": f"{base_url}/scritchy-scratchy/WebGL.wasm.br",
        "epicmine/dc5816d0674db347069a3818c4eebb18.wasm.br": f"{base_url}/epicmine/dc5816d0674db347069a3818c4eebb18.wasm.br",
        "epicmine/f3f6b0ef131f67204364f79b8ba5fb91.data.br": f"{base_url}/epicmine/f3f6b0ef131f67204364f79b8ba5fb91.data.br"
    }
    
    print("\n🌐 jsDelivr CDN URLs:")
    print("=" * 50)
    for file_path, url in urls.items():
        print(f"{file_path}:")
        print(f"  {url}")
        print()
    
    return urls

if __name__ == "__main__":
    # Prepare files
    jsdelivr_dir = prepare_jsdelivr_files()
    
    # Generate URLs
    urls = generate_jsdelivr_urls()
    
    print("✅ jsDelivr preparation complete!")
    print("\n📝 Instructions:")
    print("1. Upload files from 'jsdelivr-files' directory to GitHub releases")
    print("2. Update game HTML files to use jsDelivr URLs")
    print("3. Commit and push the updated code")
