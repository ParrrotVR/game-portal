
// File merging script for feed-the-void

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

// Initialize merging for feed-the-void
(async () => {
  try {
    // Update loading text
    const loadingText = document.querySelector("#loading-text") || document.body;
    const originalText = loadingText.textContent;
    
    // Merge index.pck
    const fileParts = getParts("index.pck", 1, 3);
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
