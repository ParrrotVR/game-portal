export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Handle game file requests
    if (url.pathname.startsWith('/games/')) {
      // Serve static files directly
      return fetch(new Request(url.pathname));
    }
    
    // Serve main index for root
    if (url.pathname === '/') {
      return fetch(new Request('/index.html'));
    }
    
    // Try to serve the requested file
    try {
      return fetch(new Request(url.pathname));
    } catch (e) {
      return new Response('Not found', { status: 404 });
    }
  }
};
