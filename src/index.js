export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        let path = url.pathname;
        if (path === '/') path = '/index.html';

        async function addIsolationHeaders(response) {
            if (!response) return response;
            const newHeaders = new Headers(response.headers);
            newHeaders.set('Cross-Origin-Embedder-Policy', 'require-corp');
            newHeaders.set('Cross-Origin-Opener-Policy', 'same-origin');
            newHeaders.set('Access-Control-Allow-Origin', '*');
            return new Response(response.body, {
                status: response.status,
                statusText: response.statusText,
                headers: newHeaders
            });
        }

        const isDataFile = (p) => {
            const low = p.toLowerCase();
            return low.endsWith('.pck') || low.endsWith('.wasm') || low.endsWith('.data') || 
                   low.endsWith('.unityweb') || low.endsWith('.br') || low.endsWith('.bundle') || 
                   low.includes('.wasm.br') || low.includes('.data.br');
        };

        const isHTML = (res) => res.headers.get('Content-Type')?.includes('text/html');

        try {
            // 1. Try fetching the file directly
            const asset = await env.ASSETS.fetch(request.clone());
            if (asset.status === 200 && (!isDataFile(path) || !isHTML(asset))) {
                return addIsolationHeaders(asset);
            }
        } catch (e) {}

        // 2. If it's a data file and we didn't get it (or got HTML), try parts
        if (isDataFile(path)) {
            const filename = path.split('/').pop();
            const directory = path.substring(0, path.lastIndexOf('/') + 1);
            
            // Generate list of possible part prefixes
            const variants = [filename];
            if (filename.endsWith('.wasm') && !filename.endsWith('.br')) variants.push(filename + '.br');
            if (filename.endsWith('.data') && !filename.endsWith('.br')) variants.push(filename + '.br');

            const folders = ['', 'index_parts/', 'index.pck_parts/', 'index.wasm_parts/', 'index.data_parts/', `${filename}_parts/`];
            
            for (const variant of variants) {
                for (const folder of folders) {
                    const prefix = `${directory}${folder}${variant}.part`;
                    
                    // Try to find if part 1 exists
                    for (const pad of ['001', '01', '1']) {
                        const part1Path = `${prefix}${pad}`;
                        // We use the origin to ensure we're fetching from the same site correctly
                        const part1Url = new URL(part1Path, url.origin).toString();
                        const part1Res = await env.ASSETS.fetch(new Request(part1Url));
                        
                        if (part1Res.status === 200 && !isHTML(part1Res)) {
                            // Found the parts! Stream them.
                            const { readable, writable } = new TransformStream();
                            
                            ctx.waitUntil((async () => {
                                const writer = writable.getWriter();
                                let i = 1;
                                try {
                                    while (true) {
                                        const pPath = `${prefix}${i.toString().padStart(pad.length, '0')}`;
                                        const pUrl = new URL(pPath, url.origin).toString();
                                        const pRes = await env.ASSETS.fetch(new Request(pUrl));
                                        
                                        if (pRes.status === 200 && !isHTML(pRes)) {
                                            await pRes.body.pipeTo(new WritableStream({
                                                write(chunk) { return writer.write(chunk); }
                                            }), { preventClose: true });
                                            i++;
                                        } else {
                                            break;
                                        }
                                        if (i > 500) break;
                                    }
                                } catch (err) {
                                } finally {
                                    await writer.close();
                                }
                            })());

                            const headers = new Headers();
                            headers.set('Content-Type', 'application/octet-stream');
                            headers.set('Cache-Control', 'public, max-age=31536000, immutable');
                            return addIsolationHeaders(new Response(readable, { headers }));
                        }
                    }
                }
            }
        }

        // 3. Last chance fallback or 404
        const finalRes = await env.ASSETS.fetch(request);
        if (isDataFile(path) && isHTML(finalRes)) {
            return new Response('404: Game Asset Not Found', { status: 404 });
        }
        return addIsolationHeaders(finalRes);
    }
};
