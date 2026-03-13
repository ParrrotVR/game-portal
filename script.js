// Register Service Worker for Split File Reassembly
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('SW Registered!', reg))
            .catch(err => console.error('SW Registration Failed:', err));
    });
}

// 3D Card Tilt Effect
const gameCards = document.querySelectorAll('.game-card');

gameCards.forEach(card => {
    card.addEventListener('mousemove', handleCardTilt);
    card.addEventListener('mouseleave', resetCardTilt);
    card.addEventListener('click', openGame);
});

function handleCardTilt(e) {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = (y - centerY) / 10;
    const rotateY = (centerX - x) / 10;

    card.style.transform = `
        perspective(1000px)
        rotateX(${rotateX}deg)
        rotateY(${rotateY}deg)
        translateY(-10px)
        scale(1.02)
    `;
}

function resetCardTilt(e) {
    const card = e.currentTarget;
    card.style.transform = '';
}

// Game Overlay Management
const gameOverlay = document.getElementById('game-overlay');
const gameIframe = document.getElementById('game-iframe');
const closeGameBtn = document.getElementById('close-game-btn');
const fullscreenBtn = document.getElementById('fullscreen-btn');
const newTabBtn = document.getElementById('new-tab-btn');
const refreshGameBtn = document.getElementById('refresh-game-btn');

let currentGamePath = '';

async function openGame(e) {
    const card = e.currentTarget;
    const gamePath = card.getAttribute('data-game-path');

    if (!gamePath) return;

    currentGamePath = gamePath;

    // Show loading status
    showLoadingStatus();

    // Ensure Service Worker is active before loading game assets
    if ('serviceWorker' in navigator) {
        // If already controlled, we are good to go immediately (preserves user gesture)
        if (!navigator.serviceWorker.controller) {
            try {
                console.log('⏳ Waiting for Service Worker...');
                await navigator.serviceWorker.ready;
            } catch (err) {
                console.warn('SW Ready check failed:', err);
            }
        }
        console.log('🚀 Service Worker ready. Launching game...');
    }

    gameIframe.setAttribute('allow', 'autoplay; fullscreen; gamepad; cross-origin-isolated');
    gameIframe.src = gamePath;

    // Show overlay with animation
    gameOverlay.style.display = 'flex';
    setTimeout(() => {
        gameOverlay.classList.add('active');
    }, 10);

    // Prevent body scroll
    document.body.style.overflow = 'hidden';
}

function closeGame() {
    gameOverlay.classList.remove('active');

    setTimeout(() => {
        gameOverlay.style.display = 'none';
        // Reset iframe src to stop all game audio and free memory.
        // Game saves persist in localStorage so progress is not lost.
        gameIframe.src = '';
        document.body.style.overflow = '';
    }, 300);
}

function toggleFullscreen() {
    if (!document.fullscreenElement &&
        !document.webkitFullscreenElement &&
        !document.msFullscreenElement) {
        if (gameOverlay.requestFullscreen) {
            gameOverlay.requestFullscreen();
        } else if (gameOverlay.webkitRequestFullscreen) {
            gameOverlay.webkitRequestFullscreen();
        } else if (gameOverlay.msRequestFullscreen) {
            gameOverlay.msRequestFullscreen();
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }
}

function openInNewTab() {
    if (currentGamePath) {
        window.open(currentGamePath, '_blank');
    }
}

function refreshGame() {
    if (gameIframe.src) {
        const currentSrc = gameIframe.src;
        gameIframe.src = 'about:blank'; // Clear it first to ensure a hard reload
        setTimeout(() => {
            gameIframe.src = currentSrc;
            showLoadingStatus();
        }, 50);
    }
}

// Event Listeners for Controls
closeGameBtn.addEventListener('click', closeGame);
fullscreenBtn.addEventListener('click', toggleFullscreen);
newTabBtn.addEventListener('click', openInNewTab);
refreshGameBtn.addEventListener('click', refreshGame);

// Close overlay on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && gameOverlay.classList.contains('active')) {
        closeGame();
    }
});

// Prevent closing overlay when clicking on controls or iframe
gameOverlay.addEventListener('click', (e) => {
    if (e.target === gameOverlay) {
        closeGame();
    }
});

// Game State Persistence
// Both games already use localStorage for saving game state via their Yandex SDK mock
// The iframe will maintain localStorage access, so saves will persist automatically
// No additional code needed - the games handle their own state management

// Visual feedback on fullscreen change
document.addEventListener('fullscreenchange', updateFullscreenButton);
document.addEventListener('webkitfullscreenchange', updateFullscreenButton);
document.addEventListener('msfullscreenchange', updateFullscreenButton);

function updateFullscreenButton() {
    const isFullscreen = document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.msFullscreenElement;

    if (isFullscreen) {
        fullscreenBtn.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M8 3V5M8 5H5M8 5L3 10M16 3V5M16 5H19M16 5L21 10M8 21V19M8 19H5M8 19L3 14M16 21V19M16 19H19M16 19L21 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>Exit Fullscreen</span>
        `;
    } else {
        fullscreenBtn.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M8 3H5C3.89543 3 3 3.89543 3 5V8M21 8V5C21 3.89543 20.1046 3 19 3H16M16 21H19C20.1046 21 21 20.1046 21 19V16M3 16V19C3 20.1046 3.89543 21 5 21H8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <span>Fullscreen</span>
        `;
    }
}

// Add smooth scroll behavior for better UX
window.addEventListener('load', () => {
    // Add loaded class for any additional animations
    document.body.classList.add('loaded');
});

// Clear Cache Functionality
const clearCacheBtn = document.getElementById('clear-cache-btn');
const loadingStatus = document.getElementById('loading-status');

clearCacheBtn.addEventListener('click', async () => {
    const confirmed = confirm('⚠️ This will delete all cached game files and saves.\n\nAre you sure you want to reset the portal?');
    if (!confirmed) return;
    // 1. Clear game-related localStorage data
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith('yandex-game-') || key.includes('Unity') || key.includes('pvz') || key.includes('epic')) {
            localStorage.removeItem(key);
        }
    });

    // 2. Clear sessionStorage
    sessionStorage.clear();

    // 3. Attempt to clear IndexedDB (where UnityCache lives)
    if (window.indexedDB && window.indexedDB.databases) {
        try {
            const dbs = await indexedDB.databases();
            dbs.forEach(db => {
                indexedDB.deleteDatabase(db.name);
                console.log(`🗑️ Deleted DB: ${db.name}`);
            });
        } catch (e) {
            console.error('Error listing databases:', e);
        }
    } else if (window.indexedDB) {
        // Fallback for browsers that don't support .databases()
        const commonDBs = ['UnityCache'];
        commonDBs.forEach(name => {
            indexedDB.deleteDatabase(name);
        });
    }

    // 4. Force reload the iframe if it's open
    if (gameOverlay.classList.contains('active')) {
        refreshGame();
    }

    // Show confirmation
    const originalText = clearCacheBtn.querySelector('span').textContent;
    clearCacheBtn.querySelector('span').textContent = 'Portal Reset!';
    clearCacheBtn.style.background = 'rgba(34, 197, 94, 0.3)';
    clearCacheBtn.style.borderColor = 'rgba(34, 197, 94, 0.6)';

    setTimeout(() => {
        clearCacheBtn.querySelector('span').textContent = originalText;
        clearCacheBtn.style.background = '';
        clearCacheBtn.style.borderColor = '';
    }, 2000);

    console.log('🗑️ Site storage cleared successfully!');
});

// Loading Status Display
let loadingTimeout;

function showLoadingStatus() {
    loadingStatus.classList.add('active');

    // Auto-hide after 3 seconds
    clearTimeout(loadingTimeout);
    loadingTimeout = setTimeout(() => {
        hideLoadingStatus();
    }, 3000);
}

function hideLoadingStatus() {
    loadingStatus.classList.remove('active');
    clearTimeout(loadingTimeout);
}

// Show loading status when iframe starts loading
gameIframe.addEventListener('load', () => {
    hideLoadingStatus();
});

console.log('🎮 Game Portal initialized successfully!');
console.log('💾 Game saves are automatically preserved via localStorage');
console.log('%c🔖 Portal Version: 1.1.0 (2026-03-13)', 'color: #00ff99; font-weight: bold; font-size: 14px;');
