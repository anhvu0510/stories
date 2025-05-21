// Storage functionality for persisting data - using reading-stories-1 style

/**
 * StorageManager handles all data persistence for the application
 */
class StorageManager {
  /**
   * Initializes the storage manager
   */
  constructor() {
    this.keys = CONFIG.storage.keys;
    this.currentStoryName = '';
  }
  
  /**
   * Sets the current story name for the storage context
   * @param {string} storyName - Name of the current story
   */
  setCurrentStory(storyName) {
    this.currentStoryName = storyName.toLowerCase().replace(/\s+/g, '_');
    
    // Save last opened story in the global config
    this.saveGlobal(this.keys.lastStory, this.currentStoryName);
    
    Utils.log('Current story set', this.currentStoryName);
  }
  
  /**
   * Saves data for the current story using reading-stories-1 style
   * @param {string} key - Storage key
   * @param {*} data - Data to store
   */
  save(key, data) {
    if (!this.currentStoryName) {
      Utils.log('No story selected, cannot save data');
      return;
    }
    
    try {
      let dataStore = {};
      // Get existing data for this story
      const existingData = localStorage.getItem(this.currentStoryName);
      
      if (!existingData) {
        dataStore[key] = data;
      } else {
        const oldData = JSON.parse(existingData);
        dataStore = { ...oldData, [key]: data };
      }
      
      localStorage.setItem(this.currentStoryName, JSON.stringify(dataStore));
      Utils.log('Saved to storage', { story: this.currentStoryName, key, data });
    } catch (error) {
      Utils.log('Error saving to storage', error);
    }
  }
  
  /**
   * Loads data for the current story using reading-stories-1 style
   * @param {string} key - Storage key
   * @returns {*} - Stored data or null
   */
  load(key) {
    if (!this.currentStoryName) {
      Utils.log('No story selected, cannot load data');
      return null;
    }
    
    try {
      const data = localStorage.getItem(this.currentStoryName);
      if (!data) return null;
      
      const parsedData = JSON.parse(data);
      const result = parsedData[key] !== undefined ? parsedData[key] : null;
      
      Utils.log('Loaded from storage', { story: this.currentStoryName, key, data: result });
      return result;
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
    try {
      // Using _global_ as the key for global settings
      let globalData = {};
      const existingData = localStorage.getItem('_global_');
      
      if (!existingData) {
        globalData[key] = data;
      } else {
        const oldData = JSON.parse(existingData);
        globalData = { ...oldData, [key]: data };
      }
      
      localStorage.setItem('_global_', JSON.stringify(globalData));
      Utils.log('Saved global data', { key, data });
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
    try {
      const data = localStorage.getItem('_global_');
      if (!data) return null;
      
      const parsedData = JSON.parse(data);
      const result = parsedData[key] !== undefined ? parsedData[key] : null;
      
      Utils.log('Loaded global data', { key, data: result });
      return result;
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
   * Gets the last opened story
   * @returns {string} - Name of the last story or empty string
   */
  getLastStory() {
    return this.loadGlobal(this.keys.lastStory) || '';
  }
  
  /**
   * Clears all data for the current story
   */
  clearCurrentStoryData() {
    if (!this.currentStoryName) return;
    
    localStorage.removeItem(this.currentStoryName);
    Utils.log('Cleared all data for current story', this.currentStoryName);
  }
  
  /**
   * Clears all story reader data
   */
  clearAllData() {
    localStorage.removeItem('_global_');
    
    // Find all story entries and remove them
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      // Skip non-story keys (those that have our old prefix)
      if (!key.startsWith(this.prefix)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    Utils.log('Cleared all story reader data');
  }
}

// Create and export a singleton instance
// const storageManager = new StorageManager();
