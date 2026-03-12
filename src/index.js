export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        let path = url.pathname;
        if (path === '/') path = '/index.html';

        const addIsolationHeaders = (response) => {
            if (!response) return response;
            const newHeaders = new Headers(response.headers);
            newHeaders.set('Cross-Origin-Embedder-Policy', 'require-corp');
            newHeaders.set('Cross-Origin-Opener-Policy', 'same-origin');
            newHeaders.set('Access-Control-Allow-Origin', '*');
            
            // Helpful for debugging part assembly
            if (response.headers.has('X-Assembled')) newHeaders.set('X-Assembled', 'true');
            
            // Force correct MIME types for known game extensions
            const low = path.toLowerCase();
            if (low.endsWith('.wasm')) newHeaders.set('Content-Type', 'application/wasm');
            else if (low.endsWith('.js')) newHeaders.set('Content-Type', 'application/javascript');
            else if (low.endsWith('.pck') || low.endsWith('.data')) newHeaders.set('Content-Type', 'application/octet-stream');
            
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
                   low.endsWith('.unityweb') || low.endsWith('.bundle') || low.includes('.wasm.br');
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
                                // Part 1 found! Stream assembly.
                                const { readable, writable } = new TransformStream();
                                
                                ctx.waitUntil((async () => {
                                    const writer = writable.getWriter();
                                    try {
                                        let currentSegInt = seg === '' ? 0 : parseInt(seg.replace('part', '').replace('.', ''));
                                        
                                        while (true) {
                                            const currentSegStr = currentSegInt === 0 ? '' : `part${currentSegInt}.`;
                                            const currentPrefix = `${dirNormalized}${folder}${name}.${currentSegStr}part`;
                                            
                                            let i = 1;
                                            let segmentFound = false;
                                            while (true) {
                                                const pPath = `${currentPrefix}${i.toString().padStart(pad.length, '0')}`;
                                                const pUrl = new URL(pPath, url.origin).toString();
                                                const pRes = await env.ASSETS.fetch(new Request(pUrl));
                                                
                                                if (pRes.status === 200 && !isHTML(pRes)) {
                                                    segmentFound = true;
                                                    await pRes.body.pipeTo(new WritableStream({
                                                        write(chunk) { return writer.write(chunk); }
                                                    }), { preventClose: true });
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


