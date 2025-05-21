// Configuration settings for Story Reader
const CONFIG = {
  // Default settings
  defaults: {
    fontFamily: 'Palatino Linotype',
    fontSize: 20,
    linesPerSentence: 2,
    theme: 'dark', // 'light' or 'dark'
    autoScroll: false,
    scrollSpeed: 5,
  },
  
  // File settings
  file: {
    maxSize: 10 * 1024 * 1024, // 10MB
    acceptedTypes: ['.txt', '.TXT'],
  },
  
  // UI settings
  ui: {
    transitionSpeed: 300, // in ms
    maxChaptersInDom: 4,
    batchSize: 2,
    menuWidth: 300, // in px
  },
  
  // Local storage keys
  storage: {
    prefix: 'story_reader_',
    keys: {
      settings: 'settings',
      position: 'position',
      lastStory: 'last_story',
      chapterNumber: 'chapter_number',
    },
  },
  
  // Debug mode (set to false in production)
  debug: true,
  
  // Version
  version: '1.0.0',
};

// Export CONFIG object
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}
