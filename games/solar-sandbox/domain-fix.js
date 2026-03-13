// Domain bypass for Solar Sandbox — must run synchronously before Godot engine loads.
// The game's compiled GDScript calls JavaScriptBridge.eval("window.location.hostname")
// and shows an "Unauthorized site" popup if the domain isn't itch.io.
// We intercept eval() to return the authorized hostname for any location checks.
(function () {
    const AUTHORIZED_HOSTNAME = 'totoriel.itch.io';
    const AUTHORIZED_HREF     = 'https://totoriel.itch.io/solarsandbox';

    // 1. Wrap eval so JavaScriptBridge.eval() calls return the spoofed hostname.
    const _eval = window.eval.bind(window);
    window.eval = function (code) {
        if (typeof code === 'string' && /location\s*[\.\[]/i.test(code)) {
            code = code
                .replace(/window\.location\.hostname/g, JSON.stringify(AUTHORIZED_HOSTNAME))
                .replace(/\blocation\.hostname\b/g,       JSON.stringify(AUTHORIZED_HOSTNAME))
                .replace(/window\.location\.host\b/g,     JSON.stringify(AUTHORIZED_HOSTNAME))
                .replace(/\blocation\.host\b/g,           JSON.stringify(AUTHORIZED_HOSTNAME))
                .replace(/window\.location\.href\b/g,     JSON.stringify(AUTHORIZED_HREF))
                .replace(/\blocation\.href\b/g,           JSON.stringify(AUTHORIZED_HREF));
            console.log('[domain-fix] intercepted eval:', code);
        }
        return _eval(code);
    };

    // 2. Block browser alert/confirm popups with "unauthorized" text (fallback).
    const _alert = window.alert.bind(window);
    window.alert = function (msg) {
        if (typeof msg === 'string' && /unauthorized/i.test(msg)) {
            console.warn('[domain-fix] suppressed alert:', msg);
            return;
        }
        return _alert(msg);
    };

    const _confirm = window.confirm.bind(window);
    window.confirm = function (msg) {
        if (typeof msg === 'string' && /unauthorized/i.test(msg)) {
            console.warn('[domain-fix] suppressed confirm:', msg);
            return true;
        }
        return _confirm(msg);
    };

    console.log('[domain-fix] hostname spoof active → ' + AUTHORIZED_HOSTNAME);
}());
