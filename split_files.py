#!/usr/bin/env python3
"""
Split large files into smaller chunks for GitHub upload.
Chunks will be named: filename.part.001, filename.part.002, etc.
"""

import os
import sys
from pathlib import Path

def split_file(file_path, chunk_size_mb=20):
    """Split a large file into smaller chunks."""
    file_path = Path(file_path)
    chunk_size = chunk_size_mb * 1024 * 1024  # Convert MB to bytes
    
    if not file_path.exists():
        print(f"❌ File not found: {file_path}")
        return False
    
    file_size = file_path.stat().st_size
    if file_size <= chunk_size:
        print(f"✅ File is small enough: {file_path} ({file_size / (1024*1024):.1f}MB)")
        return True
    
    print(f"📦 Splitting {file_path} ({file_size / (1024*1024):.1f}MB) into {chunk_size_mb}MB chunks...")
    
    with open(file_path, 'rb') as f:
        chunk_num = 1
        while True:
            chunk = f.read(chunk_size)
            if not chunk:
                break
            
            chunk_filename = f"{file_path}.part.{chunk_num:03d}"
            with open(chunk_filename, 'wb') as chunk_file:
                chunk_file.write(chunk)
            
            print(f"   ✅ Created: {chunk_filename} ({len(chunk) / (1024*1024):.1f}MB)")
            chunk_num += 1
    
    # Remove original file
    file_path.unlink()
    print(f"🗑️  Removed original: {file_path}")
    return True

def join_files(file_path):
    """Join split chunks back into original file."""
    file_path = Path(file_path)
    base_path = file_path
    
    # Find all chunk files
    chunk_files = sorted(base_path.parent.glob(f"{base_path.name}.part.*"))
    
    if not chunk_files:
        print(f"❌ No chunks found for: {file_path}")
        return False
    
    print(f"🔄 Joining {len(chunk_files)} chunks into {file_path}...")
    
    with open(file_path, 'wb') as output_file:
        for chunk_file in chunk_files:
            with open(chunk_file, 'rb') as f:
                output_file.write(f.read())
            print(f"   ✅ Added: {chunk_file.name}")
    
    # Remove chunk files
    for chunk_file in chunk_files:
        chunk_file.unlink()
        print(f"🗑️  Removed: {chunk_file.name}")
    
    print(f"✅ Reconstructed: {file_path}")
    return True

def main():
    if len(sys.argv) < 2:
        print("Usage:")
        print("  Split: python split_files.py split <file_path>")
        print("  Join:  python split_files.py join <file_path>")
        return
    
    action = sys.argv[1]
    file_path = sys.argv[2]
    
    if action == "split":
        split_file(file_path)
    elif action == "join":
        join_files(file_path)
    else:
        print("❌ Invalid action. Use 'split' or 'join'")

if __name__ == "__main__":
    main()
