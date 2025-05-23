// Main Application Entry Point

/**
 * Initialize the application
 */
function initApp() {
  Utils.log('Initializing Story Reader app', `v${CONFIG.version}`);
  // Set up global error handling
  setupErrorHandling();
  
  // Make sure UI manager and other components are initialized
  ensureComponentsInitialized();
  
  // Load application state
  // restoreAppState();
  
  // Register service worker for offline support (if in production)
  // if (!CONFIG.debug) {
  //   registerServiceWorker();
  // }
  
  Utils.log('App initialization complete');
}

/**
 * Ensure all components are properly initialized
 */
function ensureComponentsInitialized() {
  // Create global instances if not already created
  if (!window.uiManager) {
    window.uiManager = new UIManager();
  }
  
  if (!window.storageManager) {
    window.storageManager = new StorageManager();
  }
  
  if (!window.settingsManager) {
    window.settingsManager = new SettingsManager();
  }
  
  if (!window.chaptersManager) {
    window.chaptersManager = new ChaptersManager();
  }
  
  if (!window.readerManager) {
    window.readerManager = new ReaderManager();
  }
  
  if (!window.floatMenuManager) {
    window.floatMenuManager = new FloatMenuManager();
  }
}

/**
 * Set up global error handling
 */
function setupErrorHandling() {
  window.addEventListener('error', (event) => {
    Utils.log('Global error caught', event.error);
    
    // Show error toast for user
    if (!CONFIG.debug) {
      // In production, show generic message
      Utils.showToast('An error occurred. Please try again.', 'error');
    } else {
      // In debug mode, show actual error
      Utils.showToast(`Error: ${event.error.message}`, 'error');
    }
    
    // Prevent error from bubbling up
    event.preventDefault();
  });
  
  // Handle promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    Utils.log('Unhandled promise rejection', event.reason);
    
    if (CONFIG.debug) {
      Utils.showToast(`Promise error: ${event.reason.message}`, 'error');
    }
    
    event.preventDefault();
  });
}

/**
 * Restore application state
 */
function restoreAppState() {
  // Check if we have a previously loaded story
  const lastStory = storageManager.loadGlobal(CONFIG.storage.keys.lastStory);
  if (lastStory) {
    storageManager.setCurrentStory(lastStory);
    
    // Apply stored settings
    if (settingsManager) {
      settingsManager.applyStoredSettings();
    }
  } else {
    // Show welcome screen for new users
    if (uiManager) {
      uiManager.showWelcomeScreen();
    }
  }
  
  Utils.log('App state restored', { lastStory });
}

/**
 * Register service worker for offline support
 */
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        Utils.log('Service worker registered', registration);
      })
      .catch(error => {
        Utils.log('Service worker registration failed', error);
      });
  }
}

/**
 * Save application state before unloading
 */
function saveAppState() {
  if (chaptersManager) {
    // chaptersManager.saveScrollPosition();
  }
  
  Utils.log('App state saved');
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

// Save state before leaving
window.addEventListener('beforeunload', function(){
  console.log('Saving app state before unload');
  initApp();
});
