const fs = require('fs');
const path = require('path');

// Script to merge PCK parts into a single index.pck file
const partsDir = path.join(__dirname, 'index_parts');
const outputFile = path.join(__dirname, 'index.pck');

console.log('Merging PCK parts...');

try {
    // Check if parts directory exists
    if (!fs.existsSync(partsDir)) {
        console.error('Error: index_parts directory not found');
        process.exit(1);
    }

    // Get all part files
    const partFiles = fs.readdirSync(partsDir)
        .filter(file => file.startsWith('index.pck.part'))
        .sort((a, b) => {
            // Extract part numbers and sort numerically
            const aNum = parseInt(a.split('.part')[1]) || 0;
            const bNum = parseInt(b.split('.part')[1]) || 0;
            return aNum - bNum;
        });

    if (partFiles.length === 0) {
        console.error('Error: No PCK part files found in index_parts directory');
        process.exit(1);
    }

    console.log(`Found ${partFiles.length} part files`);

    // Create write stream for output file
    const writeStream = fs.createWriteStream(outputFile);

    // Merge all parts
    let currentPart = 0;
    
    function writeNextPart() {
        if (currentPart >= partFiles.length) {
            writeStream.end();
            console.log('Successfully merged PCK file');
            return;
        }

        const partFile = partFiles[currentPart];
        const partPath = path.join(partsDir, partFile);
        
        console.log(`Writing part ${currentPart + 1}/${partFiles.length}: ${partFile}`);
        
        const partData = fs.readFileSync(partPath);
        writeStream.write(partData);
        
        currentPart++;
        writeNextPart();
    }

    writeNextPart();

    writeStream.on('finish', () => {
        const stats = fs.statSync(outputFile);
        console.log(`Created index.pck with size: ${stats.size} bytes`);
    });

    writeStream.on('error', (err) => {
        console.error('Error writing PCK file:', err);
        process.exit(1);
    });

} catch (error) {
    console.error('Error merging PCK parts:', error);
    process.exit(1);
}
