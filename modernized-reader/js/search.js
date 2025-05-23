// Search Manager - Handles text search functionality

class SearchManager {
  constructor() {
    this.searchResults = [];
    this.currentSearchIndex = -1;
    this.currentSearchTerm = '';
    this.isInitialized = false;
    
    // DOM elements
    this.elements = {};
    
    this.init();
  }

  /**
   * Initialize search functionality
   */
  init() {
    if (this.isInitialized) return;
    
    this.bindElements();
    this.bindEvents();
    this.isInitialized = true;
    
    Utils.log('SearchManager initialized');
  }

  /**
   * Bind DOM elements
   */
  bindElements() {
    this.elements = {
      searchTextBtn: document.getElementById('search-text'),
      searchModal: document.getElementById('search-modal'),
      closeSearchBtn: document.getElementById('close-search'),
      searchInput: document.getElementById('search-input'),
      searchBtn: document.getElementById('search-btn'),
      searchPrevBtn: document.getElementById('search-prev'),
      searchNextBtn: document.getElementById('search-next'),
      searchCounter: document.getElementById('search-counter'),
      chapterContent: document.getElementById('chapter-content')
    };
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Open search modal
    this.elements.searchTextBtn?.addEventListener('click', () => this.openSearchModal());

    // Close search modal and clear search
    this.elements.closeSearchBtn?.addEventListener('click', () => {
      this.clearSearch();
      this.closeSearchModal();
    });

    // Close modal when clicking outside
    this.elements.searchModal?.addEventListener('click', (e) => {
      if (e.target === this.elements.searchModal) {
        this.clearSearch();
        this.closeSearchModal();
      }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isModalOpen()) {
        this.clearSearch();
        this.closeSearchModal();
      }
    });

    // Search functionality
    this.elements.searchBtn?.addEventListener('click', () => this.performSearch());

    // Search on Enter key
    this.elements.searchInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.performSearch();
      }
    });

    // Navigation buttons
    this.elements.searchPrevBtn?.addEventListener('click', () => this.navigatePrevious());
    this.elements.searchNextBtn?.addEventListener('click', () => this.navigateNext());

    // Real-time search
    this.elements.searchInput?.addEventListener('input', () => this.handleRealTimeSearch());
  }

  /**
   * Open search modal
   */
  openSearchModal() {
    if (!this.elements.searchModal) return;
    
    this.elements.searchModal.style.display = 'flex';
    this.elements.searchModal.setAttribute('aria-hidden', 'false');
    this.elements.searchInput?.focus();
    
    Utils.log('Search modal opened');
  }

  /**
   * Close search modal
   */
  closeSearchModal() {
    if (!this.elements.searchModal) return;
    
    this.elements.searchModal.style.display = 'none';
    this.elements.searchModal.setAttribute('aria-hidden', 'true');
    
    Utils.log('Search modal closed');
  }

  /**
   * Check if modal is open
   */
  isModalOpen() {
    return this.elements.searchModal?.style.display === 'flex';
  }

  /**
   * Perform search
   */
  performSearch() {
    const searchTerm = this.elements.searchInput?.value.trim();
    if (!searchTerm) return;

    this.clearSearchHighlights();
    this.currentSearchTerm = searchTerm;
    this.searchResults = [];
    this.currentSearchIndex = -1;

    if (!this.elements.chapterContent) {
      this.updateSearchCounter();
      return;
    }

    // Find and highlight all matches
    this.searchAndHighlight(this.elements.chapterContent, searchTerm);
    this.updateSearchCounter();

    if (this.searchResults.length > 0) {
      this.currentSearchIndex = 0;
      this.scrollToSearchResult(0);
    }

    Utils.log(`Search performed for: "${searchTerm}", found ${this.searchResults.length} results`);
  }

  /**
   * Search and highlight text in container
   */
  searchAndHighlight(container, searchTerm) {
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
      if (node.textContent.trim()) {
        textNodes.push(node);
      }
    }

    textNodes.forEach(textNode => {
      const text = textNode.textContent;
      const regex = new RegExp(this.escapeRegex(searchTerm), 'gi');
      let match;
      const matches = [];

      while ((match = regex.exec(text)) !== null) {
        matches.push({
          start: match.index,
          end: match.index + match[0].length,
          text: match[0]
        });
      }

      if (matches.length > 0) {
        this.highlightMatches(textNode, matches);
      }
    });
  }

  /**
   * Highlight matches in text node
   */
  highlightMatches(textNode, matches) {
    const text = textNode.textContent;
    const parent = textNode.parentNode;
    const fragment = document.createDocumentFragment();
    
    let lastIndex = 0;
    
    matches.forEach(match => {
      // Add text before match
      if (match.start > lastIndex) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.start)));
      }
      
      // Add highlighted match
      const highlight = document.createElement('span');
      highlight.className = 'search-highlight';
      highlight.textContent = match.text;
      fragment.appendChild(highlight);
      
      this.searchResults.push(highlight);
      lastIndex = match.end;
    });
    
    // Add remaining text
    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
    }
    
    parent.replaceChild(fragment, textNode);
  }

  /**
   * Scroll to search result
   */
  scrollToSearchResult(index) {
    if (index < 0 || index >= this.searchResults.length) return;

    // Remove current highlight from all results
    this.searchResults.forEach(result => {
      result.classList.remove('current');
    });

    // Highlight current result
    const currentResult = this.searchResults[index];
    currentResult.classList.add('current');

    // Scroll to result
    currentResult.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });

    this.currentSearchIndex = index;
    this.updateSearchCounter();
    
    Utils.log(`Scrolled to search result ${index + 1}/${this.searchResults.length}`);
  }

  /**
   * Navigate to previous result
   */
  navigatePrevious() {
    if (this.currentSearchIndex > 0) {
      this.scrollToSearchResult(this.currentSearchIndex - 1);
    }
  }

  /**
   * Navigate to next result
   */
  navigateNext() {
    if (this.currentSearchIndex < this.searchResults.length - 1) {
      this.scrollToSearchResult(this.currentSearchIndex + 1);
    }
  }

  /**
   * Update search counter display
   */
  updateSearchCounter() {
    const total = this.searchResults.length;
    const current = this.currentSearchIndex >= 0 ? this.currentSearchIndex + 1 : 0;
    
    if (this.elements.searchCounter) {
      this.elements.searchCounter.textContent = `${current}/${total}`;
    }

    // Update button states
    if (this.elements.searchPrevBtn) {
      this.elements.searchPrevBtn.disabled = total === 0 || this.currentSearchIndex <= 0;
    }
    if (this.elements.searchNextBtn) {
      this.elements.searchNextBtn.disabled = total === 0 || this.currentSearchIndex >= total - 1;
    }
  }

  /**
   * Clear search highlights
   */
  clearSearchHighlights() {
    const highlights = document.querySelectorAll('.search-highlight');
    highlights.forEach(highlight => {
      const parent = highlight.parentNode;
      parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
      parent.normalize();
    });
    
    this.searchResults = [];
    this.currentSearchIndex = -1;
    this.updateSearchCounter();
    
    Utils.log('Search highlights cleared');
  }

  /**
   * Clear search completely
   */
  clearSearch() {
    this.clearSearchHighlights();
    if (this.elements.searchInput) {
      this.elements.searchInput.value = '';
    }
    this.currentSearchTerm = '';
    
    Utils.log('Search cleared');
  }

  /**
   * Handle real-time search
   */
  handleRealTimeSearch() {
    const searchTerm = this.elements.searchInput?.value.trim();
    if (searchTerm && searchTerm.length >= 2) {
      this.performSearch();
    } else if (searchTerm.length === 0) {
      this.clearSearchHighlights();
    }
  }

  /**
   * Escape special regex characters
   */
  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Get search statistics
   */
  getSearchStats() {
    return {
      totalResults: this.searchResults.length,
      currentIndex: this.currentSearchIndex,
      currentTerm: this.currentSearchTerm,
      isModalOpen: this.isModalOpen()
    };
  }

  /**
   * Search for specific term (public API)
   */
  searchFor(term) {
    if (!term) return;
    
    if (this.elements.searchInput) {
      this.elements.searchInput.value = term;
    }
    this.performSearch();
  }

  /**
   * Destroy search manager
   */
  destroy() {
    this.clearSearchHighlights();
    this.closeSearchModal();
    this.isInitialized = false;
    
    Utils.log('SearchManager destroyed');
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SearchManager;
}
