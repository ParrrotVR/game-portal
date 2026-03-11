#!/usr/bin/env python3
"""
Reassemble all split game files for local development.
This script combines all split parts back into complete game files.
"""

import os
import sys
from pathlib import Path

def reassemble_file(file_path):
    """Reassemble a single file from split parts."""
    file_path = Path(file_path)
    
    if not file_path.exists():
        print(f"❌ Directory not found: {file_path.parent}")
        return False
    
    # Find all split parts
    parts = []
    base_name = file_path.name
    
    # Look for split parts
    for i in range(1, 10):  # Check up to .009
        part_name = f"{base_name}.part.{i:03d}"
        part_path = file_path.parent / part_name
        
        if part_path.exists():
            parts.append(part_path)
        else:
            break  # Stop when we find a missing part
    
    if not parts:
        print(f"⚠️ No split parts found for: {base_name}")
        return False
    
    print(f"🔧 Reassembling: {base_name}")
    print(f"   📦 Found {len(parts)} parts")
    
    # Sort parts by number
    parts.sort(key=lambda x: int(x.name.split('.')[-1]))
    
    # Combine all parts
    with open(file_path, 'wb') as output_file:
        total_size = 0
        for part_path in parts:
            with open(part_path, 'rb') as part_file:
                data = part_file.read()
                output_file.write(data)
                total_size += len(data)
                print(f"   ✅ Added: {part_path.name} ({len(data) / (1024*1024):.1f}MB)")
        
        print(f"   ✅ Created: {base_name} ({total_size / (1024*1024):.1f}MB)")
    
    # Remove split parts
    for part_path in parts:
        part_path.unlink()
        print(f"   🗑️ Removed: {part_path.name}")
    
    return True

def main():
    """Reassemble all split game files."""
    print("🎮 Game Portal - File Reassembler")
    print("=" * 50)
    
    # Game directories to check
    game_dirs = [
        "games/feed-the-void",
        "games/outhold", 
        "games/gscriptlearn",
        "games/reacticore/Build",
        "games/scritchy-scratchy/Build",
        "games/epicmine/Build"
    ]
    
    # Files to reassemble in each directory
    files_to_reassemble = [
        ("index.wasm", "games/feed-the-void"),
        ("index.pck", "games/outhold"),
        ("index.side.wasm", "games/outhold"),
        ("index.pck", "games/gscriptlearn"),
        ("Reacticore_20_02_26.wasm.br", "games/reacticore/Build"),
        ("WebGL.wasm.br", "games/scritchy-scratchy/Build"),
        ("dc5816d0674db347069a3818c4eebb18.wasm.br", "games/epicmine/Build"),
        ("f3f6b0ef131f67204364f79b8ba5fb91.data.br", "games/epicmine/Build")
    ]
    
    success_count = 0
    total_count = len(files_to_reassemble)
    
    for filename, directory in files_to_reassemble:
        file_path = Path(directory) / filename
        if reassemble_file(file_path):
            success_count += 1
        else:
            print(f"❌ Failed: {filename}")
    
    print("=" * 50)
    print(f"✅ Successfully reassembled {success_count}/{total_count} files")
    print("🎮 Games are ready for local development!")
    print()
    print("🚀 Next steps:")
    print("   1. Start server: python -m http.server 8080")
    print("   2. Open browser: http://localhost:8080")

if __name__ == "__main__":
    main()
