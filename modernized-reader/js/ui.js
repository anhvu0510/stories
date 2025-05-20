// UI management functionality


/**
 * UIManager handles UI interactions and visual effects
 */
class UIManager {
  /**
   * Initialize the UI manager
   */
  constructor() {
    this.currentTheme = CONFIG.defaults.theme;
    this._fileInputClickPending = false;
    this._isMenuOpen = false;
    this._initFileInput();
    this.initEventListeners();
  }

  /**
   * Set up initial event listeners
   */
  initEventListeners() {
    // Theme toggling
    const themeToggleBtn = document.getElementById('regex-replace-btn');
    if (themeToggleBtn) {
      Utils.addClickEvent(themeToggleBtn, this.openSettingsModal.bind(this, 'settings-regex-modal'));
    }

    // Menu toggling
    const toggleChaptersBtn = document.getElementById('toggle-chapters-btn');
    if (toggleChaptersBtn) {
      // Utils.addClickEvent( toggleChaptersBtn,this.toggleChapterMenu.bind(this));
      Utils.addClickEvent(toggleChaptersBtn, this.toggleChapterMenu.bind(this));
    }

    // Close menu when clicking overlay
    const menuOverlay = document.getElementById('menu-overlay');
    if (menuOverlay) {
      Utils.addClickEvent(menuOverlay, this.closeChapterMenu.bind(this));
    }

    // Close menu button
    const closeMenuBtn = document.getElementById('close-menu');
    if (closeMenuBtn) {
      closeMenuBtn.addEventListener('click', this.closeChapterMenu.bind(this));
    }

    // Settings modal
    const openSettingsBtn = document.getElementById('open-settings-btn');
    const closeSettingsBtn = document.getElementById('close-settings');
    const closeSettingsRegexBtn = document.getElementById('close-settings-regex');
    const modalOverlay = document.getElementById('modal-overlay');

    if (openSettingsBtn) {
      Utils.addClickEvent(openSettingsBtn, this.openSettingsModal.bind(this, 'settings-modal'));
    }

    if (closeSettingsBtn) {
      Utils.addClickEvent(closeSettingsBtn, this.closeSettingsModal.bind(this, 'settings-modal'));
    }

    if (closeSettingsRegexBtn) {
      Utils.addClickEvent(closeSettingsRegexBtn, this.closeSettingsModal.bind(this, 'settings-regex-modal'));
    }

    if (modalOverlay) {
      Utils.addClickEvent(modalOverlay, this.closeSettingsModal.bind(this, modalOverlay));
    }

    // Add ripple effect to buttons
    document.querySelectorAll('.float-menu-button, .primary-btn, .secondary-btn').forEach(button => {
      button.addEventListener('click', Utils.createRippleEffect);
      button.addEventListener('touchstart', Utils.createRippleEffect, { passive: true });
    });

    // Direct event handler for welcome-upload-btn (more reliable than delegation)
    this.setupWelcomeUploadButton();

    // Swipe gesture support for mobile
    this.initSwipeGestures();
  }



  /**
   * Set up upload button on welcome screen
   */
  /**
 * Set up upload button on welcome screen
 */
  setupWelcomeUploadButton() {
    const welcomeUploadBtn = document.getElementById('welcome-upload-btn');
    if (!welcomeUploadBtn) {
      console.log('Welcome upload button not found');
      return;
    }

    // Remove existing event listeners by cloning the button
    if (welcomeUploadBtn._hasClickListener) {
      console.log('Button already has listeners, skipping');
      return;
    }

    // Clone and replace to ensure no existing listeners
    const newBtn = welcomeUploadBtn.cloneNode(true);
    welcomeUploadBtn.parentNode.replaceChild(newBtn, welcomeUploadBtn);

    // Set up click handler on the new button
    newBtn.addEventListener('click', (e) => {
      console.log('Welcome upload button clicked (fresh handler)');
      // Use regular click event for ripple
      Utils.createRippleEffect(e);
      // Then trigger file upload
      this.triggerFileInput();
    });

    // Mark this button as having listeners
    newBtn._hasClickListener = true;
    console.log('Welcome upload button listeners set up');
  }

  /**
   * Initialize touch/swipe gestures for mobile
   */
  initSwipeGestures() {
    const chapterContent = document.getElementById('chapter-content');
    if (!chapterContent) return;

    let touchStartX = 0;
    let touchEndX = 0;

    // Detect swipe right to open menu
    chapterContent.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    chapterContent.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      this.handleSwipe(touchStartX, touchEndX);
    }, { passive: true });
  }

  /**
   * Handle swipe gesture
   * @param {number} startX - Starting X position
   * @param {number} endX - Ending X position
   */
  handleSwipe(startX, endX) {
    const swipeThreshold = 100; // Minimum distance for a swipe

    // Right swipe (open menu)
    if (endX - startX > swipeThreshold) {
      this.openChapterMenu();
    }

    // Left swipe (close menu)
    if (startX - endX > swipeThreshold) {
      this.closeChapterMenu();
    }
  }

  /**
   * Toggle between light and dark theme
   */
  toggleTheme(e) {
    const body = document.body;
    const themeIcon = document.querySelector('#regex-replace-btn i');

    // Add transition class for smooth change
    body.classList.add('dark-mode-transition');

    if (body.classList.contains('dark-mode')) {
      // Switch to light mode
      body.classList.remove('dark-mode');
      themeIcon.classList.remove('fa-sun');
      themeIcon.classList.add('fa-moon');
      this.currentTheme = 'light';
    } else {
      // Switch to dark mode
      body.classList.add('dark-mode');
      themeIcon.classList.remove('fa-moon');
      themeIcon.classList.add('fa-sun');
      this.currentTheme = 'dark';
    }

    // Save theme preference to settings
    if (settingsManager) {
      settingsManager.updateSetting('theme', this.currentTheme);
    }

    // Remove transition class after change is complete
    setTimeout(() => {
      body.classList.remove('dark-mode-transition');
    }, 300);

    Utils.log('Theme toggled to', this.currentTheme);
  }

  /**
   * Set specific theme
   * @param {string} theme - 'light' or 'dark'
   */
  setTheme(theme) {
    if (theme === this.currentTheme) return;

    const body = document.body;
    const themeIcon = document.querySelector('#regex-replace-btn i');

    if (theme === 'dark') {
      body.classList.add('dark-mode');
      if (themeIcon) {
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun');
      }
    } else {
      body.classList.remove('dark-mode');
      if (themeIcon) {
        themeIcon.classList.remove('fa-sun');
        themeIcon.classList.add('fa-moon');
      }
    }

    this.currentTheme = theme;
    Utils.log('Theme set to', theme);
  }

  /**
   * Toggle the chapter menu visibility
   */
  toggleChapterMenu(element) {

    const chapterMenu = document.getElementById('chapter-menu');
    const menuOverlay = document.getElementById('menu-overlay');

    if (!chapterMenu || !menuOverlay) {
      Utils.log('Menu elements not found');
      return;
    }

    const isOpen = chapterMenu.classList.contains('open');
    console.log({ isOpen });
    if (isOpen) {
      this.closeChapterMenu();
    } else {
      this.openChapterMenu();
    }

    Utils.log('Chapter menu toggled', isOpen ? 'closed' : 'opened');
  }

  /**
   * Open the chapter menu
   */
  openChapterMenu() {

    const chapterMenu = document.getElementById('chapter-menu');
    const menuOverlay = document.getElementById('menu-overlay');

    if (!chapterMenu || !menuOverlay) {
      console.error('Menu elements not found!');
      return;
    }

    // Show overlay first
    menuOverlay.style.display = 'block';

    // Force reflow to ensure animation works properly
    void chapterMenu.offsetWidth;

    // Open menu with animation
    chapterMenu.classList.add('open');
    menuOverlay.classList.add('open');

    // Update accessibility attribute
    chapterMenu.setAttribute('aria-hidden', 'false');

    // Highlight active chapter
    if (window.chaptersManager) {
      window.chaptersManager.highlightActiveChapter();
    }

    Utils.log('Chapter menu opened');
  }

  /**
   * Close the chapter menu
   */
  closeChapterMenu() {
    const chapterMenu = document.getElementById('chapter-menu');
    const menuOverlay = document.getElementById('menu-overlay');

    if (!chapterMenu || !menuOverlay) {
      console.error('Menu elements not found!');
      return;
    }

    // Close menu with animation
    chapterMenu.classList.remove('open');
    menuOverlay.classList.remove('open');

    // Update accessibility attribute
    chapterMenu.setAttribute('aria-hidden', 'true');

    // Hide overlay after animation
    setTimeout(() => {
      menuOverlay.style.display = 'none';
    }, 300);

    Utils.log('Chapter menu closed');
  }

  /**
   * Open the settings modal
   */
  openSettingsModal(modalId) {
    const settingsModal = document.getElementById(modalId);
    const modalOverlay = document.getElementById('modal-overlay');
    if (!settingsModal || !modalOverlay) return;
    this.closeChapterMenu();

    // Show modal and overlay
    modalOverlay.style.display = 'block';
    settingsModal.style.display = 'flex';

    // Force reflow to ensure animation works
    void settingsModal.offsetWidth;

    // Open with animation
    settingsModal.classList.add('open');
    modalOverlay.classList.add('open');
    // open lại element
    Utils.log('Settings modal opened');
  }


  /**
   * Close the settings modal
   */
  closeSettingsModal(modalId) {
    const settingsModal = document.getElementById(modalId);
    const modalOverlay = document.getElementById('modal-overlay');

    if (!settingsModal || !modalOverlay) return;

    settingsModal.classList.remove('open');
    modalOverlay.classList.remove('open');

    // Hide after animation
    setTimeout(() => {
      modalOverlay.style.display = 'none';
      settingsModal.style.display = 'none';
    }, CONFIG.ui.transitionSpeed);

    Utils.log('Settings modal closed');
  }

  /**
   * Trigger the file input click event
   */
  triggerFileInput() {
    // Prevent multiple executions in short time
    if (this._fileInputClickPending) {
      console.log('File input click pending, ignoring additional request');
      return;
    }

    const fileInput = document.getElementById('file-input');
    if (!fileInput) {
      console.error('File input not found');
      return;
    }

    // Set guard flag
    this._fileInputClickPending = true;
    console.log('Triggering file input click (guarded)');

    // Reset the value to allow selecting the same file again
    fileInput.value = '';

    // Click after a small delay to avoid event propagation issues
    setTimeout(() => {
      fileInput.click();
      console.log('File input clicked');

      // Reset the guard after a delay longer than the expected user interaction
      setTimeout(() => {
        this._fileInputClickPending = false;
        console.log('File input guard reset');
      }, 1000);
    }, 50);
  }

  /**
   * Initialize file input handler
   * @private
   */
  _initFileInput() {
    const fileInput = document.getElementById('file-input');
    if (!fileInput) {
      console.error('File input element not found');
      return;
    }

    // Remove any existing listeners
    const newFileInput = fileInput.cloneNode(true);
    fileInput.parentNode.replaceChild(newFileInput, fileInput);

    // Add new change listener
    newFileInput.addEventListener('change', async (event) => {
      const file = event.target.files[0];
      if (!file) return;

      try {
        // Show loading indicator
        this.showLoading();

        // Read file content
        const reader = new FileReader();

        reader.onload = (e) => {
          const content = e.target.result;
          // Process chapters
          if (window.chaptersManager) {
            // Use the processFile method instead of non-existent processChapterData
            window.chaptersManager.processFile(file)
              .then(() => {
                console.log('File processed successfully');
              })
              .catch(err => {
                console.error('Error processing file:', err);
              })
              .finally(() => {
                this.hideLoading();
              });
          } else {
            console.error('chaptersManager not found');
            this.hideLoading();
          }
        };

        reader.onerror = (error) => {
          console.error('Error reading file:', error);
          this.hideLoading();
        };

        reader.readAsText(file);
      } catch (error) {
        console.error('Error processing file:', error);
        this.hideLoading();
      }
    });
  }

  /**
   * Show the loading spinner
   */
  showLoading() {
    const loadingSpinner = document.getElementById('loading-spinner');
    if (loadingSpinner) {
      loadingSpinner.style.display = 'flex';
    }
  }

  /**
   * Hide the loading spinner
   */
  hideLoading() {
    const loadingSpinner = document.getElementById('loading-spinner');
    if (loadingSpinner) {
      loadingSpinner.style.display = 'none';
    }
  }

  /**
   * Update the title in the header
   * @param {string} title - The story title to display
   */
  updateStoryTitle(title) {
    const storyName = document.getElementById('story-name');
    if (storyName) {
      storyName.textContent = title;
    }
  }

  /**
   * Show an error message to the user
   * @param {string} message - The error message to display
   */
  showError(message) {
    const errorBanner = document.getElementById('error-banner');
    if (errorBanner) {
      errorBanner.textContent = message;
      errorBanner.style.display = 'block';

      // Hide after 5 seconds
      setTimeout(() => {
        errorBanner.style.display = 'none';
      }, 5000);
    }
  }

  /**
   * Show the welcome screen with upload button
   */
  showWelcomeScreen() {
    const chapterContent = document.getElementById('chapter-content');
    if (!chapterContent) {
      console.error('Chapter content element not found');
      return;
    }

    // Create welcome screen content
    chapterContent.innerHTML = `
      <div class="welcome-screen">
        <div class="welcome-content">
          <div class="welcome-icon">
            <i class="fas fa-book-reader"></i>
          </div>
          <h1>Welcome to Reader</h1>
          <p>Upload a text file to start reading</p>
          <button id="welcome-upload-btn" class="primary-btn">
            <i class="fas fa-upload"></i>
            Upload File
          </button>
        </div>
      </div>
    `;

    // Call setupWelcomeUploadButton instead of duplicating the event handler
    this.setupWelcomeUploadButton();
    console.log('Welcome screen created, button handlers set up');
  }

  /**
   * Log a message to the console and show in the UI log
   * @param {...*} messages - The messages to log
   */
  static log(...messages) {
    console.log(...messages);

    const logContainer = document.getElementById('log-container');
    if (logContainer) {
      const logEntry = document.createElement('div');
      logEntry.className = 'log-entry';
      logEntry.textContent = messages.join(' ');
      logContainer.appendChild(logEntry);

      // Auto-scroll to bottom
      logContainer.scrollTop = logContainer.scrollHeight;
    }
  }
}

// Global UI manager instance
// const uiManager = new UIManager();
