// ── Bare v3 HTTP proxy server ──────────────────────────────────────────────
async function handleBare(request) {
    // CORS preflight
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS',
                'Access-Control-Allow-Headers': '*',
            },
        });
    }

    // Bare v3 metadata endpoint
    const url = new URL(request.url);
    if (url.pathname === '/bare/v3/' && request.method === 'GET') {
        return new Response(
            JSON.stringify({ versions: ['v3'], language: 'Cloudflare Workers', maintainer: {} }),
            { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
        );
    }

    const host     = request.headers.get('x-bare-host');
    const port     = request.headers.get('x-bare-port');
    const protocol = request.headers.get('x-bare-protocol');
    const barePath = request.headers.get('x-bare-path');
    const rawBareHeaders    = request.headers.get('x-bare-headers');
    const rawForwardHeaders = request.headers.get('x-bare-forward-headers');

    if (!host || !port || !protocol || !barePath) {
        return new Response(JSON.stringify({ code: 'MISSING_BARE_HEADER' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
    }

    const targetUrl = `${protocol}//${host}:${port}${barePath}`;
    const bareHeaders    = JSON.parse(rawBareHeaders    || '{}');
    const forwardHeaders = JSON.parse(rawForwardHeaders || '[]');

    const outHeaders = new Headers();
    for (const [key, val] of Object.entries(bareHeaders)) {
        const v = Array.isArray(val) ? val[0] : val;
        if (v !== undefined) outHeaders.set(key, String(v));
    }
    for (const hdr of forwardHeaders) {
        const val = request.headers.get(hdr);
        if (val) outHeaders.set(hdr, val);
    }

    // Hop-by-hop headers to strip from response
    const HOP_BY_HOP = new Set([
        'transfer-encoding', 'connection', 'keep-alive', 'upgrade',
        'proxy-authenticate', 'proxy-authorization', 'te', 'trailers',
    ]);

    try {
        const res = await fetch(targetUrl, {
            method: request.method,
            headers: outHeaders,
            body: ['GET', 'HEAD'].includes(request.method) ? null : request.body,
            redirect: 'manual',
        });

        const resHeaders = {};
        for (const [key, val] of res.headers.entries()) {
            if (!HOP_BY_HOP.has(key.toLowerCase())) {
                resHeaders[key] = [val];
            }
        }

        return new Response(res.body, {
            status: 200,
            headers: {
                'x-bare-status':      String(res.status),
                'x-bare-status-text': res.statusText,
                'x-bare-headers':     JSON.stringify(resHeaders),
                'Access-Control-Allow-Origin':  '*',
                'Access-Control-Allow-Headers': '*',
                'Content-Type': 'application/octet-stream',
            },
        });
    } catch (err) {
        return new Response(JSON.stringify({ code: 'UNKNOWN', message: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
    }
}

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        let path = url.pathname;
        if (path === '/') path = '/index.html';

        // Route bare v3 proxy requests
        if (path.startsWith('/bare/v3')) {
            return handleBare(request);
        }

        const addIsolationHeaders = (response) => {
            if (!response) return response;
            const newHeaders = new Headers(response.headers);
            newHeaders.set('Cross-Origin-Embedder-Policy', 'credentialless');
            newHeaders.set('Cross-Origin-Opener-Policy', 'same-origin');
            newHeaders.set('Access-Control-Allow-Origin', '*');
            
            // Helpful for debugging part assembly
            if (response.headers.has('X-Assembled')) newHeaders.set('X-Assembled', 'true');
            
            // Force correct MIME types for known game extensions
            const low = path.toLowerCase();
            if (low.endsWith('.wasm')) newHeaders.set('Content-Type', 'application/wasm');
            else if (low.endsWith('.js')) newHeaders.set('Content-Type', 'application/javascript');
            else if (low.endsWith('.pck') || low.endsWith('.data')) newHeaders.set('Content-Type', 'application/octet-stream');
            // Unity .br files — must be served as raw bytes; browser must NOT auto-decompress them
            // because Unity's loader handles Brotli decompression internally
            else if (low.includes('.br')) {
                newHeaders.set('Content-Type', 'application/octet-stream');
                newHeaders.delete('Content-Encoding');
            }
            
            return new Response(response.body, {
                status: response.status,
                statusText: response.statusText,
                headers: newHeaders
            });
        };

        const getMimeType = (p) => {
            const low = p.toLowerCase();
            if (low.endsWith('.wasm')) return 'application/wasm';
            if (low.endsWith('.js')) return 'application/javascript';
            if (low.endsWith('.pck') || low.endsWith('.data') || low.endsWith('.unityweb')) return 'application/octet-stream';
            return 'application/octet-stream';
        };

        const isDataFile = (p) => {
            const low = p.toLowerCase();
            return low.endsWith('.pck') || low.endsWith('.wasm') || low.endsWith('.data') || 
                   low.endsWith('.unityweb') || low.endsWith('.bundle') ||
                   low.includes('.wasm.br') || low.includes('.framework.js.br') || low.includes('.data.br');
        };

        const isHTML = (res) => res.headers.get('Content-Type')?.toLowerCase().includes('text/html');

        // 1. Try direct fetch
        try {
            const asset = await env.ASSETS.fetch(request.clone());
            if (asset.status === 200 && (!isDataFile(path) || !isHTML(asset))) {
                return addIsolationHeaders(asset);
            }
        } catch (e) {}

        // 2. Assembly logic for large split files
        if (isDataFile(path)) {
            const filename = path.split('/').pop();
            const directory = path.substring(0, path.lastIndexOf('/') + 1);
            
            // Candidates for full filename matching
            const nameCandidates = [filename];
            if (filename.endsWith('.wasm')) {
                nameCandidates.push(filename + '.br');
                const dotIdx = filename.lastIndexOf('.');
                if (dotIdx !== -1) {
                    // Outhold pattern: index.wasm -> index.side.wasm
                    nameCandidates.push(filename.substring(0, dotIdx) + '.side' + filename.substring(dotIdx));
                }
            }
            if (filename.endsWith('.pck')) {
                nameCandidates.push(filename + '.br');
                const dotIdx = filename.lastIndexOf('.');
                if (dotIdx !== -1) {
                    nameCandidates.push(filename.substring(0, dotIdx) + '.side' + filename.substring(dotIdx));
                }
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
            
            // Unity-style nested segments (e.g. .part1.part001)
            const segmentPrefixes = ['', 'part1.', 'part2.', 'part3.'];

            for (const name of nameCandidates) {
                for (const folder of subfolders) {
                    for (const seg of segmentPrefixes) {
                        const dirNormalized = directory.endsWith('/') ? directory : directory + '/';
                        const prefix = `${dirNormalized}${folder}${name}.${seg}part`;
                        
                        // Check for part 1 padding
                        for (const pad of ['001', '01', '1']) {
                            const testUrl = new URL(`${prefix}${pad}`, url.origin).toString();
                            const testRes = await env.ASSETS.fetch(new Request(testUrl));
                            
                            if (testRes.status === 200 && !isHTML(testRes)) {
                                // Part 1 found! Stream assembly, reusing the probe response body.
                                const { readable, writable } = new TransformStream();
                                const pipeOpts = { preventClose: true };
                                
                                ctx.waitUntil((async () => {
                                    const writer = writable.getWriter();
                                    const pipe = (body) => body.pipeTo(new WritableStream({
                                        write(chunk) { return writer.write(chunk); }
                                    }), pipeOpts);
                                    try {
                                        let currentSegInt = seg === '' ? 0 : parseInt(seg.replace('part', '').replace('.', ''));
                                        let firstPart = testRes; // reuse already-fetched probe body
                                        
                                        while (true) {
                                            const currentSegStr = currentSegInt === 0 ? '' : `part${currentSegInt}.`;
                                            const currentPrefix = `${dirNormalized}${folder}${name}.${currentSegStr}part`;
                                            
                                            let i = 1;
                                            let segmentFound = false;
                                            while (true) {
                                                let pRes;
                                                if (firstPart) {
                                                    // Use the already-fetched probe body for part 1
                                                    pRes = firstPart;
                                                    firstPart = null;
                                                } else {
                                                    // Fetch remaining parts in parallel batches of 5
                                                    const batchSize = 5;
                                                    const batch = [];
                                                    for (let b = 0; b < batchSize; b++) {
                                                        const pPath = `${currentPrefix}${(i + b).toString().padStart(pad.length, '0')}`;
                                                        batch.push(env.ASSETS.fetch(new Request(new URL(pPath, url.origin).toString())));
                                                    }
                                                    const results = await Promise.all(batch);
                                                    let batchOk = true;
                                                    for (const res of results) {
                                                        if (res.status === 200 && !isHTML(res)) {
                                                            segmentFound = true;
                                                            await pipe(res.body);
                                                            i++;
                                                        } else {
                                                            batchOk = false;
                                                            break;
                                                        }
                                                        if (i > 1000) break;
                                                    }
                                                    if (!batchOk || i > 1000) break;
                                                    continue;
                                                }
                                                
                                                if (pRes.status === 200 && !isHTML(pRes)) {
                                                    segmentFound = true;
                                                    await pipe(pRes.body);
                                                    i++;
                                                } else {
                                                    break;
                                                }
                                                if (i > 1000) break;
                                            }
                                            
                                            if (currentSegInt === 0 || !segmentFound) break;
                                            currentSegInt++;
                                        }
                                    } catch (err) {
                                    } finally {
                                        await writer.close();
                                    }
                                })());

                                return addIsolationHeaders(new Response(readable, {
                                    headers: { 
                                        'Content-Type': getMimeType(path),
                                        'Cache-Control': 'public, max-age=31536000, immutable',
                                        'X-Assembled': 'true'
                                    }
                                }));
                            }
                        }
                    }
                }
            }

            
            // If data file missing, return 404, NEVER HTML fallback
            return new Response('404: Game Asset Not Found (Parts Missing)', { 
                status: 404,
                headers: { 'Content-Type': 'text/plain' }
            });
        }

        // 3. Fallback for non-data files (html, css, js engine)
        const finalRes = await env.ASSETS.fetch(request);
        // Important: Still apply isolation headers to the engine JS and HTML
        return addIsolationHeaders(finalRes);
    }
};


