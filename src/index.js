export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    let path = url.pathname === '/' ? '/index.html' : url.pathname;
    
    try {
      // Try to get the asset from the assets binding
      const asset = await env.ASSETS.fetch(new Request(path));
      if (asset.status === 200) {
        return asset;
      }
    } catch (e) {
      // Continue to fallback
    }
    
    return new Response('Not found', { status: 404 });
  }
};
