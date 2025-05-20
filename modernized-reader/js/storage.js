// Storage functionality for persisting data

/**
 * StorageManager handles all data persistence for the application
 */
class StorageManager {
  /**
   * Initializes the storage manager
   */
  constructor() {
    this.prefix = CONFIG.storage.prefix;
    this.keys = CONFIG.storage.keys;
    this.currentStoryName = '';
  }
  
  /**
   * Sets the current story name for the storage context
   * @param {string} storyName - Name of the current story
   */
  setCurrentStory(storyName) {
    this.currentStoryName = Utils.sanitizeStoryName(storyName);
    
    // Save last opened story
    this.saveGlobal(this.keys.lastStory, this.currentStoryName);
    
    Utils.log('Current story set', this.currentStoryName);
  }
  
  /**
   * Creates a storage key prefixed with story name
   * @param {string} key - The key to store
   * @returns {string} - Prefixed storage key
   */
  getStoryKey(key) {
    return `${this.prefix}${this.currentStoryName}_${key}`;
  }
  
  /**
   * Creates a global storage key (not specific to any story)
   * @param {string} key - The key to store
   * @returns {string} - Prefixed global key
   */
  getGlobalKey(key) {
    return `${this.prefix}${key}`;
  }
  
  /**
   * Saves data for the current story
   * @param {string} key - Storage key
   * @param {*} data - Data to store
   */
  save(key, data) {
    if (!this.currentStoryName) {
      Utils.log('No story selected, cannot save data');
      return;
    }
    
    const storageKey = this.getStoryKey(key);
    try {
      localStorage.setItem(storageKey, JSON.stringify(data));
      Utils.log('Saved to storage', { key: storageKey, data });
    } catch (error) {
      Utils.log('Error saving to storage', error);
    }
  }
  
  /**
   * Loads data for the current story
   * @param {string} key - Storage key
   * @returns {*} - Stored data or null
   */
  load(key) {
    if (!this.currentStoryName) {
      Utils.log('No story selected, cannot load data');
      return null;
    }
    
    const storageKey = this.getStoryKey(key);
    try {
      const data = localStorage.getItem(storageKey);
      if (data === null) return null;
      
      const parsedData = JSON.parse(data);
      Utils.log('Loaded from storage', { key: storageKey, data: parsedData });
      return parsedData;
    } catch (error) {
      Utils.log('Error loading from storage', error);
      return null;
    }
  }
  
  /**
   * Saves global data (not tied to a specific story)
   * @param {string} key - Storage key
   * @param {*} data - Data to store
   */
  saveGlobal(key, data) {
    const storageKey = this.getGlobalKey(key);
    try {
      localStorage.setItem(storageKey, JSON.stringify(data));
      Utils.log('Saved global data', { key: storageKey, data });
    } catch (error) {
      Utils.log('Error saving global data', error);
    }
  }
  
  /**
   * Loads global data
   * @param {string} key - Storage key
   * @returns {*} - Stored data or null
   */
  loadGlobal(key) {
    const storageKey = this.getGlobalKey(key);
    try {
      const data = localStorage.getItem(storageKey);
      if (data === null) return null;
      
      const parsedData = JSON.parse(data);
      Utils.log('Loaded global data', { key: storageKey, data: parsedData });
      return parsedData;
    } catch (error) {
      Utils.log('Error loading global data', error);
      return null;
    }
  }
  
  /**
   * Saves all current settings
   * @param {Object} settings - Settings object
   */
  saveSettings(settings) {
    this.save(this.keys.settings, settings);
  }
  
  /**
   * Loads saved settings or returns defaults
   * @returns {Object} - Settings object
   */
  loadSettings() {
    const savedSettings = this.load(this.keys.settings);
    return { ...CONFIG.defaults, ...savedSettings };
  }
  
  /**
   * Saves the current scroll position
   * @param {number} position - Scroll position
   */
  saveScrollPosition(position) {
    this.save(this.keys.position, position);
  }
  
  /**
   * Loads the saved scroll position
   * @returns {number|null} - Saved position or null
   */
  loadScrollPosition() {
    return this.load(this.keys.position);
  }
  
  /**
   * Saves the current chapter number
   * @param {number} chapterNumber - Chapter number
   */
  saveChapterNumber(chapterNumber) {
    this.save(this.keys.chapterNumber, chapterNumber);
  }
  
  /**
   * Loads the saved chapter number
   * @returns {number|null} - Saved chapter number or null
   */
  loadChapterNumber() {
    return this.load(this.keys.chapterNumber);
  }
  
  /**
   * Clears all data for the current story
   */
  clearCurrentStoryData() {
    if (!this.currentStoryName) return;
    
    // Get all keys for the current story
    Object.values(this.keys).forEach(keyName => {
      const fullKey = this.getStoryKey(keyName);
      localStorage.removeItem(fullKey);
    });
    
    Utils.log('Cleared all data for current story', this.currentStoryName);
  }
  
  /**
   * Clears all story reader data
   */
  clearAllData() {
    // Get all keys starting with our prefix
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key);
      }
    }
    
    Utils.log('Cleared all story reader data');
  }
}

// Create and export a singleton instance
// const storageManager = new StorageManager();
