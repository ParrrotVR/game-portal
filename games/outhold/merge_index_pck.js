
// File merging script for outhold

async function fetchWithProgress(url, onProgress) {
  try {
    console.log('Fetching:', url);
    const response = await fetch(url);
    console.log('Response status:', response.status);
    console.log('Content-Type:', response.headers.get('content-type'));
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    console.log('Buffer size:', arrayBuffer.byteLength);
    
    // Check if it's an HTML error page
    const text = new TextDecoder().decode(arrayBuffer.slice(0, 100));
    if (text.includes('<!DOCTYPE html>') || text.includes('<html>')) {
      console.error('Got HTML error page instead of file!');
      console.error('First 100 chars:', text);
      throw new Error('Got HTML error page instead of file');
    }
    
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
  try {
    // Update loading text
    const loadingText = document.querySelector("#loading-text") || document.body;
    const originalText = loadingText.textContent;
    
    // Merge index.pck
    const fileParts = getParts("index.pck", 1, 8);
    const mergedUrl = await mergeFiles(
      fileParts, 
      "index.pck", 
      (progress, filename) => {
        loadingText.textContent = `Merging ${filename}: ${progress.toFixed(1)}%`;
      }
    );
    
    // Override XMLHttpRequest to serve merged file
    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url, ...rest) {
      if (url.includes("index.pck")) {
        url = mergedUrl;
      }
      return originalOpen.call(this, method, url, ...rest);
    };
    
    // Restore original text
    loadingText.textContent = originalText;
    console.log("File merging complete - Game ready!");
    
  } catch (error) {
    console.error("Error merging files:", error);
    const loadingText = document.querySelector("#loading-text") || document.body;
    loadingText.textContent = "Error loading game files";
  }
})();
