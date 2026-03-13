// PCK Loader for Cloudflare Pages - Handles large PCK files by loading parts dynamically
class PCKLoader {
    constructor() {
        this.parts = [];
        this.totalSize = 36755564; // Total PCK size in bytes
        this.partSize = 5 * 1024 * 1024; // 5MB per part (under 25MB limit)
        this.numParts = Math.ceil(this.totalSize / this.partSize);
    }

    async loadPCK() {
        console.log(`Loading PCK in ${this.numParts} parts...`);
        
        try {
            // Load all parts in parallel
            const partPromises = [];
            for (let i = 1; i <= this.numParts; i++) {
                const partUrl = `index_parts/index.pck.part${String(i).padStart(3, '0')}`;
                partPromises.push(this.loadPart(partUrl));
            }
            
            const parts = await Promise.all(partPromises);
            
            // Combine parts into single PCK
            const pckData = new Uint8Array(this.totalSize);
            let offset = 0;
            
            for (const part of parts) {
                pckData.set(part, offset);
                offset += part.length;
            }
            
            console.log('PCK loaded successfully');
            return pckData;
            
        } catch (error) {
            console.error('Failed to load PCK:', error);
            throw error;
        }
    }

    async loadPart(url) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to load part: ${url}`);
        }
        return new Uint8Array(await response.arrayBuffer());
    }
}

// Override Godot's file system to use our PCK loader
const originalEngine = window.Engine;
window.Engine = function(config) {
    const engine = new originalEngine(config);
    
    // Override the startGame method
    const originalStartGame = engine.startGame.bind(engine);
    engine.startGame = async function(options) {
        try {
            // Load PCK parts before starting game
            const pckLoader = new PCKLoader();
            const pckData = await pckLoader.loadPCK();
            
            // Create a virtual file system entry for the PCK
            const FS = engine.FS || (await engine.initFS?.());
            if (FS) {
                FS.createDataFile('/', 'index.pck', pckData, true, true, true);
            }
            
            // Start the game
            return originalStartGame(options);
            
        } catch (error) {
            console.error('Failed to start game:', error);
            throw error;
        }
    };
    
    return engine;
};
