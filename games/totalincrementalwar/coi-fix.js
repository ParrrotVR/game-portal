// Fix SharedArrayBuffer issues for Cloudflare Pages
(function() {
    'use strict';
    
    console.log('🔧 Applying SharedArrayBuffer compatibility patch...');
    
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
    
    // Override postMessage to handle SharedArrayBuffer transfer with error handling
    const originalPostMessage = Worker.prototype.postMessage;
    Worker.prototype.postMessage = function(message, transferList) {
        try {
            if (transferList && transferList.length > 0) {
                // Filter out SharedArrayBuffers
                const filteredTransferList = transferList.filter(item => {
                    if (item instanceof SharedArrayBuffer) {
                        console.warn('🚫 Filtering SharedArrayBuffer from Worker postMessage');
                        return false;
                    }
                    return true;
                });
                return originalPostMessage.call(this, message, filteredTransferList);
            }
            return originalPostMessage.call(this, message, transferList);
        } catch (error) {
            if (error.message.includes('SharedArrayBuffer')) {
                console.warn('🚫 SharedArrayBuffer transfer blocked, retrying without transfer list');
                // Retry without any transfer list
                return originalPostMessage.call(this, message);
            }
            throw error;
        }
    };
    
    // Also override in case Workers are created differently
    if (typeof Worker !== 'undefined') {
        const OriginalWorker = window.Worker;
        window.Worker = function(scriptURL, options) {
            const worker = new OriginalWorker(scriptURL, options);
            
            // Override postMessage for this specific worker
            const workerPostMessage = worker.postMessage.bind(worker);
            worker.postMessage = function(message, transferList) {
                try {
                    if (transferList && transferList.length > 0) {
                        const filteredTransferList = transferList.filter(item => {
                            if (item instanceof SharedArrayBuffer) {
                                console.warn('🚫 Filtering SharedArrayBuffer from Worker postMessage');
                                return false;
                            }
                            return true;
                        });
                        return workerPostMessage(message, filteredTransferList);
                    }
                    return workerPostMessage(message, transferList);
                } catch (error) {
                    if (error.message.includes('SharedArrayBuffer')) {
                        console.warn('� SharedArrayBuffer transfer blocked, retrying without transfer list');
                        return workerPostMessage(message);
                    }
                    throw error;
                }
            };
            
            return worker;
        };
    }
    
    console.log('✅ SharedArrayBuffer compatibility patch applied successfully');
})();
