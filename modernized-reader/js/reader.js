// Reader functionality

/**
 * ReaderManager handles the core reading functionality
 */
class ReaderManager {
  /**
   * Initialize the reader manager
   */
  constructor() {
    this.fileInput = document.getElementById('file-input');
    this.autoScrollInterval = null;
    this.scrollSpeed = CONFIG.defaults.scrollSpeed;

    this.initEventListeners();
  }

  /**
   * Initialize reader event listeners
   */
  initEventListeners() {
    // File input change event
    if (this.fileInput) {
      this.fileInput.addEventListener('change', this.handleFileSelection.bind(this));
    }

    // Upload button in float menu
    const uploadFileBtn = document.getElementById('upload-file-btn');
    if (uploadFileBtn) {
      Utils.addClickEvent(uploadFileBtn, () => {
        if (this.fileInput) {
          this.fileInput.value = ''; // Reset value to allow selecting same file
          this.fileInput.click();
        }
      });
    }

    // Text-to-speech button
    const textToSpeechBtn = document.getElementById('scroll-to-current-read');
    if (textToSpeechBtn) {
      Utils.addClickEvent(textToSpeechBtn, this.scrollToHighlightedWord.bind(this));
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));

    // Resize event
    window.addEventListener('resize', Utils.debounce(() => {
      // Adjust UI elements on resize if needed
      if (chaptersManager) {
        chaptersManager.highlightActiveChapter();
      }
    }, 200));
  }

  /**
   * Handle file selection from input
   * @param {Event} event - Change event
   */
  async handleFileSelection(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      // Check if this is a compressed story file
      const isCompressedStory = Utils.isCompressedStoryFile(file);

      // For non-compressed files, validate file type
      if (!isCompressedStory) {
        const fileExt = file.name.split('.').pop().toLowerCase();
        if (!CONFIG.file.acceptedTypes.includes(`.${fileExt}`)) {
          Utils.showToast('Please select a valid text file (.txt) or story file (.story.bin)', 'error');
          return;
        }
      }

      // Validate file size
      if (file.size > CONFIG.file.maxSize) {
        Utils.showToast('File is too large. Maximum size is 10MB.', 'error');
        return;
      }

      // Process file with chapters manager
      if (chaptersManager) {
        if (isCompressedStory) {
          // Handle compressed story file
          Utils.log('Loading compressed story file', file.name);
          try {
            await chaptersManager.loadCompressedStory(file);
          } catch (err) {
            Utils.log('Error loading compressed story file', err);
            Utils.showToast('Failed to load compressed story. File may be corrupted.', 'error');
          }
        } else {
          // Process regular text file
          await chaptersManager.processFile(file);
        }
      }

    } catch (error) {
      Utils.log('Error handling file selection', error);
      Utils.showToast('Error processing file', 'error');
    }
  }

  /**
   * Handle keyboard shortcuts
   * @param {KeyboardEvent} event - Keyboard event
   */
  handleKeyboardShortcuts(event) {
    // Prevent handling shortcuts in input fields
    if (event.target.tagName === 'INPUT' ||
      event.target.tagName === 'TEXTAREA' ||
      event.target.isContentEditable) {
      return;
    }

    switch (event.key) {
      case 'Escape':
        // Close menus and modals
        if (uiManager) {
          uiManager.closeChapterMenu();
          uiManager.closeSettingsModal();
        }
        break;

      case 'm':
      case 'M':
        // Toggle chapter menu
        if (uiManager) {
          uiManager.toggleChapterMenu();
        }
        break;

      case 's':
      case 'S':
        // Open settings
        if (uiManager) {
          uiManager.openSettingsModal();
        }
        break;

      case 'ArrowRight':
        // Navigate to next chapter
        this.navigateChapter('next');
        break;

      case 'ArrowLeft':
        // Navigate to previous chapter
        this.navigateChapter('prev');
        break;

      case 'Home':
        // Go to first chapter
        this.navigateToFirstChapter();
        break;

      case 'End':
        // Go to last chapter
        this.navigateToLastChapter();
        break;
    }
  }

  /**
   * Navigate to next or previous chapter
   * @param {string} direction - 'next' or 'prev'
   */
  navigateChapter(direction) {
    if (!chaptersManager || !chaptersManager.chapterData || !chaptersManager.chapterData.length) {
      return;
    }

    const chapters = document.querySelectorAll('.chapter');
    const currentChapterIndex = Utils.getVisibleChapter(chapters);

    if (currentChapterIndex === null) return;

    let targetIndex;

    if (direction === 'next') {
      targetIndex = currentChapterIndex + 1;
      // Check if target index exists in chapterData
      const hasNextChapter = chaptersManager.chapterData.some(
        chapter => chapter.chapterNumber === targetIndex
      );

      if (!hasNextChapter) {
        Utils.showToast('You are at the last chapter', 'info');
        return;
      }
    } else {
      targetIndex = currentChapterIndex - 1;
      if (targetIndex < 1) {
        Utils.showToast('You are at the first chapter', 'info');
        return;
      }
    }

    if (chaptersManager) {
      chaptersManager.scrollToChapter(targetIndex);
    }
  }

  /**
   * Navigate to the first chapter
   */
  navigateToFirstChapter() {
    if (chaptersManager && chaptersManager.chapterData && chaptersManager.chapterData.length) {
      const firstChapterNumber = chaptersManager.chapterData[0].chapterNumber;
      chaptersManager.scrollToChapter(firstChapterNumber);
    }
  }

  /**
   * Navigate to the last chapter
   */
  navigateToLastChapter() {
    if (chaptersManager && chaptersManager.chapterData && chaptersManager.chapterData.length) {
      const lastChapter = chaptersManager.chapterData[chaptersManager.chapterData.length - 1];
      chaptersManager.scrollToChapter(lastChapter.chapterNumber);
    }
  }

  /**
   * Scroll to a highlighted word in the document
   */
  scrollToHighlightedWord() {
    const highlightedElements = document.querySelector('.msreadout-word-highlight');

    if (highlightedElements) {

      // Scroll to the element with smooth animation
      highlightedElements.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });

      Utils.log('Scrolled to highlighted word');
      return true;
    }
    chaptersManager.restoreScrollPosition()
  }

  /**
   * Create a sample highlighted word for testing
   */
  createSampleHighlight() {
    // Check if any highlighted elements already exist
    if (document.querySelectorAll('.msreadout-word-highlight').length > 0) {
      return;
    }

    // Find a random paragraph to add the highlight to
    const paragraphs = document.querySelectorAll('#chapter-content p');
    if (paragraphs.length > 0) {
      const randomParagraphIndex = Math.floor(Math.random() * paragraphs.length);
      const paragraph = paragraphs[randomParagraphIndex];

      // Only create a highlight if we're in debug mode
      if (CONFIG.debug) {
        const text = paragraph.textContent;
        if (text.length > 20) {
          // Create a random starting position
          const startPos = Math.floor(Math.random() * (text.length - 20));
          const endPos = startPos + Math.floor(Math.random() * 10) + 3;

          // Split the text into parts
          const beforeText = text.substring(0, startPos);
          const highlightText = text.substring(startPos, endPos);
          const afterText = text.substring(endPos);

          // Replace the paragraph content with the highlighted version
          paragraph.innerHTML = `${beforeText}<span class="msreadout-word-highlight">${highlightText}</span>${afterText}`;

          Utils.log('Created sample highlight', { position: startPos, text: highlightText });
        }
      }
    }
  }

  /**
   * Start auto-scrolling
   */
  startAutoScroll() {
    if (this.autoScrollInterval) {
      this.stopAutoScroll();
    }

    const content = document.getElementById('chapter-content');
    if (!content) return;

    this.scrollSpeed = settingsManager ?
      settingsManager.getSettingValue('scrollSpeed') :
      CONFIG.defaults.scrollSpeed;

    // Convert speed setting (1-10) to actual scroll increment (px)
    const scrollIncrement = this.convertSpeedToIncrement(this.scrollSpeed);

    this.autoScrollInterval = setInterval(() => {
      content.scrollTop += scrollIncrement;

      // Check if we've reached the bottom
      if (content.scrollTop + content.clientHeight >= content.scrollHeight) {
        // Stop scrolling at the end of the content
        this.stopAutoScroll();
        Utils.showToast('Reached the end of content', 'info');
      }
    }, 100); // Update every 100ms for smooth scrolling

    Utils.log('Auto-scroll started', { speed: this.scrollSpeed, increment: scrollIncrement });
    Utils.showToast('Auto-scroll started', 'info');
  }

  /**
   * Stop auto-scrolling
   */
  stopAutoScroll() {
    if (this.autoScrollInterval) {
      clearInterval(this.autoScrollInterval);
      this.autoScrollInterval = null;

      Utils.log('Auto-scroll stopped');
    }
  }

  /**
   * Update auto-scroll speed
   * @param {number} speed - New speed setting (1-10)
   */
  updateScrollSpeed(speed) {
    this.scrollSpeed = speed;

    if (this.autoScrollInterval) {
      // Restart with new speed
      this.stopAutoScroll();
      this.startAutoScroll();
    }
  }

  /**
   * Convert speed setting to actual scroll increment
   * @param {number} speed - Speed value (1-10)
   * @returns {number} - Scroll increment in pixels
   */
  convertSpeedToIncrement(speed) {
    // Map speed (1-10) to pixel increment (1-20)
    return Math.max(1, Math.round(speed * 2));
  }
}

