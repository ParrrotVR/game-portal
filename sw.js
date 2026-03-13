const CACHE_NAME = 'game-portal-v18'; // Streaming SW assembly + optimized probe order v1.1.4
const DATA_EXTENSIONS = ['.pck', '.wasm', '.data', '.unityweb', '.bundle'];

self.addEventListener('install', (event) => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(clients.claim()));

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    const path = url.pathname.toLowerCase();
    
    const isData = DATA_EXTENSIONS.some(ext => path.endsWith(ext)) || path.includes('.wasm.br');
    
    if (isData) {
        event.respondWith(
            fetch(event.request).then(response => {
                const isHtml = response.headers.get('content-type')?.toLowerCase().includes('text/html');
                if (response.ok && !isHtml) return response;
                return assembleSplitFile(event.request.url);
            }).catch(() => assembleSplitFile(event.request.url))
        );
        return;
    }

    // Inject COOP/COEP headers on every navigation response so crossOriginIsolated
    // is true in the main window AND any game iframes, regardless of server config.
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).then(response => {
                const headers = new Headers(response.headers);
                headers.set('Cross-Origin-Opener-Policy', 'same-origin');
                headers.set('Cross-Origin-Embedder-Policy', 'credentialless');
                headers.set('Cross-Origin-Resource-Policy', 'cross-origin');
                return new Response(response.body, {
                    status: response.status,
                    statusText: response.statusText,
                    headers: headers
                });
            })
        );
    }
});

async function assembleSplitFile(baseUrl) {
    const urlObj = new URL(baseUrl);
    const filename = urlObj.pathname.split('/').pop();
    const directory = urlObj.pathname.substring(0, urlObj.pathname.lastIndexOf('/') + 1);
    
    const getMimeType = (p) => {
        const low = p.toLowerCase();
        if (low.endsWith('.wasm')) return 'application/wasm';
        if (low.endsWith('.pck') || low.endsWith('.data') || low.endsWith('.unityweb')) return 'application/octet-stream';
        return 'application/octet-stream';
    };

    const isHTML = (res) => res.headers.get('content-type')?.toLowerCase().includes('text/html');

    // Candidates for full filename matching
    const nameCandidates = [filename];
    if (filename.endsWith('.wasm')) {
        nameCandidates.push(filename + '.br');
        const dotIdx = filename.lastIndexOf('.');
        if (dotIdx !== -1) nameCandidates.push(filename.substring(0, dotIdx) + '.side' + filename.substring(dotIdx));
    }
    if (filename.endsWith('.pck')) {
        nameCandidates.push(filename + '.br');
        const dotIdx = filename.lastIndexOf('.');
        if (dotIdx !== -1) nameCandidates.push(filename.substring(0, dotIdx) + '.side' + filename.substring(dotIdx));
    }
    if (filename.endsWith('.data')) nameCandidates.push(filename + '.br');

    // Candidates for folder names
    const base = filename.includes('.') ? filename.substring(0, filename.lastIndexOf('.')) : filename;
    const subfolders = [
        'index_parts/',          // TIW and standard Godot web exports — try first
        '', 
        'index.pck_parts/', 
        'index.wasm_parts/', 
        'index.side_parts/',
        'index.side.wasm_parts/',
        'index.side.pck_parts/',
        `${base}_parts/`,
        `${base}.parts/`,
        `${base}.side_parts/`,
        `${filename}_parts/`, 
        `${filename}.parts/`,
        'parts/'
    ];
    
    const segmentPrefixes = ['', 'part1.', 'part2.', 'part3.'];

    for (const name of nameCandidates) {
        for (const folder of subfolders) {
            for (const seg of segmentPrefixes) {
                const dirNormalized = directory.endsWith('/') ? directory : directory + '/';
                const prefix = `${dirNormalized}${folder}${name}.${seg}part`;
                
                for (const pad of ['001', '01', '1']) {
                    const testUrl = `${urlObj.origin}${prefix}${pad}`;
                    
                    try {
                        const res = await fetch(testUrl, { method: 'HEAD' });
                        if (res.ok && !isHTML(res)) {
                            // Stream parts directly rather than accumulating blobs
                            const mimeType = getMimeType(baseUrl);
                            const stream = new ReadableStream({
                                async start(controller) {
                                    try {
                                        let currentSegInt = seg === '' ? 0 : parseInt(seg.replace('part', '').replace('.', ''));
                                        while (true) {
                                            const currentSegStr = currentSegInt === 0 ? '' : `part${currentSegInt}.`;
                                            const currentPrefix = `${dirNormalized}${folder}${name}.${currentSegStr}part`;
                                            let i = 1;
                                            let segmentFound = false;
                                            while (true) {
                                                const pUrl = `${urlObj.origin}${currentPrefix}${i.toString().padStart(pad.length, '0')}`;
                                                const pRes = await fetch(pUrl);
                                                if (pRes.ok && !isHTML(pRes)) {
                                                    segmentFound = true;
                                                    const reader = pRes.body.getReader();
                                                    while (true) {
                                                        const { done, value } = await reader.read();
                                                        if (done) break;
                                                        controller.enqueue(value);
                                                    }
                                                    i++;
                                                } else { break; }
                                                if (i > 1000) break;
                                            }
                                            if (currentSegInt === 0 || !segmentFound) break;
                                            currentSegInt++;
                                        }
                                    } catch (e) {
                                    } finally {
                                        controller.close();
                                    }
                                }
                            });
                            return new Response(stream, {
                                headers: {
                                    'Content-Type': mimeType,
                                    'Cross-Origin-Embedder-Policy': 'require-corp',
                                    'Cross-Origin-Opener-Policy': 'same-origin',
                                    'Access-Control-Allow-Origin': '*',
                                    'X-Assembled': 'true'
                                }
                            });
                        }
                    } catch (e) {}
                }
            }
        }
    }

    
    return new Response('404: Game Asset Not Found (Parts Missing)', { 
        status: 404,
        headers: { 'Content-Type': 'text/plain' }
    });
}


