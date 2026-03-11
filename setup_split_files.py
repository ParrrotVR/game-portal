#!/usr/bin/env python3
"""
Split large game files into smaller parts for browser-based merging.
Based on the peaks-of-yore approach for testing alternative CDN solution.
"""

import os
import math
from pathlib import Path

def split_file_into_parts(file_path, chunk_size_mb=10):
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
// Based on peaks-of-yore approach

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
  console.log(`🔄 Merging ${{fileParts.length}} parts for ${{outputName}}...`);
  
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
  
  console.log(`✅ Merged ${{outputName}} - Size: ${{(mergedBlob.size / (1024*1024)).toFixed(1)}}MB`);
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
        loadingText.textContent = `🔄 Merging ${{filename}}: ${{progress.toFixed(1)}}%`;
      }}
    );
    
    // Override XMLHttpRequest to serve merged file
    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url, ...rest) {{
      if (url.includes("{file_name}")) {{
        console.log(`🎯 Serving merged file: ${{filename}}`);
        url = mergedUrl;
      }}
      return originalOpen.call(this, method, url, ...rest);
    }};
    
    // Restore original text
    loadingText.textContent = originalText;
    console.log("✅ File merging complete - Game ready!");
    
  }} catch (error) {{
    console.error("❌ Error merging files:", error);
    const loadingText = document.querySelector("#loading-text") || document.body;
    loadingText.textContent = "❌ Error loading game files";
  }}
}})();
'''
    
    return script_content

def setup_split_files():
    """Set up split files and merging scripts for all games."""
    
    print("🚀 Setting up file splitting for browser merging...")
    print("=" * 60)
    
    # Games and their large files
    games_to_split = [
        ("games/feed-the-void", "index.wasm"),
        ("games/outhold", "index.pck"),
        ("games/outhold", "index.side.wasm"),
        ("games/gscriptlearn", "index.pck"),
        ("games/reacticore/Build", "Reacticore_20_02_26.wasm.br"),
        ("games/scritchy-scratchy/Build", "WebGL.wasm.br"),
        ("games/epicmine/Build", "dc5816d0674db347069a3818c4eebb18.wasm.br"),
        ("games/epicmine/Build", "f3f6b0ef131f67204364f79b8ba5fb91.data.br")
    ]
    
    total_parts = 0
    
    for game_dir, file_name in games_to_split:
        file_path = Path(game_dir) / file_name
        if file_path.exists():
            # Split the file
            num_parts = split_file_into_parts(file_path, chunk_size_mb=5)  # 5MB chunks
            if num_parts:
                total_parts += num_parts
                
                # Create merging script
                game_name = Path(game_dir).name
                script_content = create_merging_script(game_name, file_name, num_parts)
                script_path = Path(game_dir) / f"merge_{file_name.replace('.', '_')}.js"
                
                with open(script_path, 'w', encoding='utf-8') as f:
                    f.write(script_content)
                
                print(f"   📝 Created merging script: {script_path.name}")
                
                # Update game HTML to include merging script
                html_path = Path(game_dir) / "index.html"
                if html_path.exists():
                    update_html_for_splitting(html_path, script_path.name, file_name)
                    print(f"   🔄 Updated: {html_path.name}")
        
        print()
    
    print("=" * 60)
    print(f"✅ Split complete! Total parts created: {total_parts}")
    print("📁 All parts are ready for browser-based merging")
    print("🌐 This version can be deployed to any hosting service")

def update_html_for_splitting(html_path, script_name, file_name):
    """Update HTML file to include file merging script."""
    
    with open(html_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Add loading text element if not present
    if '<div id="loading-text"' not in content:
        body_tag = content.find('<body')
        if body_tag != -1:
            insert_pos = content.find('>', body_tag) + 1
            loading_div = '\n    <div id="loading-text" style="color: white; font-size: 24px; text-align: center; margin-top: 50px;">🔄 Loading game files...</div>\n'
            content = content[:insert_pos] + loading_div + content[insert_pos:]
    
    # Add merging script before closing body tag
    script_tag = f'\n    <script src="{script_name}"></script>\n'
    body_end = content.find('</body>')
    if body_end != -1:
        content = content[:body_end] + script_tag + content[body_end:]
    
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(content)

def create_split_version():
    """Create a split version for testing."""
    
    # Create split version directory
    split_version_dir = Path("split-version")
    if split_version_dir.exists():
        import shutil
        shutil.rmtree(split_version_dir)
    split_version_dir.mkdir()
    
    # Copy all files
    import shutil
    shutil.copytree("games", split_version_dir / "games")
    shutil.copy2("index.html", split_version_dir / "index.html")
    shutil.copy2("styles.css", split_version_dir / "styles.css")
    shutil.copy2("script.js", split_version_dir / "script.js")
    
    # Set up splitting in the split version
    os.chdir(split_version_dir)
    setup_split_files()
    os.chdir("..")
    
    # Create README
    readme_content = """# Split Files Version (Test)

## 🧪 File Splitting Test

This version uses the peaks-of-yore method:
- Large files split into 5MB parts
- Browser merges parts on load
- Progressive loading with progress

## 📂 How It Works

1. **Files split**: Large files → 5MB parts
2. **Browser merges**: JavaScript combines parts
3. **Game loads**: Uses merged files

## ✨ Benefits

- ✅ Works on any hosting service
- ✅ No size limits
- ✅ Progressive loading
- ✅ Shows progress

## ⚠️ Trade-offs

- Slower initial load (must merge)
- More complex setup
- More files to manage

## 🚀 Deploy

Upload this entire folder to any hosting service:
- Netlify
- Vercel
- GitHub Pages
- Any static host
"""
    
    with open(split_version_dir / "README.md", 'w', encoding='utf-8') as f:
        f.write(readme_content)
    
    print(f"📁 Created split version: {split_version_dir}")
    print("✅ Ready for testing on any hosting service!")

if __name__ == "__main__":
    create_split_version()
    print("\n🧪 Split file version created!")
    print("📋 Test this alongside the CDN version")
    print("🔍 Compare performance and choose the best approach")
