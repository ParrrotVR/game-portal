// Fix SharedArrayBuffer issues for Cloudflare Pages
(function() {
    'use strict';
    
    console.log('🔧 Applying aggressive SharedArrayBuffer compatibility patch...');
    
    // Completely disable SharedArrayBuffer at the browser level
    if (typeof SharedArrayBuffer !== 'undefined') {
        delete window.SharedArrayBuffer;
        Object.defineProperty(window, 'SharedArrayBuffer', {
            get: function() {
                console.warn('🚫 SharedArrayBuffer access blocked - returning ArrayBuffer');
                return ArrayBuffer;
            },
            set: function(value) {
                console.warn('🚫 SharedArrayBuffer assignment blocked');
            },
            configurable: false
        });
    }
    
    // Override crossOriginIsolated property
    Object.defineProperty(window, 'crossOriginIsolated', {
        value: false,
        writable: false,
        configurable: false
    });
    
    // Override postMessage to completely prevent SharedArrayBuffer transfers
    const originalPostMessage = Worker.prototype.postMessage;
    Worker.prototype.postMessage = function(message, transferList) {
        // Never allow transfer lists - always pass null
        try {
            return originalPostMessage.call(this, message);
        } catch (error) {
            if (error.message.includes('SharedArrayBuffer')) {
                console.warn('🚫 SharedArrayBuffer error blocked, continuing without transfer');
                return; // Silently fail - the game should continue
            }
            throw error;
        }
    };
    
    // Override Worker constructor to prevent SharedArrayBuffer usage
    if (typeof Worker !== 'undefined') {
        const OriginalWorker = window.Worker;
        window.Worker = function(scriptURL, options) {
            const worker = new OriginalWorker(scriptURL, options);
            
            // Override postMessage for this specific worker
            const workerPostMessage = worker.postMessage.bind(worker);
            worker.postMessage = function(message, transferList) {
                try {
                    // Always call without transfer list
                    return workerPostMessage(message);
                } catch (error) {
                    if (error.message.includes('SharedArrayBuffer')) {
                        console.warn('🚫 SharedArrayBuffer error blocked in worker, continuing');
                        return; // Silently fail
                    }
                    throw error;
                }
            };
            
            return worker;
        };
    }
    
    // Also override MessageChannel and other communication methods
    if (typeof MessageChannel !== 'undefined') {
        const OriginalMessageChannel = window.MessageChannel;
        window.MessageChannel = function() {
            const channel = new OriginalMessageChannel();
            
            // Override postMessage for both ports
            ['port1', 'port2'].forEach(portName => {
                const originalPortPostMessage = channel[portName].postMessage.bind(channel[portName]);
                channel[portName].postMessage = function(message, transferList) {
                    try {
                        return originalPortPostMessage(message);
                    } catch (error) {
                        if (error.message.includes('SharedArrayBuffer')) {
                            console.warn('🚫 SharedArrayBuffer error blocked in MessageChannel');
                            return;
                        }
                        throw error;
                    }
                };
            });
            
            return channel;
        };
    }
    
    console.log('✅ Aggressive SharedArrayBuffer patch applied - all transfers disabled');
})();
