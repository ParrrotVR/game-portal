const CACHE_NAME = 'game-portal-v9'; // Bump: domain-fix v2 + portal v1.0.5
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
        '', 
        'index_parts/', 
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
                            // Assembly sequence
                            const parts = [];
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
                                        parts.push(await pRes.blob());
                                        i++;
                                    } else {
                                        break;
                                    }
                                    if (i > 1000) break;
                                }
                                if (currentSegInt === 0 || !segmentFound) break;
                                currentSegInt++;
                            }

                            if (parts.length > 0) {
                                const blob = new Blob(parts, { type: getMimeType(baseUrl) });
                                return new Response(blob, {
                                    headers: {
                                        'Content-Type': getMimeType(baseUrl),
                                        'Cross-Origin-Embedder-Policy': 'require-corp',
                                        'Cross-Origin-Opener-Policy': 'same-origin',
                                        'Access-Control-Allow-Origin': '*',
                                        'X-Assembled': 'true'
                                    }
                                });
                            }
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


