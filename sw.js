const CACHE_NAME = 'game-portal-v1';

// Files that are known to be split into .part1, .part2, etc.
const SPLIT_FILES = [
    'pvzert.data.unityweb',
    'default_assets_all_86e6c689539c8f4b2be0ff2e56740e33.bundle',
    '69a2ad277230a9b551055478393b4c76.wasm.br',
    '643cb01d8dd85a9758fd6be787a6f05a.data.br',
    'dc5816d0674db347069a3818c4eebb18.wasm.br',
    'f3f6b0ef131f67204364f79b8ba5fb91.data.br'
];

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    const filename = url.pathname.split('/').pop();

    if (SPLIT_FILES.some(f => filename === f)) {
        console.log(`[SW] Intercepting split file: ${filename}`);
        event.respondWith(assembleSplitFile(event.request.url));
    }
});

async function assembleSplitFile(baseUrl) {
    const parts = [];
    let i = 1;

    try {
        while (true) {
            const partUrl = `${baseUrl}.part${i}`;
            const response = await fetch(partUrl);

            if (response.status === 404 || !response.ok) {
                if (i === 1) {
                    // If even part1 is missing, fallback to original URL (maybe it's not split?)
                    return fetch(baseUrl);
                }
                // End of parts
                break;
            }

            parts.push(await response.blob());
            console.log(`[SW] Fetched part ${i} for ${baseUrl}`);
            i++;

            // Safety break for too many parts
            if (i > 10) break;
        }

        const mergedBlob = new Blob(parts, { type: 'application/octet-stream' });
        return new Response(mergedBlob, {
            headers: { 'Content-Type': 'application/octet-stream' }
        });
    } catch (e) {
        console.error(`[SW] Error assembling ${baseUrl}:`, e);
        return fetch(baseUrl);
    }
}
