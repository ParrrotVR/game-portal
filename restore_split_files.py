#!/usr/bin/env python3
"""
Recreate split files for games after cleanup.
"""

import os
import math
from pathlib import Path

def split_file_into_parts(file_path, chunk_size_mb=5):
    """Split a large file into smaller parts."""
    
    file_path = Path(file_path)
    if not file_path.exists():
        print(f"❌ File not found: {file_path}")
        return False
    
    file_size = file_path.stat().st_size
    chunk_size = chunk_size_mb * 1024 * 1024  # Convert MB to bytes
    num_parts = math.ceil(file_size / chunk_size)
    
    print(f"📂 Splitting {file_path.name}:")
    print(f"   Size: {file_size / (1024*1024):.1f}MB")
    print(f"   Parts: {num_parts}")
    print(f"   Chunk size: {chunk_size_mb}MB")
    
    # Create parts directory
    parts_dir = file_path.parent / f"{file_path.stem}_parts"
    parts_dir.mkdir(exist_ok=True)
    
    # Read and split file
    with open(file_path, 'rb') as f:
        for part_num in range(1, num_parts + 1):
            chunk = f.read(chunk_size)
            if not chunk:
                break
            
            part_filename = f"{file_path.name}.part{part_num:03d}"
            part_path = parts_dir / part_filename
            
            with open(part_path, 'wb') as part_file:
                part_file.write(chunk)
            
            print(f"   ✅ Created: {part_filename}")
    
    print(f"   📁 Parts saved in: {parts_dir}")
    return num_parts

def create_merging_script(game_name, file_name, num_parts):
    """Create JavaScript merging script for a game."""
    
    script_content = f'''
// File merging script for {game_name}

async function fetchWithProgress(url, onProgress) {{
  const response = await fetch(url);
  const reader = response.body.getReader();
  let chunks = [];
  let received = 0;
  
  while (true) {{
    const {{ done, value }} = await reader.read();
    if (done) break;
    received += value.length;
    chunks.push(value);
    
    if (onProgress) {{
      onProgress(received, response.headers.get('content-length') || 0);
    }}
  }}
  
  let fullBuffer = new Uint8Array(received);
  let offset = 0;
  for (let chunk of chunks) {{
    fullBuffer.set(chunk, offset);
    offset += chunk.length;
  }}
  
  return fullBuffer.buffer;
}}

async function mergeFiles(fileParts, outputName, onProgress) {{
  console.log(`Merging ${{fileParts.length}} parts for ${{outputName}}...`);
  
  const buffers = await Promise.all(
    fileParts.map((part, index) => 
      fetchWithProgress(part, (loaded, total) => {{
        const progress = ((index + loaded/total) / fileParts.length) * 100;
        if (onProgress) onProgress(progress, outputName);
      }})
    )
  );
  
  const mergedBlob = new Blob(buffers);
  const url = URL.createObjectURL(mergedBlob);
  
  console.log(`Merged ${{outputName}} - Size: ${{(mergedBlob.size / (1024*1024)).toFixed(1)}}MB`);
  return url;
}}

function getParts(basePath, start, end) {{
  let parts = [];
  for (let i = start; i <= end; i++) {{
    parts.push(basePath + ".part" + i.toString().padStart(3, '0'));
  }}
  return parts;
}}

// Initialize merging for {game_name}
(async () => {{
  try {{
    // Update loading text
    const loadingText = document.querySelector("#loading-text") || document.body;
    const originalText = loadingText.textContent;
    
    // Merge {file_name}
    const fileParts = getParts("{file_name}", 1, {num_parts});
    const mergedUrl = await mergeFiles(
      fileParts, 
      "{file_name}", 
      (progress, filename) => {{
        loadingText.textContent = `Merging ${{filename}}: ${{progress.toFixed(1)}}%`;
      }}
    );
    
    // Override XMLHttpRequest to serve merged file
    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url, ...rest) {{
      if (url.includes("{file_name}")) {{
        url = mergedUrl;
      }}
      return originalOpen.call(this, method, url, ...rest);
    }};
    
    // Restore original text
    loadingText.textContent = originalText;
    console.log("File merging complete - Game ready!");
    
  }} catch (error) {{
    console.error("Error merging files:", error);
    const loadingText = document.querySelector("#loading-text") || document.body;
    loadingText.textContent = "Error loading game files";
  }}
}})();
'''
    
    return script_content

def restore_split_files():
    """Restore split files for existing games."""
    
    print("🔄 Restoring split files for games...")
    print("=" * 50)
    
    # Check what games we have
    games_dir = Path("games")
    if not games_dir.exists():
        print("❌ No games directory found!")
        return
    
    total_parts = 0
    
    for game_dir in games_dir.iterdir():
        if game_dir.is_dir():
            print(f"\n🎮 Processing: {game_dir.name}")
            
            # Find large files to split
            for file_path in game_dir.rglob("*"):
                if file_path.is_file() and file_path.stat().st_size > 10 * 1024 * 1024:  # > 10MB
                    # Split the file
                    num_parts = split_file_into_parts(file_path, chunk_size_mb=5)
                    if num_parts:
                        total_parts += num_parts
                        
                        # Create merging script
                        script_content = create_merging_script(game_dir.name, file_path.name, num_parts)
                        script_path = file_path.parent / f"merge_{file_path.name.replace('.', '_')}.js"
                        
                        with open(script_path, 'w', encoding='utf-8') as f:
                            f.write(script_content)
                        
                        print(f"   📝 Created merging script: {script_path.name}")
                        
                        # Update game HTML to include merging script
                        html_path = file_path.parent / "index.html"
                        if html_path.exists():
                            update_html_for_splitting(html_path, script_path.name, file_path.name)
                            print(f"   🔄 Updated: {html_path.name}")
    
    print(f"\n✅ Split files restored! Total parts: {total_parts}")

def update_html_for_splitting(html_path, script_name, file_name):
    """Update HTML file to include file merging script."""
    
    with open(html_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Add loading text element if not present
    if '<div id="loading-text"' not in content:
        body_tag = content.find('<body')
        if body_tag != -1:
            insert_pos = content.find('>', body_tag) + 1
            loading_div = '\n    <div id="loading-text" style="color: white; font-size: 24px; text-align: center; margin-top: 50px;">Loading game files...</div>\n'
            content = content[:insert_pos] + loading_div + content[insert_pos:]
    
    # Add merging script before closing body tag
    script_tag = f'\n    <script src="{script_name}"></script>\n'
    body_end = content.find('</body>')
    if body_end != -1:
        content = content[:body_end] + script_tag + content[body_end:]
    
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == "__main__":
    restore_split_files()
    print("\n🎮 Split files restored! Games should work now.")
