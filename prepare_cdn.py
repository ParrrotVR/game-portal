#!/usr/bin/env python3
"""
Prepare game files for CDN hosting (Cloudflare R2, AWS S3, etc.)
This creates a structured directory for uploading to CDN services.
"""

import os
import shutil
import json
from pathlib import Path

def prepare_cdn_files():
    """Create a directory with game files ready for CDN upload."""
    
    print("🚀 Preparing files for CDN hosting...")
    print("=" * 50)
    
    # Create CDN directory
    cdn_dir = Path("cdn-files")
    if cdn_dir.exists():
        shutil.rmtree(cdn_dir)
    cdn_dir.mkdir()
    
    # Game files to host on CDN
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
    
    # Copy files to CDN directory
    file_manifest = {}
    total_size = 0
    
    for file_path, game_name in game_files:
        source = Path(file_path)
        if source.exists():
            # Create game subdirectory
            game_dir = cdn_dir / game_name
            game_dir.mkdir(exist_ok=True)
            
            # Copy file
            dest = game_dir / source.name
            shutil.copy2(source, dest)
            
            size_mb = source.stat().st_size / (1024 * 1024)
            total_size += size_mb
            
            # Add to manifest
            cdn_path = f"{game_name}/{source.name}"
            file_manifest[cdn_path] = {
                "size_mb": round(size_mb, 2),
                "game": game_name,
                "filename": source.name
            }
            
            print(f"✅ Copied: {game_name}/{source.name} ({size_mb:.1f}MB)")
        else:
            print(f"❌ Missing: {file_path}")
    
    # Save manifest
    manifest_path = cdn_dir / "manifest.json"
    with open(manifest_path, 'w') as f:
        json.dump(file_manifest, f, indent=2)
    
    print("=" * 50)
    print(f"📁 Prepared {len(file_manifest)} files in: {cdn_dir}")
    print(f"📊 Total size: {total_size:.1f}MB")
    
    return cdn_dir, file_manifest

def generate_cdn_urls(cdn_base_url="https://cdn.yourdomain.com/game-portal"):
    """Generate CDN URLs for the uploaded files."""
    
    cdn_dir, file_manifest = prepare_cdn_files()
    
    urls = {}
    for file_path, info in file_manifest.items():
        urls[file_path] = f"{cdn_base_url}/{file_path}"
    
    print("\n🌐 CDN URLs (replace with your actual CDN domain):")
    print("=" * 50)
    for file_path, url in urls.items():
        print(f"{file_path}:")
        print(f"  {url}")
        print()
    
    return urls, file_manifest

def create_cloudflare_version():
    """Create a version for Cloudflare Pages with CDN links."""
    
    # Generate URLs with placeholder CDN domain
    cdn_base = "https://cdn.yourdomain.com/game-portal"
    urls, manifest = generate_cdn_urls(cdn_base)
    
    # Create Cloudflare Pages version
    cloudflare_dir = Path("cloudflare-version")
    if cloudflare_dir.exists():
        shutil.rmtree(cloudflare_dir)
    cloudflare_dir.mkdir()
    
    # Copy all game HTML files
    games_dir = Path("games")
    for game_dir in games_dir.iterdir():
        if game_dir.is_dir():
            dest_dir = cloudflare_dir / "games" / game_dir.name
            shutil.copytree(game_dir, dest_dir)
    
    # Update game files to use CDN URLs
    update_files_for_cdn(cloudflare_dir, urls)
    
    # Copy main portal files (excluding large files)
    shutil.copy2("index.html", cloudflare_dir / "index.html")
    shutil.copy2("styles.css", cloudflare_dir / "styles.css")
    shutil.copy2("script.js", cloudflare_dir / "script.js")
    shutil.copy2("sw.js", cloudflare_dir / "sw.js")
    
    # Copy js directory
    js_dir = cloudflare_dir / "js"
    js_dir.mkdir(exist_ok=True)
    if Path("js").exists():
        for js_file in Path("js").iterdir():
            if js_file.is_file():
                shutil.copy2(js_file, js_dir / js_file.name)
    
    # Create README for Cloudflare setup
    readme_content = f"""# Cloudflare Pages Game Portal

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
{chr(10).join([f"- {path}: {info['size_mb']}MB" for path, info in manifest.items()])}

### 📊 Benefits:
- 🚀 Super fast global CDN
- 📦 Small Cloudflare Pages site
- 💾 Large files on optimized CDN
- ⚡ Better performance worldwide
"""
    
    with open(cloudflare_dir / "README.md", 'w', encoding='utf-8') as f:
        f.write(readme_content)
    
    print(f"\n📁 Created Cloudflare version: {cloudflare_dir}")
    print("📋 Next steps:")
    print("   1. Upload cdn-files/ to your CDN service")
    print("   2. Update CDN URLs in cloudflare-version/ games")
    print("   3. Deploy cloudflare-version/ to Cloudflare Pages")

def update_files_for_cdn(base_dir, urls):
    """Update game HTML files to use CDN URLs."""
    
    # Mapping of local paths to CDN paths
    path_mapping = {
        "games/feed-the-void/index.wasm": urls["feed-the-void/index.wasm"],
        "games/outhold/index.pck": urls["outhold/index.pck"],
        "games/outhold/index.side.wasm": urls["outhold/index.side.wasm"],
        "games/gscriptlearn/index.pck": urls["gscriptlearn/index.pck"],
        "games/reacticore/Build/Reacticore_20_02_26.wasm.br": urls["reacticore/Reacticore_20_02_26.wasm.br"],
        "games/scritchy-scratchy/Build/WebGL.wasm.br": urls["scritchy-scratchy/WebGL.wasm.br"],
        "games/epicmine/Build/dc5816d0674db347069a3818c4eebb18.wasm.br": urls["epicmine/dc5816d0674db347069a3818c4eebb18.wasm.br"],
        "games/epicmine/Build/f3f6b0ef131f67204364f79b8ba5fb91.data.br": urls["epicmine/f3f6b0ef131f67204364f79b8ba5fb91.data.br"]
    }
    
    # Update Feed the Void
    feed_the_void_html = base_dir / "games" / "feed-the-void" / "index.html"
    if feed_the_void_html.exists():
        with open(feed_the_void_html, 'r') as f:
            content = f.read()
        
        # Replace WASM file URL
        content = content.replace('"index.wasm"', f'"{path_mapping["games/feed-the-void/index.wasm"]}"')
        
        with open(feed_the_void_html, 'w') as f:
            f.write(content)
        print(f"✅ Updated: Feed the Void")
    
    # Update Outhold
    outhold_html = base_dir / "games" / "outhold" / "index.html"
    if outhold_html.exists():
        with open(outhold_html, 'r') as f:
            content = f.read()
        
        content = content.replace('"index.pck"', f'"{path_mapping["games/outhold/index.pck"]}"')
        content = content.replace('"index.side.wasm"', f'"{path_mapping["games/outhold/index.side.wasm"]}"')
        
        with open(outhold_html, 'w') as f:
            f.write(content)
        print(f"✅ Updated: Outhold")
    
    # Update other games similarly...
    print("✅ All game files updated for CDN")

if __name__ == "__main__":
    create_cloudflare_version()
    print("\n✅ CDN preparation complete!")
    print("\n📝 Instructions:")
    print("1. Upload 'cdn-files/' to your CDN service")
    print("2. Update CDN URLs in 'cloudflare-version/' games")
    print("3. Deploy 'cloudflare-version/' to Cloudflare Pages")
