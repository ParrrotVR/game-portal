// Automatic file reassembly for Game Portal
// This script detects split files and automatically reassembles them

class FileReassembler {
    constructor() {
        this.neededFiles = [
            'games/feed-the-void/index.wasm',
            'games/outhold/index.pck',
            'games/outhold/index.side.wasm',
            'games/gscriptlearn/index.pck',
            'games/reacticore/Build/Reacticore_20_02_26.wasm.br',
            'games/scritchy-scratchy/Build/WebGL.wasm.br',
            'games/epicmine/Build/dc5816d0674db347069a3818c4eebb18.wasm.br',
            'games/epicmine/Build/f3f6b0ef131f67204364f79b8ba5fb91.data.br'
        ];
        this.checkInterval = null;
    }

    async checkAndReassemble() {
        console.log('🔍 Checking for split game files...');
        
        for (const filePath of this.neededFiles) {
            if (await this.needsReassembly(filePath)) {
                console.log(`📦 Reassembling: ${filePath}`);
                await this.reassembleFile(filePath);
            }
        }
        
        console.log('✅ File check complete');
    }

    async needsReassembly(filePath) {
        try {
            const response = await fetch(filePath, { method: 'HEAD' });
            return !response.ok;
        } catch (error) {
            // File doesn't exist, check for split parts
            const parts = await this.findSplitParts(filePath);
            return parts.length > 0;
        }
    }

    async findSplitParts(filePath) {
        const parts = [];
        const baseName = filePath.replace(/^.*\//, ''); // Get filename without path
        const pathDir = filePath.replace(/\/[^\/]*$/, ''); // Get directory
        
        for (let i = 1; i <= 10; i++) {
            const partName = `${baseName}.part.${i.toString().padStart(3, '0')}`;
            const partPath = `${pathDir}/${partName}`;
            
            try {
                const response = await fetch(partPath, { method: 'HEAD' });
                if (response.ok) {
                    parts.push({
                        name: partName,
                        path: partPath,
                        index: i
                    });
                }
            } catch (error) {
                // Part doesn't exist, stop checking
                break;
            }
        }
        
        return parts.sort((a, b) => a.index - b.index);
    }

    async reassembleFile(filePath) {
        const parts = await this.findSplitParts(filePath);
        
        if (parts.length === 0) {
            console.warn(`⚠️ No split parts found for ${filePath}`);
            return false;
        }

        try {
            // Download all parts
            const partBlobs = [];
            for (const part of parts) {
                console.log(`   📥 Downloading: ${part.name}`);
                const response = await fetch(part.path);
                const blob = await response.blob();
                partBlobs.push(blob);
            }

            // Create combined blob
            const combinedBlob = new Blob(partBlobs, { type: 'application/octet-stream' });
            
            // Store in IndexedDB for future use
            await this.storeFile(filePath, combinedBlob);
            
            console.log(`   ✅ Reassembled: ${filePath} (${combinedBlob.size / (1024*1024).toFixed(1)}MB)`);
            return true;
            
        } catch (error) {
            console.error(`❌ Failed to reassemble ${filePath}:`, error);
            return false;
        }
    }

    async storeFile(filePath, blob) {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('GamePortalFiles', 1);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                const db = request.result;
                const transaction = db.transaction(['files'], 'readwrite');
                const store = transaction.objectStore('files');
                
                const putRequest = store.put({ path: filePath, blob: blob, timestamp: Date.now() });
                
                putRequest.onerror = () => reject(putRequest.error);
                putRequest.onsuccess = () => resolve();
            };
            
            request.onupgradeneeded = () => {
                const db = request.result;
                const store = db.createObjectStore('files', { keyPath: 'path' });
                store.createIndex('timestamp', 'timestamp', { unique: false });
            };
        });
    }

    async getStoredFile(filePath) {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('GamePortalFiles', 1);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                const db = request.result;
                const transaction = db.transaction(['files'], 'readonly');
                const store = transaction.objectStore('files');
                
                const getRequest = store.get(filePath);
                
                getRequest.onerror = () => reject(getRequest.error);
                getRequest.onsuccess = () => resolve(getRequest.result?.blob);
            };
        });
    }

    // Override fetch to use stored files
    setupFetchOverride() {
        const originalFetch = window.fetch;
        window.fetch = async (url, options) => {
            for (const filePath of this.neededFiles) {
                if (url.includes(filePath)) {
                    const storedFile = await this.getStoredFile(filePath);
                    if (storedFile) {
                        console.log(`📁 Using stored file: ${filePath}`);
                        return new Response(storedFile, {
                            status: 200,
                            headers: { 'Content-Type': 'application/octet-stream' }
                        });
                    }
                }
            }
            return originalFetch(url, options);
        };
    }
}

// Initialize and run reassembly
const reassembler = new FileReassembler();

// Run reassembly when page loads
document.addEventListener('DOMContentLoaded', async () => {
    // Show loading message
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'file-reassembly-loading';
    loadingDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 15px;
        border-radius: 10px;
        z-index: 10000;
        font-family: Arial, sans-serif;
        max-width: 300px;
    `;
    loadingDiv.innerHTML = `
        <div style="display: flex; align-items: center;">
            <div style="width: 20px; height: 20px; border: 2px solid #fff; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite; margin-right: 10px;"></div>
            <span>🔄 Preparing game files...</span>
        </div>
        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    `;
    document.body.appendChild(loadingDiv);

    try {
        await reassembler.checkAndReassemble();
        reassembler.setupFetchOverride();
        
        // Remove loading message after delay
        setTimeout(() => {
            if (loadingDiv.parentNode) {
                loadingDiv.parentNode.removeChild(loadingDiv);
            }
        }, 2000);
        
    } catch (error) {
        console.error('❌ File reassembly failed:', error);
        loadingDiv.innerHTML = `
            <div style="color: #ff6b6b;">
                ⚠️ Some game files may not load properly
                <br><small>Try refreshing the page</small>
            </div>
        `;
    }
});

// Export for debugging
window.FileReassembler = FileReassembler;
