// Settings management functionality


/**
 * SettingsManager handles application settings and preferences
 */
class SettingsManager {
  /**
   * Initialize settings manager
   */
  constructor() {
    this.settings = { ...CONFIG.defaults };
    this.regexReplacements = [];
    this.initEventListeners();
  }

  /**
   * Initialize event listeners for settings controls
   */
  initEventListeners() {
    // Font size controls
    const fontSizeSlider = document.getElementById("font-size-slider");
    const increaseFontBtn = document.getElementById("increase-font-size");
    const decreaseFontBtn = document.getElementById("decrease-font-size");
    const fontSizeDisplay = document.getElementById("font-size-display");

    if (fontSizeSlider) {
      fontSizeSlider.addEventListener("input", (e) => {
        const size = parseInt(e.target.value);
        this.updateFontSize(size);
        if (fontSizeDisplay) {
          fontSizeDisplay.textContent = size;
        }
      });
    }

    if (increaseFontBtn) {
      Utils.addClickEvent(increaseFontBtn, () => {
        if (!fontSizeSlider) return;

        const newSize = parseInt(fontSizeSlider.value) + 1;
        if (newSize <= parseInt(fontSizeSlider.max)) {
          fontSizeSlider.value = newSize;
          this.updateFontSize(newSize);
          if (fontSizeDisplay) {
            fontSizeDisplay.textContent = newSize;
          }
        }
      });
    }

    if (decreaseFontBtn) {
      Utils.addClickEvent(decreaseFontBtn, () => {
        if (!fontSizeSlider) return;

        const newSize = parseInt(fontSizeSlider.value) - 1;
        if (newSize >= parseInt(fontSizeSlider.min)) {
          fontSizeSlider.value = newSize;
          this.updateFontSize(newSize);
          if (fontSizeDisplay) {
            fontSizeDisplay.textContent = newSize;
          }
        }
      });
    }

    // Lines per sentence controls
    const linesSlider = document.getElementById("lines-per-sentence-slider");
    const increaseLinesBtn = document.getElementById(
      "increase-lines-per-sentence"
    );
    const decreaseLinesBtn = document.getElementById(
      "decrease-lines-per-sentence"
    );
    const linesDisplay = document.getElementById("lines-per-sentence-display");

    if (linesSlider) {
      linesSlider.addEventListener("input", (e) => {
        const lines = parseInt(e.target.value);
        console.log("Lines per sentence changed1111:", lines);
        this.settings.linesPerSentence = lines;
        if (linesDisplay) {
          linesDisplay.textContent = lines;
          const chapterContent = document.getElementById("chapter-content");
          const currentChapterIndex = Utils.getVisibleChapter(chapterContent.childNodes);
          if (currentChapterIndex) {
            chapterContent.innerHTML = "";
            chaptersManager.loadMoreData("down", currentChapterIndex);
          }
        }
      });
    }

    if (increaseLinesBtn) {
      Utils.addClickEvent(increaseLinesBtn, () => {
        if (!linesSlider) return;

        const newLines = parseInt(linesSlider.value) + 1;
        if (newLines <= parseInt(linesSlider.max)) {
          linesSlider.value = newLines;
          this.settings.linesPerSentence = newLines;
          if (linesDisplay) {
            linesDisplay.textContent = newLines;
          }
        }
      });
    }

    if (decreaseLinesBtn) {
      Utils.addClickEvent(decreaseLinesBtn, () => {
        if (!linesSlider) return;

        const newLines = parseInt(linesSlider.value) - 1;
        if (newLines >= parseInt(linesSlider.min)) {
          linesSlider.value = newLines;
          this.settings.linesPerSentence = newLines;
          if (linesDisplay) {
            linesDisplay.textContent = newLines;
          }
        }
      });
    }

    // Font family dropdown
    const fontFamilySelect = document.getElementById("font-family");
    if (fontFamilySelect) {
      fontFamilySelect.addEventListener("change", (e) => {
        const fontFamily = e.target.value;
        this.updateFontFamily(fontFamily);
      });
    }

    // Auto-scroll toggle
    const autoScrollToggle = document.getElementById("auto-scroll");
    const scrollSpeedSlider = document.getElementById("scroll-speed-slider");
    const scrollSpeedDisplay = document.getElementById("scroll-speed-display");

    if (autoScrollToggle) {
      autoScrollToggle.addEventListener("change", (e) => {
        const isEnabled = e.target.checked;
        this.settings.autoScroll = isEnabled;

        // Enable/disable scroll speed control
        if (scrollSpeedSlider) {
          scrollSpeedSlider.disabled = !isEnabled;
        }

        // Start/stop auto-scrolling
        if (isEnabled && window.readerManager) {
          window.readerManager.startAutoScroll();
        } else if (window.readerManager) {
          window.readerManager.stopAutoScroll();
        }
      });
    }

    if (scrollSpeedSlider) {
      scrollSpeedSlider.addEventListener("input", (e) => {
        const speed = parseInt(e.target.value);
        this.settings.scrollSpeed = speed;

        if (scrollSpeedDisplay) {
          scrollSpeedDisplay.textContent = speed;
        }

        // Update scroll speed if auto-scroll is active
        if (this.settings.autoScroll && window.readerManager) {
          window.readerManager.updateScrollSpeed(speed);
        }
      });
    }

    // Regex replacement
    const addRegexBtn = document.getElementById("add-regex-replace");
    if (addRegexBtn) {
      Utils.addClickEvent(addRegexBtn, this.addRegexReplacement.bind(this));
    }

    // Save settings button
    const saveSettingsBtn = document.getElementById("save-settings");
    if (saveSettingsBtn) {
      Utils.addClickEvent(saveSettingsBtn, this.saveSettings.bind(this));
    }

    const saveSettingsRegexBtn = document.getElementById("save-settings-regex");
    if (saveSettingsBtn) {
      Utils.addClickEvent(saveSettingsBtn, this.saveRegexSettings.bind(this));
    }

    // Reset settings button
    const resetSettingsBtn = document.getElementById("reset-settings");
    if (resetSettingsBtn) {
      Utils.addClickEvent(resetSettingsBtn, this.resetSettings.bind(this));
    }
  }

  /**
   * Add a new regex replacement rule
   */
  addRegexReplacement() {
    const regexMatch = document.getElementById("regex-match");
    const regexReplace = document.getElementById("regex-replace");

    if (!regexMatch || !regexReplace) return;

    const matchValue = regexMatch.value.trim();
    const replaceValue = regexReplace.value.trim();

    if (!matchValue) {
      Utils.showToast("Please enter a match pattern", "warning");
      return;
    }

    // Create replacement object
    const replacement = {
      match: matchValue,
      replace: replaceValue,
    };

    // Add to regex replacement list UI
    this.addRegexReplacementToUI(replacement);

    // Add to replacements array
    this.regexReplacements.unshift(replacement);

    // Clear inputs
    regexMatch.value = "";
    regexReplace.value = "";

    // Update count display
    this.updateRegexCount();
    storageManager.save("regexReplacements", this.regexReplacements);
    Utils.log("Added regex replacement", replacement);
  }

  /**
   * Add a regex replacement to the UI
   * @param {Object} replacement - {match, replace} object
   */
  addRegexReplacementToUI(replacement) {
    const regexReplaceList = document.getElementById("regex-replace-list");
    if (!regexReplaceList) return;

    const listItem = document.createElement("li");
    listItem.className = "regex-inputs";

    // Create match input
    const matchInput = document.createElement("input");
    matchInput.type = "text";
    matchInput.value = replacement.match;
    // matchInput.readOnly = true;
    matchInput.className = "input-control";

    // Create replace input
    const replaceInput = document.createElement("input");
    replaceInput.type = "text";
    replaceInput.value = replacement.replace;
    // replaceInput.readOnly = true;
    replaceInput.className = "input-control";

    // Create delete button
    const deleteButton = document.createElement("button");
    deleteButton.innerHTML = "&times;";
    deleteButton.className = "icon-btn";
    deleteButton.addEventListener("click", () => {
      // Remove from UI
      regexReplaceList.removeChild(listItem);

      // Remove from array
      this.regexReplacements = this.regexReplacements.filter(
        (item) =>
          item.match !== replacement.match ||
          item.replace !== replacement.replace
      );

      // Update count
      chaptersManager.applyRegexReplacements([replacement], true);
      storageManager.save("regexReplacements", this.regexReplacements);
      this.updateRegexCount();
      Utils.log("Removed regex replacement", replacement);
    });

    // Add elements to list item
    listItem.appendChild(matchInput);
    listItem.appendChild(replaceInput);
    listItem.appendChild(deleteButton);

    // Add to list (at the top)
    regexReplaceList.insertBefore(listItem, regexReplaceList.firstChild);
    chaptersManager.applyRegexReplacements([replacement]);
  }

  /**
   * Update the regex count display
   */
  updateRegexCount() {
    const countElement = document.getElementById("regex-count");
    if (countElement) {
      countElement.textContent = `[ ${this.regexReplacements.length} ]`;
    }
  }

  /**
   * Update the font size
   * @param {number} size - New font size
   */
  updateFontSize(size) {
    this.settings.fontSize = size;

    const chapterContent = document.getElementById("chapter-content");
    if (chapterContent) {
      chapterContent.style.fontSize = `${size}px`;
    }
  }

  /**
   * Update the font family
   * @param {string} fontFamily - New font family
   */
  updateFontFamily(fontFamily) {
    this.settings.fontFamily = fontFamily;

    const chapterContent = document.getElementById("chapter-content");
    if (chapterContent) {
      chapterContent.style.fontFamily = fontFamily;
    }
  }

  /**
   * Save all current settings
   */
  saveSettings() {
    // Collect current settings
    this.collectCurrentSettings();
    // Close settings modal
    if (uiManager) {
      uiManager.closeSettingsModal("settings-modal");
    }

    Utils.showToast("Settings saved", "success");
    Utils.log("Settings saved", this.settings);
  }

  saveRegexSettings() {
    // Save settings to storage
    if (storageManager) {
      storageManager.saveSettings(this.settings);
    }

    // Apply regex replacements to current content
    // if (chaptersManager) {
    //   chaptersManager.applyRegexReplacements(this.regexReplacements);
    // }

    // Close settings modal
    if (uiManager) {
      uiManager.closeSettingsModal("settings-regex-modal");
    }

    Utils.showToast("Settings Regex Saved", "success");
    Utils.log("Settings saved", this.settings);
  }

  /**
   * Collect current settings from UI controls
   */
  collectCurrentSettings() {
    // Font size
    const fontSizeDisplay = document.getElementById("font-size-display");
    if (fontSizeDisplay) {
      this.settings.fontSize = parseInt(fontSizeDisplay.textContent);
    }

    // Lines per sentence
    const linesDisplay = document.getElementById("lines-per-sentence-display");
    if (linesDisplay) {
      this.settings.linesPerSentence = parseInt(linesDisplay.textContent);
    }

    // Font family
    const fontFamilySelect = document.getElementById("font-family");
    if (fontFamilySelect) {
      this.settings.fontFamily = fontFamilySelect.value;
    }
  }

  /**
   * Reset settings to defaults
   */
  resetSettings() {
    // Confirm reset
    if (confirm("Reset all settings to defaults?")) {
      // Reset to defaults
      this.settings = { ...CONFIG.defaults };

      // Clear regex replacements
      this.regexReplacements = [];
      const regexReplaceList = document.getElementById("regex-replace-list");
      if (regexReplaceList) {
        regexReplaceList.innerHTML = "";
      }
      this.updateRegexCount();

      // Update UI controls
      this.updateSettingsUI();

      // Apply default settings
      this.applySettings();
    }
  }

  /**
   * Update UI controls with current settings
   */
  updateSettingsUI() {
    // Font size
    const fontSizeSlider = document.getElementById("font-size-slider");
    const fontSizeDisplay = document.getElementById("font-size-display");

    if (fontSizeSlider) {
      fontSizeSlider.value = this.settings.fontSize;
    }

    if (fontSizeDisplay) {
      fontSizeDisplay.textContent = this.settings.fontSize;
    }

    // Lines per sentence
    const linesSlider = document.getElementById("lines-per-sentence-slider");
    const linesDisplay = document.getElementById("lines-per-sentence-display");

    if (linesSlider) {
      linesSlider.value = this.settings.linesPerSentence;
    }

    if (linesDisplay) {
      linesDisplay.textContent = this.settings.linesPerSentence;
    }

    // Font family
    const fontFamilySelect = document.getElementById("font-family");
    if (fontFamilySelect) {
      fontFamilySelect.value = this.settings.fontFamily;
    }
  }

  /**
   * Apply current settings to the UI
   */
  applySettings() {
    // Apply font size
    this.updateFontSize(this.settings.fontSize);

    // Apply font family
    this.updateFontFamily(this.settings.fontFamily);

    // Apply theme
    if (uiManager) {
      uiManager.setTheme(this.settings.theme);
    }

    // Apply auto-scroll
    if (this.settings.autoScroll && window.readerManager) {
      window.readerManager.startAutoScroll();
    }

    // Apply regex replacements
    // if (chaptersManager) {
    //   chaptersManager.applyRegexReplacements(this.regexReplacements);
    // }
  }

  /**
   * Load and apply stored settings
   */
  applyStoredSettings() {
    if (!storageManager) return;

    // Load settings
    const storedSettings = storageManager.loadSettings();
    this.settings = { ...this.settings, ...storedSettings };
    // Load regex replacements
    const storedReplacements = storageManager.load("regexReplacements");
    if (storedReplacements && Array.isArray(storedReplacements)) {
      this.regexReplacements = storedReplacements;
      const regexReplaceList = document.getElementById("regex-replace-list");
      regexReplaceList.innerHTML = "";
      this.regexReplacements.forEach((replacement) => {
        this.addRegexReplacementToUI(replacement);
      });
    }

    // Update UI
    this.updateSettingsUI();

    // Apply settings
    this.applySettings();

    Utils.log("Applied stored settings", this.settings);
  }

  /**
   * Update a single setting
   * @param {string} key - Setting key
   * @param {*} value - Setting value
   */
  updateSetting(key, value) {
    if (key in this.settings) {
      this.settings[key] = value;

      // Save to storage
      if (storageManager) {
        storageManager.saveSettings(this.settings);
      }

      Utils.log("Updated setting", { key, value });
    }
  }

  /**
   * Get a setting value
   * @param {string} key - Setting key
   * @returns {*} - Setting value or null
   */
  getSettingValue(key) {
    return key in this.settings ? this.settings[key] : null;
  }
}
