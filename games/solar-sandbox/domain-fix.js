// Solar Sandbox domain bypass — runs synchronously before Godot engine loads.
// Three layers of interception:
//   1. eval() — intercepts JavaScriptBridge.eval("window.location.hostname") calls
//   2. fetch() — intercepts HTTP requests made by Steam_release.gd for domain checks
//   3. XMLHttpRequest — same, for XHR-based domain checks
(function () {
    const AUTHORIZED_HOSTNAME = 'totoriel.itch.io';
    const AUTHORIZED_HREF     = 'https://totoriel.itch.io/solarsandbox';
    const AUTHORIZED_ORIGIN   = 'https://totoriel.itch.io';

    console.error('[domain-fix v2] Loaded — spoofing hostname as ' + AUTHORIZED_HOSTNAME);

    // ── Layer 1: eval() intercept ────────────────────────────────────────────
    const _eval = window.eval.bind(window);
    window.eval = function (code) {
        if (typeof code === 'string' && /location/i.test(code)) {
            var patched = code
                .replace(/window\.location\.hostname/g, JSON.stringify(AUTHORIZED_HOSTNAME))
                .replace(/\blocation\.hostname\b/g,       JSON.stringify(AUTHORIZED_HOSTNAME))
                .replace(/window\.location\.host\b/g,     JSON.stringify(AUTHORIZED_HOSTNAME))
                .replace(/\blocation\.host\b/g,           JSON.stringify(AUTHORIZED_HOSTNAME))
                .replace(/window\.location\.href\b/g,     JSON.stringify(AUTHORIZED_HREF))
                .replace(/\blocation\.href\b/g,           JSON.stringify(AUTHORIZED_HREF))
                .replace(/window\.location\.origin\b/g,   JSON.stringify(AUTHORIZED_ORIGIN))
                .replace(/\blocation\.origin\b/g,         JSON.stringify(AUTHORIZED_ORIGIN));
            if (patched !== code) {
                console.log('[domain-fix] eval intercepted');
            }
            return _eval(patched);
        }
        return _eval(code);
    };

    // ── Layer 2: fetch() intercept ───────────────────────────────────────────
    // Steam_release.gd makes an HTTP request for domain verification.
    // Return a fake 200 OK so the check passes.
    var _fetch = window.fetch.bind(window);
    window.fetch = function (input, init) {
        var url = typeof input === 'string' ? input : (input && input.url) || '';
        // Allow game asset fetches; intercept anything that looks like a domain/auth check
        if (url && !/\.(wasm|pck|js|png|ico|webp|jpg|css|mp3|ogg|wav)(\?|$)/i.test(url)) {
            console.log('[domain-fix] fetch intercepted:', url);
            return Promise.resolve(new Response(
                JSON.stringify({ authorized: true, domain: AUTHORIZED_HOSTNAME }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
            ));
        }
        return _fetch(input, init);
    };

    // ── Layer 3: XMLHttpRequest intercept ────────────────────────────────────
    var _XHROpen = XMLHttpRequest.prototype.open;
    var _XHRSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function (method, url) {
        this._domainFixUrl = url || '';
        return _XHROpen.apply(this, arguments);
    };
    XMLHttpRequest.prototype.send = function () {
        var url = this._domainFixUrl || '';
        if (url && !/\.(wasm|pck|js|png|ico|webp|jpg|css|mp3|ogg|wav)(\?|$)/i.test(url)) {
            console.log('[domain-fix] XHR intercepted:', url);
            Object.defineProperty(this, 'readyState', { get: function () { return 4; } });
            Object.defineProperty(this, 'status',    { get: function () { return 200; } });
            Object.defineProperty(this, 'responseText', {
                get: function () { return JSON.stringify({ authorized: true, domain: AUTHORIZED_HOSTNAME }); }
            });
            setTimeout(function () {
                try { this.onreadystatechange && this.onreadystatechange(); } catch(e){}
                try { this.onload && this.onload(); } catch(e){}
            }.bind(this), 10);
            return;
        }
        return _XHRSend.apply(this, arguments);
    };

    // ── Fallback: suppress browser alert/confirm for unauthorized messages ───
    var _alert = window.alert.bind(window);
    window.alert = function (msg) {
        if (typeof msg === 'string' && /unauthorized/i.test(msg)) {
            console.warn('[domain-fix] suppressed alert:', msg); return;
        }
        return _alert(msg);
    };
    var _confirm = window.confirm.bind(window);
    window.confirm = function (msg) {
        if (typeof msg === 'string' && /unauthorized/i.test(msg)) {
            console.warn('[domain-fix] suppressed confirm:', msg); return true;
        }
        return _confirm(msg);
    };
}());
