#!/usr/bin/env python3
"""
Automatically reassemble all split game files.
"""

import os
import sys
from pathlib import Path

def join_all_files():
    """Join all split game files in the games directory."""
    games_dir = Path("games")
    
    # Find all split files
    split_files = []
    for pattern in ["*.part.001", "*.part.002", "*.part.003", "*.part.004", "*.part.005"]:
        split_files.extend(games_dir.rglob(pattern))
    
    if not split_files:
        print("❌ No split files found!")
        return False
    
    # Group by original filename
    file_groups = {}
    for split_file in split_files:
        # Extract original filename (remove .part.XXX)
        parts = split_file.name.split('.part.')
        original_name = '.part.'.join(parts[:-1])
        original_path = split_file.parent / original_name
        
        if original_path not in file_groups:
            file_groups[original_path] = []
        file_groups[original_path].append(split_file)
    
    # Sort and join each group
    for original_path, chunks in sorted(file_groups.items()):
        chunks.sort(key=lambda x: int(x.name.split('.part.')[-1]))
        
        print(f"🔄 Reassembling: {original_path}")
        print(f"   📦 Found {len(chunks)} chunks")
        
        # Join chunks
        with open(original_path, 'wb') as output_file:
            total_size = 0
            for chunk in chunks:
                with open(chunk, 'rb') as chunk_file:
                    data = chunk_file.read()
                    output_file.write(data)
                    total_size += len(data)
                print(f"   ✅ Added: {chunk.name}")
        
        print(f"   📊 Total size: {total_size / (1024*1024):.1f}MB")
        
        # Remove chunk files
        for chunk in chunks:
            chunk.unlink()
        print(f"   🗑️  Removed {len(chunks)} chunk files")
        print()
    
    print("✅ All files reassembled successfully!")
    print("🎮 Games should now work properly")
    return True

if __name__ == "__main__":
    join_all_files()
