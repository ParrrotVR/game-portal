#!/usr/bin/env python3
"""
Update game HTML files to use jsDelivr CDN URLs.
This replaces local file paths with jsDelivr CDN links.
"""

import os
import re
from pathlib import Path

def update_feed_the_void():
    """Update Feed the Void game to use jsDelivr."""
    
    file_path = Path("games/feed-the-void/index.html")
    if not file_path.exists():
        print(f"❌ File not found: {file_path}")
        return False
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace WASM file URL
    old_wasm = 'index.wasm'
    new_wasm = 'https://cdn.jsdelivr.net/gh/parrrotvr/game-portal@latest/jsdelivr-files/feed-the-void/index.wasm'
    
    content = content.replace(f'"{old_wasm}"', f'"{new_wasm}"')
    content = content.replace(f"'{old_wasm}'", f"'{new_wasm}'")
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✅ Updated: Feed the Void -> {new_wasm}")
    return True

def update_outhold():
    """Update Outhold game to use jsDelivr."""
    
    file_path = Path("games/outhold/index.html")
    if not file_path.exists():
        print(f"❌ File not found: {file_path}")
        return False
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace PCK file URL
    old_pck = 'index.pck'
    new_pck = 'https://cdn.jsdelivr.net/gh/parrrotvr/game-portal@latest/jsdelivr-files/outhold/index.pck'
    
    content = content.replace(f'"{old_pck}"', f'"{new_pck}"')
    content = content.replace(f"'{old_pck}'", f"'{new_pck}'")
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✅ Updated: Outhold -> {new_pck}")
    return True

def update_gscriptlearn():
    """Update Learn GDScript game to use jsDelivr."""
    
    file_path = Path("games/gscriptlearn/index.html")
    if not file_path.exists():
        print(f"❌ File not found: {file_path}")
        return False
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace PCK file URL
    old_pck = 'index.pck'
    new_pck = 'https://cdn.jsdelivr.net/gh/parrrotvr/game-portal@latest/jsdelivr-files/gscriptlearn/index.pck'
    
    content = content.replace(f'"{old_pck}"', f'"{new_pck}"')
    content = content.replace(f"'{old_pck}'", f"'{new_pck}'")
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✅ Updated: Learn GDScript -> {new_pck}")
    return True

def update_reacticore():
    """Update Reacticore game to use jsDelivr."""
    
    file_path = Path("games/reacticore/index-force.html")
    if not file_path.exists():
        print(f"❌ File not found: {file_path}")
        return False
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace WASM file URL
    old_wasm = 'Reacticore_20_02_26.wasm.br'
    new_wasm = 'https://cdn.jsdelivr.net/gh/parrrotvr/game-portal@latest/jsdelivr-files/reacticore/Reacticore_20_02_26.wasm.br'
    
    content = content.replace(f'"{old_wasm}"', f'"{new_wasm}"')
    content = content.replace(f"'{old_wasm}'", f"'{new_wasm}'")
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✅ Updated: Reacticore -> {new_wasm}")
    return True

def update_epicmine():
    """Update Epic Mine game to use jsDelivr."""
    
    file_path = Path("games/epicmine/Build/index.html")
    if not file_path.exists():
        print(f"❌ File not found: {file_path}")
        return False
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace WASM and data file URLs
    old_wasm = 'dc5816d0674db347069a3818c4eebb18.wasm.br'
    new_wasm = 'https://cdn.jsdelivr.net/gh/parrrotvr/game-portal@latest/jsdelivr-files/epicmine/dc5816d0674db347069a3818c4eebb18.wasm.br'
    
    old_data = 'f3f6b0ef131f67204364f79b8ba5fb91.data.br'
    new_data = 'https://cdn.jsdelivr.net/gh/parrrotvr/game-portal@latest/jsdelivr-files/epicmine/f3f6b0ef131f67204364f79b8ba5fb91.data.br'
    
    content = content.replace(f'"{old_wasm}"', f'"{new_wasm}"')
    content = content.replace(f"'{old_wasm}'", f"'{new_wasm}'")
    content = content.replace(f'"{old_data}"', f'"{new_data}"')
    content = content.replace(f"'{old_data}'", f"'{new_data}'")
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✅ Updated: Epic Mine -> {new_wasm}")
    print(f"✅ Updated: Epic Mine -> {new_data}")
    return True

def main():
    """Update all game files to use jsDelivr CDN."""
    
    print("🌐 Updating game files to use jsDelivr CDN...")
    print("=" * 50)
    
    updates = [
        update_feed_the_void,
        update_outhold,
        update_gscriptlearn,
        update_reacticore,
        update_epicmine
    ]
    
    success_count = 0
    for update_func in updates:
        try:
            if update_func():
                success_count += 1
        except Exception as e:
            print(f"❌ Error: {e}")
    
    print("=" * 50)
    print(f"✅ Updated {success_count}/{len(updates)} games")
    print("🎮 Games now use jsDelivr CDN for large files!")

if __name__ == "__main__":
    main()
