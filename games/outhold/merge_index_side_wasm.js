
// File merging script for outhold

async function fetchWithProgress(url, onProgress) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    
    if (onProgress) {
      onProgress(arrayBuffer.byteLength, arrayBuffer.byteLength);
    }
    
    return arrayBuffer;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}

async function mergeFiles(fileParts, outputName, onProgress) {
  console.log(`Merging ${fileParts.length} parts for ${outputName}...`);
  
  const buffers = await Promise.all(
    fileParts.map((part, index) => 
      fetchWithProgress(part, (loaded, total) => {
        const progress = ((index + loaded/total) / fileParts.length) * 100;
        if (onProgress) onProgress(progress, outputName);
      })
    )
  );
  
  const mergedBlob = new Blob(buffers);
  const url = URL.createObjectURL(mergedBlob);
  
  console.log(`Merged ${outputName} - Size: ${(mergedBlob.size / (1024*1024)).toFixed(1)}MB`);
  return url;
}

function getParts(basePath, start, end) {
  let parts = [];
  for (let i = start; i <= end; i++) {
    parts.push(basePath + ".part" + i.toString().padStart(3, '0'));
  }
  return parts;
}

// Initialize merging for outhold
(async () => {
  console.log('Starting Outhold WASM merge...');
  const wasmParts = getParts('./index_parts/index.side.wasm', 1, 8);
  console.log('WASM parts:', wasmParts);
  
  try {
    const wasmUrl = await mergeFiles(wasmParts, 'index.side.wasm');
    console.log('WASM merge successful, URL:', wasmUrl);
    
    // Override XMLHttpRequest to serve merged files
    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url, ...args) {
      if (url.includes('index.side.wasm')) {
        console.log('Intercepting WASM request:', url, '->', wasmUrl);
        return originalOpen.call(this, method, wasmUrl, ...args);
      }
      return originalOpen.call(this, method, url, ...args);
    };
    
    console.log('WASM merging complete - Game ready!');
    const loadingText = document.querySelector("#loading-text") || document.body;
    if (loadingText.textContent !== "Error loading game files") {
      loadingText.textContent = "All files merged! Starting game...";
    }
  } catch (error) {
    console.error('Error merging WASM files:', error);
    const loadingText = document.querySelector("#loading-text") || document.body;
    loadingText.textContent = "Error loading WASM files: " + error.message;
  }
})();
