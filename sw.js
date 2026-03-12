const CACHE_NAME = 'game-portal-v5';
const DATA_EXTENSIONS = ['.pck', '.wasm', '.data', '.unityweb', '.br', '.bundle'];

self.addEventListener('install', (event) => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(clients.claim()));

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    const path = url.pathname.toLowerCase();
    
    const isData = DATA_EXTENSIONS.some(ext => path.endsWith(ext));
    
    if (isData) {
        event.respondWith(
            fetch(event.request).then(response => {
                const isHtml = response.headers.get('content-type')?.includes('text/html');
                if (response.ok && !isHtml) return response;
                return assembleSplitFile(event.request.url);
            }).catch(() => assembleSplitFile(event.request.url))
        );
    }
});

async function assembleSplitFile(baseUrl) {
    const urlObj = new URL(baseUrl);
    const filename = urlObj.pathname.split('/').pop();
    const directory = urlObj.pathname.substring(0, urlObj.pathname.lastIndexOf('/') + 1);
    
    const sNames = [filename];
    if (filename.endsWith('.wasm')) sNames.push(filename + '.br');
    if (filename.endsWith('.data')) sNames.push(filename + '.br');
    
    const folders = ['', 'index_parts/', 'index.pck_parts/', 'index.wasm_parts/', 'index.data_parts/', `${filename}_parts/`];

    for (const sName of sNames) {
        for (const folder of folders) {
            const prefix = `${directory}${folder}${sName}.part`;
            for (const pad of ['001', '01', '1']) {
                const testUrl = `${urlObj.origin}${prefix}${pad}`;
                const res = await fetch(testUrl, { method: 'HEAD' });
                const isHtml = res.headers.get('content-type')?.includes('text/html');
                
                if (res.ok && !isHtml) {
                    // Start assembly
                    const parts = [];
                    let i = 1;
                    while (true) {
                        const pUrl = `${urlObj.origin}${prefix}${i.toString().padStart(pad.length, '0')}`;
                        const pRes = await fetch(pUrl);
                        const pIsHtml = pRes.headers.get('content-type')?.includes('text/html');
                        if (pRes.ok && !pIsHtml) {
                            parts.push(await pRes.blob());
                            i++;
                        } else {
                            break;
                        }
                        if (i > 500) break;
                    }
                    
                    if (parts.length > 0) {
                        const blob = new Blob(parts, { type: 'application/octet-stream' });
                        return new Response(blob, {
                            headers: {
                                'Content-Type': 'application/octet-stream',
                                'Cross-Origin-Embedder-Policy': 'require-corp',
                                'Cross-Origin-Opener-Policy': 'same-origin',
                                'Access-Control-Allow-Origin': '*'
                            }
                        });
                    }
                }
            }
        }
    }
    
    return new Response('Asset not found', { status: 404 });
}
