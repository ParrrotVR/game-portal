const fs = require('fs');
const path = require('path');

function splitFile(filePath, chunkSizeMB) {
    const stats = fs.statSync(filePath);
    const fileSize = stats.size;
    const chunkSize = chunkSizeMB * 1024 * 1024;
    const buffer = fs.readFileSync(filePath);

    let offset = 0;
    let part = 1;

    while (offset < fileSize) {
        const end = Math.min(offset + chunkSize, fileSize);
        const chunk = buffer.slice(offset, end);
        const chunkPath = `${filePath}.part${part}`;
        fs.writeFileSync(chunkPath, chunk);
        console.log(`Created ${chunkPath} (${chunk.length} bytes)`);
        offset += chunkSize;
        part++;
    }
}

const filesToSplit = [
    'C:\\Users\\cheeseburger\\.gemini\\antigravity\\scratch\\game-portal\\games\\epicmine\\Build\\dc5816d0674db347069a3818c4eebb18.wasm.br',
    'C:\\Users\\cheeseburger\\.gemini\\antigravity\\scratch\\game-portal\\games\\epicmine\\Build\\f3f6b0ef131f67204364f79b8ba5fb91.data.br'
];

filesToSplit.forEach(file => {
    try {
        console.log(`Splitting ${file}...`);
        splitFile(file, 20); // 20MB chunks
    } catch (err) {
        console.error(`Error splitting ${file}:`, err);
    }
});
