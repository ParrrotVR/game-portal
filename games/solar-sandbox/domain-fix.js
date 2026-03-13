// Override Godot domain validation
window.addEventListener('load', function() {
    // Override common domain check functions
    if (window.Module) {
        const originalCall = window.Module.ccall;
        window.Module.ccall = function(name, ...args) {
            if (name === 'check_domain' || name === 'validate_domain') {
                return true; // Always pass domain check
            }
            return originalCall.call(this, name, ...args);
        };
    }
    
    // Override potential popup functions
    const originalAlert = window.alert;
    window.alert = function(message) {
        if (message && message.toLowerCase().includes('unauthorized')) {
            console.log('Blocked unauthorized site popup:', message);
            return; // Don't show the popup
        }
        return originalAlert.call(this, message);
    };
    
    // Override confirm dialogs
    const originalConfirm = window.confirm;
    window.confirm = function(message) {
        if (message && message.toLowerCase().includes('unauthorized')) {
            console.log('Blocked unauthorized site confirm:', message);
            return true; // Auto-accept
        }
        return originalConfirm.call(this, message);
    };
});
