// Utility functions for the Story Reader app

/**
 * Utility class with static methods
 */
class Utils {
  /**
   * Logs messages to console in debug mode
   * @param {string} message - The message to log
   * @param {*} data - Optional data to log
   */
  static log(message, data) {
    if (CONFIG.debug) {
      if (data) {
        console.log(`[StoryReader] ${message}:`, data);
      } else {
        console.log(`[StoryReader] ${message}`);
      }
    }
  }

  /**
   * Creates and shows a toast notification
   * @param {string} message - The message to display
   * @param {string} type - The type of toast: 'success', 'error', 'warning', 'info'
   * @param {number} duration - How long to display the toast in ms
   */
  static showToast(message, type = 'info', duration = 1500) {
    // Remove any existing toasts
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
      existingToast.remove();
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    // Set icon based on type
    let icon = 'info-circle';
    switch (type) {
      case 'success': icon = 'check-circle'; break;
      case 'error': icon = 'exclamation-circle'; break;
      case 'warning': icon = 'exclamation-triangle'; break;
    }

    toast.innerHTML = `<i class="fas fa-${icon}"></i><span>${message}</span>`;
    document.body.appendChild(toast);

    // Show toast with animation
    setTimeout(() => toast.classList.add('show'), 10);

    // Hide and remove toast after duration
    setTimeout(() => {
      toast.classList.remove('show');
      toast.classList.add('hide');
      setTimeout(() => toast.remove(), 100);
    }, duration);
  }

  /**
   * Creates a ripple effect on an element
   * @param {Event} event - The click event
   */
  static createRippleEffect(event) {
    const button = event.currentTarget;

    // Remove existing ripples
    const ripples = button.getElementsByClassName('ripple-effect');
    while (ripples.length > 0) {
      ripples[0].parentNode.removeChild(ripples[0]);
    }

    // Create ripple element
    const circle = document.createElement('span');
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;

    // Calculate position
    const rect = button.getBoundingClientRect();
    const x = event.clientX - rect.left - radius;
    const y = event.clientY - rect.top - radius;

    // Setup style
    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${x}px`;
    circle.style.top = `${y}px`;
    circle.classList.add('ripple-effect');

    // Add to button
    button.appendChild(circle);

    // Remove after animation completes
    setTimeout(() => {
      if (circle && circle.parentNode) {
        circle.parentNode.removeChild(circle);
      }
    }, 600);
  }

  /**
   * Debounces a function to limit how often it runs
   * @param {Function} func - The function to debounce
   * @param {number} wait - Time in milliseconds to wait
   * @returns {Function} - Debounced function
   */
  static debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Throttles a function to limit how often it runs
   * @param {Function} func - The function to throttle
   * @param {number} limit - Time in milliseconds between function calls
   * @returns {Function} - Throttled function
   */
  static throttle(func, limit = 300) {
    let inThrottle;
    return function () {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * Returns a sanitized story name suitable for storage keys
   * @param {string} storyName - The name of the story
   * @returns {string} - Sanitized story name
   */
  static sanitizeStoryName(storyName) {
    if (!storyName) return '';
    return storyName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  }

  /**
   * Chunks an array into smaller arrays of a specified size
   * @param {Array} array - The array to chunk
   * @param {number} size - The size of each chunk
   * @returns {Array} - Array of chunks
   */
  static chunkArray(array, size) {
    if (!Array.isArray(array) || size <= 0) {
      throw new Error('Invalid input: array must be an array and size must be a positive number.');
    }
    const result = [];
    for (let i = 0; i < array.length; i += size) {
      result.push(array.slice(i, i + size));
    }
    return result;
  }

  /**
   * Adds event listeners with touchstart fallback for mobile
   * @param {Element} element - The DOM element to attach to
   * @param {string} event - The event name ('click', etc)
   * @param {Function} callback - The callback function
   */
  static addClickEvent(element, callback) {
    if (!element) return;

    // Add click for desktop
    
    element.addEventListener('click', function (event) {
       Utils.debounce(callback, 1000)
       return true
    });

    // Add touchstart for mobile with throttle to prevent double firing
    const touchCallback = Utils.throttle(callback, 300);
    element.addEventListener('touchstart', touchCallback, { passive: true });
  }

  /**
   * Get the visible chapter based on scroll position
   * @param {NodeList|Array} chapters - The DOM chapter elements
   * @returns {number|null} - The visible chapter index
   */
  static getVisibleChapter(chapters) {
    if (!chapters || chapters.length === 0) return null;

    const container = document.getElementById('chapter-content');
    const scrollTop = container.scrollTop;
    let visibleChapterIndex = null;

    // Find the first chapter that is visible in the viewport
    for (let i = 0; i < chapters.length; i++) {
      const chapter = chapters[i];
      const chapterTop = chapter.offsetTop - container.offsetTop;
      const chapterBottom = chapterTop + chapter.offsetHeight;

      // Check if the chapter is currently visible in the viewport
      if (
        (scrollTop >= chapterTop && scrollTop < chapterBottom) ||
        (scrollTop < chapterTop && scrollTop + container.clientHeight > chapterTop)
      ) {
        // Extract chapter index from ID (e.g., "chapter-2" => 2)
        visibleChapterIndex = parseInt(chapter.id.split('-')[1]);
        break;
      }
    }

    // If no chapter is found, default to the first (0)
    return visibleChapterIndex !== null ? visibleChapterIndex : 0;
  }


  // Thêm hàm debounce vào Utils

static debounce = function (func, wait = 300) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  };

// Tạo phiên bản mới của addClickEvent với tính năng chống double click
static addClickEventWithDebounce = function (element, handler, delay = 1000) {
    if (!element) return;

    // Biến để theo dõi trạng thái
    let isProcessing = false;

    element.addEventListener('click', function (event) {
      // Nếu đang xử lý, bỏ qua click mới
      if (isProcessing) {
        event.preventDefault();
        event.stopPropagation();
        return false;
      }

      // Đánh dấu đang xử lý
      isProcessing = true;
      console.log({isProcessing, delay});

      // Gọi handler
      handler.call(this, event);

      // Sau delay, cho phép xử lý click tiếp theo
      setTimeout(() => {

        isProcessing = false;
      }, delay);
    });
  };

  /**
   * Check if a file is a compressed story file
   * @param {File} file - File to check
   * @returns {boolean} - True if file is a compressed story file
   */
  static isCompressedStoryFile(file) {
    if (!file) return false;
    return file.name.toLowerCase().endsWith('.story.bin');
  }
  
  /**
   * Format file size into a human-readable string
   * @param {number} bytes - File size in bytes
   * @returns {string} - Formatted file size
   */
  static formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    else return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }
}
