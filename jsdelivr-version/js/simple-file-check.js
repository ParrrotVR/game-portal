// Simple file reassembly for Game Portal
// This version just ensures split files are available and lets games handle them

class SimpleFileReassembler {
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
    }

    async checkFiles() {
        console.log('🔍 Checking game files availability...');
        let allAvailable = true;
        
        for (const filePath of this.neededFiles) {
            const available = await this.isFileAvailable(filePath);
            if (available) {
                console.log(`   ✅ Available: ${filePath}`);
            } else {
                console.log(`   ❌ Missing: ${filePath}`);
                allAvailable = false;
            }
        }
        
        if (allAvailable) {
            console.log('✅ All game files are available!');
        } else {
            console.log('⚠️ Some game files are missing - games may not load properly');
        }
        
        return allAvailable;
    }

    async isFileAvailable(filePath) {
        try {
            const response = await fetch(filePath, { method: 'HEAD' });
            return response.ok;
        } catch (error) {
            return false;
        }
    }
}

// Initialize and run check
const reassembler = new SimpleFileReassembler();

// Run file check when page loads
document.addEventListener('DOMContentLoaded', async () => {
    // Show loading message
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'file-check-loading';
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
            <span>🔍 Checking game files...</span>
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
        await reassembler.checkFiles();
        
        // Remove loading message after delay
        setTimeout(() => {
            if (loadingDiv.parentNode) {
                loadingDiv.parentNode.removeChild(loadingDiv);
            }
        }, 3000);
        
    } catch (error) {
        console.error('❌ File check failed:', error);
        loadingDiv.innerHTML = `
            <div style="color: #ff6b6b;">
                ⚠️ Error checking game files
                <br><small>Some games may not load properly</small>
            </div>
        `;
    }
});

// Export for debugging
window.SimpleFileReassembler = SimpleFileReassembler;
