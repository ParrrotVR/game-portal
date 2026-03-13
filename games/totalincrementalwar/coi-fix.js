// Fix SharedArrayBuffer issues for Cloudflare Pages
(function() {
    'use strict';
    
    // Override SharedArrayBuffer to prevent errors
    if (typeof SharedArrayBuffer !== 'undefined') {
        const OriginalSharedArrayBuffer = window.SharedArrayBuffer;
        window.SharedArrayBuffer = function(length) {
            console.warn('SharedArrayBuffer disabled - falling back to ArrayBuffer');
            return new ArrayBuffer(length);
        };
        
        // Copy static properties
        Object.setPrototypeOf(window.SharedArrayBuffer, OriginalSharedArrayBuffer);
        Object.getOwnPropertyNames(OriginalSharedArrayBuffer).forEach(name => {
            if (name !== 'prototype' && name !== 'length' && name !== 'name') {
                try {
                    window.SharedArrayBuffer[name] = OriginalSharedArrayBuffer[name];
                } catch (e) {
                    // Skip read-only properties
                }
            }
        });
    }
    
    // Override crossOriginIsolated property
    Object.defineProperty(window, 'crossOriginIsolated', {
        value: false,
        writable: false,
        configurable: false
    });
    
    // Override postMessage to handle SharedArrayBuffer transfer
    const originalPostMessage = Worker.prototype.postMessage;
    Worker.prototype.postMessage = function(message, transferList) {
        if (transferList && transferList.length > 0) {
            // Filter out SharedArrayBuffers
            const filteredTransferList = transferList.filter(item => 
                !(item instanceof SharedArrayBuffer)
            );
            return originalPostMessage.call(this, message, filteredTransferList);
        }
        return originalPostMessage.call(this, message, transferList);
    };
    
    console.log('🔧 SharedArrayBuffer compatibility patch applied');
})();
